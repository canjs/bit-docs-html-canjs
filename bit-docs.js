var path = require("path");
var tags = require('./tags/tags');

module.exports = function(bitDocs){
    var pkg = require("./package.json");
    var dependencies = {};
    dependencies[pkg.name] = pkg.version;

    bitDocs.register("html", {
        templates: path.join(__dirname, "templates"),
        dependencies: dependencies
    });

    bitDocs.register("tags", tags);
}