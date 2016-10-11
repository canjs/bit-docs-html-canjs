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
	$tableOfContents = $('.on-this-page-table');
	$headers = getHeaders();

	// remove anything in the "On This Page" list
	$onThisPage.empty();
	// add items to on-this-page dropdown
	$.each($('h2'), function(index, header) {
		if (!header.id) {
			header.id = generateId(header);
		}
		$onThisPage.append("<a href=#"+header.id+"><li>"+$(header).html()+"</li></a>");
	});

	if ($headers.length) {
		buildTOC();
	}

	if (window.location.hash) {
		var $currentHeader = $(window.location.hash);
		scrollToElement($currentHeader);
		setOnThisPageTitle($currentHeader.html());
	} else {
		var articleScroll = window.history.state && window.history.state.articleScroll;
		if (articleScroll) {
			$articleContainer.scrollTop(articleScroll);
		} else {
			$articleContainer.scrollTop(0);
		}
	}

}
init();

// Allow use of Back/Forward navigation
window.addEventListener('popstate', function(ev) {
	navigate(window.location.href);
});

// Update the "On This Page" placeholder with header text at scroll position
$articleContainer.on("scroll", function(ev) {
	window.history.replaceState({ articleScroll: $articleContainer.scrollTop() }, null, window.location.href);

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
	if (this.href === "javascript://") { // jshint ignore:line
		return;
	}

	if (this.hostname === window.location.hostname) {
		var href = this.href;
		ev.preventDefault();
		var stateObj = { articleScroll: $articleContainer.scrollTop()};
		window.history.pushState(null, null, href);

		navigate(href);
	}
});

function navigate(href) {
	if (this.pathname === window.location.pathname && window.location.hash) {
		return scrollToElement($(window.location.hash));
	}
	$.ajax(href, {dataType: "text"}).then(function(content) {
		// set content positions
		var $content = $(content.match(/<body>(\n|.)+<\/body>/g)[0]);
		if (!$content.length) {
			window.location.reload();
		}

		var $nav = $content.find(".bottom-left>ul");
		var $article = $content.find("article");
		var $breadcrumb = $content.find(".breadcrumb");
		var $logo = $content.find(".top-left>.brand");
		$(".bottom-left>ul").replaceWith($nav);
		$("article").replaceWith($article);
		$(".breadcrumb").replaceWith($breadcrumb);
		$(".top-left>.brand").replaceWith($logo);

		// Initialize any jsbin scripts in the content
		delete window.jsbinified;

		// go through every package and re-init
		for (var packageName in window.PACKAGES) {
			if (typeof window.PACKAGES[packageName] === "function") {
				window.PACKAGES[packageName]();
			}
		}

		init();
	}, function(){
		window.location.reload();
	});
}

function getHeaders() {
	var	outline = window.docObject && parseInt(window.docObject.outline),
		outlineLevel = !isNaN(outline) ? outline : 1,
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

function buildTOC() {
	var level = 0,
		baseLevel = $headers[0].nodeName.substr(1),
		toc = "<ol>";

	$headers.each(function(index, element) {
		var $el = $(element);
		var title = $el.text().replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
		var link = '#' + generateId($el[0]);

		var prevLevel = level;
		level = element.nodeName.substr(1);

		var newContent;

		if (prevLevel === 0) {
			newContent = '<li>';
		} else if (level === prevLevel) {
			newContent = '</li><li>';
		} else if (level > prevLevel) {
			newContent = Array(level - prevLevel + 1).join('<ol><li>');
		} else if(level < prevLevel) {
			newContent = Array(prevLevel - level + 1).join('</li></ol>') + '</li><li>';
		}

		newContent += "<a href='" + link + "'>" + title + "</a>";
		toc += newContent;
	});

	toc += Array(level - baseLevel + 1).join('</li></ol>') + "</li></ol>";
	$tableOfContents.append(toc);
}
