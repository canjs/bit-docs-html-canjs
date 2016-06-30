var generate = require("bit-docs-generate-html/generate");
var Q = require("q");
var fs = require("fs");
var readFile = Q.denodeify(fs.readFile);
var path = require("path");

var docMap = readFile(__dirname+"/docMap.json").then(function(source){
    return JSON.parse(""+source);
});

var forceBuild = process.argv.indexOf("-f") !== -1;

generate(docMap,{
    html: {
        templates: path.join(__dirname, "templates"),
        dependencies: {
            "bit-docs-html-canjs": __dirname
        }
    },
    dest: path.join(__dirname, "temp"),
    parent: "canjs",
    forceBuild: forceBuild,
    debug: true
}).done();
