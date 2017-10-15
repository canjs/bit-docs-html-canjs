var PageModel = require('./page-model');
var QUnit = require('steal-qunit');
var searchMap = require('../doc/searchMap.json');
var stache = require('can-stache');
var ViewModel = require('./sidebar.viewmodel');

require('./sidebar');

QUnit.module('canjs-sidebar');

QUnit.test('Page model returns correct visibleChildren', function(assert) {
  var pageInCoreCollection = new PageModel({collection: 'core'});
  var pageInInfrastructureCollection = new PageModel({collection: 'infrastructure'});
  var parentPage = new PageModel({
    name: 'api'
  });
  var page = new PageModel({
    isCollapsed: false,
    parentPage: parentPage,
    unsortedChildren: [pageInCoreCollection, pageInInfrastructureCollection]
  });

  assert.deepEqual(page.sortedChildren, page.visibleChildren, 'sortedChildren == visibleChildren');

  page.isCollapsed = true;
  assert.ok(page.sortedChildren.length > page.visibleChildren.length, 'isCollapsed = true makes visibleChildren ⊂ sortedChildren');
  assert.strictEqual(page.visibleChildren[0], pageInCoreCollection, 'visibleChildren contains page from Core collection');
});

QUnit.test('Search map is parsed', function(assert) {
  var vm = new ViewModel({searchMap: searchMap});
  assert.ok(vm.pageMap, 'pageMap property is set');
  assert.ok(vm.rootPage, 'rootPage property is set');
  var childrenLength = vm.rootPage.sortedChildren.length;
  assert.ok(childrenLength > 1 && childrenLength < 10, 'rootPage has a reasonable number of children');
});

QUnit.test('Parents with @subchildren should show their grandchildren', function(assert) {
  var vm = new ViewModel({searchMap: searchMap});
  var pageMap = vm.pageMap;
  var guidesPage = pageMap['guides'];
  var recipesGroup = pageMap['guides/recipes'];
  vm.selectedPage = guidesPage;
  assert.notOk(vm.isExpanded(recipesGroup), 'child is not expanded');
  assert.ok(vm.shouldShowChildren(recipesGroup), 'child shows its children');
});

QUnit.test('Only top-level children are initially rendered', function(assert) {
  var renderer = stache('<canjs-sidebar searchMap:from="searchMap" />');
  var vm = new ViewModel({searchMap: searchMap});
  var fragment = renderer(vm);
  var links = fragment.querySelectorAll('li');
  assert.strictEqual(links.length, vm.rootPage.sortedChildren.length, 'number of children and links are equal');
});

QUnit.test('Correct page is selected after “asynchonously” setting the searchMap', function(assert) {
  var renderer = stache('<canjs-sidebar searchMap:from="searchMap" selectedPageName:from="selectedPageName" />');
  var vm = new ViewModel({selectedPageName: 'about'});
  vm.searchMap = searchMap;
  var fragment = renderer(vm);
  var currentPage = fragment.querySelector('.current');
  assert.ok(currentPage, 'page is selected when searchMap is provided');
  var currentPageTitle = currentPage.querySelector('a').textContent.trim();
  assert.strictEqual('About', currentPageTitle, 'correct page is selected');
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
