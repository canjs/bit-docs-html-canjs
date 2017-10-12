var DefineMap = require('can-define/map/map');

var Module = DefineMap.extend({
  seal: false
}, {
  children: {
    get: function() {
      var childrenUnsorted = this.childrenUnsorted;

      // Logic taken from https://github.com/canjs/bit-docs-html-canjs/blob/00248c638b44458413fd70b0e14d4458fc1066d3/templates/helpers.js#L251-L289
      var ordered = [];
      var sorted = [];

      childrenUnsorted.forEach(function(child) {
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
  childrenUnsorted: {
    type: 'any',
    value: function() {
      return [];
    }
  },
  description: 'string',
  dest: 'string',
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
  name: 'string',
  order: 'number',
  parent: 'string',
  parentModule: 'any',
  shortTitle: {
    get: function() {
      return this.title;// TODO
    }
  },
  title: 'string',
  type: 'string',
  url: 'string'
});

module.exports = DefineMap.extend({
  isExpanded: function(moduleData) {
    var selectedModule = this.selectedModule;

    // If the selected module and the module being tested are the same,
    // then show children
    if (moduleData === selectedModule) {
      return true;
    }

    // Otherwise, walk up the tree to determine if any of the selected module’s
    // parents are equal to the one being tested
    var parent = (selectedModule) ? selectedModule.parentModule : null;
    while (parent) {
      if (parent === moduleData) {
        return true;
      }
      parent = parent.parentModule;
    }

    return false;
  },
  moduleMap: {
    type: 'any',
    value: function() {
      return {};
    }
  },
  rootModule: {
    get: function() {
      var moduleMap = this.moduleMap || {};
      return moduleMap.canjs;// “canjs” is the site’s root module
    }
  },
  searchMap: {
    type: 'any',
    set: function(searchMap) {
      var moduleMap = this.moduleMap;
      var name;

      for (name in searchMap) {
        var module = moduleMap[name];// Module type object
        var moduleData = searchMap[name];// JS object

        if (module) {// Need to update the data
          module.assign(moduleData);
        } else {// Need to create a new one
          module = new Module(moduleData);
          moduleMap[name] = module;
        }

        if (module.parent) {
          var parentModule = moduleMap[module.parent];
          if (parentModule) {
            parentModule.childrenUnsorted.push(module);
          } else {
            parentModule = new Module({
              childrenUnsorted: [module],
              name: module.parent
            });
            moduleMap[module.parent] = parentModule;
          }
          module.parentModule = parentModule;
        }
      }

      return searchMap;
    }
  },
  selectedModule: Module,
  shouldShowChildren: function(moduleData) {
    var selectedModule = this.selectedModule;

    // If the selected module and the module being tested are the same,
    // then show children
    if (moduleData === selectedModule) {
      return true;
    }

    // If the parent has @subchildren, then show this module’s children
    if (moduleData.parentModule.subchildren) {
      return true;
    }

    // Otherwise, walk up the tree to determine if any of the selected module’s
    // parents are equal to the one being tested
    var parent = (selectedModule) ? selectedModule.parentModule : null;
    while (parent) {
      if (parent === moduleData) {
        return true;
      }
      parent = parent.parentModule;
    }

    return false;
  }
});
