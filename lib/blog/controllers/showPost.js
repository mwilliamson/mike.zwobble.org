module.exports = function(year, month, slug, callback) {
        callback(null, {
            writeTo: function(response) {
                response.writeHead(200, {"Content-Type": "text/plain"});
                response.end("Post<Year: " + year + ", Month: " + month + ", Slug: " + slug + ">");
            }
        });
    };
