var fs = require("fs");
var path = require("path");

module.exports = function(docMap, options, getCurrent, helpers, OtherHandlebars){

    console.log("making helpers");
    // create children lookup
    var childrenMap = makeChildrenMap(docMap);
    return {
        "makeSignature": function(code){

            if(code){
				return code;
			}

			var sig = "";
            if(this.type === "module") {
                sig = "__"+this.name+"__ ";
            }
            if(this.types) {
                return sig + helpers.makeTypes(this.types);
            }

            if(! /function|constructor/i.test(this.type) && !this.params && !this.returns){
				return sig + helpers.makeType(this);
			}

            // if it's a constructor add new
			if(this.type === "constructor"){
				sig += "new "
			}

			// get the name part right
			var parent = docMap[this.parent];
			if(parent){
				if(parent.type == "prototype"){
					var parentParent = docMap[parent.parent];
					sig += (parentParent.alias || (lastPartOfName( parentParent.name) +".")  ).toLowerCase();

				} else {
					sig += (parent.alias || lastPartOfName( parent.name)+"." );
				}

				sig += ( lastPartOfName(this.name) || "function" );
			} else {
				sig += "function";
			}


			sig+="("+helpers.makeParamsString(this.params)+")";

			// now get the params



			return sig;
        },
        "makeParams": function(){
            var result = "<b>"+this.name+"</b>";
            if(this.types) {
                result += " <code>"+helpers.makeTypesString(this.types)+"</code>"
            }
            return result;
        },
        makeTypesString: function (types) {
			if (types && types.length) {
				// turns [{type: 'Object'}, {type: 'String'}] into '{Object | String}'
				var txt = "{"+helpers.makeTypes(types);
				//if(this.defaultValue){
				//	txt+="="+this.defaultValue
				//}
				return txt+"}";
			} else {
				return '';
			}
		},
        makeTypes: function(types){
			if (types.length) {
				// turns [{type: 'Object'}, {type: 'String'}] into '{Object | String}'
				return types.map(helpers.makeType).join('|');
			} else {
				return '';
			}
		},
        makeType: function (t) {
			if(t.type === "function"){
				var fn = t.params && t.params.length ?
                    "("+helpers.makeParamsString(t.params)+")" : "";

				if(t.constructs && t.constructs.types){
					fn = "constructor"+fn;
					fn += " => "+helpers.makeTypes(t.constructs.types)
				} else {
					fn = "function"+fn;
				}

				return fn;
			}
			var type = docMap[t.type];
			var title = type && type.title || undefined;
			var txt = helpers.linkTo(t.type, title);

			if(t.template && t.template.length){
				txt += "\\<"+t.template.map(function(templateItem){
					return helpers.makeTypes(templateItem.types)
				}).join(",")+"\\>";
			}
			if(type){
				if(type.type === "function" && (type.params || type.signatures)){
					var params = type.params || (type.signatures[0] && type.signatures[0].params ) || []
				} else if(type.type === "typedef" && type.types[0] && type.types[0].type == "function"){
					var params = type.types[0].params;
				}
				if(params){
					txt += "("+helpers.makeParamsString(params)+")";
				}
			}

			return txt;
		},
        makeParamsString: function(params){
            if(!params || !params.length){
                return "";
            }
            return params.map(function(param){
                // try to look up the title
                var type = param.types && param.types[0] && param.types[0].type
                return helpers.linkTo(type, param.name) +
                    ( param.variable ? "..." : "" );
            }).join(", ");
        },
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
        },
        indent: function(content, spaces){
            if(typeof content === "string") {
                var padding = new Array(spaces+1).join(" ");

                return padding + content.replace(/\n\r?/g,"\n"+padding);
            } else {
                var depth = this.depth || (this.docObject && this.docObject.depth) || 0;

                return new Array(depth+1).join("  ");
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
                title: getTitle(docObject),
                items: (childrenMap[docObject.name] || []).sort(compareDocObjects)
            }
        });
    } else {
        var children = childrenMap[docObject.name];
        if(children && children.length) {
            return [{
                items: (children || []).sort(compareDocObjects)
            }]
        }

    }
}
var compareDocObjects = function(child1, child2){

	// put groups at the end
	if(/group|prototype|static/i.test(child1.type)){
		if(!/group|prototype|static/i.test(child2.type)){
			return 1;
		} else {
			if(child1.type === "prototype"){
				return -1
			}
			if(child2.type === "prototype"){
				return 1
			}
			if(child1.type === "static"){
				return -1
			}
			if(child2.type === "static"){
				return 1
			}

		}
	}
	if(/prototype|static/i.test(child2.type)){
		return -1;
	}

	if(typeof child1.order == "number"){
		if(typeof child2.order == "number"){
			// same order given?
			if(child1.order == child2.order){
				// sort by name
				if(child1.name < child2.name){
					return -1
				}
				return 1;
			} else {
				return child1.order - child2.order;
			}

		} else {
			return -1;
		}
	} else {
		if(typeof child2.order == "number"){
			return 1;
		} else {
			// alphabetical
			if(child1.name < child2.name){
				return -1
			}
			return 1;
		}
	}
};
