// TODO: place in settings file
var debug = true;

exports.httpError = function(statusCode, err, callback) {
    if (!callback) {
        callback = err;
        err = undefined;
    }
    callback(null, {
        writeTo: function(response) {
            response.writeHead(statusCode, {"Content-Type": "text/plain"});
            if (err && debug) {
                response.end("" + statusCode + ": " + err);
            } else {
                response.end("" + statusCode);
            }
        }
    });
};

exports.http404 = function(content) {
    return function(callback) {
        callback(null, content.html({
            statusCode: 404,
            template: "http404"
        }));
    };
};
