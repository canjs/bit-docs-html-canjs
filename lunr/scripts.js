var Search = require('../static/search');
var searchLogic = require('../static/search-logic');
var search = new Search('.search', {});
var $ = require('jquery');

$.ajax({
	url: '../doc/searchMap.json',
	dataType: "json",
	cache: true
}).then(function(searchMap){
	searchLogic.indexData(search.convertSearchMapToIndexableItems(searchMap));
	var found = searchLogic.search('can');
	console.log(found.length);
}, function(err){
	console.error(err);
});
