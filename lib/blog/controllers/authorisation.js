var settings = require("../settings"),
    bcrypt = require("bcrypt");

module.exports = function(content, request, injector) {
    var unauthorizedResponse = content.html({
        template: "unauthorized",
        headers: [['WWW-Authenticate', 'Basic realm="Authorisation required"']],
        statusCode: 401
    });
    
    return function(controller, respond) {
        // TODO: should bounce onto HTTPS if on HTTP
        var authorization = request.headers.authorization;
        if (!authorization) {
            respond(null, unauthorizedResponse);
        } else {
            var parts = authorization.split(' '),
                scheme = parts[0],
                credentials = new Buffer(parts[1], 'base64').toString().split(':');
            // TODO: should check scheme === "Basic"
            //var pause = connectUtils.pause(req);
            var username = credentials[0];
            var password = credentials[1];
            
            if (username !== settings.auth.username) {
                respond(null, unauthorizedResponse);
            } else {
                bcrypt.compare(password, settings.auth.hash, function(err, isCorrectPassword) {
                    if (isCorrectPassword) {
                        // FIXME: duplication!
                        var controllerArguments = controller.parameterValues.concat(respond);
                        injector.get("controllers." + controller.name, function(err, controller) {
                            if (err) {
                                callback(err);
                            } else {
                                controller.apply(undefined, controllerArguments);
                            }
                        })
                        //pause.resume();
                    } else {
                        respond(null, unauthorizedResponse);
                    }
                });
            }
        }
    };
}
