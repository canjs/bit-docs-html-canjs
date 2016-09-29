require("./canjs.less!");
$ = require("jquery");

var $articleContainer,
	$onThisPage,
	$tableOfContents,
	$onThisPageTitle,
	$headers;

// Init
function init() {
	$articleContainer = $('#right .bottom-right');
	$onThisPage = $('.on-this-page');
	$onThisPageTitle = $('.breadcrumb-dropdown a');
	$tableOfContents = $('on-this-page-table ol');
	$headers = getHeaders();

	// remove anything in the "On This Page" list
	$onThisPage.empty();
	// add items to on-this-page dropdown
	$.each($headers, function(index, header) {
		if (!header.id) {
			header.id = generateId(header);
		}
		$onThisPage.append("<a href=#"+header.id+"><li>"+$(header).html()+"</li></a>");
	});

	var $currentHeader = $(window.location.hash);
	scrollToElement($currentHeader);
	setOnThisPageTitle($currentHeader.html());
}
init();

// Allow use of Back/Forward navigation
window.addEventListener('popstate', function(ev) {
	navigate(window.location.href);
});

// Update the "On This Page" placeholder with header text at scroll position
$articleContainer.on("scroll", function(ev) {
	if ($articleContainer[0].scrollHeight - $articleContainer.scrollTop() === $articleContainer.outerHeight()) {
		// Show last header if at bottom of page
		var $header = $($headers[$headers.length-1]);
		setOnThisPageTitle($header.html());
	} else {
		// Otherwise, try to set to last header value before scroll position
		var contOffsetTop = $articleContainer.offset().top,
			headerContent;
		$.each($headers, function(index, header) {
			var $header = $(header);
			var marginTop = parseInt($header.css('margin-top')) || 20;
			if ($header.offset().top - marginTop - contOffsetTop <= 0) {
				headerContent = $header.html();
			}
		});
		setOnThisPageTitle(headerContent);
	}
});

// Override link behavior
$(document.body).on("click", "a", function(ev) {
	// make sure we're in the right spot
	if (this.href === "javascript://") {
		return;
	}

	var href = this.href;
	ev.preventDefault();
	window.history.pushState(null, null, href);

	if (this.hostname === window.location.hostname) {
		if (this.pathname === window.location.pathname && window.location.hash) {
			scrollToElement($(window.location.hash));
		} else {
			navigate(href);
		}
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
	var	outline = window.docObject && parseInt(window.docObject.outline),
		outlineLevel = !isNaN() ? outline : 1,
		headerArr = [];
	for (var i = 1; i <= outlineLevel; i++) {
		headerArr.push('h' + (outlineLevel + 1));
	}
	return $(headerArr.join(', '));
}

function generateId(element) {
	var txt = element.textContent;
	return txt.replace(/\s/g,"").replace(/[^\w]/g,"_");
}

function scrollToElement($element) {
	if ($element.length) {
		var topMargin = parseInt($element.css('margin-top')) || 20;
		var pos = $element.offset().top - topMargin - $articleContainer.offset().top + $articleContainer.scrollTop();
		$articleContainer.scrollTop(pos);
	} else {
		$articleContainer.scrollTop(0);
	}
	setOnThisPageTitle($element.html());
}

function setOnThisPageTitle(title) {
	$onThisPageTitle.html(title || 'On this page');
}
