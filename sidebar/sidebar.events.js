var domData = require('can-util/dom/data/data');

module.exports = {
  'a click': function(element, event) {
    var pageData = domData.get.call(element, 'page');
    var viewModel = this.viewModel;

    // Change the selected module
    viewModel.selectedPage = pageData;

    // Prevent the default link action
    // TODO: dispatch event?
    event.preventDefault();
  }
};
