var Component = require('can-component');
var events = require('./sidebar.events');
var template = require('./sidebar.stache!steal-stache');
var ViewModel = require('./sidebar.viewmodel');

module.exports = Component.extend({
  events: events,
  tag: 'canjs-sidebar',
  view: template,
  ViewModel: ViewModel
});
