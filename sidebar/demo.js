var DefineMap = require('can-define/map/map');
var searchMap = require('../doc/searchMap.json');
var stache = require('can-stache');
var template = require('./demo.stache!steal-stache');

require('./sidebar');
require('./demo.less!steal-less');

var DemoViewModel = DefineMap.extend({
  pages: {
    value: function() {
      return [
        searchMap['canjs'],
        searchMap['about'],
        searchMap['guides'],
        searchMap['api'],
        searchMap['can-compute'],
        searchMap['can-ajax']
      ];
    }
  },
  selectedPageName: 'string',
  searchMap: 'any',
  setSelectedPageName: function(pageName) {
    this.selectedPageName = pageName;
  }
});

var fragment = template(new DemoViewModel({
  selectedPageName: 'canjs',
  searchMap: searchMap
}));
document.body.appendChild(fragment);
