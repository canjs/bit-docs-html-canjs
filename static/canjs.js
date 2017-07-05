require("./canjs.less!");
var LoadingBar = require('./loading-bar.js');
$ = require("jquery");
var debounce = require("lodash/debounce");
var loader = new LoadingBar('blue');
var SearchControl = require('./search');

// state
var $articleContainer,
	$onThisPage,
	$tableOfContents,
	$onThisPageTitle,
	$everything,
	$headers,
	$nav,
	$pathPrefix,
	$navTrigger,
	$navLabel,
	headerHidden,
	animating,
	navigating,
	scrollPositionInterval,
	currentHref,
	searchControl,
	hasShownSearch;

(function() {
	//flag that determines whether or not the search has already been shown
	//(used for fading in or not)
	hasShownSearch = false;
	init();

	// prevent sidebar from changing width when header hides
	$('#left').css('min-width', $('.top-left').width());

	// Override link behavior
	$(document.body).on("click", "a", function(ev) {
		var noModifierKeys = !ev.altKey && !ev.ctrlKey && !ev.metaKey && !ev.shiftKey,
			sameHostname = (ev.target.hostname || this.hostname) === window.location.hostname,
			sameProtocol = (ev.target.protocol || this.protocol) === window.location.protocol;

		if (noModifierKeys && sameHostname && sameProtocol) {
			ev.preventDefault();
			navigate(ev.target.href || this.href);
		}
	}).on('keyup', 'input[type="checkbox"]', function(e){
		var $target = $(e.target);
		if(e.keyCode == 13 && $target.is(document.activeElement)){
			$target.prop('checked', !$target.prop('checked'));
			$target.trigger('change');
		}
	});

	$navTrigger.focus(function(){
		$navTrigger.siblings('label').addClass('active');
	}).blur(function(){
		$navTrigger.siblings('label').removeClass('active');
	});

	// Back/Forward navigation
	window.addEventListener('popstate', function(ev) {
		ev.preventDefault();
		navigate(window.location.href);
	});

	$articleContainer.on("scroll", debounce(function(ev) {
		// Maintain scroll state in history
		window.history.replaceState({ articleScroll: $articleContainer.scrollTop() }, null, window.location.href);

		// Update the "On This Page" placeholder with header text at scroll position
		setOnThisPageScroll();
	}, 50));

	// toggle nav on interval instead of scroll to prevent queueing issues
	setInterval(function() {
		toggleNav();
	}, 200);
	
	scrollToCurrentMenuItem();
})();

// Touch support
$('body').on('touchstart', function() {});

//////////

function init() {
	// Set state
	$articleContainer = $('#right .bottom-right');
	$onThisPage = $('.on-this-page');
	$navTrigger = $('#nav-trigger');
	$onThisPageTitle = $('.breadcrumb-dropdown a');
	$tableOfContents = $('.on-this-page-table');
	$everything = $('#everything');
	$headers = getHeaders();
	$nav = $('.top-left > .brand, .top-right-top');
	$pathPrefix = $("[path-prefix]").first();
	headerHidden = undefined;
	currentHref = window.location.href;

	setPathPrefix();
	setOnThisPageContent();
	buildTOC();
	setNavToggleListener();
	setScrollPosition();

	if (!searchControl) {
		searchControl = new SearchControl(".search-bar", {
			navigate: function(href){
				navigate(href);
			},
			pathPrefix: window.pathPrefix,
			animateInOnStart: !hasShownSearch
		});
	}

	hasShownSearch = true;
}

function scrollToCurrentMenuItem(){
	var currentPageLi = $('li.current');
	if(currentPageLi.length){
		$('.nav-menu').scrollTop(currentPageLi.offset().top - $('.nav-menu').offset().top);
	}
}

function setPathPrefix(){
	var pathPrefix;
	if($pathPrefix && $pathPrefix.length){
		pathPrefix = $pathPrefix.attr("path-prefix");
		if(pathPrefix && pathPrefix.length){
			window.pathPrefix = pathPrefix;
		}
	}
}

function setDocTitle() {
	var title = window.docObject.title || window.docObject.name;
	if (title.toLowerCase() === 'canjs') {
		document.title = title;
	} else {
		document.title = 'CanJS - ' + title;
	}
}

// Set the scroll position until user scrolls or navigates away.
// This ensures that the scroll position is correctly set to the target element,
// regardless of asynchonously embedded elements.
function setScrollPosition() {
	var lastAutoScroll;
	animating = true; // flag animating on first run only
	scrollPositionInterval = setInterval(function() {
		var currentScroll = $articleContainer.scrollTop();
		if (lastAutoScroll === undefined || lastAutoScroll === currentScroll) {
			if (window.location.hash) {
				var $currentHeader = $(window.location.hash);
				scrollToElement($currentHeader);
			} else {
				var articleScroll = window.history.state && window.history.state.articleScroll;
				if (articleScroll) {
					$articleContainer.scrollTop(articleScroll);
				} else {
					$articleContainer.scrollTop(0);
					clearInterval(scrollPositionInterval);
				}
			}
			lastAutoScroll = $articleContainer.scrollTop();
		} else {
			// User manually scrolled
			clearInterval(scrollPositionInterval);
		}
		animating = false;
	}, 250);
}

var $menuButton = $('[for="nav-trigger"]');
var $navTrigger = $('#nav-trigger');

function navigate(href) {
	// make sure we're in the right spot
	if (href === "javascript://") { // jshint ignore:line
		return;
	}

	// disable links while navigating
	if (navigating) {
		return;
	}

	$articleContainer.scrollTop(0);

	// just scroll to hash if possible
    if (window.location.hash && href.replace(/#.*/, '') === currentHref.replace(/#.*/, '')) {
        scrollToElement($(window.location.hash));
        return;
    }

	window.history.pushState(null, null, href);

	// clear existing scroll interval if it's still alive
	clearInterval(scrollPositionInterval);

	loader.start();

	if($menuButton.is(':visible')){
		$navTrigger.prop('checked', false);
	}

	navigating = true;
	$.ajax(href, {
		dataType: "text",
		xhr: function() {
			var xhr = new window.XMLHttpRequest();
			xhr.addEventListener("progress", function(evt){
				if (evt.lengthComputable) {
					var percentComplete = (evt.loaded / evt.total) * 100;
					loader.update(Math.floor(percentComplete));
				}
			}, false);
			return xhr;
		},
		success: function(content) {
			// Google Analytics
			ga('send', 'pageview', window.location.pathname);

			// set new content
			var $content = $(content.match(/<body.*?>[\s\S]+<\/body>/g)[0]);
			if (!$content.length) {
				window.location.reload();
			}
			var $nav = $content.find(".bottom-left .scrollable-contents > ul"),
					$article = $content.find("article"),
					$breadcrumb = $content.find(".breadcrumb"),
					homeLink = $content.find(".logo > a").attr('href'),
					$navReplace = $(".bottom-left .scrollable-contents > ul"),

					//root elements - use .filter; not .find
					$pathPrefixDiv = $content.filter("[path-prefix]");


			//if any page doesn't have a nav, replacing it won't work,
			//and the nav will be gone for any subsequent page visits
			if($navReplace && $navReplace.length){
				$navReplace.replaceWith($nav);
			}else{
				$(".bottom-left").append($nav);
			}
			$("article").replaceWith($article);
			$(".breadcrumb").replaceWith($breadcrumb);
			$(".logo > a").attr('href', homeLink);
			$("[path-prefix]").replaceWith($pathPrefixDiv);

			// Initialize jsbin scripts
			delete window.jsbinified;

			// Initialize github buttons
			$.getScript('https://buttons.github.io/buttons.js');

			loader.end();

			// go through every package and re-init
			for (var packageName in window.PACKAGES) {
				if (typeof window.PACKAGES[packageName] === "function") {
					window.PACKAGES[packageName]();
				}
			}

			init();
			setDocTitle();

			searchControl.options.pathPrefix = window.pathPrefix;
			if(searchControl.searchResultsCache){
				searchControl.renderSearchResults(searchControl.searchResultsCache);
			}
		},
		error: function() {
			window.history.pushState(null, null, href);
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
	var $breadcrumb = $(".breadcrumb");
	var $h2 = $('h2');
	var showDropdown = $h2.length > 1;

	if (showDropdown) {
		$breadcrumb.addClass('dropdown-has-items');
	} else {
		$breadcrumb.removeClass('dropdown-has-items');
	}

	// don't bother with 1 header
	if (!showDropdown) {
		return;
	}

	// remove anything in the "On This Page" list
	$onThisPage.empty();

	$onThisPage.parent().css('display', 'inline-block');
	// add items to on-this-page dropdown
	$.each($h2, function(index, header) {
		if (header.tagName === 'A') {
			header = header.innerHTML;
		}
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

	// Show the toggle button if nav is hidden
	if ($nav.css('display') === 'none') {
		$('.nav-toggle').show();
	}

	// Determines if the nav should hide (true) or show (false)
	// Use `hide` override if passed as argument
	// Otherwise, check if scroll position is past hiding breakpoint
	var shouldHide = hide === undefined ? $articleContainer.scrollTop() >= breakpoint : hide;

	// Don't run on new page before breakpoint unless `hide` override is passed as argument.
	if (headerHidden === undefined && shouldHide === false && hide === undefined) {
		return;
	}

	// Don't hide if already hidden, set hidden state
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