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

var frontPageController = require("./controllers/frontPage");
var showPostController = require("./controllers/showPost");

var useController = paths.useController;

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

connect.createServer(function(request, response, next) {
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
