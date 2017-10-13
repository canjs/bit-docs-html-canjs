var DefineMap = require('can-define/map/map');

module.exports = DefineMap.extend({
  seal: false
}, {
  collapse: function() {
    this.isCollapsed = (this.isCollapsed) ? false : true;
  },
  description: 'string',
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
  linkTitle: {
    get: function() {
      return this.description;// TODO
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
      return this.title || this.name;// TODO
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
