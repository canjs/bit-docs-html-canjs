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

			$("article").replaceWith(article);

			// find what I clicked on in the current nav ... try positioning it in the same place.
			$(".bottom-left>ul").replaceWith(nav);
		}, function(){
			debugger;
		});
	}
});
