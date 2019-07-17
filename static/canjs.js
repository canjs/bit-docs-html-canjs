require("./canjs.less!");
var LoadingBar = require('./loading-bar.js');
$ = require("jquery");
var debounce = require("lodash/debounce");
var loader = new LoadingBar('blue');
var SearchControl = require('./search');
var SidebarComponent = require("../sidebar/sidebar");
var stache = require('can-stache');
var can = require("can-namespace");

// exposes canjs stuff so widgets can use it.
window.can = can;

var getParentModule = function(docObject) {
	if (docObject.type === "module") {
		return docObject;
	} else {
		return getParentModule(docObject.parentPage);
	}
};

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
	sidebarViewModel,
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

		// Fix relative URLs in IE 11
		if (!ev.target.hostname && !this.hostname && !ev.target.protocol && !this.protocol) {
			this.href = this.href;
		}

		var noModifierKeys = !ev.altKey && !ev.ctrlKey && !ev.metaKey && !ev.shiftKey,
			sameHostname = (ev.target.hostname || this.hostname) === window.location.hostname,
			sameProtocol = (ev.target.protocol || this.protocol) === window.location.protocol;

		if (noModifierKeys && sameHostname && sameProtocol) {
			ev.preventDefault();
			searchControl.hideResults();
			navigate(ev.target.href || this.href);
		}
	}).on('click', function(event) {
		var searchContainer = document.querySelector('.search-section');
		if ($.contains(searchContainer, event.target) === false) {
			searchControl.hideResults();
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

	// Set the scrollbar-width CSS variable
	window.addEventListener("focus", updateScrollbarWidthCSSVariable);
	updateScrollbarWidthCSSVariable();

	// If the window changes size, we might need to hide the TOC scrollbar
	window.addEventListener("resize", debounce(hideTOCSidebarScrollbar, 20));

	// Back/Forward navigation
	window.addEventListener('popstate', function(ev) {
		ev.preventDefault();
		ev.stopImmediatePropagation();// This helps maintain the correct scroll position in Chrome
		navigate(window.location.href, false);
	});

	$articleContainer.on("scroll", debounce(function(ev) {
		// Maintain scroll state in history
		window.history.replaceState({ articleScroll: getPageScrollTop() }, null, window.location.href);
	}, 50));
})();

// Touch support
$('body').on('touchstart', function() {});

//////////

function init() {
	// Set state
	$articleContainer = $('body');
	$onThisPage = $('.on-this-page');
	$navTrigger = $('#nav-trigger');
	$tableOfContents = $('.on-this-page-table');
	$everything = $('#everything');
	$headers = getHeaders();
	$nav = $('.top-left > .brand, .top-right-top');
	$pathPrefix = $("[path-prefix]").first();
	headerHidden = undefined;
	currentHref = window.location.href;

	setPathPrefix();
	buildTOC();
	setScrollPosition();

	if (!searchControl) {
		searchControl = new SearchControl(".search-bar", {
			navigate: navigate,
			pathPrefix: window.pathPrefix,
			animateInOnStart: !hasShownSearch
		});
	}

	// Set up the client-side sidebar nav
	if (!sidebarViewModel) {
		sidebarViewModel = new SidebarComponent.ViewModel({
			pathPrefix: window.pathPrefix
		});

		searchControl.getSearchMap().then(function(searchMap) {
			sidebarViewModel.searchMap = searchMap;

			// Find the current menu that contains social-side-container and a ul
			var currentMenu = document.querySelector('.nav-menu');

			// Construct the new sidebar DOM fragment
			var renderer = stache('<canjs-sidebar class="nav-menu" pathPrefix:from="pathPrefix" searchMap:from="searchMap" selectedPageName:from="selectedPageName" />');
			var fragment = renderer(sidebarViewModel);

			// Add the new sidebar before the current menu
			var parentContainer = currentMenu.parentElement;
			parentContainer.insertBefore(fragment, currentMenu);

			// Get rid of the old menu
			currentMenu.parentNode.removeChild(currentMenu);
		}, function(error) {
			console.error('Failed to get search map with error:', error);
		});
	}

	// Update the selected page in the sidebar
	if (window.docObject) {
		sidebarViewModel.selectedPageName = window.docObject.name;
	}

	// Set up the client-side TOC
	if (window.customElements) {
		var tocContainer = document.querySelector("#toc-sidebar nav");
		var oldToc = document.querySelector("bit-toc");
		if (oldToc) {
			tocContainer.removeChild(oldToc);
		}
		var newToc = document.createElement("bit-toc");
		newToc.depth = getOutlineDepth();
		newToc.headingsContainerSelector = "body";
		newToc.scrollSelector = "#toc-sidebar nav";
		newToc.highlight = function() {
			var articleRect = this.article.getBoundingClientRect();
			var buttons = this.buttons;
			var titles = this.titles.filter(function(title) {
				return !title.attributes['data-skip'];
			});
			var positions = titles.map(function(header, i) {
				return {
					header: header,
					rect: header.getBoundingClientRect(),
					button: buttons[i]
				};
			});
			positions.push({ rect: { top: articleRect.top + this.article.scrollHeight - this.article.scrollTop } });
			positions.slice(0, positions.length - 1).forEach(function(position, index) {
				position.button.classList.remove('completed', 'active');
				var curRect = position.rect;
				var curDistance = curRect.top;// was - articleRect.top
				var nextRect = positions[index + 1].rect;
				var nextDistance = nextRect.top;// was - articleRect.top
				if (nextDistance >= 0 && nextDistance <= articleRect.height && curDistance >= 0 && curDistance <= articleRect.height) {
					var lastPosition = positions[index - 1];
					if (lastPosition) {
						lastPosition.button.classList.add('completed');
					}
					position.button.classList.add('active');
				} else if (nextDistance < articleRect.height / 2) {
					position.button.classList.add('completed');
				} else if (nextDistance >= articleRect.height / 2 && curDistance < articleRect.height / 2) {
					var lastPosition = positions[index - 1];
					if (lastPosition) {
						lastPosition.button.classList.add('completed');
					}
					position.button.classList.add('active');
				}
			});

			// Get the last element in the nav that’s highlighted
			var activeOrCompleted = this.querySelectorAll(".active,.completed");
			var lastActiveOrCompleted = activeOrCompleted[activeOrCompleted.length - 1];
			if (lastActiveOrCompleted) {
				lastActiveOrCompleted = lastActiveOrCompleted.querySelector('a');

				// Check to see if it’s in viewport
				var lastActiveOrCompletedRect = lastActiveOrCompleted.getBoundingClientRect();
				var sidebarElement = this.outlineScrollElement;
				var sidebarElementBoundingRect = sidebarElement.getBoundingClientRect();
				var topInset = sidebarElementBoundingRect.top;// Main nav height
				var visibleSidebarHeight = sidebarElementBoundingRect.height;// Not the entire height, just what’s visible in the viewport
				var lastActiveOrCompletedRectIsInViewport = (
					lastActiveOrCompletedRect.bottom <= visibleSidebarHeight &&
					lastActiveOrCompletedRect.left >= 0 &&
					lastActiveOrCompletedRect.left <= window.innerWidth &&
					lastActiveOrCompletedRect.top >= topInset &&
					lastActiveOrCompletedRect.top <= visibleSidebarHeight
				);
				if (lastActiveOrCompletedRectIsInViewport === false) {
					// Scroll the sidebar so the highlighted element is in the viewport
					var amountScrolledDownSidebar = tocContainer.scrollTop;
					var additionalScrollAmount = lastActiveOrCompletedRect.top - visibleSidebarHeight;
					var amountToScroll = topInset + (visibleSidebarHeight / 2) + additionalScrollAmount + amountScrolledDownSidebar;
					tocContainer.scrollTop = amountToScroll;
				}
			}
		};
		newToc.setupHighlighting = function() {

			// Add a class to li elements with a ul element inside them
			tocContainer.querySelectorAll("li > ul").forEach(function(childUl) {
				childUl.parentElement.classList.add("nested");
			});

			// Highlighting
			this.article = document.querySelector(this.containerSelector);
			var highlight =  debounce(this.highlight.bind(this),1);
			window.addEventListener("scroll",highlight);
			this.teardowns.push(function() {
				window.removeEventListener("scroll", highlight);
			}.bind(this));
			this.highlight();
		};
		tocContainer.appendChild(newToc);

		// Show the “On this page” title
		var onThisPage = document.querySelector("#toc-sidebar nav h1");
		onThisPage.classList.remove("hide");

		// After the TOC loads, determine whether the “On this page” title should show
		setTimeout(function() {
			if (tocContainer.contains(newToc) === false) {
				// Hide the “On this page” title
				onThisPage.classList.add("hide");
			}

			// Determine whether space for the scrollbar needs to be added
			hideTOCSidebarScrollbar();
		});
	}

	hasShownSearch = true;
}

function setPathPrefix(){
	var pathPrefix;
	if($pathPrefix && $pathPrefix.length){
		pathPrefix = $pathPrefix.attr("path-prefix");
		if(pathPrefix && pathPrefix.length){
			if (searchControl) {
				searchControl.options.pathPrefix = pathPrefix;
			}
			if (sidebarViewModel) {
				sidebarViewModel.pathPrefix = pathPrefix;
			}
			window.pathPrefix = pathPrefix;
		}
	}
}

function setDocTitle(docObject) {
	var title = docObject.title || docObject.name || "CanJS";
	if (title.toLowerCase() === 'canjs') {
		return title;
	}
	if (docObject.type !== "page") {
		var group, groupParentPage;
		if (docObject.type === "module") {
			group = docObject.parentPage;
		} else {
			var parentModule = getParentModule(docObject);
			group = parentModule.parentPage;
			title += " | " + (parentModule.title || parentModule.name);
		}

		groupParentPage =  group.parentPage;
		if (groupParentPage.type === "module") {
			//handle sub-modules paths, eg. can-connect
			title += " | "  + (groupParentPage.title || groupParentPage.name);
			if (groupParentPage.parentPage.type === "group") {
				title += " | " + groupParentPage.parentPage.title + " | " + groupParentPage.parentPage.parentPage.title;
			}
		} else {
			title += " | " + group.title + " | " + groupParentPage.title;
		}
		title += " | CanJS";
	} else {
		var parentPage = docObject.parentPage;
		while(parentPage) {
			title += " | " + parentPage.title;
			parentPage = parentPage.parentPage;
		}
	}
	document.title = title;
}

// Set the scroll position until user scrolls or navigates away.
// This ensures that the scroll position is correctly set to the target element,
// regardless of asynchonously embedded elements.
function setScrollPosition() {
	var lastAutoScroll;
	animating = true; // flag animating on first run only
	scrollPositionInterval = setInterval(function() {
		var currentScroll = getPageScrollTop();
		if (lastAutoScroll === undefined || lastAutoScroll === currentScroll) {
			if (window.location.hash) {
				var $currentHeader = $(window.location.hash);
				scrollToElement($currentHeader);
			} else {
				var articleScroll = window.history.state && window.history.state.articleScroll;
				if (articleScroll) {
					setPageScrollTop(articleScroll);
				} else {
					setPageScrollTop(0);
					clearInterval(scrollPositionInterval);
				}
			}
			lastAutoScroll = getPageScrollTop();
		} else {
			// User manually scrolled
			clearInterval(scrollPositionInterval);
		}
		animating = false;
	}, 250);
}

var $menuButton = $('[for="nav-trigger"]');
var $navTrigger = $('#nav-trigger');

function navigate(href, updateLocation) {
	// make sure we're in the right spot
	if (href === "javascript://") { // jshint ignore:line
		return;
	}

	// disable links while navigating
	if (navigating) {
		return;
	}

	// just scroll to hash if possible
	var currentHrefBase = currentHref.replace(/#.*/, '');// This is the current URL without the hash
	var hrefBase = href.replace(/#.*/, '');// This is the new URL without the hash
	if (currentHrefBase === hrefBase) {
		var hrefHash = href.match(/#.*/, '') || [];// Match the hash part of the URL, including the hash
		scrollToElement($(hrefHash[0]));
		if (updateLocation !== false) {// We don’t want to pushState when our popstate listener calls this
			window.history.pushState({ articleScroll: getPageScrollTop() }, null, href);
		}
		return;
	}

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

			if(window.history.pushState && updateLocation !== false){
				window.history.pushState(null, null, href);
			}

			// Google Analytics
			ga('send', 'pageview', window.location.pathname);

			// set new content
			var $content = $(content.match(/<body.*?>[\s\S]+<\/body>/g)[0]);
			if (!$content.length) {
				window.location.reload();
			}

			// Scroll to the top of the page & TOC sidebar
			setPageScrollTop(0);
			$('#toc-sidebar nav').scrollTop(0);

			var $article = $content.find("article");
			var currentPage = $content.filter("#everything").attr("data-current-page");
			var $headerLinks = $content.find(".top-right-links");
			var homeLink = $content.find(".logo > a").attr('href');

			// Remove GitHub star buttons from the main body in IE
			if (!!navigator.userAgent.match(/Trident/g) || !!navigator.userAgent.match(/MSIE/g)) {
				var gitHubButtons = $article.find('.body .github-button');
				gitHubButtons.each(function() {
					this.classList.remove('github-button');
				});
			}

			//root elements - use .filter; not .find
			var $pathPrefixDiv = $content.filter("[path-prefix]");

			// handle inline javascript code
			// create a steal module on the fly
			var scripts = $article[0].querySelectorAll('script[type="text/steal-module"]');
			$.each(scripts, function (i, script) {
				if (typeof steal !== 'undefined') {
					if (script.id && !steal.loader.has(script.id)) {
						steal.loader.define(script.id, script.innerText);
					}
				}
			});

			$(".top-right-links").replaceWith($headerLinks);
			$("article").replaceWith($article);
			$(".logo > a").attr('href', homeLink);
			$("[path-prefix]").replaceWith($pathPrefixDiv);
			$("[data-current-page]").attr("data-current-page", currentPage);

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
			setDocTitle(sidebarViewModel.selectedPage);

			if(searchControl.searchResultsCache){
				searchControl.renderSearchResults(searchControl.searchResultsCache);
			}
		},
		error: function() {
			if(window.history.pushState && updateLocation !== false){
				window.history.pushState(null, null, href);
			}
			// just reload the page if this fails
			window.location.reload();
		},
		complete: function() {
			navigating = false;
		}
	});
}

function getHeaders(useOutline) {
	var headerArr = [];
	var headerDepth = 1;

	if (useOutline) {
		headerDepth = getOutlineDepth();
	}

	for (var i = 1; i <= headerDepth; i++) {
		headerArr.push('h' + (i + 1));
	}

	return $(headerArr.join(', ')).filter(function(index, header) {
		return !header.attributes['data-skip'];
	}).each(function(index, header) {
		if (!header.id) {
			header.id = generateId(header);
		}
	});
}

function generateId(element) {
	var txt = element.textContent;
	return txt.replace(/\s/g,"").replace(/[^\w]/g,"_");
}

function getOutlineDepth() {
	var outline = (window.docObject && window.docObject.outline !== undefined) ? (window.docObject.outline.depth !== undefined ? parseInt(window.docObject.outline.depth) : parseInt(window.docObject.outline)) : 1;
	return !isNaN(outline) ? outline : 1;
}

function hideTOCSidebarScrollbar() {
	var tocSidebar = document.querySelector("#toc-sidebar nav");
	if (tocSidebar.scrollHeight > tocSidebar.offsetHeight) {
		tocSidebar.classList.add("hide-scrollbar");
	} else {
		tocSidebar.classList.remove("hide-scrollbar");
	}
}

function isMobile() {
	return window.innerWidth < 1000;
}

function scrollToElement($element) {
	if ($element.length) {
		var topMargin = Math.max(parseInt($element.css('margin-top')), 60);// Minimum of 60px to clear the navigation
		var pos = $element.offset().top - topMargin - $articleContainer.offset().top;
		setTimeout(function() {
			// Without this timeout, the scrollTop will be set correctly and then reverted
			setPageScrollTop(pos);
		});
	} else {
		$articleContainer.scrollTop(0);
	}
}

function buildTOC() {
	var $tocHeaders = getHeaders(true);

	if (!$tocHeaders.length || $tocHeaders.length < 2) {
		$tableOfContents.remove();
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

function getPageScrollTop() {
	// Different browsers return different values for this
	return $('body').scrollTop() || $('html').scrollTop();
}

function setPageScrollTop(value) {
	// Different browsers require this to be set on different elements
	$('body').scrollTop(value)
	$('html').scrollTop(value);
}

function updateScrollbarWidthCSSVariable() {
	var parent = document.createElement('div');
	parent.innerHTML = "<div style='height:50px;left:-50px;overflow:auto;position:absolute;top:-50px;width:50px'><div style='height:100px;width:1px'></div></div>";
	var child = parent.firstChild;
	document.body.appendChild(child);
	var width = child.offsetWidth - child.clientWidth;
	document.documentElement.style.setProperty("--scrollbar-width", width + "px");
	document.body.removeChild(child);
};
