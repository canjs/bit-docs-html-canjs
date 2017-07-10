var fs = require("fs");
var path = require("path");
var stealTools = require("steal-tools");

var forceBuild = process.argv.indexOf("-f") !== -1;

var siteConfig = {
  debug: false,
  dest: path.join(__dirname, 'dist'),
  minifyBuild: true
};

var dest = siteConfig.dest + '/static/search-worker.js';

fs.mkdir(siteConfig.dest, function() {
  stealTools.export({
    system: {
      config: __dirname + '/package.json!npm',
      main: 'static/search-worker'
    },
    options: {
      bundleAssets: true,
      bundleSteal: true,
      debug: siteConfig.debug ?  true : false,
      minify: siteConfig.minifyBuild === false ? false : true,
      quiet: siteConfig.debug ? false : true
    },
    outputs: {
      "+standalone" : {
        dest: dest
      }
    }
  }).then(function(){
    // Work around for https://github.com/stealjs/steal-tools/issues/775
    console.info('Replacing "window" with "self"');
    fs.readFile(dest, 'utf8', function(err, file){
      if(err) return console.error(err);
      file = file.replace(/window/gmi, 'self');
      fs.writeFile(dest, file, function(err){
        if(err) return console.error(err);
        console.info('Done');
      });
    });
  });
});
