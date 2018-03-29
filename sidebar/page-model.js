var DefineMap = require('can-define/map/map');
var localStorage = require('./local-storage');
var sortedCollectionNames = ['can-core', 'can-infrastructure', 'can-ecosystem', 'can-legacy'];

var expandedStorageKeyForName = function(name) {
  return 'canjs-expanded-' + name;
};

var getShortTitleForNameWithParent = function(name, parent) {
  var parentName = parent && parent.name || '';

  var parentNameWithSlash = parentName + '/';
  if (name.indexOf(parentNameWithSlash) === 0) {
    name = name.replace(parentNameWithSlash, './');

  } else {
    var indexOfLastSlashInParentName = parentName.lastIndexOf('/');
    var parentNameAfterLastSlash = (indexOfLastSlashInParentName > 0) ? parentName.substr(indexOfLastSlashInParentName + 1) : '';
    var parentNameBeforeLastSlash = (indexOfLastSlashInParentName > 0) ? parentName.substr(0, indexOfLastSlashInParentName) : '';
    var parentNameWithLastSlash = parentNameBeforeLastSlash + '/';

    if (parentNameAfterLastSlash && stringEndsWith(parentNameBeforeLastSlash, parentNameAfterLastSlash) && name.indexOf(parentNameWithLastSlash) === 0) {
      name = name.replace(parentNameWithLastSlash, './');

    } else {
      return;
    }
  }

  var indexOfLastSlashInName = name.lastIndexOf('/');
  var nameAfterLastSlash = (indexOfLastSlashInName > 0) ? name.substr(indexOfLastSlashInName + 1) : '';
  var nameWithDoubleSlashes = '/' + nameAfterLastSlash + '/' + nameAfterLastSlash;
  if (stringEndsWith(name, nameWithDoubleSlashes)) {
    var nameBeforeLastSlash = (indexOfLastSlashInName > 0) ? name.substr(0, indexOfLastSlashInName) : '';
    return nameBeforeLastSlash + '/';
  } else {
    return name;
  }
};

var sortByName = function(x, y) {
  // “/” comes before “-”
  var a = x.name.replace(/\//g, '!');
  var b = y.name.replace(/\//g, '!');
  if (a < b) {
    return -1;
  }
  if (a > b) {
    return 1;
  }
  return 0;
};

var stringEndsWith = function(string, searchString) {
  return string.substr(0 - searchString.length) === searchString;
};

var PageModel = DefineMap.extend({
  seal: false
}, {
  childrenInCoreCollection: {
    get: function() {
      return this.sortedChildren.filter(function(page) {
        return page.collection === 'can-core';
      });
    }
  },
  collapse: function() {
    var isCollapsed = this.isCollapsed = (this.isCollapsed) ? false : true;

    // Persist expanded sections
    var storageKey = expandedStorageKeyForName(this.name);
    if (isCollapsed) {
      localStorage.removeItem(storageKey);
    } else {
      localStorage.setItem(storageKey, true);
    }
  },
  collection: 'string',
  description: 'string',
  descriptionWithoutHTML: {
    get: function() {
      if (!this.description) {
        return '';
      }
      var div = document.createElement('div');
      div.innerHTML = this.description;
      return div.innerText.trim() || '';
    }
  },
  isCollapsed: {
    type: 'boolean',
    get: function(lastSetValue) {
      if (lastSetValue === undefined) {
        if (!this.isCollapsible) {
          return false;
        }
        var storageKey = expandedStorageKeyForName(this.name);
        var isExpanded = localStorage.getItem(storageKey);
        return (isExpanded) ? false : true;
      }
      return lastSetValue;
    },
    set: function(isCollapsed) {
      if (isCollapsed === false) {
        var parent = this.parentPage;
        if (parent) {
          parent.isCollapsed = false;
        }
      }
      return isCollapsed;
    }
  },
  isCollapsible: {
    type: 'boolean',
    get: function() {
      var parentPage = this.parentPage || {};
      return parentPage.name === 'api' && this.isCollection === false;
    }
  },
  isCollection: {
    type: 'boolean',
    get: function() {
      return sortedCollectionNames.indexOf(this.name) !== -1;
    }
  },
  isGroup: {
    type: 'boolean',
    get: function() {
      return ['group', 'prototype', 'static'].indexOf(this.type) !== -1;
    }
  },
  isInCoreCollection: {
    type: 'boolean',
    default: false,
    get: function() {
      var collection = this.collection;
      if (!collection) {
        // Walk up the parents to find the collection
        var parent = this.parentPage;
        while (parent) {
          collection = parent.collection;
          parent = (collection) ? null : parent.parentPage;
        }
      }
      return collection === 'can-core';
    }
  },
  name: {
    type: 'string',
    default: ''
  },
  order: 'number',
  parent: 'string',
  parentPage: 'any',
  shortTitle: {
    get: function() {
      var name = this.name;
      var title = this.title;

      if (this.type === 'module') {
        var nameFromParent;
        var parent = this.parentPage;
        while (parent) {
          nameFromParent = getShortTitleForNameWithParent(name, parent);
          parent = (nameFromParent) ? null : parent.parentPage;
        }
        if (nameFromParent) {
          return nameFromParent;
        }
      }

      return title || name;
    }
  },
  sortedChildren: {
    get: function() {
      var sorted = [];
      var unsortedChildren = this.unsortedChildren;

      // If this group is collapsible, then sort/group children by collection
      if (this.isCollapsible) {
        var collections = [];
        var collectionGroup;
        var collectionGroups = {};

        // Group by collection
        unsortedChildren.forEach(function(child) {
          var collection = child.collection;
          collectionGroup = collectionGroups[collection];
          if (!collectionGroup) {
            collectionGroup = collectionGroups[collection] = {
              name: collection,
              pages: []
            };
            collections.push(collection);
          }
          collectionGroups[collection].pages.push(child);
        });

        // Sort the collections (can-core, can-infrastructure, can-ecosystem, can-legacy)
        collections.sort(function(x, y) {
          return sortedCollectionNames.indexOf(x) - sortedCollectionNames.indexOf(y);
        });

        // Add all the collections and pages to the “sorted” array
        collections.forEach(function(collection) {
          collectionGroup = collectionGroups[collection];
          sorted.push(new PageModel({
            name: collection,
            parentPage: this,
            title: collection.substr(4),// Remove the `can-` prefix
            type: 'group'
          }));
          collectionGroup.pages.sort(sortByName);
          sorted.push.apply(sorted, collectionGroup.pages);
        }.bind(this));

      } else {

        // Logic taken from https://github.com/canjs/bit-docs-html-canjs/blob/00248c638b44458413fd70b0e14d4458fc1066d3/templates/helpers.js#L251-L289
        var ordered = [];

        unsortedChildren.forEach(function(child) {
          if (child && typeof child.order === 'number') {
            ordered.push(child);
          } else {
            sorted.push(child);
          }
        });

        // Sort alphabetically
        sorted.sort(sortByName);

        // Sort by docObject “ordered” property
        ordered.sort(function(x, y) {
          return x.order - y.order;
        });

        // Insert ordered items to their index in the alphabetical array
        ordered.forEach(function(child) {
          sorted.splice(child.order, 0, child);
        });
      }

      return sorted;
    }
  },
  title: 'string',
  type: 'string',
  unsortedChildren: {
    default: function() {
      return [];
    }
  },
  url: 'string',
  visibleChildren: {
    get: function() {
      if (!this.isCollapsible || !this.isCollapsed) {
        return this.sortedChildren;
      }
      return this.childrenInCoreCollection;
    }
  }
});

module.exports = PageModel;
