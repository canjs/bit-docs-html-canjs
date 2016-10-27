require("./canjs.less!");
$ = require("jquery");

// state
var $articleContainer,
	$onThisPage,
	$tableOfContents,
	$onThisPageTitle,
	$everything,
	$headers,
	$nav,
	headerHidden,
	animating,
	navigating;

// Run immediately
setState();
setOnThisPageContent();
buildTOC();
setNavToggleListener();

$('#left').css('min-width', $('.top-left').width());

// This doesn't work very well.
var $dynamic = $(document).find('iframe, video, img');
if ($dynamic.length) {
	$dynamic.load(setScrollPosition);
} else {
	setScrollPosition();
}

// Override link behavior
$(document.body).on("click", "a", function(ev) {
	// make sure we're in the right spot
	if (this.href === "javascript://") { // jshint ignore:line
		return;
	}

	if (navigating) {
		return;
	}

	if (this.hostname === window.location.hostname) {
		var href = this.href;
		ev.preventDefault();
		window.history.pushState(null, null, href);
		navigate(href);
	}
});

// Allow use of Back/Forward navigation
window.addEventListener('popstate', function(ev) {
	navigate(window.location.href);
});

$articleContainer.on("scroll", function(ev) {
	// Maintain scroll state in history
	window.history.replaceState({ articleScroll: $articleContainer.scrollTop() }, null, window.location.href);

	// Update the "On This Page" placeholder with header text at scroll position
	setOnThisPageScroll();
});

// toggle nav on interval instead of scroll to prevent queueing issues
setInterval(function() {
	toggleNav();
}, 100);

//////////

function setState() {
	$articleContainer = $('#right .bottom-right');
	$onThisPage = $('.on-this-page');
	$onThisPageTitle = $('.breadcrumb-dropdown a');
	$tableOfContents = $('.on-this-page-table');
	$everything = $('#everything');
	$headers = getHeaders();
	$nav = $('.top-left > .brand, .top-right-top');
	headerHidden = undefined;
}

function setDocTitle() {
	var title = window.docObject.title || window.docObject.name;
	if (title.toLowerCase() === 'canjs') {
		document.title = title;
	} else {
		document.title = 'CanJS - ' + title;
	}
}

function setScrollPosition() {
	if (window.location.hash) {
		var $currentHeader = $(window.location.hash);
		scrollToElement($currentHeader);
	} else {
		var articleScroll = window.history.state && window.history.state.articleScroll;
		if (articleScroll) {
			$articleContainer.scrollTop(articleScroll);
		} else {
			$articleContainer.scrollTop(0);
		}
	}
}

function navigate(href) {
	navigating = true;
	if (window.location.hash && href.replace(/#.*/, '') === window.location.href.replace(/#.*/, '')) {
		scrollToElement($(window.location.hash));
		navigating = false;
		return;
	}

	$.ajax(href, {
		dataType: "text",
		success: function(content) {
			// Google Analytics
			ga('send', 'pageview', window.location.pathname);

			// set content positions
			var $content = $(content.match(/<body>(\n|.)+<\/body>/g)[0]);
			if (!$content.length) {
				window.location.reload();
			}
			var $nav = $content.find(".bottom-left > ul");
			var $article = $content.find("article");
			var $breadcrumb = $content.find(".breadcrumb");
			var homeLink = $content.find(".logo > a").attr('href');
			$(".bottom-left>ul").replaceWith($nav);
			$("article").replaceWith($article);
			$(".breadcrumb").replaceWith($breadcrumb);
			$(".logo > a").attr('href', homeLink);

			// Initialize any jsbin scripts in the content
			delete window.jsbinified;

			// Initialize github buttons
			$.getScript('https://buttons.github.io/buttons.js');

			// go through every package and re-init
			for (var packageName in window.PACKAGES) {
				if (typeof window.PACKAGES[packageName] === "function") {
					window.PACKAGES[packageName]();
				}
			}

			setState();
			setDocTitle();
			setOnThisPageContent();
			buildTOC();
			setNavToggleListener();
			setScrollPosition();
		},
		error: function() {
			// just reload the page if this fails
			window.location.reload();
		},
		complete: function() {
			navigating = false;
		}
	});
}

function getHeaders(useOutline) {
	var headerArr = [],
		headerDepth = 1;

	if (useOutline) {
		var	outline = window.docObject && parseInt(window.docObject.outline);
		headerDepth = !isNaN(outline) ? outline : 1;
	}

	for (var i = 1; i <= headerDepth; i++) {
		headerArr.push('h' + (i + 1));
	}

	return $(headerArr.join(', ')).each(function(index, header) {
		if (!header.id) {
			header.id = generateId(header);
		}
	});
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

function setOnThisPageContent() {
	// remove anything in the "On This Page" list
	$onThisPage.empty();
	// don't bother with 1 header
	var $h2 = $('h2');
	if ($h2.length < 2) {
		return;
	}
	$('.breadcrumb-dropdown').css('display', 'inline-block');
	// add items to on-this-page dropdown
	$.each($h2, function(index, header) {
		$onThisPage.append("<a href=#"+header.id+"><li>"+$(header).html()+"</li></a>");
	});
}

function setOnThisPageTitle(title) {
	$onThisPageTitle.html(title || 'On this page');
}

function setOnThisPageScroll() {
	var onThisPageTitle = '';
	if ($articleContainer[0].scrollHeight - $articleContainer.scrollTop() === $articleContainer.outerHeight()) {
		// Show last header if at bottom of page
		var $header = $($headers[$headers.length-1]);
		onThisPageTitle = $header.html();
	} else {
		// Otherwise, try to set to last header value before scroll position
		var contOffsetTop = $articleContainer.offset().top;
		$.each($headers, function(index, header) {
			var $header = $(header);
			var marginTop = parseInt($header.css('margin-top')) || 20;
			if ($header.offset().top - marginTop - contOffsetTop <= 0) {
				onThisPageTitle = $header.html();
			}
		});
	}
	setOnThisPageTitle(onThisPageTitle);
}

function setNavToggleListener() {
	$('.nav-toggle').on('click', function(){
		$articleContainer.scrollTop(0);
		toggleNav(false);
	});
}

function toggleNav(hide) {
	// Don't run in mobile
	if (window.innerWidth < 1000) {
		return;
	}

	// Don't rely on jQuery's queue.
	// The animation completion functions break it.
	if (animating) {
		return;
	}

	var breakpoint = 20,
		headerHeight = 53;

	if ($nav.css('display') === 'none') {
		$('.nav-toggle').show();
	}

	// Determines if the nav should hide (true) or show (false)
	// Use `hide` argument if passed
	// Otherwise, check if scroll position is past hiding breakpoint
	var shouldHide = hide === undefined ? $articleContainer.scrollTop() >= breakpoint : hide;

	// Don't run on new page if not after breakpoint
	// Unless `hide` argument is passed
	if (headerHidden === undefined && shouldHide === false && hide === undefined) {
		return;
	}

	// Don't hide if already hidden
	// Make sure hidden states are set
	if (shouldHide && $nav.css('display') === 'none') {
		headerHidden = true;
		return;
	}

	// Don't run headerHidden isn't changing
	if (shouldHide === headerHidden) {
		return;
	}

	// Set hiding and animation states
	headerHidden = shouldHide;
	animating = true;

	if (shouldHide) {
		$('.nav-toggle').show();
		$everything.animate({
			"margin-top": 0-headerHeight,
			"height": parseFloat($everything.css('height')) + headerHeight
		}, {
			duration: 250,
			complete: function() {
				$nav.hide();
				$everything.css('height', '');
				$everything.css('margin-top', '');
				animating = false;
			}
		});
	} else {
		$('.nav-toggle').hide();
		$everything.css('height', parseFloat($everything.css('height')) + headerHeight);
		$everything.css('margin-top', 0-headerHeight);
		$nav.show();
		$everything.animate({
			"margin-top": '0',
			"height": '100%'
		}, {
			duration: 250,
			complete: function() {
				animating = false;
			}
		});
	}
}

function buildTOC() {
	var $tocHeaders = getHeaders(true);

	if (!$tocHeaders.length || $tocHeaders.length < 2) {
		return;
	}

	var level = 0,
		baseLevel = $tocHeaders[0].nodeName.substr(1),
		toc = "<ol>";

	$tocHeaders.each(function(index, element) {
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
