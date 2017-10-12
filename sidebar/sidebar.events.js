var domData = require('can-util/dom/data/data');

module.exports = {
  'a click': function(element, event) {
    var moduleData = domData.get.call(element, 'moduleData');
    var viewModel = this.viewModel;

    // Change the selected module
    viewModel.selectedModule = moduleData;

    // Prevent the default link action
    // TODO: dispatch event?
    event.preventDefault();
  }
};
