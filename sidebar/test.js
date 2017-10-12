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
  var childrenLength = vm.rootModule.children.length;
  assert.ok(childrenLength > 1 && childrenLength < 10, 'rootModule has a reasonable number of children');
});

QUnit.test('Parents with @subchildren should show their grandchildren', function(assert) {
  var vm = new ViewModel({searchMap: searchMap});
  var moduleMap = vm.moduleMap;
  var guidesPage = moduleMap['guides'];
  var recipesGroup = moduleMap['guides/recipes'];
  vm.selectedModule = guidesPage;
  assert.notOk(vm.isExpanded(recipesGroup), 'child is not expanded');
  assert.ok(vm.shouldShowChildren(recipesGroup), 'child shows its children');
});

QUnit.test('Only top-level children are initially rendered', function(assert) {
  var renderer = stache('<canjs-sidebar searchMap:from="searchMap" />');
  var vm = new ViewModel({searchMap: searchMap});
  var fragment = renderer(vm);
  var links = fragment.querySelectorAll('li');
  assert.strictEqual(links.length, vm.rootModule.children.length, 'number of children and links are equal');
});

QUnit.test('When an item is selected, its children should be shown', function(assert) {
  var renderer = stache('<canjs-sidebar searchMap:from="searchMap" />');
  var vm = new ViewModel({searchMap: searchMap});
  var fragment = renderer(vm);
  var firstLink = fragment.querySelector('a');
  firstLink.click();
  var firstLinkParent = firstLink.parentElement;
  var firstLinkParentChildrenLinks = firstLinkParent.querySelectorAll('li');
  assert.ok(firstLinkParent.classList.contains('current'), 'has current class');
  assert.ok(firstLinkParent.classList.contains('expanded'), 'has expanded class');
  assert.ok(firstLinkParentChildrenLinks.length > 0, 'has children');
});

QUnit.test('When a child item is selected, it should still be visible', function(assert) {
  var renderer = stache('<canjs-sidebar searchMap:from="searchMap" />');
  var vm = new ViewModel({searchMap: searchMap});
  var fragment = renderer(vm);
  var firstLink = fragment.querySelector('a');
  firstLink.click();
  var firstLinkParent = firstLink.parentElement;
  var firstChildLink = firstLinkParent.querySelector('ul').querySelector('a');
  firstChildLink.click();
  var firstLinkParentChildrenLinks = firstLinkParent.querySelectorAll('li');
  assert.ok(firstLinkParent.classList.contains('expanded'), 'parent has expanded class');
  assert.ok(firstLinkParentChildrenLinks.length > 0, 'parent has children');
});
