module.exports = function(callback) {
    callback(null, {
        writeTo: function(response) {
            response.writeHead(200, {"Content-Type": "text/plain"});
            response.end("OK");
        }
    });
};
