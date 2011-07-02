module.exports = function(statusCode, callback) {
    callback(null, {
        writeTo: function(response) {
            response.writeHead(statusCode, {"Content-Type": "text/plain"});
            response.end("" + statusCode);
        }
    });
};
