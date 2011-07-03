var mustache = require("mustache"),
    fs = require("fs"),
    dateformat = require("dateformat");

var cachedTemplates = {};

var loadTemplate = function(name, callback) {
    callback = callback || function() {};
    if (name in cachedTemplates) {
        callback(null, cachedTemplates[name]);
    } else {
        fs.readFile("templates/" + name + ".html", "utf-8", function(err, text) {
            if (err) {
                callback(err);
            } else {
                cachedTemplates[name] = text;
                callback(null, text);
            }
        });
    }
};

exports.html = function(templateName, view) {
    view = view || {};
    view.formatDate = function() {
        return function(text) {
            return dateformat(this[text], "dddd d mmmm yyyy");
        };
    };
    return {
        writeTo: function(response) {
            loadTemplate("base", function(err, baseTemplate) {
                // TODO: handle err
                loadTemplate(templateName, function(err, template) {
                    // TODO: handle err
                    response.writeHead(200, {"Content-Type": "text/html"});
                    response.end(mustache.to_html(baseTemplate, view, {body: template}));
                });
            });
        }
    };
};
