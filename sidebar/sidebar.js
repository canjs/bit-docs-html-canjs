var Component = require('can-component');
var template = require('./sidebar.stache!steal-stache');
var ViewModel = require('./sidebar.viewmodel');

module.exports = Component.extend({
  tag: 'canjs-sidebar',
  view: template,
  ViewModel: ViewModel
});
