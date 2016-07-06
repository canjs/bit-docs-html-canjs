var fs = require("fs");
var path = require("path");

module.exports = function(docMap, options, getCurrent, helpers, OtherHandlebars){

    // create children lookup
    var childrenMap = makeChildrenMap(docMap);
    var docMapInfo = new DocMapInfo(docMap, getCurrent);

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
				txt += "&lt;"+t.template.map(function(templateItem){
					return helpers.makeTypes(templateItem.types)
				}).join(",")+"&gt;";
			}
			if(type){
				if(type.type === "function" && (type.params || type.signatures)){
					var params = type.params || (type.signatures[0] && type.signatures[0].params ) || []
				} else if(type.type === "typedef" && type.types && type.types[0] && type.types[0].type == "function"){
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
        isCurrent: function(docObject, options){
            return docMapInfo.isCurrent(docObject);
        },
        hasCurrent: function(docObject) {
            return docMapInfo.hasCurrent(docObject);
        },
        hasOrIsCurrent: function(docObject){
            return docMapInfo.hasOrIsCurrent(docObject);
        },
        getTitle: function(docObject){
            return docMapInfo.getTitle(docObject);
        },
        getShortTitle: function(docObject){
            return docMapInfo.getShortTitle(docObject);
        },
        isGroup: function(docObject){
            return docMapInfo.isGroup(docObject);
        },
        getCurrentTree: function(){
            return docMapInfo.getCurrentTree();
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

var DocMapInfo = function(docMap, getCurrent) {
    this.docMap = docMap;
    this.childrenMap = makeChildrenMap(docMap);
    this.getCurrent = getCurrent;
};
DocMapInfo.prototype.isCurrent = function(docObject){
    return docObject.name === this.getCurrent().name;
};
DocMapInfo.prototype.hasCurrent = function(docObject){
    var parents = this.getParents(this.getCurrent());
    parents.push(this.getCurrent());
    var itemMap = {};
    parents.forEach(function(docObject){
        itemMap[docObject.name] = true;
    });

    return itemMap[docObject.name];
};
DocMapInfo.prototype.hasOrIsCurrent = function(docObject){
    return this.isCurrent(docObject) || this.hasCurrent(docObject);
};
DocMapInfo.prototype.getParents = function(docObject, cb){
    var names = {};

	// walk up parents until you don't have a parent
	var parent = this.docMap[docObject.parent],
		parents = [];
    if(!parent) {
        return [];
    }
	// don't allow things that are their own parent
	if(parent.parent === docObject.name){
		return parents;
	}

	while(parent){
        cb && cb(parent);
		parents.unshift(parent);
		if(names[parent.name]){
			return parents;
		}
		names[parent.name] = true;
		parent = this.docMap[parent.parent];
	}
	return parents;
};
DocMapInfo.prototype.getTitle = function(docObject) {
    return docObject.title || docObject.name
};
DocMapInfo.prototype.getShortTitle = function(docObject) {
    if(docObject.title) {
        return docObject.title;
    }
    if(docObject.type === "module") {
        var parents = this.getParents(docObject);
        var parentModule = parents.find(function(docObject){
            return docObject.type === "module";
        });
        if(parentModule) {
            var name = docObject.name;
            if(docObject.name.indexOf( parentModule.name+"/" ) === 0 ) {
                name = docObject.name.replace(parentModule.name+"/", "./")
            }
            var basename = path.basename(name);
            if(name.endsWith("/"+basename+"/"+basename)) {
                return path.dirname(name)+"/";
            }
        }
    }
    return docObject.name;
};
DocMapInfo.prototype.isGroup = function(docObject) {
    return ["group","static","prototype"].indexOf(docObject.type) !== -1
};
DocMapInfo.prototype.getCurrentTree = function(){
    // [{docObject, children<>},{docObject}]
    //
    var getChildren = this.getChildren.bind(this),
        getNestedDocObject = this.getNestedDocObject.bind(this);

    var cur = this.getCurrent();

    var curChildren = this.getNestedChildren(cur);

    this.getParents(cur, function(docObject){
        curChildren = getChildren(docObject).map(function(docObject){
            if(docObject.name === cur.name) {
                return {docObject: docObject, children: curChildren};
            } else {
                return getNestedDocObject(docObject);
            }
        });
        cur = docObject;
    });

    if(!curChildren) {
        return {children: []}
    } else {
        return {children: curChildren};
    }
};
DocMapInfo.prototype.getChildren = function(docObject){
    var children = this.childrenMap[docObject.name];
    return (children || []).sort(compareDocObjects);
};
DocMapInfo.prototype.getNestedDocObject = function(docObject){
    if(this.isGroup(docObject)) {
        return {
            docObject: docObject,
            children: this.getNestedChildren(docObject)
        }
    } else {
        return {docObject: docObject};
    }
};
DocMapInfo.prototype.getNestedChildren = function(docObject){
    return this.getChildren(docObject).map(this.getNestedDocObject.bind(this));
}

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
