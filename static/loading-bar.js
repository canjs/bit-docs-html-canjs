function LoadingBar(c){
    this.meter = $('<span>', {style: 'width:0%;'});
    this.elem = $('<div>', {style: 'display:none', class: 'meter animate '+c}).append(
      this.meter.append($('<span>'))
  );
  $('body').prepend(this.elem);
    return this;
}

LoadingBar.prototype.start = function(){
    this.meter.css('width', '0%');
    this.elem.show();
};

LoadingBar.prototype.end = function(){
    this.elem.hide();
};

LoadingBar.prototype.update = function(p){
    this.meter.css('width', p+'%');
};

module.exports = LoadingBar;