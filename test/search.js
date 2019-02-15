var QUnit = require('steal-qunit');
var SearchControl = require('../static/search');
var searchLogic = require('../static/search-logic');
var searchBarTemplate = require('../templates/search-bar.mustache!steal-stache');
var searchResultsTemplate = require('../templates/search-results.mustache!steal-stache');

/* Helper function for finding a specific result */
var indexOfPageInResults = function(pageName, results) {
  for (var i = 0; i < results.length; i++) {
    if (results[i].ref === pageName) {
      return i;
    }
  }
};

/* Clear local storage */
window.localStorage.clear();

/* Render the search templates into the page */
var qunitFixture = document.getElementById('qunit-fixture');
qunitFixture.appendChild(searchBarTemplate());
qunitFixture.appendChild(searchResultsTemplate());

/* Create a new instance of the search control */
var search = new SearchControl('.search-bar', {
  pathPrefix: '../doc'
});

/* Tests */
QUnit.module('search control');

var setUpSearchControl = search.searchEnginePromise.then(function(searchMap) {
  return new Promise(function(resolve) {
    // Wait for the search worker to be set up
    setTimeout(function() {
      resolve(searchLogic.indexData(search.convertSearchMapToIndexableItems(searchMap)));
    }, 1000);
  });
});

QUnit.test('Search results render', function(assert) {
  var done = assert.async();
  setUpSearchControl.then(function() {
    search.search('can-');
    setTimeout(function() {
      var searchResultLis = document.querySelectorAll('.search-results li');
      assert.equal(searchResultLis.length > 1, true, 'got more than 1 result');
      var firstResultText = searchResultLis[0].querySelector('a').textContent.trim();
      assert.notEqual(firstResultText, '', 'first result has text');
      done();
    }, 1000);
  });
});

QUnit.test('Search for “about”', function(assert) {
  var done = assert.async();
  setUpSearchControl.then(function() {
    var results = searchLogic.search('about');
    assert.equal(results.length > 1, true, 'got more than 1 result');
    assert.equal(indexOfPageInResults('about', results), 0, 'first result is the About page');
    done();
  });
});

QUnit.test('Search for “can-component”', function(assert) {
  var done = assert.async();
  setUpSearchControl.then(function() {
    var results = searchLogic.search('can-component');
    assert.equal(results.length > 1, true, 'got more than 1 result');
    assert.equal(indexOfPageInResults('can-component', results), 0, 'first result is the can-component page');
    done();
  });
});

QUnit.test('Search for “can-connect”', function(assert) {
  var done = assert.async();
  setUpSearchControl.then(function() {
    var results = searchLogic.search('can-connect');
    assert.equal(results.length > 1, true, 'got more than 1 result');
    assert.equal(indexOfPageInResults('can-connect', results), 0, 'first result is the can-connect page');
    done();
  });
});

QUnit.test('Search for “helpers/', function(assert) {
  var done = assert.async();
  setUpSearchControl.then(function() {
    var results = searchLogic.search('helpers/');
    assert.equal(results.length > 1, true, 'got more than 1 result');
    done();
  });
});

QUnit.test('Search for “Live Binding”', function(assert) {
  var done = assert.async();
  setUpSearchControl.then(function() {
    var results = searchLogic.search('Live Binding');
    assert.equal(results.length > 1, true, 'got more than 1 result');
    assert.equal(indexOfPageInResults('can-stache.Binding', results) < 2, true, 'first result is the can-stache Live Binding page');
    done();
  });
});

QUnit.test('Search for “Play”', function(assert) {
  var done = assert.async();
  setUpSearchControl.then(function() {
    var results = searchLogic.search('Play');
    assert.equal(results.length > 0, true, 'got results');
    assert.equal(indexOfPageInResults('guides/recipes/playlist-editor', results), 0, 'first result is the “Playlist Editor (Advanced)” guide');
    done();
  });
});

QUnit.test('Search for “stache”', function(assert) {
  var done = assert.async();
  setUpSearchControl.then(function() {
    var results = searchLogic.search('stache');
    assert.equal(results.length > 1, true, 'got more than 1 result');
    assert.equal(indexOfPageInResults('can-stache', results), 0, 'first result is the can-stache page');
    done();
  });
});

QUnit.test('Search for “%special”', function(assert) {
  var done = assert.async();
  setUpSearchControl.then(function() {
    var results = searchLogic.search('%special');
    assert.equal(results.length > 0, true, 'got results');
    assert.equal(indexOfPageInResults('can-stache/keys/special', results), 0, 'first result is the can-stache/keys/special page');
    done();
  });
});

QUnit.test('Search for “define/map”', function(assert) {
  var done = assert.async();
  setUpSearchControl.then(function() {
    var results = searchLogic.search('define/map');
    assert.equal(results.length > 1, true, 'got more than 1 result');
    assert.equal(indexOfPageInResults('can-define/map/map', results), 0, 'first result is the can-define/map/map page');
    done();
  });
});

QUnit.test('Speed while searching for can-*', function(assert) {
  var done = assert.async();
  setUpSearchControl.then(function() {
    var startTime = new Date();
    var results = searchLogic.search('can-zone');
    var totalTime = new Date() - startTime;
    assert.equal(totalTime < 300, true, 'less than 300 milliseconds');
    done();
  });
});
