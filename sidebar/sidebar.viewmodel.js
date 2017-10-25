var DefineMap = require('can-define/map/map');
var PageModel = require('./page-model');

module.exports = DefineMap.extend({
  isExpanded: function(page) {
    var selectedPage = this.selectedPage;

    // If the selected page and the page being tested are the same,
    // then show children
    if (page === selectedPage) {
      return true;
    }

    // Otherwise, walk up the tree to determine if any of the selected page’s
    // parents are equal to the one being tested
    var parent = (selectedPage) ? selectedPage.parentPage : null;
    while (parent) {
      if (parent === page) {
        return true;
      }
      parent = parent.parentPage;
    }

    return false;
  },
  pageMap: {
    type: 'any',
    value: function() {
      return {};
    }
  },
  pathPrefix: {
    type: 'string',
    value: '',
    set: function(pathPrefix) {
      if (pathPrefix) {
        if (pathPrefix.substr(-1) !== '/') {
          return pathPrefix + '/';
        }
        return pathPrefix;
      }
      return '';
    }
  },
  rootPage: {
    get: function() {
      var pageMap = this.pageMap || {};
      return pageMap.canjs;// “canjs” is the site’s root page
    }
  },
  searchMap: {
    type: 'any',
    set: function(searchMap) {
      var pageMap = this.pageMap;
      var name;

      for (name in searchMap) {
        var page = pageMap[name];// PageModel type object
        var pageData = searchMap[name];// JS object

        if (page) {// Need to update the data
          page.assign(pageData);
        } else {// Need to create a new one
          page = new PageModel(pageData);
          pageMap[name] = page;
        }

        if (page.parent) {
          var parentPage = pageMap[page.parent];
          if (parentPage) {
            parentPage.unsortedChildren.push(page);
          } else {
            parentPage = new PageModel({
              unsortedChildren: [page],
              name: page.parent
            });
            pageMap[page.parent] = parentPage;
          }
          page.parentPage = parentPage;
        }
      }

      return searchMap;
    }
  },
  selectedPage: {
    Type: PageModel,
    set: function(selectedPage) {
      if (selectedPage) {
        if (selectedPage.isCollapsed && selectedPage.visibleChildren.length === 0) {
          selectedPage.isCollapsed = false;
        } else {
          var selectedParent = selectedPage.parentPage;
          if (selectedParent) {
            selectedParent.isCollapsed = false;
          }
        }
      }
      return selectedPage;
    }
  },
  selectedPageName: {
    type: 'string',
    get: function(selectedPageName) {
      var selectedPage = this.selectedPage;
      return selectedPage && selectedPage.name || selectedPageName || '';
    },
    set: function(selectedPageName) {
      this.selectedPage = this.pageMap[selectedPageName];
      return selectedPageName;
    }
  },
  shouldShowChildren: function(page) {
    var selectedPage = this.selectedPage;

    // If the selected page and the page being tested are the same,
    // then show children
    if (page === selectedPage) {
      return true;
    }

    // If the parent has @subchildren, then show this page’s children
    if (page.parentPage.subchildren) {
      return true;
    }

    // Otherwise, walk up the tree to determine if any of the selected page’s
    // parents are equal to the one being tested
    var parent = (selectedPage) ? selectedPage.parentPage : null;
    while (parent) {
      if (parent === page) {
        return true;
      }
      parent = parent.parentPage;
    }

    return false;
  },
  shouldShowExpandCollapseButton: function(page) {
    if (!page.isCollapsible) {
      return false;
    }

    // If the selected page and the page being tested are the same,
    // then make sure the expand/collapse button is shown, unless
    // the page doesn’t have any visible children
    if (page === this.selectedPage) {
      return page.childrenInCoreCollection.length > 0;
    }

    return !this.isExpanded(page);
  }
});
