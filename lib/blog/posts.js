var ObjectID = require('mongodb/lib/mongodb/bson/bson').ObjectID;
var slugs = require("./slugs");

var utcDate = function() {
    return new Date(Date.UTC.apply(undefined, arguments));
};

var postQuery = function(postCollection, initialPostConditions, listOptions) {
    var id, year, month, slug, topic;
    
    var buildDateRange = function() {
        if (year !== undefined) {
            var startDate, endDate;
            if (month !== undefined) {
                startDate = utcDate(year, month, 1);
                endDate = utcDate(year, month + 1, 1);
            } else {
                startDate = utcDate(year, 0, 1);
                endDate = utcDate(year + 1, 0, 1);
            }
            return {$gte: startDate, $lt: endDate};
        } else {
            return null;
        }
    };
    
    var buildConditions = function() {
        var conditions = initialPostConditions();
        if (id !== undefined) {
            conditions._id = new ObjectID(id);
        }
        var dateRange = buildDateRange();
        if (dateRange) {
            conditions.publicationDate = dateRange;
        }
        if (slug) {
            conditions.slug = slug;
        }
        if (topic) {
            conditions["latestRevision.topics"] = topic._id;
        }
        return conditions;
    };
    
    var self = {
        withId: function(value) {
            id = value;
            return self;
        },
        inYear: function(value) {
            year = value;
            return self;
        },
        inMonth: function(value) {
            month = value;
            return self;
        },
        withSlug: function(value) {
            slug = value;
            return self;
        },
        withTopic: function(value) {
            topic = value;
            return self;
        },
        list: function(options, callback) {
            var customListOptions;
            if (!callback) {
                callback = options;
                options = listOptions;
            } else {
                options = Object.create(options);
                for (var key in listOptions) {
                    options[key] = listOptions[key];
                }
            }
            
            postCollection.find(buildConditions(), {oldRevisions: 0}, options).toArray(callback);
        },
        unique: function(callback) {
            postCollection.findOne(buildConditions(), {oldRevisions: 0}, callback);
        },
        countPerMonth: function(callback) {
            postCollection.group( 
                function(post) { 
                    return {
                        year: post.publicationDate.getUTCFullYear(),
                        month: post.publicationDate.getUTCMonth(),
                    };
                },
                buildConditions(),
                {count: 0},
                function(post, counter) {
                    counter.count += 1;
                },
                true,
                function(err, results) {
                    if (err) {
                        callback(err);
                    } else {
                        results.sort(function(first, second) {
                            if (second.year !== first.year) {
                                return second.year - first.year;
                            } else {
                                return second.month - first.month;
                            }
                        });
                        callback(err, results);
                    }
                }
            );
        }
    };
    
    return self;
};

exports.adminPostRepository = function(mongoDb, topicRepository, callback) {
    postRepository(mongoDb, topicRepository, function() {
        return {};
    }, {},  callback);
}

exports.publicPostRepository = function(mongoDb, topicRepository, callback) {
    postRepository(mongoDb, topicRepository, function() {
        return {isPublished: true};
    }, {"sort": [["publicationDate", -1]]}, callback);
};

var revisionFromFields = function(fields) {
    return {
        title: fields.title,
        bodyHtml: fields.bodyHtml,
        topics: fields.topics.map(function(id) {
            return new ObjectID(id);
        }),
        date: new Date()
    };
};

var postRepository = function(mongoDb, topicRepository, initialPostConditions, listOptions, callback) {
    mongoDb.collection("posts", function(err, postCollection) {
        if (err) {
            callback(err);
        } else {
            callback(null, {
                posts: function() {
                    return postQuery(postCollection, initialPostConditions, listOptions);
                },
                // TODO: restrict the following to admin repository
                createPost: function(fields, callback) {
                    postCollection.save({
                        isPublished: false,
                        oldRevisions: [],
                        latestRevision: revisionFromFields(fields)
                    }, {safe: true}, callback);
                },
                updatePost: function(post, fields, callback) {
                    post.oldRevisions.push(post.latestRevision);
                    post.latestRevision = revisionFromFields(fields);
                    postCollection.save(post, {safe: true}, callback);
                },
                publishPost: function(post, callback) {
                    if (!post.isPublished) {
                        post.publicationDate = new Date();
                        post.slug = slugs.slugify(post.latestRevision.title);
                        post.isPublished = true;
                    }
                    postCollection.save(post, {safe: true}, callback);
                }
            })
        }
    });
};
