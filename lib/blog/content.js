var dust = require("dust"),
    fs = require("fs"),
    dates = require("./dates");

dust.filters["date"] = dates.formatDate;
dust.filters["yearMonth"] = dates.formatYearMonth;

dust.onLoad = function(name, callback) {
    fs.readFile("templates/" + name + ".html", "utf-8", callback);
};

var decimalOfLength = function(value, length) {
    var str = value.toString();
    while (str.length < length) {
        str = "0" + str;
    };
    return str;
};

var yearMonthForUrl = function(yearMonth) {
    return {
        year: yearMonth.year.toString(),
        month: decimalOfLength(yearMonth.month + 1, 2)
    };
};

var baseContext = dust.makeBase({
    Url_post: function(chunk, context, bodies, params) {
        var post = params.post;
        var yearMonth = yearMonthForUrl({
            year: post.publicationDate.getUTCFullYear(),
            month: post.publicationDate.getUTCMonth()}
        );
        chunk.write("/" + yearMonth.year + "/" + yearMonth.month + "/" + post.slug + "/");
    },
    Url_monthArchive: function(chunk, context, bodies, params) {
        var yearMonth = yearMonthForUrl(params.yearMonth);
        chunk.write("/" + yearMonth.year + "/" + yearMonth.month + "/");
    },
    Url_editPost: function(chunk, context, bodies, params) {
        var post = params.post;
        chunk.write("/admin/post/" + post._id + "/");
    }
});

module.exports = function(postRepository) {
    return {
        html: function(templateName, view) {
            return {
                writeTo: function(response) {
                    postRepository.posts().countPerMonth(function(err, countPerMonth) {
                        var baseView = baseContext.push({
                            page: view,
                            archives: countPerMonth
                        });
                        dust.render(templateName, baseView, function(err, output) {
                            // TODO: handle err
                            response.writeHead(200, {"Content-Type": "text/html"});
                            response.end(output);
                        });
                    });
                }
            };
        }
    };
};
