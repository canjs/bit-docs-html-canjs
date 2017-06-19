// var QUnit = require('steal-qunit');
// var SearchControl = require('../static/search');

// /* Helper function for finding a specific result */
// var indexOfPageInResults = function(pageName, results) {
//   return results.findIndex(function(result) {
//     return result.name === pageName;
//   });
// };

// /* Clear local storage */
// window.localStorage.clear();

// /* Create the search bar element */
// var searchBar = document.createElement('div');
// searchBar.id = 'search-bar';
// document.body.appendChild(searchBar);

// /* Create a new instance of the search control */
// var search = new SearchControl('#search-bar', {
//   pathPrefix: '../temp'
// });

// /* Tests */
// QUnit.module('search control');

// QUnit.test('Search for “about”', function(assert) {
//   var done = assert.async();
//   search.searchEngineSearch('about').then(function(results) {
//     assert.equal(results.length > 0, true, 'got results');
//     assert.equal(indexOfPageInResults('about', results), 0, 'first result is the About page');
//     done();
//   });
// });

// QUnit.test('Search for “can-component”', function(assert) {
//   var done = assert.async();
//   search.searchEngineSearch('can-component').then(function(results) {
//     assert.equal(results.length > 0, true, 'got results');
//     assert.equal(indexOfPageInResults('can-component', results), 0, 'first result is the can-component page');
//     done();
//   });
// });

// QUnit.test('Search for “can-connect”', function(assert) {
//   var done = assert.async();
//   search.searchEngineSearch('can-connect').then(function(results) {
//     assert.equal(results.length > 0, true, 'got results');
//     assert.equal(indexOfPageInResults('can-connect', results), 0, 'first result is the can-connect page');
//     done();
//   });
// });

// QUnit.test('Search for “helpers/', function(assert) {
//   var done = assert.async();
//   search.searchEngineSearch('helpers/').then(function(results) {
//     assert.equal(results.length > 0, true, 'got results');
//     done();
//   });
// });

// QUnit.test('Search for “Live Binding”', function(assert) {
//   var done = assert.async();
//   search.searchEngineSearch('Live Binding').then(function(results) {
//     assert.equal(results.length > 0, true, 'got results');
//     assert.equal(indexOfPageInResults('can-stache.Binding', results) < 2, true, 'first result is the can-stache Live Binding page');
//     done();
//   });
// });

// QUnit.test('Search for “Play”', function(assert) {
//   var done = assert.async();
//   search.searchEngineSearch('Play').then(function(results) {
//     assert.equal(results.length > 0, true, 'got results');
//     assert.equal(indexOfPageInResults('guides/recipes/playlist-editor', results), 0, 'first result is the “Playlist Editor (Advanced)” guide');
//     done();
//   });
// });

// QUnit.test('Search for “stache”', function(assert) {
//   var done = assert.async();
//   search.searchEngineSearch('stache').then(function(results) {
//     assert.equal(results.length > 0, true, 'got results');
//     assert.equal(indexOfPageInResults('can-stache', results), 0, 'first result is the can-stache page');
//     done();
//   });
// });

// QUnit.test('Search for “%special”', function(assert) {
//   var done = assert.async();
//   search.searchEngineSearch('%special').then(function(results) {
//     assert.equal(results.length > 0, true, 'got results');
//     assert.equal(indexOfPageInResults('can-stache/keys/special', results), 0, 'first result is the can-stache/keys/special page');
//     done();
//   });
// });

// QUnit.test('Speed while searching for can-*', function(assert) {
//   var done = assert.async();
//   var startTime = new Date();
//   search.searchEngineSearch('can-zone').then(function() {
//     var totalTime = new Date() - startTime;
//     assert.equal(totalTime < 300, true, 'less than 300 milliseconds');
//     done();
//   });
// });
