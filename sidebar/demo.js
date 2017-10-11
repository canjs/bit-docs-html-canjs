var searchMap = require('../doc/searchMap.json');
var stache = require('can-stache');

require('./sidebar');

var renderer = stache('<canjs-sidebar searchMap:from="searchMap" />');
var fragment = renderer({
  searchMap: searchMap
});
document.body.appendChild(fragment);
