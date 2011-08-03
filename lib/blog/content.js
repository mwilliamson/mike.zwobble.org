var dust = require("dust"),
    fs = require("fs"),
    dateformat = require("dateformat"),
    dates = require("./dates"),
    editPostController = require("./controllers/editPost"),
    showPostController = require("./controllers/showPost"),
    feedController = require("./controllers/feed"),
    async = require("async"),
    yearMonthForUrl = require("./urls").yearMonthForUrl,
    textFormat = require("./textFormat");

dust.filters["dateTime"] = dates.formatDateTime;
dust.filters["date"] = dates.formatDate;
dust.filters["yearMonth"] = dates.formatYearMonth;
dust.filters["isoDate"] = function(date) {
    return new Date(date).toISOString();
};
dust.filters["plainTextToHtml"] = textFormat.plainTextToHtml;

dust.onLoad = function(name, callback) {
    // TODO: use .html explicitly in controllers or have html method add extension
    // (would need to update reference to base template)
    var fullName = name.indexOf(".") === -1 ? name + ".html" : name;
    fs.readFile("templates/" + fullName, "utf-8", callback);
};

var Url_topic = function(topic) {
    return "/topic/" + topic.slug + "/";
};

var baseContext = {
    Url_frontPage: function(chunk) {
        chunk.write("/");
    },
    Url_feed: function(chunk) {
        chunk.write(feedController.url);
    },
    Url_post: function(chunk, context, bodies, params) {
        var post = params.post;
        chunk.write(showPostController.url(post));
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
    },
    Dates_format: function(chunk, context, bodies, params) {
        chunk.write(dateformat(params.date, params.format, true));
    }
};

module.exports = function(topicRepository) {
    var redirectWithStatusCode = function(statusCode) {
        return function(target) {
            return {
                writeTo: function(response) {
                    response.writeHead(301, {"Location": target});
                    response.end();
                }
            };
        }
    };
    
    var text = function(options, contentType, view) {
        if (Object.prototype.toString.call(options) === "[object String]") {
            options = {
                template: options
            };
        }
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
                    // FIXME: this is specific to the HTML base template (don't need topics in, say, the Atom feed, and everything is wrapped in page)
                    var baseView = dust.makeBase(base).push({
                        page: view,
                        topics: topics
                    });
                    dust.render(options.template, baseView, function(err, output) {
                        // TODO: handle err
                        (options.headers || []).forEach(function(header) {
                            response.setHeader(header[0], header[1]);
                        });
                        response.writeHead(options.statusCode || 200, {"Content-Type": contentType});
                        response.end(output);
                    });
                });
            }
        };
    };
    
    return {
        html: function(options, view) {
            return text(options, "text/html", view);
        },
        text: text,
        redirect: redirectWithStatusCode(302),
        permanentRedirect: redirectWithStatusCode(301)
    };
};
