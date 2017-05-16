var $ = require("jquery");
var Control = require("can-control");
var searchResultsRenderer = require("./templates/search-results.stache!steal-stache");
var joinURIs = require("can-util/js/join-uris/");

//https://lunrjs.com/guides/getting_started.html
var searchEngine = require("lunr");

var Search = Control.extend({

	defaults: {
		//dom selectors
		searchResultsContainerSelector: ".search-results-container",
		searchResultsContainerParentSelector: ".bottom-left",

		//renderer stuff
		resultsRenderer: searchResultsRenderer,
		pathPrefix: window.pathPrefix,
		docMapHashUrl: window.pathPrefix + '/docMapHash.json', 
		searchMapUrl: window.pathPrefix + '/searchMap.json',

		//callbacks
		onResultsHide: null,
		onResultsHidden: null,
		onResultsShow: null,
		onResultsShown: null,
		navigate:null, // function(href) - provide a custom method for navigation

		//results classes
		keyboardActiveClass: "keyboard-active",

		//search options
		minSearchLength: 3,
		searchTimeout: 400,

		localStorageKeyPrefix: "bit-docs"
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

	// ---- END PROPERTIES ---- //


	// ---- SETUP / TEARDOWN ---- //

	init(){

		//init elements
		this.setElements();

		//hide the input until the search engine is ready
		this.$inputWrap.hide();

		this.checkDocMapHash(this.options.docMapHashUrl).then((localStorageCleared) => {
			this.getSearchMap(this.options.searchMapUrl, localStorageCleared).then((searchMap) => {
				this.initSearchEngine(searchMap);

				//show the search input when the search engine is ready
				this.$inputWrap.fadeIn(400);

				//focus the search on init
				//only do stuff if we have an input to work with
				if(this.$input && this.$input.length){
						this.$input.trigger("focus");
				}

				this.bindResultsEvents();
			});
		});
	},
	destroy(){
		this.unbindResultsEvents();
		this.unsetElements();
	},

	setElements(){
		this.$element = $(this.element);
		this.$inputWrap = this.$element.find('.search-wrap');
		this.$input = this.$inputWrap.find(".search");
		this.$resultsContainer = $(this.options.searchResultsContainerSelector); 
		this.$resultsWrap = this.$resultsContainer.find(".search-results-wrap");
		this.$resultsContainerParent = this.$resultsContainer.closest(this.options.searchResultsContainerParentSelector);
		this.$resultsCancelLink = this.$resultsContainer.find(".search-cancel");
	},
	unsetElements(){
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
	getLocalStorageItem(key){
		if(!window.localStorage){
			return null;
		}

		let storageItem = localStorage.getItem(key);

		if(storageItem){
			return JSON.parse(storageItem);	
		}

		return null;
	},
	setLocalStorageItem(key, data){
		if(!window.localStorage){
			return null;
		}
		if(data){
			localStorage.setItem(key, JSON.stringify(data));
			return true;
		}
		return null;
	},
	// function formatLocalStorageKey
	// prefixes a key based on options.localStorageKeyPrefix
	formatLocalStorageKey(key){
		return this.options.localStorageKeyPrefix + "-" + key;
	},
	//  ---- END LOCAL STORAGE ---- //


	//  ---- END DATA RETRIEVAL ---- //
	searchMapLocalStorageKey: "searchMap",
	searchMap: null,

	// function getSearchMap
	// retrieves the searchMap either from localStorage
	// or the specified url
	//
	// @param dataUrl the url of the searchMap.json file
	// @param localStorageCleared whether or not the localStorage was cleared
	//
	// @returns promise
	getSearchMap(dataUrl, localStorageCleared) {
		return new Promise((resolve, reject) => {
			let localStorageKey = this.formatLocalStorageKey(this.searchMapLocalStorageKey);
			this.searchMap = this.getLocalStorageItem(localStorageKey);
			if(this.searchMap){
				resolve(this.searchMap);
			}else{
				$.ajax({
					url: dataUrl,
					dataType: "json",
					cache: true
				}).then((data) => {
					//save search map
					this.searchMap = data;
					this.setLocalStorageItem(localStorageKey, data);
					resolve(data);
				}, reject);
			}
		});
	},

	docMapHashLocalStorageKey: "docMapHash",
	// function getDocMapHash
	// retrieves the docMapHash localStorage (if present)
	// and from the specified url
	// then compares the two.  If they're different, localStorage is cleared
	//
	// @param dataUrl the url of the docMapHash.json file
	//
	// @returns promise that resolves to true if localStorage was cleared and false otherwise
	checkDocMapHash(dataUrl) {
		
		return new Promise((resolve, reject) => {
				//no need to do anything if localStorage isn't present
				if(!window.localStorage){
					resolve(false);
					return;
				}

				$.ajax({
					url: dataUrl,
					dataType: "json",
					cache: false
				}).then((data) => {
					let localStorageKey = this.formatLocalStorageKey(this.docMapHashLocalStorageKey),
							docMapHashLocalStorage = this.getLocalStorageItem(localStorageKey),
							lsHash = docMapHashLocalStorage && docMapHashLocalStorage.hash,
							dataHash = data && data.hash;

					//no lsHash && no dataHash => resolve
					//lsHash && no dataHash => resolve
					if(!dataHash){
						resolve(false);
						return;
					}

					//no lsHash && dataHash => save && resolve
					//lsHash && dataHash => check if same
					if(lsHash !== dataHash){

						//TODO: wait until after we've attempted to get a new
						//searchMap before clearing?
						localStorage.clear();
						this.setLocalStorageItem(localStorageKey, data);
						resolve(true);
						return;
					}

					resolve(false);
				}, reject);
		});
	},


	//  ---- END DATA RETRIEVAL ---- //



	//  ---- SEARCHING / PARSING ---- //

	searchIndexLocalStorageKey: "searchIndex",
	searchEngine: null,
	// function initSearchEngine
	// checks localStorage for an index
	//   if found
	//     generates search engine from saved index
	//   else
	//     generates search engine from searchMap & saves index to local storage
	initSearchEngine(searchMap){
		let localStorageKey = this.formatLocalStorageKey(this.searchIndexLocalStorageKey),
				index = this.getLocalStorageItem(localStorageKey);
		if(index){
			this.searchEngine = searchEngine.Index.load(index);
		}else{
			this.searchEngine = searchEngine(function(){
				this.ref('name');
				this.field('title');
				this.field('description');
				this.field('url');

				for (var itemKey in searchMap) {
				  if (searchMap.hasOwnProperty(itemKey)) {
				    this.add(searchMap[itemKey])
				  }
				}
			});
			this.setLocalStorageItem(localStorageKey, this.searchEngine);
		}
	},

	// function searchEngineSearch
	// takes a value and returns a map of all relevant search items
	searchEngineSearch(value){
		return this.searchEngine
					//run the search
					.search(this.formatSearchTerm(value))
					//convert the results into a searchMap subset
					.map(result => this.searchMap[result.ref]);
	},

	//function formatSearchTerm
	// replace colons because they can confuse the search engine
	// if they're not part of a field search
	// @param term
	formatSearchTerm(term){
		let colonParts = term.split(":"),
				wildcardChar = "*"

		//go ahead and leave if no colons found
		if(colonParts.length === 1){
			return wildcardChar + term + wildcardChar;
		}

		let colonReplacement = "*",
				fields = ["name", "title", "description", "url"],
				hasFieldSearch = colonParts.length > 1,
				fieldToSearch = hasFieldSearch ? colonParts.shift() : null,
				isFieldToSearchInFields = fields.indexOf(fieldToSearch) >= 0;

		term = colonParts.join(colonReplacement) + wildcardChar;

		if(isFieldToSearchInFields){
			term = fieldToSearch + ":" + term;
		}else{
			term = wildcardChar + term;
		}

		return term;
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
		if(!value || !value.length || value.length < this.options.minSearchLength){
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
	".search-icon-cancel click": function(el, ev){
		ev.preventDefault();
		ev.stopPropagation();
		this.clear();
	},
	
	// ---- END EVENTS ---- //

	// ---- RESULTS EVENTS ---- //
	bindResultsEvents(){
		//hide the search on cancel click
		if(this.$resultsCancelLink && this.$resultsCancelLink.length){
			this.$resultsCancelLink.on("click.search-component", (ev) =>{
				ev.preventDefault();
				this.clear();
			});
		}

		// if we click the list item, navigate
		// if the target element is an anchor tag, simply clear
		if(this.$resultsContainer && this.$resultsContainer.length){
			this.$resultsContainer.on("click.search-component", ".search-results > ul > li", (ev) => {
				var $target = $(ev.target),
						$a;

				if(!$target.is("a")){
					$a = $target.closest("li").find("a");
					this.navigate($a.attr("href"));
					return;
				}

				this.clear();
			});
		}
	},
	unbindResultsEvents(){
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


	// ---- WINDOW EVENTS ---- //

	// [ctrl + k] focuses the search input
	"{window} keyup": function(el, ev){
		if(!ev.ctrlKey){
			return true;
		}

		switch(ev.keyCode){
			case 75: // 'k'
				this.$input.trigger("focus");
				break;
		}
	},

	// ---- END WINDOW EVENTS ---- //



	// ---- SEARCH VIEW ---- //

	// function search
	// replaces the content in the results element
	//  with stache rendered data based on given falue
	searchDebounceHandle: 0,
	search(value){
		clearTimeout(this.searchDebounceHandle);
		this.searchDebounceHandle = setTimeout(() => {
			var resultsMap = this.searchEngineSearch(value),
					numResults = Object.keys(resultsMap).length,
					resultsFrag = this.options.resultsRenderer({
						results:resultsMap,
						numResults:numResults,
						searchValue:value,
						pathPrefix: (this.options.pathPrefix === '.') ? '' : '/' + this.options.pathPrefix + '/'
					},{
						docUrl(){
							if(!docObject.pathToRoot){
								return this.url;
							}

							var root = joinURIs(window.location.href, docObject.pathToRoot);
							if(root.substr(-1) === "/"){
								root = root.substr(0, root.length-1);
							}

							return root + "/" + this.url;
						}
					});

			this.$resultsWrap.empty();
			this.$resultsWrap[0].appendChild(resultsFrag);

			//refresh necessary dom
			this.$resultsList = null;
			if(numResults){
				this.$resultsList = this.$resultsWrap.find(".search-results > ul");
			}
		}, this.options.searchTimeout);
	},

	// ---- SHOW/HIDE ---- //

	// function clear
	// - clears & focuses the input
	// - unsets the search state
	clear(){
		this.$input.val("").trigger("focus");
		this.unsetSearchState();
	},
	// function unsetSearchState
	// - hides the results
	// - empties and focuses the input
	unsetSearchState(){
		clearTimeout(this.searchDebounceHandle);
		this.$inputWrap.removeClass("has-value");
		this.searchTerm = "";
		this.hideResults();
	},

	// function hideResults
	// animate the results out
	hideResults(){
		if(this.$resultsContainer.is(":visible")){

			if(this.options.onResultsHide){
				this.options.onResultsHide();
			}
			this.deactivateResult();
			this.$resultsContainer.stop().addClass("is-hiding").fadeOut({
				duration: 400,
				complete: () => {
					this.$resultsContainer.removeClass("is-hiding");
					if(!this.$resultsContainer.is(".is-showing")){
						this.$resultsContainerParent.removeClass("search-active");
						if(this.$resultsWrap && this.$resultsWrap.length){
							this.$resultsWrap.empty();
						}
						if(this.options.onResultsHidden){
							this.options.onResultsHidden();
						}
					}
				}
			});
		}
	},

	// function showResults
	// animate the results in
	showResults(){
		if(!this.$resultsContainer.is(":visible") || this.$resultsContainer.is(".is-hiding")){
			if(this.options.onResultsShow){
				this.options.onResultsShow();
			}
			this.$resultsContainerParent.stop().addClass("search-active");
			this.$resultsContainer.addClass("is-showing").fadeIn({
				duration: 400,
				complete: () => {
					if(!this.$resultsContainer.is(".is-hiding")){
						this.$resultsContainer.removeClass("is-showing")
						if(this.options.onResultsShown){
							this.options.onResultsShown();
						}
				}
				}
			});
			
			this.$resultsContainer.scrollTop(0);
		}
	},

	// ---- END SHOW/HIDE ---- //


	// ---- KEYBOARD NAVIGATION ---- //

	// function activateNextResult
	// finds the next result in the results to activate
	activateNextResult(){
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

		//if no next result, 
		//  activate the first one
		if(!$nextResult || ($nextResult && !$nextResult.length)){
			this.activateResult(this.$resultsList.find("li").first());
			return;
		}
		this.activateResult($nextResult);
	},
	// function activateNextResult
	// finds the previous result in the results to activate
	activatePrevResult(){
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

		//if no prev result, 
		//  activate the last one
		if(!$prevResult || ($prevResult && !$prevResult.length)){
			this.activateResult(this.$resultsList.find("li").last());
			return;
		}
		this.activateResult($prevResult);
	},

	// function activateResult
	// sets property and adds class to active result
	activateResult($result){
		this.deactivateResult(); 
		this.$activeResult = $result;
		this.$activeResult.addClass(this.options.keyboardActiveClass);

		var activeResultOffset = this.getActiveResultOffset();

		this.$resultsContainer.scrollTop(this.$activeResult.position().top - activeResultOffset);
	},

	// function deactivateResult
	// unsets property and removes class to active result
	deactivateResult(){
		if(this.$activeResult){
			this.$activeResult.removeClass(this.options.keyboardActiveClass);
			this.$activeResult = null;
		}
	},

	// function selectActiveResult
	// navigates to active result's href it there is an active result present
	selectActiveResult(){
		if(!this.$activeResult){
			return;
		}

		var $a = this.$activeResult.find("a"),
				href = $a.attr("href");

		this.navigate(href);
	},

	// function getActiveResultOffset
	// if method provided, use the return value
	// otherwise, use the position().top of the first list item
	getActiveResultOffset(){
		
		if(this.options.getActiveResultOffset){
			return this.options.getActiveResultOffset();
		}

		var $item = this.$resultsList.find("li").first();
		if(!$item || ($item && !$item.length)){
			return 0;
		}
		return $item.position().top;
	},

	// ---- END KEYBOARD NAVIGATION ---- //


	// ---- HELPERS ---- //

	// function navigate	
	//if we've been given a navigate method, call it
	//  otherwise, just navigate normally
	navigate(href){
		if(this.options.navigate){
			this.options.navigate(href);
		}else{
			window.location.href = href;
		}

		this.clear();
		
	}
	// ---- END HELPERS ---- //

});


module.exports = Search;
