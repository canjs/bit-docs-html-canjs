var $ = require("jquery");
var assign = require("can-util/js/assign/");
var Control = require("can-control");
var LoadingBar = require('./loading-bar');
var searchResultsRenderer = require("../templates/search-results.stache!steal-stache");
var joinURIs = require("can-util/js/join-uris/");
var currentIndexVersion = 4;// Bump this whenever the index code is changed

var Search = Control.extend({

	defaults: {
		//dom selectors
		searchResultsContainerSelector: ".search-results-container",
		searchResultsContainerParentSelector: "#left > .bottom",

		//renderer stuff
		resultsRenderer: searchResultsRenderer,
		pathPrefix: window.pathPrefix,
		searchMapHashUrl: '/searchMapHash.json',
		searchMapUrl: '/searchMap.json',

		//callbacks
		onResultsHide: null,
		onResultsHidden: null,
		onResultsShow: null,
		onResultsShown: null,
		navigate:null, // function(href) - provide a custom method for navigation

		//results classes
		keyboardActiveClass: "keyboard-active",

		//search options
		searchAnimation: 250,// matches @transition-speed in variables.less
		searchTimeout: 400,

		localStorageKeyPrefix: "search",

		//whether or not to animate in upon initialization
		animateInOnStart: true
	}
}, {

	// ---- PROPERTIES ---- //

	//elements
	$element: null,
	$inputWrap: null,
	$input: null,

	//results elements
	$resultsContainer: null, 			//contains all the markup for the search results
	$resultsWrap: null, 					//used to replace its inner content via searchResultsRenderer
	$resultsContainerParent: null,
	$resultsCancelLink: null,
	$resultsList: null, // the ul that holds the results (refreshed every time the dom is updated with new results)

	//results navigation elements
	$activeResult: null,

	storageFallback: {},
	useLocalStorage: false,
	searchResultsCache: null,

	// ---- END PROPERTIES ---- //


	// ---- SETUP / TEARDOWN ---- //

	init: function(){

		//init elements
		this.setElements();

		//hide the input until the search engine is ready
		this.$inputWrap.hide();

		this.useLocalStorage = this.localStorageIsAvailable();

		if (window.Worker) {
			this.initSearchWorker();
		} else {
			console.info('window.Worker not defined, so not enabling search features');
		}
	},
	initSearchWorker: function() {
		var options = this.options;
		var self = this;
		var workerPath = options.pathPrefix + '/static/search-worker.js';

		this.searchWorker = new Worker(workerPath);
		this.searchWorker.addEventListener('message', this.didReceiveWorkerMessage.bind(this));

		this.searchEnginePromise = new Promise(function(resolve, reject) {
			self.checkSearchMapHash(options.pathPrefix + options.searchMapHashUrl).then(function(searchMapHashChangedObject){
				self.getSearchMap(options.pathPrefix + options.searchMapUrl, searchMapHashChangedObject).then(function(searchMap){
					self.initSearchEngine(searchMap);
					resolve(searchMap);
				}, function(error){
					console.error("getSearchMap error", error);
					reject(error);
				});
			}, function(error){
				console.error("checkSearchMapHash error", error);
				reject(error);
			});
		});
	},
	didReceiveWorkerMessage: function(message) {
		var data = message.data;
		switch (data.name) {
			case 'search did index':
				var searchIndexKey = this.formatLocalStorageKey(this.searchIndexLocalStorageKey);
				var searchIndexVersionKey = this.formatLocalStorageKey(this.searchIndexVersionLocalStorageKey);
				this.setLocalStorageItem(searchIndexKey, data.searchEngine);
				this.setLocalStorageItem(searchIndexVersionKey, currentIndexVersion);
				break;

			case 'search engine ready':
				//show the search input when the search engine is ready
				if(this.options.animateInOnStart){
					this.$inputWrap.fadeIn(this.options.searchAnimation);
				}else{
					this.$inputWrap.show();
				}

				this.bindResultsEvents();
				break;

			case 'search results':
				//convert the results into a searchMap subset
				var searchMap = this.searchMap;
				var results = data.results.map(function(result) {
					return searchMap[result.ref];
				});
				this.searchResultsCache = results;
				this.searchIndicator.end();
				this.$resultsContainer.scrollTop(0);
				this.renderSearchResults(results);
				break;

			default:
				console.info('Received message from worker:', message);
		}
	},
	destroy: function(){
		this.unbindResultsEvents();
		this.unsetElements();
	},

	setElements: function(){
		this.$element = $(this.element);
		this.$inputWrap = this.$element.find('.search-wrap');
		this.$input = this.$inputWrap.find(".search");
		this.$resultsContainer = $(this.options.searchResultsContainerSelector);
		this.$resultsWrap = this.$resultsContainer.find(".search-results-wrap");
		this.$resultsContainerParent = this.$resultsContainer.closest(this.options.searchResultsContainerParentSelector);
		this.$resultsCancelLink = this.$resultsContainer.find(".search-cancel");
	},
	unsetElements: function(){
		this.$element = null;
		this.$inputWrap = null;
		this.$input = null;
		this.$resultsContainer = null;
		this.$resultsWrap = null;
		this.$resultsContainerParent = null;
		this.$resultsCancelLink = null;
	},

	// ---- SETUP / TEARDOWN ---- //


	//  ---- LOCAL STORAGE ---- //
	getLocalStorageItem: function(key){
		var storageItem = (this.useLocalStorage) ? localStorage.getItem(key) : this.storageFallback[key];
		if (storageItem) {
			return JSON.parse(storageItem);
		}
		return null;
	},

	setLocalStorageItem: function(key, data){
		if (data) {
			var storageItem = JSON.stringify(data);
			if (this.useLocalStorage) {
				localStorage.setItem(key, storageItem);
			} else {
				this.storageFallback[key] = storageItem;
			}
			return true;
		}
		return null;
	},

	localStorageIsAvailable: function(){
		var t = this.formatLocalStorageKey('test');
		try {
			localStorage.setItem(t, '*');
			var localStorageWorks = localStorage.getItem(t) === '*';
			localStorage.removeItem(t);
			return localStorageWorks;
		}catch(e){
			return false;
		}
	},

	// function formatLocalStorageKey
	// prefixes a key based on options.localStorageKeyPrefix
	formatLocalStorageKey: function(key){
		return this.options.localStorageKeyPrefix + "-" + key;
	},
	//  ---- END LOCAL STORAGE ---- //

	//  ---- END DATA RETRIEVAL ---- //
	searchMapLocalStorageKey: 'map',
	searchMap: null,

	// function getSearchMap
	// retrieves the searchMap either from localStorage
	// or the specified url
	//
	// @param dataUrl the url of the searchMap.json file
	// @param searchMapHashChangedObject {localStorageKey, data} if we should clear localStorage
	//				false otherwise
	//
	// @returns thenable
	getSearchMap: function(dataUrl, searchMapHashChangedObject) {
		var self = this,
				returnDeferred = $.Deferred(),
				localStorageKey = this.formatLocalStorageKey(this.searchMapLocalStorageKey);

		this.searchMap = this.getLocalStorageItem(localStorageKey);
		if(this.searchMap && !searchMapHashChangedObject){
			returnDeferred.resolve(this.searchMap);
		}else{

			$.ajax({
				url: dataUrl,
				dataType: "json",
				cache: true
			}).then(function(data){
				if(!data){
					if(self.searchMap){
						returnDeferred.resolve(self.searchMap);
					}else{
						returnDeferred.reject({
							error: "No searchMap data"
						});
					}

					return false;
				}

				//wait until after we have a new searchMap before clearing (if necessary)
				if(searchMapHashChangedObject){
					localStorage.clear();
					//set the searchMapHash item
					self.setLocalStorageItem(searchMapHashChangedObject.localStorageKey, searchMapHashChangedObject.data);
				}

				//save search map
				self.searchMap = data;
				self.setLocalStorageItem(localStorageKey, data);
				returnDeferred.resolve(data);
			}, function(error){
				if(self.searchMap){
					returnDeferred.resolve(self.searchMap);
				}else{
					returnDeferred.reject(error);
				}
			});
		}
		return returnDeferred;
	},

	searchMapHashLocalStorageKey: 'map-hash',
	// function checkSearchMapHash
	// retrieves the searchMapHash localStorage (if present)
	// and from the specified url
	// then compares the two.  If they're different, localStorage is cleared
	//
	// @param dataUrl the url of the searchMapHash.json file
	//
	// @returns thenable that resolves to true if localStorage was cleared and false otherwise
	checkSearchMapHash: function(dataUrl) {
		var returnDeferred = $.Deferred();
		var self = this;

		//no need to do anything if localStorage isn't present
		if (!this.useLocalStorage) {
			returnDeferred.resolve(false);
			return;
		}

		var localStorageKey = self.formatLocalStorageKey(self.searchMapHashLocalStorageKey);
		var searchMapHashLocalStorage = self.getLocalStorageItem(localStorageKey);
		var lsHash = searchMapHashLocalStorage && searchMapHashLocalStorage.hash;

		$.ajax({
			url: dataUrl,
			dataType: "json",
			cache: false
		}).then(function(data){
			var dataHash = data && data.hash;

			//no lsHash && no dataHash => resolve
			//lsHash && no dataHash => resolve
			if(!dataHash){
				returnDeferred.resolve(false);
				return;
			}

			//no lsHash && dataHash => save && resolve
			//lsHash && dataHash => check if same
			if(lsHash !== dataHash){
				returnDeferred.resolve({
					localStorageKey: localStorageKey,
					data: data
				});
				return;
			}

			returnDeferred.resolve(false);
		}, function(error){
			//if we have a localStorage item, use it
			if(searchMapHashLocalStorage){
				returnDeferred.resolve(false);
			}else{
				returnDeferred.reject(error);
			}
		});

		return returnDeferred;
	},


	//  ---- END DATA RETRIEVAL ---- //



	//  ---- SEARCHING / PARSING ---- //

	searchIndexLocalStorageKey: 'index',
	searchIndexVersionLocalStorageKey: 'index-version',
	searchEngine: null,
	// function initSearchEngine
	// checks localStorage for an index
	//   if found
	//     generates search engine from saved index
	//   else
	//     generates search engine from searchMap & saves index to local storage
	initSearchEngine: function(searchMap){
		var searchEngine;
		var searchIndexKey = this.formatLocalStorageKey(this.searchIndexLocalStorageKey);
		var searchIndexVersionKey = this.formatLocalStorageKey(this.searchIndexVersionLocalStorageKey);
		var index = this.getLocalStorageItem(searchIndexKey);
		var indexVersion = this.getLocalStorageItem(searchIndexVersionKey);

		if (index && currentIndexVersion === indexVersion) {
			this.searchWorker.postMessage({
				name: 'load index',
				index: index
			});

		} else {
			this.searchWorker.postMessage({
				name: 'index data',
				index: index,
				items: this.convertSearchMapToIndexableItems(searchMap)
			});
		}
	},

	convertSearchMapToIndexableItems: function(searchMap) {
		var dummyContainer = document.createElement('div');
		var items = [];

		for (var itemKey in searchMap) {
			if (searchMap.hasOwnProperty(itemKey)) {
				var item = assign({}, searchMap[itemKey]);

				// Convert HTML to text
				dummyContainer.innerHTML = item.description;
				item.description = dummyContainer.innerText;

				items.push(item);
			}
		}

		return items;
	},

	// function searchEngineSearch
	// takes a value and returns a map of all relevant search items
	searchEngineSearch: function(value) {
		this.searchWorker.postMessage({
			name: 'search',
			query: value
		});
	},
	//  ---- END SEARCHING / PARSING ---- //


	// ---- EVENTS ---- //

	//keyup
	//  esc exits search results
	//  any other key triggers search
	searchTerm: "",
	".search keyup": function(el, ev){
		var value = ev.target.value;

		//hide search if input is empty or less than min length
		if(!value || !value.length){
			this.unsetSearchState();
			return;
		}

		this.$inputWrap.addClass("has-value");

		switch(ev.keyCode){
			case 27: //esc
				this.clear();
				break;
			case 13: //enter
				this.selectActiveResult();
				break;
			default:

				if(value !== this.searchTerm){
					this.searchTerm = value;
					this.search(value);
					this.showResults();
				}
				break;
		}
	},

	//keydown
	//  down activates next result
	//  up activates previous result
	".search keydown": function(el, ev){
		switch(ev.keyCode){
			case 40: //down
				ev.preventDefault();
				this.activateNextResult();
				break;
			case 38: //up
				ev.preventDefault();
				this.activatePrevResult();
				break;
		}
	},

	//focus the search input when we click the search bar
	"click": function(el, ev){
		this.$input.trigger("focus");
	},

	//cancel search on cancel click
	".search-icon-cancel click": "clear",
	".search-icon-cancel touchend": "clear",

	// ---- END EVENTS ---- //

	// ---- RESULTS EVENTS ---- //
	bindResultsEvents: function(){
		var self = this;

		//hide the search on cancel click
		if(this.$resultsCancelLink && this.$resultsCancelLink.length){
			this.$resultsCancelLink.on("click.search-component", function(ev){
				ev.preventDefault();
				self.clear();
			});
		}
	},
	unbindResultsEvents: function(){
		//hide the search on cancel click
		if(this.$resultsCancelLink && this.$resultsCancelLink.length){
			this.$resultsCancelLink.off("click.search-component");
		}

		//hide the search on result link click
		if(this.$resultsContainer && this.$resultsContainer.length){
			this.$resultsContainer.off("click.search-component", ".search-results > ul > li");
		}
	},
	// ---- END RESULTS EVENTS ---- //

	// ---- SEARCH VIEW ---- //

	// function search
	// replaces the content in the results element
	//  with stache rendered data based on given falue
	searchDebounceHandle: 0,
	search: function(value){
		clearTimeout(this.searchDebounceHandle);
		var self = this;
		this.searchDebounceHandle = setTimeout(function(){
			if (!self.searchIndicator) {
				self.searchIndicator = new LoadingBar('blue', self.$resultsContainer);
			}
			self.searchIndicator.start(0);
			self.searchIndicator.update(100);
			self.searchEngineSearch(value);
		}, this.options.searchTimeout);
	},

	renderSearchResults: function(results){
		var self = this;
		var numResults = results.length;
		if (numResults > 50) {
			numResults = '50+';
			results = results.slice(0, 50);
		}
		var resultsFrag = this.options.resultsRenderer({
			results: results,
			numResults: numResults,
			searchValue: this.searchTerm
		},{
			docUrl: function(url){
				if(self.options.pathPrefix){
					return self.options.pathPrefix + "/" + url;
				}

				if(url.substr(-1) === "/"){
					return this.url;
				}

				return "/" + url;
			},
			addTargetToExternalURLs: function(html, parentHref){
				var $html = $('<div>').html(html);
				$html.find('a').each(function(){
					var $a = $(this);
					var isLocal = this.hostname === location.hostname;
					var isRelative = this.getAttribute('href').indexOf(location.hostname) === -1;
					if(!isLocal || this.protocol !== location.protocol){
						$a.attr('target', '_blank');
					}
					if(isLocal && isRelative){
						// These links are generated by bit-docs and are relative to the page they are from
						// so we need to get the path prefix of the parent a tag
						var prefix = parentHref.substr(0, parentHref.lastIndexOf('/'));
						var href = prefix + '/' + $a.attr('href');
						$a.attr('href', href);
					}
				});
				return $html.contents();
			}
		});

		this.$resultsWrap.empty();
		this.$resultsWrap[0].appendChild(resultsFrag);

		//refresh necessary dom
		this.$resultsList = null;
		if(numResults){
			this.$resultsList = this.$resultsWrap.find(".search-results > ul");
		}
	},

	// ---- SHOW/HIDE ---- //

	// function clear
	// - clears & focuses the input
	// - unsets the search state
	clear: function(element, event) {
		if (event) {
			event.preventDefault();
			event.stopPropagation();
		}
		this.$input.val("").trigger("focus");
		this.unsetSearchState();
	},
	// function unsetSearchState
	// - hides the results
	// - empties and focuses the input
	unsetSearchState: function(){
		clearTimeout(this.searchDebounceHandle);
		this.$inputWrap.removeClass("has-value");
		this.searchTerm = "";
		this.hideResults();
	},

	// function hideResults
	// animate the results out
	hideResults: function(){
		var self = this;
		if(this.$resultsContainer.is(":visible")){

			if(this.options.onResultsHide){
				this.options.onResultsHide();
			}
			this.deactivateResult();
			$('#left').removeClass('search-showing');
			this.$resultsContainer.stop().addClass("is-hiding").fadeOut({
				duration: this.options.searchAnimation,
				complete: function(){
					self.$resultsContainer.removeClass("is-hiding");
					if(!self.$resultsContainer.is(".is-showing")){
						if(self.$resultsWrap && self.$resultsWrap.length){
							self.$resultsWrap.empty();
						}
						if(self.options.onResultsHidden){
							self.options.onResultsHidden();
						}
					}
				}
			});
		}
	},

	// function showResults
	// animate the results in
	showResults: function(){
		var self = this;
		if(!this.$resultsContainer.is(":visible") || this.$resultsContainer.is(".is-hiding")){
			if(this.options.onResultsShow){
				this.options.onResultsShow();
			}
			this.$resultsContainerParent.stop();
			this.$resultsContainer.addClass("is-showing").fadeIn({
				duration: this.options.searchAnimation,
				complete: function(){
					if(!self.$resultsContainer.is(".is-hiding")){
						self.$resultsContainer.removeClass("is-showing");
						if(self.options.onResultsShown){
							self.options.onResultsShown();
						}
					}
				}
			});

			this.$resultsContainer.scrollTop(0);
			$('#left').addClass('search-showing');
		}
	},

	// ---- END SHOW/HIDE ---- //


	// ---- KEYBOARD NAVIGATION ---- //

	// function activateNextResult
	// finds the next result in the results to activate
	activateNextResult: function(){
		var $nextResult;

		if(!this.$resultsContainer.is(":visible")){
			return;
		}
		if(!this.$resultsList){
			return;
		}

		//if no currently active result,
		//  activate the first one
		if(!this.$activeResult){
			this.activateResult(this.$resultsList.find("li").first());
			return;
		}

		$nextResult = this.$activeResult.next("li");

		if ($nextResult && $nextResult.length) {
			this.activateResult($nextResult);
		}
	},
	// function activateNextResult
	// finds the previous result in the results to activate
	activatePrevResult: function(){
		var $prevResult;

		if(!this.$resultsContainer.is(":visible")){
			return;
		}
		if(!this.$resultsList){
			return;
		}

		//if no currently active result,
		//  activate the last one
		if(!this.$activeResult){
			this.activateResult(this.$resultsList.find("li").last());
			return;
		}

		$prevResult = this.$activeResult.prev("li");

		if ($prevResult && $prevResult.length) {
			this.activateResult($prevResult);
		}
	},

	// function activateResult
	// sets property and adds class to active result
	activateResult: function($result){
		// Get position top of last active element
		var lastResultPosTop = parseInt(this.$activeResult && this.$activeResult.position().top || 0, 10);
		this.deactivateResult();
		this.$activeResult = $result;
		this.$activeResult.addClass(this.options.keyboardActiveClass);

		// Get position top of current active element
		var activeResultPosTop = parseInt(this.$activeResult.position().top, 10);
		var activeResultHeight = Math.ceil(this.$activeResult.outerHeight());
		var activeResultPosBottom = activeResultPosTop + activeResultHeight;
		var resultsContainerHeight = this.$resultsContainer.height();

		// Detect if the user is arrowing down
		var isMovingDown = lastResultPosTop < this.$activeResult.position().top;
		var isBelow = activeResultPosBottom > resultsContainerHeight;
		var isAbove = activeResultPosTop < 0;

		if(isMovingDown && isBelow){
			this.resetScrollToBottom(activeResultPosBottom, resultsContainerHeight);
		}
		else if(isAbove){
			this.resetScrollToTop(activeResultPosTop);
		}
	},

	resetScrollToTop: function(activeResultPosTop){
		this.$resultsContainer.scrollTop(
			this.$resultsContainer.scrollTop() +
			activeResultPosTop
		);
	},

	resetScrollToBottom: function(activeResultPosBottom, resultsContainerHeight){
		var currentScrollTop = this.$resultsContainer.scrollTop();
		var scrollTo = activeResultPosBottom - resultsContainerHeight + currentScrollTop;

		this.$resultsContainer.scrollTop(scrollTo);
	},

	// function deactivateResult
	// unsets property and removes class to active result
	deactivateResult: function(){
		if(this.$activeResult){
			this.$activeResult.removeClass(this.options.keyboardActiveClass);
			this.$activeResult = null;
		}
	},

	// function selectActiveResult
	// navigates to active result's href it there is an active result present
	selectActiveResult: function(){
		if(!this.$activeResult){
			return;
		}

		var $a = this.$activeResult.find("a"),
				href = $a.attr("href");

		this.navigate(href);
	},

	// ---- END KEYBOARD NAVIGATION ---- //


	// ---- HELPERS ---- //

	// function navigate
	//if we've been given a navigate method, call it
	//  otherwise, just navigate normally
	navigate: function(href){
		if(this.options.navigate){
			this.options.navigate(href);
		}else{
			window.location.href = href;
		}
	}
	// ---- END HELPERS ---- //

});

module.exports = Search;
