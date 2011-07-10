var dates = require("../dates");

var controller = function(content, query, title, callback) {
    query.list({}, function(err, posts) {
        if (err) {
            callback(err);
        } else {
            callback(null, content.html("archive", {
                posts: posts,
                title: "Archive: " + title
            }));
        }
    });
};

exports.month = function(content, postRepository) {
    return function(year, month, callback) {
        var title = dates.formatYearMonth({year: year, month: month - 1});
        var posts = postRepository.posts().inYear(year).inMonth(month - 1);
        controller(content, posts, title, callback);
    };
};

exports.year = function(content, postRepository) {
    return function(year, callback) {
        var title = year.toString();
        var posts = postRepository.posts().inYear(year);
        controller(content, posts, title, callback);
    };
};

exports.byTopic = function(content, postRepository) {
    return function(topic, callback) {
        controller(content, postRepository.posts().withTopic(topic), topic.name, callback);
    };
};
