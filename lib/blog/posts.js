var ObjectID = require('mongodb/lib/mongodb/bson/bson').ObjectID;
var slugs = require("./slugs");
var then = require("./util").then;

var utcDate = function() {
    return new Date(Date.UTC.apply(undefined, arguments));
};

var postQuery = function(postCollection, initialPostConditions, originalPostMapFunction, listOptions) {
    var postMapFunction = function(post) {
        return originalPostMapFunction(post);
    };
    var id, year, month, slug;
    
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
        list: function(range, callback) {
            if (!callback) {
                callback = range;
                range = undefined;
            }
            postCollection.find(buildConditions(), {oldRevisions: 0}, listOptions).toArray(then(callback, function(posts) {
                callback(null, posts.map(postMapFunction));
            }));
        },
        unique: function(callback) {
            postCollection.findOne(buildConditions(), {oldRevisions: 0}, function(err, post) {
                if (err) {
                    callback(err);
                } else if (post) {
                    callback(null, postMapFunction(post));
                } else {
                    callback(null, null);
                }
            });
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
    }, function(post) {
        return post;
    }, {},  callback);
}

exports.publicPostRepository = function(mongoDb, topicRepository, callback) {
    postRepository(mongoDb, topicRepository, function() {
        return {isPublished: true};
    }, function(post) {
        var latestRevision = post.latestRevision;
        return {
            slug: post.slug,
            publicationDate: post.publicationDate,
            title: latestRevision.title,
            bodyHtml: latestRevision.bodyHtml,
            topics: latestRevision.topics
        };
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

var postRepository = function(mongoDb, topicRepository, initialPostConditions, postMapFunction, listOptions, callback) {
    mongoDb.collection("posts", function(err, postCollection) {
        if (err) {
            callback(err);
        } else {
            callback(null, {
                posts: function() {
                    return postQuery(postCollection, initialPostConditions, postMapFunction, listOptions);
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
                    // FIXME: doesn't update post
                    postCollection.findOne({_id: post._id}, then(callback, function(databasePost) {
                        databasePost.oldRevisions.push(databasePost.latestRevision);
                        databasePost.latestRevision = revisionFromFields(fields);
                        postCollection.save(databasePost, {safe: true}, callback);
                    }));
                },
                publishPost: function(post, callback) {
                    // FIXME: doesn't update post
                    postCollection.findOne({_id: post._id}, then(callback, function(databasePost) {
                        if (!databasePost.isPublished) {
                            databasePost.publicationDate = new Date();
                            databasePost.slug = slugs.slugify(post.latestRevision.title);
                            databasePost.isPublished = true;
                        }
                        postCollection.save(databasePost, {safe: true}, callback);
                    }));
                }
            })
        }
    });
};
