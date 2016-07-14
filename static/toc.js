var stache = require("can-stache");
require("can-stache-bindings");
var Control = require("can-control");

var template = stache("{{#each titles}}" +
  "<li><a ($click)='scrollTo(., %event)' href='#{{id}}'>{{text}}</a></li>" +
  "{{/each}}");

var toc = document.getElementsByClassName("on-this-page")[0];

function throttle(fn, ms){
  var wait = false;
  return function(){
    if(!wait) {
      wait = true;
      var val = fn.apply(this, arguments);
      setTimeout(function(){
        wait = false;
      }, ms);
      return val;
    }
  };
}

var TableOfContents = Control.extend({
  init: function(el, options){
    this.scroller = document.body;
    this.titleSelector = options.titleSelector || "h2";

    this.navHeight = this.getNavHeight();
    this.fixed(!this.isNavVisible());

    this.titles = this.collectTitles();
    this.titleIndex = 0;
    this.calculateActive();

    // Append our template
    var toc = this;
    this.element.appendChild(template({
      titles: this.titles,
      scrollTo: function(item, ev){
        ev.preventDefault();
        window.scrollTo(0, item.pos + 1);
        toc.calculateActive();
      }
    }));
    this.setActive(this.titleIndex);

    window.addEventListener("scroll", this);
  },

  getNavHeight: function(){
    var nav = document.querySelector(".navbar");
    return nav.clientHeight;
  },

  isNavVisible: function(){
    return this.navHeight > this.scroller.scrollTop;
  },

  collectTitles: function(){
    var titles = document.querySelectorAll("article " + this.titleSelector);
    var curScroll = this.scroller.scrollTop;
    var navHeight = this.navHeight;
    return [].map.call(titles, function(title, idx){
      var txt = title.textContent;
      title.id = 'sig_' + txt.replace(/\s/g,"").replace(/[^\w]/g,"_");
      return {
        id: title.id,
        index: idx,
        text: txt,
        pos: title.getBoundingClientRect().top + curScroll - navHeight
      };
    });
  },

  fixed: function(fixed){
    if(fixed === this._fixed) {
      return;
    }
    this._fixed = fixed;
    this.element.classList[fixed ? "add" : "remove"]("fixed");
  },

  getTitle: function(idx){
    return this.titles[idx] || {};
  },

  setActive: function(idx){
    var lastIndex = this.titleIndex;
    var lis = this.element.querySelectorAll("li");
    [].forEach.call(lis, function(li, index){
      li.classList[index === idx ? "add" : "remove"]("active");
    });
    this.titleIndex = idx;
  },

  handleEvent: throttle(function(ev){
    switch(ev.type){
      case "scroll":
        this.handleScroll(ev);
        break;
    }
  }, 20),

  handleScroll: function(ev){
    // Determine if we should show the TOC
    this.fixed(!this.isNavVisible());

    this.calculateActive();
  },

  calculateActive: function(){
    var scrollTop = this.scroller.scrollTop;

    // Determine which h2 should be showing
    var prev = this.getTitle(this.titleIndex);
    var next = this.getTitle(this.titleIndex + 1);

    // See if we need to jump to the next when scrolling down
    var cur;
    while(scrollTop > next.pos) {
      cur = next;
      next = this.getTitle(cur.index + 1);
    }

    // See if we need to move to the previous when scrolling up
    if(!cur) {
      do {
        cur = prev;
        prev = this.getTitle(prev.index - 1);
      } while(scrollTop < cur.pos);
    }

    if(typeof cur.pos !== "undefined") {
      this.setActive(cur.index);
    }
  },



});

new TableOfContents(toc);
