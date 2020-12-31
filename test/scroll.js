var QUnit = require("steal-qunit");
var F = require('funcunit');
var utils = require('../sidebar/utils');
var $ = require("jquery");

F.attach(QUnit);

QUnit.module('canjs-scroll', {
  beforeEach: function() {

    // Clear local storage
    window.localStorage.clear();

  }
});

QUnit.test('Scroll down and refresh the page', function(assert) {
	var done = assert.async();

	// Open a page
	F.open('../doc/guides/html.html', function() {
		var offset = 100;

		// Set the size so the page takes up some space
		F.frame.height = 200;
		F.frame.width = "100%";

		// Scroll down 100px
		F.win.scroll("top", offset);

		// Reload the page
		F.win.location.reload();

		// Wait for the page to be loaded
		F("body").wait(function() {
			// Check whether the element exists
			return this[0] ? true : false;
		}, function() {
			// Get the amount the body has been scrolled
			var bodyTopOffset = F("body")[0].getBoundingClientRect().top;
			assert.equal(bodyTopOffset, 0 - offset);
			done();
		});
	});
});

QUnit.test('Refresh after going to a specific section', function(assert) {
	var done = assert.async();

	// Open a page
	F.open('../doc/guides/html.html', function() {

		// Set the size so the page takes up some space
		F.frame.height = 200;
		F.frame.width = "100%";

		// Click a TOC link to go to a specific section
		F(".on-this-page-table a[href='#Components']").click();

		// Reload the page
		F.win.location.reload();

		// Wait for the page to be loaded
		F("#Components").wait(function() {
			// Check whether the element exists
			return this[0] ? true : false;
		}, function() {
			// Wait for the restoration logic to run
			setTimeout(function() {
				// Determine whether the section is in view
				var rect = F.win.$("#Components")[0].getBoundingClientRect();
				assert.ok(utils.rectIntersectsWithWindow(rect, F.win));
				done();
			}, 300);
		});
	});
});

QUnit.test("Refresh after going to a specific section and scrolling", function(assert) {
	var done = assert.async();

	// Open a page
	F.open('../doc/guides/html.html', function() {
		var offset = 100;

		// Set the size so the page takes up some space
		F.frame.height = 200;
		F.frame.width = "100%";

		// Click a TOC link to go to a specific section
		F(".on-this-page-table a[href='#Overview']").click();

		// Wait for the page to be scrolled down to the section
		F.wait(300, function() {

			// Scroll to 100px from the top of the page
			F.win.scroll("top", offset);

			// Reload the page
			F.win.location.reload();

			// Wait for the page to be loaded
			F("body").wait(function() {
				// Check whether the element exists
				return this[0] ? true : false;
			}, function() {
				// Wait for the restoration logic to run
				setTimeout(function() {
					// Get the amount the body has been scrolled
					var bodyTopOffset = F("body")[0].getBoundingClientRect().top;
					assert.equal(bodyTopOffset, 0 - offset);
					done();
				}, 300);
			});
		});
	});
});
