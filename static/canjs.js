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

		setOnThisPage();

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

$(document.body).on("click", ".header-item", function(ev) {
	var container = $('#right .bottom-right'),
		targetContent = $(ev.currentTarget).html(),
		scrollTo;

	$.each($('h2'), function(index, el) {
		el = $(el);
		if (el.html() === targetContent) {
			scrollTo = el;
		}
	});

	var position = scrollTo.offset().top - container.offset().top + container.scrollTop();
	container.scrollTop(position);
});

function setOnThisPage() {
	var contentHeaders = $("article h2");
	var onThisPage = $(".on-this-page");
	$.each(contentHeaders, function(index, header) {
		onThisPage.append('<li class="header-item">'+header.innerHTML+"</li>");
	});
}
setOnThisPage();
