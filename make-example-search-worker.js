var fs = require("fs");
var path = require("path");
var stealTools = require("steal-tools");

var forceBuild = process.argv.indexOf("-f") !== -1;

var siteConfig = {
  debug: true,
  dest: path.join(__dirname, 'doc', 'workers'),
  minifyBuild: false
};

fs.mkdir(siteConfig.dest, function() {
  stealTools.build({
    bundlesPath: siteConfig.dest,
    config: __dirname + '/package.json!npm',
    main: 'static/search-worker'
  }, {
    bundleAssets: true,
    bundleSteal: true,
    debug: siteConfig.debug ?  true : false,
    minify: siteConfig.minifyBuild === false ? false : true,
    quiet: siteConfig.debug ? false : true
  });
});
