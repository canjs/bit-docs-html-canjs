var searchData = {};

function buildSearchData(searchMap) {
	var parts, part, i, fullName;
	for (fullName in searchMap) {
	    parts = fullName.split(".");
	    for (i = 0; i < parts.length; i++) {
	        part = parts[i].toLowerCase();
	        addSearchChars(fullName, part);
	    }
	}
	window.canjsSearchData = searchData;
}

function addSearchChars(data, tag) {
    var letter, l, depth = 3,
		current = searchData;

    for ( l = 0; l < depth; l++ ) {
        letter = tag.substring(l, l + 1);
        if (!current[letter] ) {
            current[letter] = {};
            current[letter].list = [];
        }
        if ( $.inArray(current[letter].list, data) === -1 ) {
            current[letter].list.push(data);
        }
        current = current[letter];
    }
}

module.exports = {
	getSearchData: function() {
		var url = window.pathPrefix + '/searchMap.json';
		$.ajax({
			url: url,
			success: buildSearchData,
			dataType: "json",
			cache: true
		});
	}
};
