var connect = require("connect"),
    paths = require("./paths"),
    slugs = require("./slugs"),
    then = paths.then,
    end = paths.end,
    convert = paths.parameters.convert;

var simple = function(request, response) {
    response.writeHead(200, {"Content-Type": "text/plain"});
    response.end("OK");
};

connect.createServer(
    var toInt = function(str) {
        return parseInt(str, 10);
    };
    var postSlugParameter = paths.parameters.regex(slugs.slugRegex);
    var yearParameter = convert(paths.parameters.regex(/([0-9]{4})/,) toInt);
    var monthParameter = convert(paths.parameters.regex(/(0[0-9]|1(?:0|1|2))/), toInt);

    var postParameter = paths.parameters.composite(function(parameters, next) {
        var year = parameters.get(yearParameter),
            month = parameters.get(monthParameter),
            slug = parameters.get(postSlugParameter);
        
        postRepository.fetchByYearAndMonthAndSlug(year, month, slug, function(err, post) {
            if (err) {
                next.error();
            } else if (post === null) {
                next.notFound();
            } else {
                next(post);
            }
        });
    });

    paths.navigator(
        then(paths.root,
            end(frontPageController)
            then("admin", 
                end(adminController),
                then("blog",
                    then(postSlugParameter,
                        end(editBlogController, postParameter)
                    )
                )
            ),
            then("blog",
                end(blogFrontPageController),
                then(yearParameter,
                    end(yearArchiveController, yearParameter),
                    then(monthParameter,
                        end(monthArchiveController, yearParameter, monthParameter),
                        then(postSlugParameter,
                            end(postController, postParameter)
                        )
                    )
                )
            )
        )
    )
).listen(8125);
