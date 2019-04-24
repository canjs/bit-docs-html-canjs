var generate = require("bit-docs-generate-html/generate");
var generateSearchMap = require("bit-docs-generate-searchmap/generate");
var Q = require("q");
var fs = require("fs");
var readFile = Q.denodeify(fs.readFile);
var path = require("path");

var forceBuild = process.argv.indexOf("-f") !== -1;

var docMap = readFile(__dirname+"/docMap.json").then(function(source){
    return JSON.parse(""+source);
});
var siteConfig = {
    html: {
        templates: path.join(__dirname, "templates"),
        package: {
            steal: {
                configDependencies: [
                    "./node_modules/steal-conditional/conditional"
                ]
            }
        },
        dependencies: {
            "bit-docs-html-canjs": __dirname,
            "bit-docs-prettify": "^0.1.0",
            "bit-docs-html-highlight-line": "^0.2.2",
            //TODO: This should not be include here and should only be included in package.json.
            //  we get an error without this, here, though
            "steal-stache": "^4.0.1",
            "steal-conditional": "^0.3.6",
            "bit-docs-html-codepen-link": "^1.0.0"
        },
        staticDist: [
            path.join(__dirname, "dist", "static")
        ]
    },
    dest: path.join(__dirname, "doc"),
    parent: "canjs",
    forceBuild: forceBuild,
	minifyBuild: false,
	altVersions: {
		"2.3.27": "https://v2.canjs.com"
	},
    debug: true
};

generate(docMap,siteConfig).then(function(){
	return generateSearchMap(docMap, siteConfig);
}).done();
