var QUnit = require('steal-qunit');
var SearchControl = require('../static/search');

/* Helper function for finding a specific result */
var indexOfPageInResults = function(pageName, results) {
  return results.findIndex(function(result) {
    return result.name === pageName;
  });
};

/* Create the search bar element */
var searchBar = document.createElement('div');
searchBar.id = 'search-bar';
document.body.appendChild(searchBar);

/* Create a new instance of the search control */
var search = new SearchControl('#search-bar', {
  pathPrefix: '../temp'
});

/* Tests */
QUnit.module('search control');

QUnit.test('Search for “about”', function(assert) {
  var done = assert.async();
  search.searchEngineSearch('about').then(function(results) {
    assert.equal(results.length > 0, true, 'got results');
    assert.equal(indexOfPageInResults('about', results), 0, 'first result is the About page');
    done();
  });
});
