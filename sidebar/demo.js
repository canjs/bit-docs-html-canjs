var searchMap = require('../doc/searchMap.json');
var stache = require('can-stache');
var template = require('./demo.stache!steal-stache');

require('./sidebar');
require('./demo.less!steal-less');

var fragment = template({
  searchMap: searchMap
});
document.body.appendChild(fragment);
