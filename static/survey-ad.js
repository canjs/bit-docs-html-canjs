var Control = require("can-control");

module.exports = Control.extend({
  defaults: {
    engagementCountKey: 'survey-ad-engagement-count',
    engagementCountMinimum: 3,
    userDidCloseKey: 'survey-ad-closed'
  }
}, {

  /* This should only happen once */
  init: function() {
    var surveyAdElement = this.element;

    // Always show the close button since JS is active
    var closeButton = surveyAdElement.querySelector('.close');
    if (closeButton.classList) {// Only enable the close button in IE10+
      closeButton.style.display = 'inline-block';
    }

    try {

      // Look up the user’s preference in localStorage
      var didClose = window.localStorage.getItem(this.options.userDidCloseKey);

      // Get how many times the user has engaged
      var engagementCount = window.localStorage.getItem(this.options.engagementCountKey);

      // If the user hasn’t closed the control and their engagement count is
      // greater than the minimum, show the control
      if (!didClose && engagementCount >= this.options.engagementCountMinimum) {
        this.show();
      }

    } catch (error) {
      console.info('Caught localStorage error:', error);
    }
  },

  /* This should happen whenever a new page is loaded */
  didEngage: function() {
    try {
      var storageKey = this.options.engagementCountKey;
      var engagementCount = parseInt(window.localStorage.getItem(storageKey) || '0', 10);
      var newEngagementCount = 1 + engagementCount;

      // Store the new engagement count
      window.localStorage.setItem(storageKey, newEngagementCount);

      // Potentially show the control
      if (newEngagementCount >= this.options.engagementCountMinimum) {

        // Look up the user’s preference in localStorage
        var didClose = window.localStorage.getItem(this.options.userDidCloseKey);
        if (!didClose) {
          this.show();
        }

      }
    } catch (error) {
      console.info('Caught localStorage error:', error);
    }
  },

  hide: function(immediately) {

    // Remove .showing to animate the control out of view
    if (this.element.classList) {
      this.element.classList.remove('showing');
    }

    // .survey-ad-showing is used to change padding-bottom on the rest of the content
    document.getElementById('everything').classList.remove('survey-ad-showing');
  },

  show: function() {

    // Add a class to animate the control into view
    if (this.element.classList) {
      this.element.classList.add('showing');
    }

    // .survey-ad-showing is used to change padding-bottom on the rest of the content
    document.getElementById('everything').classList.add('survey-ad-showing');
  },

  /* This event will fire when the user clicks the X button */
  '{element} .close click': function() {

    // Hide the control
    this.hide();

    // Try to remember the user’s preference in localStorage
    try {
      // Get the current time; we don’t make use of this right now,
      // but in the future if we want to re-enable the link after a
      // certain amount of time or for a particular event, we can
      // more easily do that :)
      var currentTime = (new Date()).getTime();
      var storageKey = this.options.userDidCloseKey;
      window.localStorage.setItem(storageKey, currentTime);
    } catch (error) {
      console.info('Caught localStorage error:', error);
    }
  }
});
