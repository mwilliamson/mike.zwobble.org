var dust = require("dust"),
    fs = require("fs"),
    dates = require("./dates"),
    editPostController = require("./controllers/editPost"),
    async = require("async");

dust.filters["dateTime"] = dates.formatDateTime;
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

var Url_topic = function(topic) {
    return "/topic/" + topic.slug + "/";
};

var baseContext = {
    Url_post: function(chunk, context, bodies, params) {
        var post = params.post;
        var yearMonth = yearMonthForUrl({
            year: post.publicationDate.getUTCFullYear(),
            month: post.publicationDate.getUTCMonth()}
        );
        chunk.write("/" + yearMonth.year + "/" + yearMonth.month + "/" + post.slug + "/");
    },
    Url_topic: function(chunk, context, bodies, params) {
        chunk.write(Url_topic(params.topic));
    },
    Url_monthArchive: function(chunk, context, bodies, params) {
        var yearMonth = yearMonthForUrl(params.yearMonth);
        chunk.write("/" + yearMonth.year + "/" + yearMonth.month + "/");
    },
    
    Url_adminIndex: function(chunk) {
        chunk.write("/admin/");
    },
    Url_editPost: function(chunk, context, bodies, params) {
        chunk.write(editPostController.url(params.post));
    },
    Url_newPost: function(chunk) {
        chunk.write("/admin/post/new/");
    }
};

module.exports = function(topicRepository) {
    return {
        html: function(templateName, view) {
            return {
                writeTo: function(response) {
                    topicRepository.fetchAll(function(err, topics) {
                        var base = Object.create(baseContext);
                        
                        base.Topics_links = function(chunk, context, bodies, params) {
                            return chunk.map(function(chunk) {
                                var topicIds = params.topics;
                                async.map(topicIds, topicRepository.fetchById, function(err, topics) {
                                    var toLinkTag = function(topic) {
                                        var url = Url_topic(topic);
                                        return "<a href=\"" + dust.escapeHtml(url) + "\">" +
                                            dust.escapeHtml(topic.name) + "</a>";
                                    };
                                    chunk.end(topics.map(toLinkTag).join(", "));
                                });
                            });
                        };
                        
                        var baseView = dust.makeBase(base).push({
                            page: view,
                            topics: topics
                        });
                        dust.render(templateName, baseView, function(err, output) {
                            // TODO: handle err
                            response.writeHead(200, {"Content-Type": "text/html"});
                            response.end(output);
                        });
                    });
                }
            };
        },
        redirect: function(target) {
            return {
                writeTo: function(response) {
                    response.writeHead(302, {"Location": target});
                    response.end();
                }
            };
        }
    };
};
