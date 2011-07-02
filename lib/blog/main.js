var connect = require("connect"),
    url = require("url"),
    paths = require("./paths"),
    slugs = require("./slugs"),
    parameters = paths.parameters,
    then = paths.then,
    end = paths.end,
    convert = paths.parameters.convert;

var simple = function(request, response) {
    response.writeHead(200, {"Content-Type": "text/plain"});
    response.end("OK");
};

var buildErrorController = function(statusCode) {
    return {
        writeTo: function(response) {
            response.writeHead(statusCode, {"Content-Type": "text/plain"});
            response.end("" + statusCode);
        }
    };
};

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
        var compositeArguments = Array.prototype.slice.call(arguments, 1);
        compositeArguments.push(function() {
            var callback = arguments[arguments.length - 1];
            var controllerArguments = Array.prototype.slice.call(arguments, 0, arguments.length - 1);
            callback(null, {matched: parameters.matches.matched, value: function(respond) {
                controllerArguments.push(respond);
                controller.apply(undefined, controllerArguments);
            }});
        });
        return end(parameters.composite.apply(undefined, compositeArguments));
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
        if (err) {
            buildErrorController(500).writeTo(response);
        } else if (result.matched) {
            var controller = result.value;
            controller(function(err, content) {
                if (err) {
                    buildErrorController(500).writeTo(response);
                } else {
                    content.writeTo(response);
                }
            });
        } else {
            buildErrorController(404).writeTo(response);
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
