require("./canjs.less!");
$ = require("jquery");

$(document.body).on("click","a",function(ev){
	// make sure we're in the right spot
	if(this.href === "javascript://") {
		return;
	}
	// this might need to change if we add other things
	if(this.hostname === window.location.hostname) {
		var node = $(this);
		var href = this.href;
		ev.preventDefault();
		window.history.pushState(null, null, this.href);
		$.ajax(href,{dataType: "text"}).then(function(content){
			var $content = $(content.match(/<body>(\n|.)+<\/body>/g)[0]);

			var nav = $content.find(".bottom-left>ul");
			var article = $content.find("article");
			var breadcrumb = $content.find(".breadcrumb");

			$(".bottom-left>ul").replaceWith(nav);
			$("article").replaceWith(article);
			$(".breadcrumb").replaceWith(breadcrumb);
			// find what I clicked on in the current nav ... try positioning it in the same place.

			// go through every package and re-init
			for(var packageName in window.PACKAGES) {
				if(typeof PACKAGES[packageName] === "function") {
					PACKAGES[packageName]();
				}
			}
		}, function(){
			debugger;
		});
	}
});

// Show/Hide the top navigation on scroll
// using a duration results in a disjointed animation.
var lastScrollTop = 0,
	topNav = $('#right .top-right-top, #left .brand');
$('#right .bottom-right').scroll(function(e) {
	var newScrollTop = $(this).scrollTop();
	if (lastScrollTop > newScrollTop) {
		topNav.show(); // scrolling up, show nav
	} else {
		topNav.hide(); // scrolling down, hide nav
	}
	lastScrollTop = newScrollTop;
});
