var yearMonthForUrl = require("../urls").yearMonthForUrl;

module.exports = function(content) {
    return function(post, respond) {
        respond(null, content.html("show-post", {post: post, title: post.title}));
    };
};

module.exports.url = function(year, month, slug) {
    if (!month) {
        var post = year;
        year = post.publicationDate.getUTCFullYear();
        month = post.publicationDate.getUTCMonth();
        slug = post.slug;
    }
    var yearMonth = yearMonthForUrl({
        year: year,
        month: month
    });
    return "/" + yearMonth.year + "/" + yearMonth.month + "/" + slug + "/";
}
