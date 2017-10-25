var domData = require('can-util/dom/data/data');

module.exports = {
  '{element} inserted': 'animateElements',

  animateElements: function() {
    var element = this.element;

    // Need to wait two animation frames for the animation to work correctly
    requestAnimationFrame(function() {
      requestAnimationFrame(function() {
        var unanimatedElements = element.querySelectorAll('.unanimated');
        unanimatedElements.forEach(function(unanimatedElement) {
          unanimatedElement.classList.remove('unanimated');
        });
      });
    });
  },

  'a click': function(element, event) {
    var pageData = domData.get.call(element.parentElement, 'page');
    var viewModel = this.viewModel;

    // Change the selected module
    viewModel.selectedPage = pageData;

    // Prevent the default link action
    event.preventDefault();
  },

  'button click': function(element) {
    var parentLi = element.parentElement;
    var page = domData.get.call(parentLi, 'page');

    // Turn on the transition animation
    parentLi.classList.add('transitions-on');
    this.transitionsOnElement = parentLi;

    // If the page is collapsed, then uncollapse it and run the animation
    if (page.isCollapsed) {
      page.collapse();
      this.animateElements();

    } else {
      // If the page is expanded, then we need to run the animation before collapsing the section
      // (which will cause the elements to be removed from the DOM)

      // Add the “unanimated” class to all the non-Core pages so they can be collapsed
      var childPages = parentLi.querySelectorAll('ul li:not(.core)');
      childPages.forEach(function(childPage) {
        childPage.classList.add('unanimated');
      });

      // Set a timer to collapse the section after the animation has run
      var animationTime = 250;// TODO: this should be set from @transition-speed
      setTimeout(function() {
        // Double check that the page hasn’t been expanded during the timer
        if (!page.isCollapsed) {
          page.collapse();
        }
      }, animationTime);
    }
  },

  'li transitionend': function() {
    // We want to turn off transitions after an animation ends
    if (this.transitionsOnElement) {
      this.transitionsOnElement.classList.remove('transitions-on');
      this.transitionsOnElement = null;
    }
  },

  '{viewModel} selectedPage': 'animateElements'
};
