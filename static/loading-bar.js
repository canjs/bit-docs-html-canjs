function LoadingBar(color, parent) {
  this.meter = $('<span>', {style: 'transition: width 1s ease; width:0%;'});
  this.elem = $('<div>', {style: 'display:none', class: 'meter animate ' + color}).append(
    this.meter.append($('<span>'))
  );

  parent = parent || $('body');
  parent.prepend(this.elem);

  return this;
}

LoadingBar.prototype.start = function(percentage) {
  percentage = percentage || 0;
  this.meter.css('width', percentage + '%');
  this.elem.show();
};

LoadingBar.prototype.end = function() {
  this.elem.hide();
};

LoadingBar.prototype.update = function(percentage) {
  this.meter.css('width', percentage + '%');
};

module.exports = LoadingBar;
