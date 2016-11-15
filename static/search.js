var $ = require("jquery");
var Control = require("can-control");
var searchResultsRenderer = require("./templates/search-results.stache!steal-stache");
var joinURIs = require("can-util/js/join-uris/");

var Search = Control({

	defaults: {
		//dom selectors
		searchResultsContainerSelector: ".search-results-container",
		searchResultsContainerParentSelector: ".bottom-left",

		//renderer stuff
		resultsRenderer: searchResultsRenderer,
		pathPrefix: window.pathPrefix,
		dataUrl: window.pathPrefix + '/searchMap.json',

		//callbacks
		onResultsHide: null,
		onResultsHidden: null,
		onResultsShow: null,
		onResultsShown: null,
		navigate:null, // function(href) - provide a custom method for navigation

		//results classes
		keyboardActiveClass: "keyboard-active"
	},

	dataPromise: null,
	getData(dataUrl) {
		if(!this.dataPromise){
			this.dataPromise = $.ajax({
				url: dataUrl,
				dataType: "json",
				cache: true
			}).then((data) => {
				this.buildData(data);
			});
		}

		return this.dataPromise;
	},

	searchData: {},
	buildData(searchMap) {
		var parts, part, i, fullName;
		for (fullName in searchMap) {
	    fullName.split(".").forEach((part) => {
        this.addChars(fullName, part.toLowerCase());
	    });
		}

		this.searchMap = searchMap;
	},

	addChars(data, tag) {
	    var letter, l, depth = 3,
			current = this.searchData;

	    for ( l = 0; l < depth; l++ ) {
	        letter = tag.substring(l, l + 1);
	        if (!current[letter] ) {
	            current[letter] = {};
	            current[letter].list = [];
	        }
	        if ( $.inArray(current[letter].list, data) === -1 ) {
	            current[letter].list.push(data);
	        }
	        current = current[letter];
	    }
	},

	//  ---- SEARCHING / PARSING ---- //

	// function searchEngineSearch
	// takes a value and returns a map of all relevant search items
	searchEngineSearch(value){
				//get the most relevant list of items from the data
		var dataList = this.buildDataList(value),
				//get the data associated with the dataList (from canjsSearchMap);
				mappedData = this.buildMapDataFromList(dataList),
				//filter the search results based on value
				filteredData = this.filterMappedData(value, mappedData);

		return filteredData;
	},

	// function buildDataList 
	// takes a 3-deep nested list and returns the most relevant list
	// {
	//   "a": {
	//      "b": {
	//      		"r": {
	//      			list: ["abra", "abraham"]
	//      		},
	//      		"b": {
	//      			list: ["abba"]
	//      		},
	//      		list: ["abra","abraham","abba"]
	//      	},

	//      "c": {
	//      		"c": {
	//      			list: ["accent"]
	//      		},
	//      		"u": {
	//      			list: ["acura"]
	//      		},
	//      		list: ["accent", "acura"]
	//      	}
	//      list: ["abra", "abraham", "abba", "accent", "acura"]
	//    },
	//    "b": { ... },
	//    ...
	// }
	// Examples:
	// buildDataList("ab") => ["abra","abraham","abba"]
	// buildDataList("ad") => []
	// buildDataList("abr") => ["abra", "abraham"]
	// buildDataList("abz") => []
	// buildDataList("abrANYTHINGELSE") => []
	buildDataList(value){
		var lowerValue = value.toLowerCase();
		var searchData = this.searchData;

		//no data to search
		if(!searchData){
			return [];
		}

		//no value 
		//  - return empty list
		if(lowerValue.length === 0){
			return [];
		}

		//only one letter
		//  - return empty list if no associated top-level list
		//  - return empty list otherwise
		if(lowerValue.length === 1){
			return searchData[lowerValue] ? searchData[lowerValue].list : [];
		}

		//two letters
		//  - return empty list if no associated top-level list
		//  - return empty list if no associated second-level
		//  - return second-level list otherwise
		if(lowerValue.length === 2){
			if(!searchData[lowerValue[0]]){
				return [];
			}
			return searchData[lowerValue[0]][lowerValue[1]] ? searchData[lowerValue[0]][lowerValue[1]].list : [];
		}

		//more than 2 letters
		//  - return empty list if no associated top-level list
		//  - return empty list if no associated second-level
		//  - return empty list if no associated third-level list
		//  - return third-level list otherwise
		if(lowerValue.length > 2){
			if(!searchData[lowerValue[0]] || !searchData[lowerValue[0]][lowerValue[1]]){
				return [];
			}

			return searchData[lowerValue[0]][lowerValue[1]][lowerValue[2]] ? searchData[lowerValue[0]][lowerValue[1]][lowerValue[2]].list : [];
		}
	},


	// function buildMapDataFromList
	// takes an array of strings, and returns an object 
	//  with the keys as the array items and the values as the values from searchMap
	buildMapDataFromList(list){
		var mapData = {},
				searchMap = this.searchMap;

		list.forEach(function(k){
			mapData[k] = searchMap[k];
		});
		return mapData;
	},

	// function filterMappedData
	// takes the search value and a map of the search data
	//  returns a subset of the data using indexof on key and title
	filterMappedData(value, data){
		if(value.length <= 3){
			return data;
		}

		var objOut = {},
				lowerValue = value.toLowerCase(),
				description, name, title;
				
		for(var key in data){
			name = data[key].name ? data[key].name.toLowerCase() : "";
			title = data[key].title ? data[key].title.toLowerCase() : "";

			if(key.toLowerCase().indexOf(lowerValue) >= 0 || 
				title.indexOf(lowerValue) >= 0){
				objOut[key] = data[key];
			}
		}
		return objOut;
	}

	//  ---- END SEARCHING / PARSING ---- //
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

	init(el,options){

		//ensure data has been requested
		if(!this.constructor.dataPromise){
			this.constructor.getData(this.options.dataUrl);
		}

		//init elements
		this.$element = $(this.element);
		this.$inputWrap = this.$element.find('.search-wrap');
		this.$input = this.$inputWrap.find(".search");
		this.$resultsContainer = $(options.searchResultsContainerSelector); 
		this.$resultsWrap = this.$resultsContainer.find(".search-results-wrap");
		this.$resultsContainerParent = this.$resultsContainer.closest(options.searchResultsContainerParentSelector);
		this.$resultsCancelLink = this.$resultsContainer.find(".search-cancel");

		//focus the search on init
		this.constructor.dataPromise.then(() => {
			//only do stuff if we have an input to work with
			if(this.$input && this.$input.length){
					this.$input.trigger("focus");
			}

			this.bindResultsEvents();
			this.bindWindowEvents();
		});
	},

	destroy(){
		this.unbindResultsEvents();
		this.unbindWindowEvents();
	},

	// ---- SETUP / TEARDOWN ---- //



	// ---- EVENTS ---- //

	//keyup
	//  esc exits search results
	//  down activates next result
	//  up activates previous result
	//  any other key triggers search
	".search keyup": function(el, ev){
		var value = ev.target.value;

		//hide search if input is empty
		if(!value || !value.length){
			this.hideResults();
			this.$inputWrap.removeClass("has-value");
			return;
		}

		this.$inputWrap.addClass("has-value");

		switch(ev.keyCode){
			case 27: //esc
				this.clear();
				break;
			case 40: //down
				this.activateNextResult();
				break;
			case 38: //up
				this.activatePrevResult();
				break;
			case 13: //enter
				this.selectActiveResult();
			default:
				this.search(value);
				this.showResults();
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
			this.$resultsContainer.off("click.search-component", ".search-results a");
		}
	},
	// ---- END RESULTS EVENTS ---- //


	// ---- WINDOW EVENTS ---- //

	// [ctrl + k] focuses the search input
	bindWindowEvents(){
		$(window).on("keyup.search-component", (ev) => {
			if(!ev.ctrlKey){
				return true;
			}

			switch(ev.keyCode){
				case 75: // 'k'
					this.$input.trigger("focus");
					break;
			}
			
		});
	},
	unbindWindowEvents(){
		$(window).off("keyup.search-component");
	},

	// ---- END WINDOW EVENTS ---- //



	// ---- SEARCH VIEW ---- //

	// function search
	// replaces the content in the results element
	//  with stache rendered data based on given falue
	search(value){
		var resultsMap = this.constructor.searchEngineSearch(value),
				numResults = Object.keys(resultsMap).length,
				resultsFrag = this.options.resultsRenderer({
					results:resultsMap,
					numResults:numResults,
					searchValue:value,
					pathPrefix: (this.options.pathPrefix === '.') ? '' : '/' + this.options.pathPrefix + '/'
				},{
					docUrl: function(){
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
	},

	// ---- SHOW/HIDE ---- //

	// function clear
	// - hides the results
	// - empties and focuses the input
	clear(){
		this.$input.val("").trigger("focus");
		this.$inputWrap.removeClass("has-value");
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
			this.$resultsContainer.stop().fadeOut({
				duration: 400,
				complete: () => {
					this.$resultsContainerParent.removeClass("search-active");
					if(this.options.onResultsHidden){
						this.options.onResultsHidden();
					}
				}
			});
		}
	},

	// function showResults
	// animate the results in
	showResults(){
		if(!this.$resultsContainer.is(":visible")){
			if(this.options.onResultsShow){
				this.options.onResultsShow();
			}
			this.$resultsContainerParent.stop().addClass("search-active");
			this.$resultsContainer.fadeIn({
				duration: 400,
				complete: () => {
					if(this.options.onResultsShown){
						this.options.onResultsShown();
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
