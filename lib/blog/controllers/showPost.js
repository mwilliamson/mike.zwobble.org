module.exports = function() {
    return function(year, month, slug, respond) {
        respond(null, {
            writeTo: function(response) {
                response.writeHead(200, {"Content-Type": "text/plain"});
                response.end("Post<Year: " + year + ", Month: " + month + ", Slug: " + slug + ">");
            }
        });
    };
};
