var generate = require("bit-docs-generate-html/generate");
var Q = require("q");
var path = require("path");
var assert = require("assert");

var Browser = require("zombie"),
	connect = require("connect");


var find = function(browser, property, callback, done){
	var start = new Date();
	var check = function(){
		if(browser.window && browser.window[property]) {
			callback(browser.window[property]);
		} else if(new Date() - start < 2000){
			setTimeout(check, 20);
		} else {
			done("failed to find "+property);
		}
	};
	check();
};
var waitFor = function(browser, checker, callback, done){
	var start = new Date();
	var check = function(){
		if(checker(browser.window)) {
			callback(browser.window);
		} else if(new Date() - start < 2000){
			setTimeout(check, 20);
		} else {
			done(new Error("checker was never true"));
		}
	};
	check();
};


var open = function(url, callback, done){
	var server = connect().use(connect.static(path.join(__dirname))).listen(8081);
	var browser = new Browser();
	browser.visit("http://localhost:8081/"+url)
		.then(function(){
			callback(browser, function(){
				server.close();
			})
		}).catch(function(e){
			server.close();
			done(e)
		});
};

// somehow do a build with this added on ...

describe("bit-docs-prettify", function(){
    it("basics work", function(done){
        this.timeout(30000);

        var docMap = Q({
            index: {
                name: "index",
                body: "```\nvar str ='hello world';\n```"
            }
        });

        generate(docMap,{
            html: {
                dependencies: {
                    "bit-docs-prettify": __dirname
                }
            },
            dest: path.join(__dirname, "temp"),
            parent: "index",
            forceBuild: true
        }).then(function(){

            open("temp/index.html",function(browser, close){

				var prettyprinted = browser.window.document.getElementsByClassName("prettyprint")

				assert.ok(prettyprinted.length, "has a returns object")

				close();
				done();

			},done);

        }).catch(function(err){
            console.log("err",err.stack);
            done(err)
        });
    });
});
