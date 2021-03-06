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

var search;
var setUpSearchControl;

/* Tests */
QUnit.module('search control', {
  before: function() {

    /* Clear local storage */
    window.localStorage.clear();

    /* Render the search templates into the page */
    var qunitFixture = document.getElementById('qunit-fixture');
    qunitFixture.appendChild(searchBarTemplate());
    qunitFixture.appendChild(searchResultsTemplate());

    /* Create a new instance of the search control */
    search = new SearchControl('.search-bar', {
      pathPrefix: '../doc'
    });

    setUpSearchControl = search.searchEnginePromise.then(function(searchMap) {
      return new Promise(function(resolve) {
        // Wait for the search worker to be set up
        setTimeout(function() {
          resolve(searchLogic.indexData(search.convertSearchMapToIndexableItems(searchMap)));
        }, 2000);
      });
    });

  }
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
    }, 2000);
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

QUnit.test('Search for “Call Expression”', function(assert) {
  var done = assert.async();
  setUpSearchControl.then(function() {
    var results = searchLogic.search('Call Expression');
    assert.equal(results.length > 1, true, 'got more than 1 result');
    assert.equal(indexOfPageInResults('can-stache/expressions/call', results) < 2, true, 'first result is the can-stache Call Expression page');
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

QUnit.test('Search for “{{#expression}}', function(assert) {
  var done = assert.async();
  setUpSearchControl.then(function() {
    var results = searchLogic.search('{{#expression}}');
    assert.equal(results.length > 0, true, 'got results');
    assert.equal(indexOfPageInResults('can-stache.tags.section', results), 0, 'first result is the can-stache.tags.section page');
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

QUnit.test('Search for “restModel”', function(assert) {
  var done = assert.async();
  setUpSearchControl.then(function() {
    var results = searchLogic.search('restModel');
    assert.equal(results.length > 1, true, 'got more than 1 result');
    assert.equal(indexOfPageInResults('can-rest-model', results), 0, 'first result is the can-rest-model page');
    done();
  });
});

QUnit.test('Search for “QueryLogic”', function(assert) {
  var done = assert.async();
  setUpSearchControl.then(function() {
    var results = searchLogic.search('QueryLogic');
    assert.equal(results.length > 1, true, 'got more than 1 result');
    assert.equal(indexOfPageInResults('can-query-logic', results), 0, 'first result is the can-query-logic page');
    done();
  });
});

QUnit.test('Search for “DefineList”', function(assert) {
  var done = assert.async();
  setUpSearchControl.then(function() {
    var results = searchLogic.search('DefineList');
    assert.equal(results.length > 1, true, 'got more than 1 result');
    assert.equal(indexOfPageInResults('can-define/list/list', results), 0, 'first result is the can-define/list/list page');
    done();
  });
});

QUnit.test('Search for “DefineMap”', function(assert) {
  var done = assert.async();
  setUpSearchControl.then(function() {
    var results = searchLogic.search('DefineMap');
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

QUnit.test('Search for helper starting with "#xxx"', function(assert) {
  var done = assert.async();
  setUpSearchControl.then(function() {
    var results = searchLogic.search('#let');
    assert.equal(results.length > 1, true, 'Got results for #let');
    assert.equal(indexOfPageInResults('can-stache.helpers.let', results), 0, 'first result is the can-stache.helpers.let page');
    done();
  });
});

QUnit.test("Prioritize core packages in search results", function(assert) {
  var done = assert.async();
  setUpSearchControl.then(function() {
    var results = searchLogic.search('types');
    assert.equal(results.length > 1, true, 'Got results for type');
    assert.equal(indexOfPageInResults('can-type', results), 0, 'first result is the can-type page');
    done();
  });
});
