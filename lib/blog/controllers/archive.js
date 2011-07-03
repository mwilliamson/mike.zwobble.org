var dateformat = require("dateformat");

var controller = function(content, postRepository, year, month, title, callback) {
    var query = postRepository.posts().inYear(year);
    if (month !== undefined) {
        query = query.inMonth(month - 1);
    }
    
    query.list({}, function(err, posts) {
        if (err) {
            callback(err);
        } else {
            callback(null, content.html("archive", {
                posts: posts,
                title: "Archives: " + title
            }));
        }
    });
};

exports.month = function(content, postRepository) {
    return function(year, month, callback) {
        var title = dateformat(new Date(year, month - 1, 1), "mmmm yyyy");
        controller(content, postRepository, year, month, title, callback);
    };
};

exports.year = function(content, postRepository) {
    return function(year, callback) {
        var title = year.toString();
        controller(content, postRepository, year, undefined, title, callback);
    };
};
