require("./canjs.less!");
$ = require("jquery");

var outline,
	$articleContainer,
	$onThisPage,
	$onThisPageTitle,
	$headers;

// Init
function init() {
	outline = window.docObject && parseInt(window.docObject.outline);
	$articleContainer = $('#right .bottom-right');
	$onThisPage = $('.on-this-page');
	$onThisPageTitle = $('.breadcrumb-dropdown a');
	$headers = getHeaders();

	$articleContainer.scrollTop(0); // ensure scroll-to-top

	// remove anything in the "On This Page" list
	$onThisPage.empty();
	// add items to on-this-page dropdown
	console.log('doing the headers thing');
	console.log($headers);
	$.each($headers, function(index, header) {
		$onThisPage.append("<li>"+$(header).html()+"</li>");
	});
}
init();

// Allow use of Back/Forward navigation
window.addEventListener('popstate', function(ev) {
	navigate(window.location.href);
});

// Override link behavior
$(document.body).on("click", "a", function(ev) {
	// make sure we're in the right spot
	if (this.href === "javascript://") {
		return;
	}
	// this might need to change if we add other things
	if (this.hostname === window.location.hostname) {
		var href = this.href;
		ev.preventDefault();
		window.history.pushState(null, null, href);
		navigate(href);
	}
});

// Scroll to matching header after clicking on this page item
$(document.body).on("click", ".on-this-page li", function(ev) {
	var targetContent = $(ev.currentTarget).html(),
		targetScroll;

	$.each($('h2'), function(index, el) {
		el = $(el);
		if (el.html() === targetContent) {
			targetScroll = el;
		}
	});

	var pos = targetScroll.offset().top - $articleContainer.offset().top + $articleContainer.scrollTop();
	$articleContainer.scrollTop(pos);
});

// Update the "On This Page" placeholder with header text at scroll position
$articleContainer.on("scroll", function(ev) {
	if ($articleContainer[0].scrollHeight - $articleContainer.scrollTop() === $articleContainer.outerHeight()) {
		// Show last header if at bottom of page
		var $header = $($headers[$headers.length-1]);
		$onThisPageTitle.html($header.html());
	} else {
		// Otherwise, try to set to last header value before scroll position
		var contOffsetTop = $articleContainer.offset().top,
			headerContent;
		$.each($headers, function(index, header) {
			var $header = $(header);
			if ($header.offset().top - contOffsetTop <= 0) {
				headerContent = $header.html();
			}
		});
		$onThisPageTitle.html(headerContent || 'On this page');
	}
});

function navigate(href) {
	$.ajax(href, {dataType: "text"}).then(function(content) {
		// set content positions
		var $content = $(content.match(/<body>(\n|.)+<\/body>/g)[0]);
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
		for (var packageName in window.PACKAGES) {
			if (typeof PACKAGES[packageName] === "function") {
				PACKAGES[packageName]();
			}
		}

		init();
	}, function(){
		debugger;
	});
}

function getHeaders() {
	var outlineLevel = !isNaN() ? outline : 1,
		headerArr = [];
	for (var i = 1; i <= outlineLevel; i++) {
		headerArr.push('h' + (outlineLevel + 1));
	}
	return $(headerArr.join(', '));
}
