var DefineMap = require('can-define/map/map');
var PageModel = require('./page-model');

module.exports = DefineMap.extend({
  descriptionForCollection: function(page) {
    var collection = this.pageMap[page.name];
    return collection.descriptionWithoutHTML;
  },

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
          if (!parentPage) {
            parentPage = new PageModel({
              name: page.parent
            });
            pageMap[page.parent] = parentPage;
          }
          page.parentPage = parentPage;

          // Do not add the collections as children to the API Docs page
          // because they’ll be shown as children of each purpose group.
          if (page.isCollection === false) {
            parentPage.unsortedChildren.push(page);
          }

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
          if (selectedParent && selectedParent.isCollapsible && selectedPage.collection !== 'can-core') {
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
    // the page doesn’t have any children in the Core collection.
    var selectedPage = this.selectedPage;
    if (page === selectedPage) {
      return page.childrenInCoreCollection.length > 0;
    }

    // If the page is expanded, then we need to check whether the selected page
    // is a descendent of a Core package. If it is, then we want to show the
    // expand/collapse button, otherwise it shouldn’t be shown.
    var pageIsExpanded = this.isExpanded(page);
    if (pageIsExpanded) {
      var childrenInCoreCollection = page.childrenInCoreCollection;
      var parent = selectedPage || null;
      while (parent) {
        if (childrenInCoreCollection.indexOf(parent) > -1) {
          return true;
        }
        parent = parent.parentPage;
      }
      return false;
    }

    return true;
  },

  urlForCollection: function(page) {
    var collection = this.pageMap[page.name];
    return (collection) ? this.pathPrefix + collection.url : '';
  }
});
