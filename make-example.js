var generate = require("bit-docs-generate-html/generate");
var Q = require("q");
var fs = require("fs");
var readFile = Q.denodeify(fs.readFile);
var path = require("path");

var docMap = readFile(__dirname+"/docMap.json").then(function(source){
    return JSON.parse(""+source);
});

generate(docMap,{
    html: {
        templates: path.join(__dirname, "templates"),
        dependencies: {
            "bit-docs-html-canjs": __dirname
        }
    },
    dest: path.join(__dirname, "temp"),
    parent: "canjs",
    forceBuild: true,
    debug: true
}).done();
