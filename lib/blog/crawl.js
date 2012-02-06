var url = require("url");
var fs = require("fs");
var path =  require("path");
var http = require("http");
var async = require("async");
var jsdom = require('jsdom');
var settings = require("./settings");
var _ = require("underscore");
var mkdirp = require("mkdirp");

var targetDirectory = process.argv[2];

var hostname = "localhost";
var protocol = "http";
var port = settings.httpPort;
var host = protocol + "://" + hostname + ":" + port;

var jQuerySource = fs.readFileSync("./static/static/jquery-1.7.1.min.js").toString();

var crawledPaths = [];
var remainingCrawlPaths = ["/", "/2009/", "/2010/", "/2011/"];

var addUrl = function(crawlUrl) {
    if (!isExternalSite(crawlUrl)) {
        remainingCrawlPaths.push(url.parse(crawlUrl).path);
    }
};

var isAlreadyCrawled = function(crawlPath) {
    return crawledPaths.indexOf(crawlPath) !== -1;
};

var isExternalSite = function(crawlUrl) {
    return crawlUrl.indexOf(host + "/") !== 0;
};

var getPath = function(crawlPath, callback) {
    http.get({
        hostname: hostname,
        port: port,
        path: crawlPath
    }, function(response) {
        if (response.statusCode !== 200) {
            return callback(new Error("Path: " + crawlPath + " got status code " + response.statusCode));
        }
        var responseChunks = [];
        response.setEncoding('utf8');
        response.on('data', function (chunk) {
            responseChunks.push(chunk);
        });
        response.on("end", function() {
            callback(null, responseChunks.join(""));
        });
    });
};

var save = function(webPath, text) {
    var savePath = path.join(targetDirectory, "." + webPath);
    if (/\/$/.test(savePath)) {
        savePath = path.join(savePath, "index.html");
    }
    mkdirp(path.dirname(savePath), function(err) {
        fs.writeFile(savePath, text, "utf8");
    });
};

var crawl = function(crawlPath, callback) {
    if (isAlreadyCrawled(crawlPath)) {
        return callback();
    }
    crawledPaths.push(crawlPath);
    console.log("Crawling " + crawlPath);
    getPath(crawlPath, function(error, responseText) {
        if (error) {
            callback(error);
        } else {
            save(crawlPath, responseText);
            jsdom.env({
                html: responseText,
                src: [jQuerySource],
                done: function(errors, window) {
                    var useHrefs = function(index, element) {
                        addUrl(url.resolve(url.format({
                            protocol: "http",
                            hostname: hostname,
                            port: port
                        }), element.getAttribute("href")));
                    };
                    window.$("a").each(useHrefs);
                    window.$("link").each(useHrefs);
                    callback();
                }
            });
        }
    });
};

async.whilst(
    function() {
        return remainingCrawlPaths.length > 0;
    },
    function(callback) {
        crawl(remainingCrawlPaths.pop(), callback);
    },
    function(err) {
        if (err) {
            console.log("Crawling failed:");
            console.log(err);
        }
    }
);
