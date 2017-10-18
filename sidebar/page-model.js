var DefineMap = require('can-define/map/map');

var stringEndsWith = function(string, searchString) {
  return string.substr(0 - searchString.length) === searchString;
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

module.exports = DefineMap.extend({
  seal: false
}, {
  collapse: function() {
    this.isCollapsed = (this.isCollapsed) ? false : true;
  },
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
  dest: 'string',
  isCollapsed: {
    type: 'boolean',
    value: true
  },
  isCollapsible: {
    type: 'boolean',
    get: function() {
      var parentPage = this.parentPage || {};
      return parentPage.name === 'api';
    }
  },
  isGroup: {
    type: 'boolean',
    get: function() {
      return ['group', 'prototype', 'static'].indexOf(this.type) !== -1;
    }
  },
  name: {
    type: 'string',
    value: ''
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
      var unsortedChildren = this.unsortedChildren;

      // Logic taken from https://github.com/canjs/bit-docs-html-canjs/blob/00248c638b44458413fd70b0e14d4458fc1066d3/templates/helpers.js#L251-L289
      var ordered = [];
      var sorted = [];

      unsortedChildren.forEach(function(child) {
        if (child && typeof child.order === 'number') {
          ordered.push(child);
        } else {
          sorted.push(child);
        }
      });

      // Sort alphabetically, “/” comes before “-”
      sorted.sort(function(x, y) {
        var a = x.name.replace(/\//g, '!');
        var b = y.name.replace(/\//g, '!');
        if (a < b) {
          return -1;
        }
        if (a > b) {
          return 1;
        }
        return 0;
      });

      // Sort by docObject “ordered” property
      ordered.sort(function(x, y) {
        return x.order - y.order;
      });

      // Insert ordered items to their index in the alphabetical array
      ordered.forEach(function(child) {
        sorted.splice(child.order, 0, child);
      });

      return sorted;
    }
  },
  title: 'string',
  type: 'string',
  unsortedChildren: {
    value: function() {
      return [];
    }
  },
  url: 'string',
  visibleChildren: {
    get: function() {
      if (!this.isCollapsible || !this.isCollapsed) {
        return this.sortedChildren;
      }
      return this.sortedChildren.filter(function(page) {
        return page.collection === 'core';
      });
    }
  }
});
