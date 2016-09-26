require("./canjs.less!");
$ = require("jquery");

window.addEventListener('popstate', function(e) {
	var href = window.location.href;
	navigate(href);
});

$(document.body).on("click","a",function(ev){
	// make sure we're in the right spot
	if (this.href === "javascript://") {
		return;
	}
	// this might need to change if we add other things
	if(this.hostname === window.location.hostname) {
		var href = this.href;
		ev.preventDefault();
		window.history.pushState(null, null, href);
		navigate(href);
	}
});

function navigate(href) {
	$.ajax(href,{dataType: "text"}).then(function(content){
		$('#right .bottom-right').scrollTop(0);
		var $content = $(content.match(/<body>(\n|.)+<\/body>/g)[0]);

		// find what I clicked on in the current nav ... try positioning it in the same place.
		var nav = $content.find(".bottom-left>ul");
		var article = $content.find("article");
		var breadcrumb = $content.find(".breadcrumb");

		$(".bottom-left>ul").replaceWith(nav);
		$("article").replaceWith(article);
		$(".breadcrumb").replaceWith(breadcrumb);

		// Initialize any scripts in the content
		var scripts = article.find('script');
		$.each(scripts, function(index, script) {
			var src = script.src;
			if (src) {
				$.getScript(src);
			}
		});

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
