var QUnit = require('steal-qunit');
var searchMap = require('../doc/searchMap.json');
var stache = require('can-stache');
var ViewModel = require('./sidebar.viewmodel');

require('./sidebar');

QUnit.module('canjs-sidebar');

QUnit.test('Search map is parsed', function(assert) {
  var vm = new ViewModel({searchMap: searchMap});
  assert.ok(vm.moduleMap, 'moduleMap property is set');
  assert.ok(vm.rootModule, 'rootModule property is set');
  var childrenLength = vm.children.length;
  assert.ok(childrenLength > 1 && childrenLength < 10, 'children.length is a reasonable number');
});

QUnit.test('Only top-level children are initially rendered', function(assert) {
  var renderer = stache('<canjs-sidebar searchMap:from="searchMap" />');
  var vm = new ViewModel({searchMap: searchMap});
  var fragment = renderer(vm);
  var links = fragment.querySelectorAll('li');
  assert.strictEqual(links.length, vm.children.length, 'Number of children and links are equal');
});
