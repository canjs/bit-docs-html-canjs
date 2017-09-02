function LoadingBar(color, parent) {
  this.meter = $('<span>', {style: 'transition: width 0.5s ease; width:0%;'});
  this.elem = $('<div>', {style: 'display:none', class: 'meter animate ' + color}).append(
    this.meter.append($('<span>'))
  );

  parent = parent || $('body');
  parent.prepend(this.elem);

  return this;
}

LoadingBar.prototype.start = function(progress) {
  progress = progress || 5;
  this.clearTimer();
  this.meter.css('width', progress + '%');
  this.elem.show();
};

LoadingBar.prototype.end = function() {
  this.update(100);
};

LoadingBar.prototype.update = function(progress) {
  this.clearTimer();
  this.meter.css('width', progress + '%');
  if(progress === 100){
    this.timer = setTimeout(function(){
      this.elem.hide();
    }.bind(this), 500);
  }
};

LoadingBar.prototype.clearTimer = function(){
  if(this.timer){
    clearTimeout(this.timer);
    this.timer = null;
  }
};

module.exports = LoadingBar;
