var domData = require('can-util/dom/data/data');
var each = require("can-util/js/each/each");

module.exports = {
  '{element} inserted': 'animateElementsImmediately',

  animateElements: function() {
    // Need to wait two animation frames for the animation to work correctly
    requestAnimationFrame(function() {
      requestAnimationFrame(function() {
        this.animateElementsImmediately();
      }.bind(this));
    }.bind(this));
  },

  animateElementsImmediately: function() {
    var element = this.element;
    var unanimatedElements = element.querySelectorAll('.unanimated');
    each(unanimatedElements, function(unanimatedElement) {
      unanimatedElement.classList.remove('unanimated');
    });
  },

  'a click': function(element, event) {

    // Check for modifier keys before preventing default
    var noModifierKeys = !event.altKey && !event.ctrlKey && !event.metaKey && !event.shiftKey;
    if (noModifierKeys) {

      try {
        var pageData = domData.get.call(element.parentElement, 'page');
        var viewModel = this.viewModel;

        // Change the selected module
        viewModel.selectedPage = pageData;

        // When the selectedPage changes, the DOM will be updated and may have some
        // elements with the “unanimated” class, which would not be removed for two
        // requestAnimationFrames. Calling animateElementsImmediately will cause the
        // new elements to have their “unanimated” class instantly removed, which
        // prevents them from displaying at 0 height for two frames.
        this.animateElementsImmediately();

      } catch (error) {
        console.error('Caught error while handling click event:', error);
      }

      // Prevent the default link action
      event.preventDefault();
    }
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
      var parentLiChildren = parentLi.children;
      for (var i = 0; i < parentLiChildren.length; i++) {
        var parentLiChild = parentLiChildren[i];
        if (parentLiChild.tagName === 'UL') {
          var ulChildren = parentLiChild.children;
          for (var j = 0; j < ulChildren.length; j++) {
            var ulChildClassList = ulChildren[j].classList;
            if (ulChildClassList.contains('can-core') === false) {
              ulChildClassList.add('unanimated');
            }
          }
        }
      }

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
