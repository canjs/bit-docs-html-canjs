var canViewCallbacks = require('can-view-callbacks');
var utils = require('./utils');

canViewCallbacks.attr('selected-in-sidebar', function(element) {
  var containerElement = document.querySelector('#left');
  if (!containerElement) {
    return;
  }

  // Using rAF because otherwise getBoundingClientRect won’t return useful values
  // Need to wait two animation frames for the correct scrollTop to be calculated
  requestAnimationFrame(function() {
    // fixes bug after upgrade
    setTimeout(function() {
      var elementRect = element.getBoundingClientRect();

      // Only scroll if the element isn’t in the viewport
      if (utils.rectIntersectsWithWindow(elementRect, window) === false) {
        var parent = element.parentElement;
        var parentScrollTop = 0;
        while (parent) {
          parentScrollTop += parent.scrollTop;
          parent = parent.parentElement;
        }
        containerElement.scrollTop = elementRect.top + parentScrollTop - utils.safeInset.top;
      }
    },100);
  });
});
