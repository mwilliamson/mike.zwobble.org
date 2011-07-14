var connect = require("connect"),
    //connectUtils = require("connect/utils"),
    url = require("url"),
    fs = require("fs"),
    settings = require("./settings"),
    paths = require("./paths"),
    slugs = require("./slugs"),
    parameters = paths.parameters,
    then = paths.then,
    end = paths.end,
    convert = paths.parameters.convert,
    errorController = require("./controllers/error"),
    mongo = require("./mongo"),
    inject = require("./inject"),
    content = require("./content"),
    posts = require("./posts"),
    topics = require("./topics"),
    editPostForm = require("./controllers/editPostForm");
    
var toInt = function(str, callback) {
    callback.ok(parseInt(str, 10));
};

var buildSlugParameter = function() {
    return parameters.regex(slugs.slugRegex);
};

var postSlugParameter = buildSlugParameter();
var yearParameter = convert(parameters.regex(/([0-9]{4})/), toInt);
var monthParameter = convert(parameters.regex(/(0[0-9]|1(?:0|1|2))/), toInt);
var dayParameter = convert(parameters.regex(/([0-9]{2})/), toInt);
var topicSlugParameter = buildSlugParameter();
var oldSlugParameter = parameters.regex(/[A-Za-z0-9\-_]+/);

var postIdParameter = parameters.regex(/[0-9a-f]+/);

var archiveControllers = require("./controllers/archive");
var oldControllers = require("./controllers/old");

var injector = inject.newInjector();
injector.bind("mongoDb").toProvider(mongo.connect).memoize();
injector.bind("publicPostRepository").toProvider(posts.publicPostRepository, "mongoDb", "topicRepository");
injector.bind("adminPostRepository").toProvider(posts.adminPostRepository, "mongoDb", "topicRepository");
injector.bind("topicRepository").toProvider(topics.topicRepository, "mongoDb");
injector.bind("content").toSyncProvider(content, "topicRepository");
injector.bind("editPostForm").toProvider(editPostForm, "topicRepository");

injector.bind("controllers.frontPage").toSyncProvider(require("./controllers/frontPage"), "content", "publicPostRepository");
injector.bind("controllers.showPost").toSyncProvider(require("./controllers/showPost"), "content");
injector.bind("controllers.monthArchive").toSyncProvider(archiveControllers.month, "content", "publicPostRepository");
injector.bind("controllers.yearArchive").toSyncProvider(archiveControllers.year, "content", "publicPostRepository");
injector.bind("controllers.topicArchive").toSyncProvider(archiveControllers.byTopic, "content", "publicPostRepository");

injector.bind("controllers.old.root").toSyncProvider(oldControllers.root, "content");
injector.bind("controllers.old.post").toSyncProvider(oldControllers.post, "content");

injector.bind("controllers.adminIndex")
    .toSyncProvider(require("./controllers/adminIndex"), "content", "adminPostRepository");
injector.bind("controllers.editPost")
    .toSyncProvider(require("./controllers/editPost"), "content", "editPostForm", "adminPostRepository", "postParameters");
injector.bind("controllers.newPost")
    .toSyncProvider(require("./controllers/newPost"), "content", "editPostForm", "adminPostRepository", "postParameters");
injector.bind("controllers.adminTopics")
    .toSyncProvider(require("./controllers/adminTopics"), "content", "topicRepository", "postParameters");

injector.bind("controllers.authorisation").toSyncProvider(require("./controllers/authorisation"), "content", "request", "injector");
injector.bind("controllers.http404").toSyncProvider(errorController.http404, "content");

var injectableParameter = function() {
    var parameterArguments = arguments;
    return {
        func: function(injector, callback) {
            injector.callFunction.apply(undefined, Array.prototype.slice.call(parameterArguments).concat([callback]));
        },
        injectable: true
    };
};

var buildParameterCallback = function(callback) {
    return function(err, value) {
        if (err) {
            callback.error(err);
        } else if (value === null || value === undefined) {
            callback.unmatched();
        } else {
            callback.ok(value);
        }
    };
};

var postParameter = injectableParameter(function(publicPostRepository, callback) {
    callback(parameters.composite(
        yearParameter, monthParameter, postSlugParameter,
        function(year, month, slug, callback) {
            publicPostRepository
                .posts()
                .inYear(year)
                .inMonth(month - 1)
                .withSlug(slug)
                .unique(buildParameterCallback(callback));
        }
    ));
}, "publicPostRepository");

var topicParameter = injectableParameter(function(topicRepository, callback) {
    callback(parameters.composite(topicSlugParameter, function(slug, callback) {
        topicRepository.fetchBySlug(slug, buildParameterCallback(callback));
    }));
}, "topicRepository");

var adminPostParameter = injectableParameter(function(adminPostRepository, callback) {
    callback(parameters.composite(postIdParameter, function(postId, callback) {
            adminPostRepository
                .posts()
                .withId(postId)
                .unique(buildParameterCallback(callback));
        }
    ));
}, "adminPostRepository");

var useController = function(controllerName) {
    var controllerParameters = Array.prototype.slice.call(arguments, 1);
    return parameters.composite(controllerParameters, function(controllerParameterValues, callback) {
        callback.ok({
            name: controllerName,
            parameterValues: controllerParameterValues
        });
    });
};

var authenticateOnHttps = function(subMatcher) {
    return {
        match: function(components, parameterValues, callback) {
            subMatcher.match(components, parameterValues, {
                ok: function(value) {
                    callback.ok({
                        name: "authorisation",
                        parameterValues: [value]
                    });
                },
                unmatched: callback.unmatched,
                notFound: callback.notFound,
                error: callback.error
            });
        }
    };
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
    then("topic",
        then(topicSlugParameter,
            end(useController("topicArchive", topicParameter))
        )
    ),
    then("admin",
        authenticateOnHttps(
            paths.firstOf(
                end(useController("adminIndex")),
                then("post",
                    then(postIdParameter,
                        end(useController("editPost", adminPostParameter))
                    ),
                    then("new",
                        end(useController("newPost"))
                    )
                ),
                then("topics",
                    end(useController("adminTopics"))
                )
            )
        )
    ),
    then("blog",
        end(useController("old.root")),
        then(yearParameter,
            then(monthParameter,
                then(dayParameter,
                    then(oldSlugParameter,
                        end(useController("old.post", yearParameter, monthParameter, oldSlugParameter))
                    )
                )
            )
        )
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
                errorController.httpError(500, err, respond);
            } else {
                content.writeTo(response);
            }
        };
        if (err) {
            errorController.httpError(500, err, respond);
        } else {
            var controller = result.value;
            var controllerArguments = result.matched ? controller.parameterValues.concat(respond) : [respond];
            var controllerName = result.matched ? controller.name : "http404";
            
            var controllerInjector = injector.extend();
            controllerInjector.bind("request").toConstant(request);
            controllerInjector.bind("postParameters").toConstant(request.body);
            controllerInjector.get("controllers." + controllerName, function(err, controller) {
                if (err) {
                    errorController.httpError(500, err, respond);
                } else {
                    controller.apply(undefined, controllerArguments);
                }
            })
        }
    });
};

var oneDay = 1000 * 60 * 60 * 24;
var staticMiddleware = connect.static("static");

connect.createServer(
    staticMiddleware,
    connect.bodyParser(),
    navigatingMiddleware
).listen(settings.httpPort);
