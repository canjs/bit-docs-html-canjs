var searchData = {};

function buildSearchData(searchMap) {
	var parts, part, i, fullName;
	for (fullName in searchMap) {
	    parts = fullName.split(".");
	    for (i = 0; i < parts.length; i++) {
	        part = parts[i].toLowerCase();
	        addSearchChars(fullName, part);
	    }
	}
	window.canjsSearchMap = searchMap;
	window.canjsSearchData = searchData;
}

function addSearchChars(data, tag) {
    var letter, l, depth = 3,
		current = searchData;

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
}

// function searchEngineSearch
// takes a value and returns a map of all relevant search items
function searchEngineSearch(value){
			//get the most relevant list of items from the searchData
	var searchDataList = buildSearchDataList(value),
			//get the data associated with the searchDataList (from canjsSearchMap);
			mappedSearchData = buildSearchMapDataFromList(searchDataList),
			//filter the search results based on value
			filteredSearchData = filterMappedSearchData(value, mappedSearchData);

	return filteredSearchData;
}

// function buildSearchDataList 
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
// buildSearchDataList("ab") => ["abra","abraham","abba"]
// buildSearchDataList("ad") => []
// buildSearchDataList("abr") => ["abra", "abraham"]
// buildSearchDataList("abz") => []
// buildSearchDataList("abrANYTHINGELSE") => []
function buildSearchDataList(value){
	var lowerValue = value.toLowerCase();

	//no data to search
	if(!canjsSearchData){
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
		return canjsSearchData[lowerValue] ? canjsSearchData[lowerValue].list : [];
	}

	//two letters
	//  - return empty list if no associated top-level list
	//  - return empty list if no associated second-level
	//  - return second-level list otherwise
	if(lowerValue.length === 2){
		if(!canjsSearchData[lowerValue[0]]){
			return [];
		}
		return canjsSearchData[lowerValue[0]][lowerValue[1]] ? canjsSearchData[lowerValue[0]][lowerValue[1]].list : [];
	}

	//more than 2 letters
	//  - return empty list if no associated top-level list
	//  - return empty list if no associated second-level
	//  - return empty list if no associated third-level list
	//  - return third-level list otherwise
	if(lowerValue.length > 2){
		if(!canjsSearchData[lowerValue[0]] || !canjsSearchData[lowerValue[0]][lowerValue[1]]){
			return [];
		}

		return canjsSearchData[lowerValue[0]][lowerValue[1]][lowerValue[2]] ? canjsSearchData[lowerValue[0]][lowerValue[1]][lowerValue[2]].list : [];
	}
}

// function buildSearchMapDataFromList
// takes an array of strings, and returns an object 
//  with the keys as the array items and the values as the values from canjsSearchMap
function buildSearchMapDataFromList(list){
	var mapData = {};
	list.forEach(function(k){
		mapData[k] = canjsSearchMap[k];
	});
	return mapData;
}

// function filterMappedSearchData
// takes the value and a map of the search data
//  returns a subset of the data based on values
function filterMappedSearchData(value, data){
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

function getSearchData() {
	var url = window.pathPrefix + '/searchMap.json';
	return $.ajax({
		url: url,
		dataType: "json",
		cache: true
	}).then(buildSearchData);
}

module.exports = {
	getSearchData: getSearchData,
	searchEngineSearch: searchEngineSearch
};
