var dust = require("dust"),
    fs = require("fs"),
    dateformat = require("dateformat");

dust.filters["date"] = function(date) {
    return dateformat(date, "dddd d mmmm yyyy");
};

dust.onLoad = function(name, callback) {
    fs.readFile("templates/" + name + ".html", "utf-8", callback);
};

var decimalOfLength = function(value, length) {
    var str = value.toString();
    while (str.length < length) {
        str = "0" + str;
    };
    return str;
};

var baseContext = dust.makeBase({
    Url_post: function(chunk, context, bodies, params) {
        var post = params.post;
        var year = post.publicationDate.getUTCFullYear().toString();
        var month = decimalOfLength(post.publicationDate.getUTCMonth() + 1, 2);
        chunk.write("/" + year + "/" + month + "/" + post.slug + "/");
    }
});

exports.html = function(templateName, view) {
    return {
        writeTo: function(response) {
            dust.render(templateName, baseContext.push(view), function(err, output) {
                // TODO: handle err
                response.writeHead(200, {"Content-Type": "text/html"});
                response.end(output);
            });
        }
    };
};
