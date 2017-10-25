var FuncUnit = require('funcunit');
var localStorage = require('./local-storage');
var PageModel = require('./page-model');
var QUnit = require('steal-qunit');
var searchMap = require('../doc/searchMap.json');
var stache = require('can-stache');
var utils = require('./utils');
var ViewModel = require('./sidebar.viewmodel');

require('./sidebar');

QUnit.module('canjs-sidebar');

QUnit.test('Page model has descriptionWithoutHTML property', function(assert) {
  var page = new PageModel({
    description: '<a href="">link text</a>'
  });
  assert.strictEqual(page.descriptionWithoutHTML, 'link text', 'descriptionWithoutHTML is correct');
});

QUnit.test('Page model has shortTitle property', function(assert) {
  var canConnect = new PageModel({
    name: 'can-connect',
    title: '',
    type: 'module'
  });
  var canConnectBehaviors = new PageModel({
    name: 'can-connect.behaviors',
    parentPage: canConnect,
    title: 'behaviors',
    type: 'group'
  });
  var canConnectModules = new PageModel({
    name: 'can-connect.modules',
    parentPage: canConnect,
    title: 'modules',
    type: 'group'
  });
  var canUtil = new PageModel({
    name: 'can-util',
    title: '',
    type: 'module'
  });
  var canUtilDOM = new PageModel({
    name: 'can-util/dom',
    parentPage: canUtil,
    title: 'can-util/dom',
    type: 'group'
  });
  var canUtilDOMEvents = new PageModel({
    name: 'can-util/dom/events/events',
    parentPage: canUtilDOM,
    title: 'events',
    type: 'module'
  });

  var canConnectBase = new PageModel({
    name: 'can-connect/base/base',
    parentPage: canConnectBehaviors,
    title: 'base',
    type: 'module'
  });
  assert.strictEqual(canConnectBase.shortTitle, './base/', 'correct for can-connect/base/base');

  var canConnectHelpersMapDeepMerge = new PageModel({
    name: 'can-connect/helpers/map-deep-merge',
    parentPage: canConnectModules,
    title: 'map-deep-merge',
    type: 'module'
  });
  assert.strictEqual(canConnectHelpersMapDeepMerge.shortTitle, './helpers/map-deep-merge', 'correct for can-connect/helpers/map-deep-merge');

  var canUtilDOMEventsAttributes = new PageModel({
    name: 'can-util/dom/events/attributes/attributes',
    parentPage: canUtilDOMEvents,
    title: 'attributes',
    type: 'module'
  });
  assert.strictEqual(canUtilDOMEventsAttributes.shortTitle, './attributes/', 'correct for can-util/dom/events/attributes/attributes');
});

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

  assert.equal(page.sortedChildren.length, 4, 'sortedChildren has 2 additional children')
  assert.deepEqual(page.sortedChildren, page.visibleChildren, 'sortedChildren == visibleChildren');

  page.isCollapsed = true;
  assert.ok(page.sortedChildren.length > page.visibleChildren.length, 'isCollapsed = true makes visibleChildren ⊂ sortedChildren');
  assert.strictEqual(page.visibleChildren[0], pageInCoreCollection, 'visibleChildren contains page from Core collection');
});

QUnit.test('Page model persists expanded state', function(assert) {
  localStorage.clear();
  var page = new PageModel({
    name: 'test'
  });
  assert.ok(page.isCollapsed, 'pages are collapsed by default');

  // When collapse() is called, localStorage should be updated
  page.collapse();
  assert.notOk(page.isCollapsed, 'collapse method works');
  assert.ok(localStorage.getItem('canjs-expanded-test'), 'expanded state is persisted');

  // Programmatic changes to isCollapsed do not affect localStorage
  page.isCollapsed = true;
  assert.ok(localStorage.getItem('canjs-expanded-test'), 'programmatic changes to isCollapsed are not persisted');

  // Collapsed pages are not stored in localStorage, only expanded pages
  page.isCollapsed = false;
  page.collapse();
  assert.notOk(localStorage.getItem('canjs-expanded-test'), 'collapsed state is persisted');
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

QUnit.test('When a child item is selected, its parent should not be collapsed', function(assert) {
  var vm = new ViewModel({searchMap: searchMap});
  var pageMap = vm.pageMap;
  var canAjaxPage = pageMap['can-ajax'];
  var canAjaxParent = canAjaxPage.parentPage;
  assert.ok(canAjaxParent.isCollapsed, 'parent is collapsed beforehand');
  vm.selectedPage = canAjaxPage;
  assert.notOk(canAjaxParent.isCollapsed, 'parent is not collapsed afterwards');
  assert.notOk(vm.shouldShowExpandCollapseButton(canAjaxParent), 'parent does not show expand/collapse button');
});

QUnit.test('When a purpose group page is selected, its expand/collapse button should be shown', function(assert) {
  var vm = new ViewModel({searchMap: searchMap});
  var canObservablesPage = vm.pageMap['can-observables'];
  vm.selectedPage = canObservablesPage;
  assert.ok(vm.shouldShowExpandCollapseButton(canObservablesPage), 'expand/collapse button is shown');
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
  var currentPage = fragment.querySelector('[selected-in-sidebar]');
  assert.ok(currentPage, 'page is selected when searchMap is provided');
  var currentPageTitle = currentPage.querySelector('a').textContent.trim();
  assert.strictEqual('About', currentPageTitle, 'correct page is selected');
});

QUnit.test('Children are shown when the sidebar is first initialized with a purpose page selected', function(assert) {
  var done = assert.async(1);
  var renderer = stache('<canjs-sidebar searchMap:from="searchMap" selectedPageName:from="selectedPageName" />');
  var vm = new ViewModel({
    searchMap: searchMap,
    selectedPageName: 'can-observables'
  });
  document.body.appendChild(renderer(vm));

  // Need to wait to let the inserted event fire
  setTimeout(function() {
    var sidebarElement = document.body.querySelector('canjs-sidebar');
    var childContainer = sidebarElement.querySelector('[selected-in-sidebar] ul');
    var childContainerRect = childContainer.getBoundingClientRect();
    assert.notEqual(childContainerRect.height, 0, 'child container has height');
    document.body.removeChild(sidebarElement);// Don’t need it anymore
    done();
  }, 100);
});

QUnit.test('When an item is selected, its children should be shown', function(assert) {
  var renderer = stache('<canjs-sidebar searchMap:from="searchMap" />');
  var vm = new ViewModel({searchMap: searchMap});
  var fragment = renderer(vm);
  var firstLink = fragment.querySelector('a');
  firstLink.click();
  var firstLinkParent = firstLink.parentElement;
  var firstLinkParentChildrenLinks = firstLinkParent.querySelectorAll('li');
  assert.ok(firstLinkParent.hasAttribute('selected-in-sidebar'), 'has selected-in-sidebar attribute');
  assert.ok(firstLinkParent.classList.contains('expanded'), 'has expanded class');
  assert.ok(firstLinkParentChildrenLinks.length > 0, 'has children');
});

QUnit.test('When a child item is selected, it should still be visible', function(assert) {
  var renderer = stache('<canjs-sidebar searchMap:from="searchMap" />');
  var vm = new ViewModel({searchMap: searchMap});
  var fragment = renderer(vm);

  // Click on the first link (About)
  var firstLink = fragment.querySelector('a');
  firstLink.click();

  // Click on the first link under About (Mission)
  var firstLinkParent = firstLink.parentElement;
  var firstChildLink = firstLinkParent.querySelector('ul').querySelector('a');
  firstChildLink.click();

  // Check to make sure everything looks ok
  var firstLinkParentChildrenLinks = firstLinkParent.querySelectorAll('li');
  assert.ok(firstLinkParent.classList.contains('expanded'), 'parent has expanded class');
  assert.ok(firstLinkParentChildrenLinks.length > 0, 'parent has children');
});

QUnit.test('Sidebar scrolls to selected items', function(assert) {
  var done = assert.async(1);

  var timeout = 20000;
  var timeoutID = setTimeout(function() {
    assert.notOk(true, 'Test took longer than ' + timeout + 'ms; test timed out.');
  }, timeout);

  // Open the demo page in an iframe
  FuncUnit.open('../sidebar/demo.html', function() {

    // Set the height & width of FuncUnit’s iframe
    FuncUnit.frame.height = 200;
    FuncUnit.frame.width = 600;

    // Select the can-ajax page
    FuncUnit('.go-to-can-ajax').click();

    // Check to make sure the element is visible
    FuncUnit('[selected-in-sidebar]').wait(function() {
      var element = this[0];
      if (!element) {
        return false;
      }
      var rect = element.getBoundingClientRect();
      return utils.rectIntersectsWithWindow(rect, FuncUnit.win);
    }, function() {
      clearTimeout(timeoutID);
      assert.ok(true, 'did scroll to selected element');
      done();
    });
  });
});

QUnit.test('Sidebar animates opened sections', function(assert) {
  var done = assert.async(1);

  var timeout = 20000;
  var timeoutID = setTimeout(function() {
    assert.notOk(true, 'Test took longer than ' + timeout + 'ms; test timed out.');
  }, timeout);

  // Open the demo page in an iframe
  FuncUnit.open('../sidebar/demo.html', function() {

    // Set the height & width of FuncUnit’s iframe
    FuncUnit.frame.height = 200;
    FuncUnit.frame.width = 600;

    // Select the API Docs page
    FuncUnit('.go-to-api').click();

    // Open up a section
    FuncUnit('.parent .parent button').click();

    // Check to make sure the element is visible
    var firstHeight;
    FuncUnit('.parent .parent ul').wait(function() {
      var element = this[0];
      var rect = element.getBoundingClientRect();
      if (firstHeight) {
        return firstHeight < rect.height;
      }
      firstHeight = rect.height;
    }, function() {
      clearTimeout(timeoutID);
      assert.ok(true, 'did animate section opening');
      done();
    });
  });
});
