var QUnit = require('steal-qunit');
var SearchControl = require('../static/search');

/* Helper function for finding a specific result */
var indexOfPageInResults = function(pageName, results) {
  return results.findIndex(function(result) {
    return result.name === pageName;
  });
};

/* Clear local storage */
window.localStorage.clear();

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

QUnit.test('Search for “can-component”', function(assert) {
  var done = assert.async();
  search.searchEngineSearch('can-component').then(function(results) {
    assert.equal(results.length > 0, true, 'got results');
    assert.equal(indexOfPageInResults('can-component', results), 0, 'first result is the can-component page');
    done();
  });
});

QUnit.test('Search for “can-connect”', function(assert) {
  var done = assert.async();
  search.searchEngineSearch('can-connect').then(function(results) {
    assert.equal(results.length > 0, true, 'got results');
    assert.equal(indexOfPageInResults('can-connect', results), 0, 'first result is the can-connect page');
    done();
  });
});

QUnit.test('Search for “Live Binding”', function(assert) {
  var done = assert.async();
  search.searchEngineSearch('Live Binding').then(function(results) {
    assert.equal(results.length > 0, true, 'got results');
    assert.equal(indexOfPageInResults('can-stache.Binding', results) < 2, true, 'first result is the can-stache Live Binding page');
    done();
  });
});

QUnit.test('Search for “Play”', function(assert) {
  var done = assert.async();
  search.searchEngineSearch('Play').then(function(results) {
    assert.equal(results.length > 0, true, 'got results');
    assert.equal(indexOfPageInResults('guides/recipes/playlist-editor', results), 0, 'first result is the “Playlist Editor (Advanced)” guide');
    done();
  });
});
