var ObjectID = require('mongodb/lib/mongodb/bson/bson').ObjectID;

var utcDate = function() {
    return new Date(Date.UTC.apply(undefined, arguments));
};

var postQuery = function(postCollection, initialPostConditions, postMapFunction, listOptions) {
    var year, month, slug;
    
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
            postCollection.find(buildConditions(), {revisions: 0}, listOptions).toArray(function(err, posts) {
                if (err) {
                    callback(err);
                } else {
                    callback(null, posts.map(postMapFunction));
                }
            });
        },
        unique: function(callback) {
            postCollection.findOne(buildConditions(), {revisions: 0}, function(err, post) {
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

exports.adminPostRepository = function(mongoDb, callback) {
    postRepository(mongoDb, function() {
        return {};
    }, function(post) {
        return post;
    }, {},  callback);
}

exports.publicPostRepository = function(mongoDb, callback) {
    postRepository(mongoDb, function() {
        return {isPublished: true};
    }, function(post) {
        var latestRevision = post.latestRevision;
        return {
            slug: post.slug,
            publicationDate: post.publicationDate,
            title: latestRevision.title,
            bodyHtml: latestRevision.bodyHtml
        };
    }, {"sort": [["publicationDate", -1]]}, callback);
};

var postRepository = function(mongoDb, initialPostConditions, postMapFunction, listOptions, callback) {
    mongoDb.collection("posts", function(err, postCollection) {
        if (err) {
            callback(err);
        } else {
            callback(null, {
                posts: function() {
                    return postQuery(postCollection, initialPostConditions, postMapFunction, listOptions);
                },
                // TODO: restrict to admin repository
                fetchPostById: function(postId, callback) {
                    postCollection.findOne({_id: new ObjectID(postId)}, callback);
                }
            })
        }
    });
};

/*var mongoose = require("mongoose"),
    Schema = mongoose.Schema

    blogPostRevisionSchema = new Schema({
        title: String,
        body: String,
        creationDate: Date
    },
    
    blogPostSchema = new Schema({
        slug: String,
        publicationDate: Date,
        revisions: [blogPostRevisionSchema]
    });

blogPostSchema.method("isPublished", function() {
    return this.publicationDate !== null;
});

mongoose.model("BlogPost", blogPostSchema);
mongoose.model("BlogPostRevision", blogPostRevisionSchema);
*/
