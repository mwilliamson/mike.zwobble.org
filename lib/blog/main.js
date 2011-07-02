var connect = require("connect"),
    url = require("url"),
    paths = require("./paths"),
    slugs = require("./slugs"),
    parameters = paths.parameters,
    then = paths.then,
    end = paths.end,
    convert = paths.parameters.convert,
    errorController = require("./controllers/error");
    
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

var injector = require("./inject").newInjector();
injector.bind("blah").toConstant("Silly hats only.");
injector.bind("controllers.frontPage").toSyncProvider(require("./controllers/frontPage"), "blah");
injector.bind("controllers.showPost").toSyncProvider(require("./controllers/showPost"));

var useController = function(controllerName) {
    var controllerParameters = Array.prototype.slice.call(arguments, 1);
    return parameters.composite(controllerParameters, function(controllerParameterValues, callback) {
        callback(null, {matched: parameters.matches.matched, value: {
            name: controllerName,
            parameterValues: controllerParameterValues
        }});
    });
};

var navigator = paths.navigator(
    paths.firstOf(
        end(useController("frontPage")),
        then(yearParameter,
            then(monthParameter,
                then(postSlugParameter,
                    end(useController("showPost", yearParameter, monthParameter, postSlugParameter))
                )
            )
        )
    )
);

var navigatingMiddleware = function(request, response, next) {
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
