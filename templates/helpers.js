


module.exports = function(docMap, options, getCurrent, helpers, OtherHandlebars){
    console.log("making helpers");
    // create children lookup
    var childrenMap = makeChildrenMap(docMap);
    return {
        sidebarLevels: function(){
            // we need to walk up until the highest parent
            // and then get all children on the way down

            var parents = getParents(getCurrent(), docMap);

            // [{title: "collection", items: []},{title: ""}]
            //var current = parents.shift(); // remove the canjs one
            parents.pop();
            var parentLevels = [];
            parents.forEach(function(docObject, index){
                // dont get groups because they will be retrieved already
                if(!isGroup(docObject)) {
                    var levels = getLevels(docObject, childrenMap, index);
                    parentLevels.push.apply(parentLevels,levels);
                }

            });

            return parentLevels;
        },
        subSidebarLevels: function(){
            return getLevels(getCurrent(), childrenMap, Infinity);
        },
        isActive: function(options){
            var parents = getParents(getCurrent(), docMap);
            parents.push(getCurrent());
            var itemMap = {};
            parents.forEach(function(docObject){
                itemMap[docObject.name] = true;
            });

            if(itemMap[this.name]) {
                return options.fn();
            } else {
                return options.inverse();
            }
        }
    };
};

var levelMap = ["collection","modules"];

function makeChildrenMap(docMap){
    var childrenMap = {};
    for(var name in docMap) {
        var docObject = docMap[name];
        var parent = docObject.parent;
        if(parent) {
            if(!childrenMap[parent]) {
                childrenMap[parent] = [];
            }
            childrenMap[parent].push(docObject);
        }
    }
    return childrenMap;
};

function getParents(docObject, docMap) {
    var names = {};

	// walk up parents until you don't have a parent
	var parent = docMap[docObject.name],
		parents = [];

	// don't allow things that are their own parent
	if(parent.parent === docObject.name){
		return parents;
	}

	while(parent){
		parents.unshift(parent);
		if(names[parent.name]){
			return parents;
		}
		names[parent.name] = true;
		parent = docMap[parent.parent];
	}
	return parents;
};
function getTitle(docObject, docMap) {
    return docObject.title || docObject.name
}
function isGroup(docObject) {
    return ["group","static","prototype"].indexOf(docObject.type) !== -1
}
function getLevels(docObject, childrenMap, index) {
    var children = childrenMap[docObject.name];
    if( children && children.every(isGroup) ) {
        return children.map(function(docObject){
            return {
                title: levelMap[index] || getTitle(docObject),
                items: childrenMap[docObject.name]
            }
        });
    } else {
        var children = childrenMap[docObject.name];
        if(children && children.length) {
            return [{
                items: children
            }]
        }

    }
}
