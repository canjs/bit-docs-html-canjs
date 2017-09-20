var Control = require("can-control");

module.exports = Control.extend({
  /* This should only happen once */
  init: function() {
    var surveyAdElement = this.element;

    // Always show the close button since JS is active
    var closeButton = surveyAdElement.querySelector('.close');
    if (closeButton.classList) {// Only enable the close button in IE10+
      closeButton.style.display = 'inline-block';
    }

    // Look up the user’s preference in localStorage
    try {
      var storageKey = 'survey-ad-closed';
      var didClose = window.localStorage.getItem(storageKey);
      if (didClose) {
        // Immediately hide this element
        surveyAdElement.style.display = 'none';
        // .survey-ad-showing is used to change padding-bottom on the rest of the content
        document.getElementById('everything').classList.remove('survey-ad-showing');
      }
    } catch (error) {
      console.info('Caught localStorage error:', error);
    }
  },
  /* This event will fire when the user clicks the X button */
  '{element} .close click': function() {

    // Add .hidden so the element animates out of view
    this.element.classList.add('hidden');

    // .survey-ad-showing is used to change padding-bottom on the rest of the content
    document.getElementById('everything').classList.remove('survey-ad-showing');

    // Try to remember the user’s preference in localStorage
    try {
      // Get the current time; we don’t make use of this right now,
      // but in the future if we want to re-enable the link after a
      // certain amount of time or for a particular event, we can
      // more easily do that :)
      var currentTime = (new Date()).getTime();
      var storageKey = 'survey-ad-closed';
      window.localStorage.setItem(storageKey, currentTime);
    } catch (error) {
      console.info('Caught localStorage error:', error);
    }
  }
});
