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
            "bit-docs-html-canjs": __dirname,
            "bit-docs-prettify": "^0.1.0",
			"bit-docs-html-highlight-line": "^0.2.2"
        }
    },
    dest: path.join(__dirname, "temp"),
    parent: "canjs",
    forceBuild: forceBuild,
		minifyBuild: false,
    debug: true
}).done();
