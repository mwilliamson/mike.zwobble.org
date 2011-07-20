var settings = require("../settings"),
    bcrypt = require("bcrypt");

module.exports = function(content, request, injector) {
    var unauthorizedResponse = content.html({
        template: "unauthorized",
        headers: [['WWW-Authenticate', 'Basic realm="Authorisation required"']],
        statusCode: 401
    });
    
    return function(respond) {
        // TODO: how to detect HTTPS when behind nginx?
        if (!request.isHttps && false) {
            // TODO: should return 400 if no host header
            var hostHeader = request.headers.host;
            var host = (hostHeader || "").split(":")[0];
            respond(null, {
                writeTo: function(response) {
                    var target = "https://" + host + ":" + settings.httpsPort + request.url;
                    response.writeHead(302, {"Location": target});
                    response.end();
                }
            });
        } else {
            var authorization = request.headers.authorization;
            if (!authorization) {
                respond(null, unauthorizedResponse);
            } else {
                var parts = authorization.split(' '),
                    scheme = parts[0],
                    credentials = new Buffer(parts[1], 'base64').toString().split(':');
                if (scheme !== "Basic") {
                    respond(null, content.html({
                        template: "badRequest",
                        statusCode: 400
                    }));
                } else {
                    var username = credentials[0];
                    var password = credentials[1];
                    
                    if (username !== settings.auth.username) {
                        respond(null, unauthorizedResponse);
                    } else {
                        bcrypt.compare(password, settings.auth.hash, function(err, isCorrectPassword) {
                            if (isCorrectPassword) {
                                respond.next();
                            } else {
                                respond(null, unauthorizedResponse);
                            }
                        });
                    }
                }
            }
        }
    };
}
