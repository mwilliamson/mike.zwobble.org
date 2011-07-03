var dust = require("dust"),
    fs = require("fs"),
    dateformat = require("dateformat");

dust.filters["date"] = function(date) {
    return dateformat(date, "dddd d mmmm yyyy");
};

dust.onLoad = function(name, callback) {
    fs.readFile("templates/" + name + ".html", "utf-8", callback);
};

exports.html = function(templateName, view) {
    view = view || {};
    return {
        writeTo: function(response) {
            dust.render(templateName, view, function(err, output) {
                // TODO: handle err
                response.writeHead(200, {"Content-Type": "text/html"});
                response.end(output);
            });
        }
    };
};
