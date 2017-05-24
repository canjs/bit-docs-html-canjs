function highlightKeywords(text, keywords, className){
	if(typeof text !== 'string'){
  	throw 'The first argument must be a string!';
  }
  if(!Array.isArray(keywords)){
  	throw 'The second argument must be an array!';
  }
  // Single quotes needed because the transpiler removes escaping :(
  var replaceText = ">$1<span class='"+(className || 'highlighted')+"'>$2</span>$3<";
	var textCopy = text;
	for(var i = 0; i < keywords.length; i++){
    var regex = new RegExp('>([^<]*)?('+keywords[i]+')([^>]*)?<','gmi');
    textCopy = textCopy.replace(regex, replaceText);
  }
  return textCopy;
}

module.exports = highlightKeywords;