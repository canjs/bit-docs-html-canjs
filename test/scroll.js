var QUnit = require("steal-qunit");
var F = require('funcunit');
var utils = require('../sidebar/utils');
var $ = require("jquery");

F.attach(QUnit);

QUnit.module('canjs-scroll');

QUnit.test('Scroll down and refresh the page', function(assert) {
	var done = assert.async(1);
	F.open('../doc/guides/html.html', function() {
		F.frame.height = 400;
		F.frame.width = "100%";

		var section = F("#Overview")[0];
		var style = window.getComputedStyle(section);
		var topMargin = Math.max(parseInt(style.paddingTop), 60);
		var pos = section.offsetTop - topMargin - document.querySelector("body").offsetTop;
		F.win.scroll("top", pos);

		
		F("#Overview").wait(function(){
			var element = this[0];
			if (!element) {
				return false;
			}
			var rect = section.getBoundingClientRect();
			F.win.location.reload();
			return utils.rectIntersectsWithWindow(rect, F.win)
		}, function(){
			assert.ok(true);
			done();
		});
	});
	
});

QUnit.test('Refresh after going to a specific section', function(assert) {
	var done = assert.async(1);
	F.open('../doc/guides/html.html', function() {
		F.frame.height = 400;
		F.frame.width = "100%";
		
		F(".on-this-page-table a[href='#Components']").click();
		
		F.win.location.reload();
		
		F("#Components").wait(function(){
			var element = this[0];
			if (!element) {
				return false;
			}
			var rect = element.getBoundingClientRect();
			return utils.rectIntersectsWithWindow(rect, F.win)
		}, 4000, function(){
			assert.ok(true);
			done();
		});
	});
	
});

QUnit.test("Refresh after going to a specific section and scrolling", function(assert) {
	var done = assert.async(1);

	F.open('../doc/guides/html.html', function() {
		F.frame.height = 400;
		F.frame.width = "100%";
	
		F(".on-this-page-table a[href='#Overview']").click();
		
		var pos = F("#Components").offset().top - 60;
		F.win.scroll("top", pos);
		F.win.location.reload();
		
		
		F("#Components").wait(function() {
			var element = this[0];
			if (!element) {
				return false;
			}
			var rect = element.getBoundingClientRect();
			return utils.rectIntersectsWithWindow(rect, F.win)
		}, function() {
			assert.ok(true);
			done();
		});
	});
})
