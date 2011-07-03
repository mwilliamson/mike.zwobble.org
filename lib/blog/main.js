var connect = require("connect"),
    url = require("url"),
    paths = require("./paths"),
    slugs = require("./slugs"),
    parameters = paths.parameters,
    then = paths.then,
    end = paths.end,
    convert = paths.parameters.convert,
    errorController = require("./controllers/error"),
    mongo = require("./mongo"),
    inject = require("./inject"),
    content = require("./content");
    
var toInt = function(str, callback) {
    callback(null, {status: parameters.status.ok, value: parseInt(str, 10)});
};
var postSlugParameter = parameters.regex(slugs.slugRegex);
var yearParameter = convert(parameters.regex(/([0-9]{4})/), toInt);
var monthParameter = convert(parameters.regex(/(0[0-9]|1(?:0|1|2))/), toInt);

var archiveControllers = require("./controllers/archive");

var injector = inject.newInjector();
injector.bind("mongoDb").toProvider(mongo.connect).memoize();
injector.bind("postRepository").toProvider(require("./posts").publicPostRepository, "mongoDb");
injector.bind("content").toSyncProvider(content, "postRepository");

injector.bind("controllers.frontPage").toSyncProvider(require("./controllers/frontPage"), "content", "postRepository");
injector.bind("controllers.showPost").toSyncProvider(require("./controllers/showPost"), "content");
injector.bind("controllers.monthArchive").toSyncProvider(archiveControllers.month, "content", "postRepository");
injector.bind("controllers.yearArchive").toSyncProvider(archiveControllers.year, "content", "postRepository");

injector.bind("controllers.adminIndex").toSyncProvider(require("./controllers/adminIndex"), "content", "postRepository");

var injectableParameter = function() {
    var parameterArguments = arguments;
    return {
        func: function(injector, callback) {
            injector.callFunction.apply(undefined, Array.prototype.slice.call(parameterArguments).concat([callback]));
        },
        injectable: true
    };
};

var postParameter = injectableParameter(function(postRepository, callback) {
    callback(parameters.composite(
        yearParameter, monthParameter, postSlugParameter,
        function(year, month, slug, callback) {
            postRepository.posts().inYear(year).inMonth(month - 1).withSlug(slug).unique(function(err, post) {
                if (err) {
                    callback(err);
                } else if (post === null) {
                    callback(null, {status: parameters.status.unmatched});
                } else {
                    callback(null, {status: parameters.status.ok, value: post});
                }
            });
        }
    ));
}, "postRepository");

var useController = function(controllerName) {
    var controllerParameters = Array.prototype.slice.call(arguments, 1);
    return parameters.composite(controllerParameters, function(controllerParameterValues, callback) {
        callback(null, {status: parameters.status.ok, value: {
            name: controllerName,
            parameterValues: controllerParameterValues
        }});
    });
};

var navigatorPaths = paths.firstOf(
    end(useController("frontPage")),
    then(yearParameter,
        end(useController("yearArchive", yearParameter)),
        then(monthParameter,
            end(useController("monthArchive", yearParameter, monthParameter)),
            then(postSlugParameter,
                end(useController("showPost", postParameter))
            )
        )
    ),
    then("admin",
        end(useController("adminIndex"))
    )
);

var navigatingMiddleware = function(request, response, next) {
    var path = url.parse(request.url).pathname;
    var navigator = paths.navigator(navigatorPaths, function(parameter, callback) {
        if (parameter.injectable) {
            parameter.func(injector, callback);
        } else {
            callback(parameter);
        }
    });
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
            var controllerArguments = controller.parameterValues.concat(respond);
            injector.get("controllers." + controller.name, function(err, controller) {
                if (err) {
                    errorController(500, respond);
                } else {
                    controller.apply(undefined, controllerArguments);
                }
            })
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
};

var oneDay = 1000 * 60 * 60 * 24;

connect.createServer(
    connect.static("static"),
    navigatingMiddleware
).listen(8125);
