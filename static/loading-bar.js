function loading(c){
    this.meter = $('<span>', {style: 'width:0%;'});
    this.elem = $('<div>', {styles: 'display:none', class: 'meter animate '+c}).append(
      this.meter.append($('<span>'))
  );
  $('body').append(this.elem);
    return this;
}

loading.prototype.start = function(){
    this.meter.css('width', '0%');
    this.elem.show();
}

loading.prototype.end = function(){
    this.elem.hide();
}

loading.prototype.update = function(p){
    this.meter.css('width', p+'%');
}

module.exports = loader;