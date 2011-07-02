var connect = require("connect"),
    url = require("url"),
    paths = require("./paths"),
    slugs = require("./slugs"),
    parameters = paths.parameters,
    then = paths.then,
    end = paths.end,
    convert = paths.parameters.convert,
    errorController = require("./controllers/error");

connect.createServer(function(request, response, next) {
    var toInt = function(str, callback) {
        callback(null, {matched: parameters.matches.matched, value: parseInt(str, 10)});
    };
    var postSlugParameter = parameters.regex(slugs.slugRegex);
    var yearParameter = convert(parameters.regex(/([0-9]{4})/), toInt);
    var monthParameter = convert(parameters.regex(/(0[0-9]|1(?:0|1|2))/), toInt);

    var postParameter = parameters.composite(
        yearParameter, monthParameter, postSlugParameter,
        function(year, month, slug, callback) {
            postRepository.fetchByYearAndMonthAndSlug(year, month, slug, function(err, post) {
                if (err) {
                    callback(err);
                } else if (post === null) {
                    callback(null, {matched: parameters.matches.unmatched});
                } else {
                    callback(null, {matched: parameters.matches.matched, value: post});
                }
            })
        }
    );

    var frontPageController = function(callback) {
        callback(null, {
            writeTo: function(response) {
                response.writeHead(200, {"Content-Type": "text/plain"});
                response.end("OK");
            }
        });
    };
    
    var showPostController = function(year, month, slug, callback) {
        callback(null, {
            writeTo: function(response) {
                response.writeHead(200, {"Content-Type": "text/plain"});
                response.end("Post<Year: " + year + ", Month: " + month + ", Slug: " + slug + ">");
            }
        });
    };

    var useController = function(controller) {
        var controllerParameters = Array.prototype.slice.call(arguments, 1);
        return end(parameters.composite(controllerParameters, function(controllerParameterValues, callback) {
            callback(null, {matched: parameters.matches.matched, value: function(respond) {
                var controllerArguments = controllerParameterValues.concat(respond);
                controller.apply(undefined, controllerArguments);
            }});
        }));
    };

    var navigator = paths.navigator(
        paths.firstOf(
            useController(frontPageController),
            then(yearParameter,
                then(monthParameter,
                    then(postSlugParameter,
                        useController(showPostController, yearParameter, monthParameter, postSlugParameter)
                    )
                )
            )
        )
    );
    
    var path = url.parse(request.url).pathname;
    navigator.navigate(path, function(err, result) {
        var respond = function(err, content) {
            if (err) {
                errorController(500, respond);
            } else {
                content.writeTo(response);
            }
        };
        if (err) {
            errorController(500, respond);
        } else if (result.matched) {
            var controller = result.value;
            controller(respond);
        } else {
            errorController(404, respond);
        }
    });

    //~ paths.navigator(
        //~ then(paths.root,
            //~ controller(frontPageController),
            //~ then("admin", 
                //~ controller(adminController),
                //~ then("blog",
                    //~ then(postSlugParameter,
                        //~ controller(editBlogController, postParameter)
                    //~ )
                //~ )
            //~ ),
            //~ then("blog",
                //~ controller(blogFrontPageController),
                //~ then(yearParameter,
                    //~ controller(yearArchiveController, yearParameter),
                    //~ then(monthParameter,
                        //~ controller(monthArchiveController, yearParameter, monthParameter),
                        //~ then(postSlugParameter,
                            //~ controller(postController, postParameter)
                        //~ )
                    //~ )
                //~ )
            //~ )
        //~ )
    //~ )
}).listen(8125);
