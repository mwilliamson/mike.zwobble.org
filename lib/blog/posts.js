var utcDate = function() {
    return new Date(Date.UTC.apply(undefined, arguments));
};

var postQuery = function(postCollection) {
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
        var conditions = {isPublished: true};
        var dateRange = buildDateRange();
        if (dateRange) {
            conditions.publicationDate = dateRange;
        }
        if (slug) {
            conditions.slug = slug;
        }
        return conditions;
    };
    
    var databasePostToPublicPost = function(post) {
        // TODO: only grab the latest revision when querying
        var latestRevision = post.revisions[post.revisions.length - 1];
        return {
            slug: post.slug,
            publicationDate: post.publicationDate,
            title: latestRevision.title,
            bodyHtml: latestRevision.bodyHtml
        };
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
            postCollection.find(buildConditions(), {"sort": [["publicationDate", -1]]}).toArray(function(err, posts) {
                if (err) {
                    callback(err);
                } else {
                    callback(null, posts.map(databasePostToPublicPost));
                }
            });
        },
        unique: function(callback) {
            postCollection.findOne(buildConditions(), function(err, post) {
                if (err) {
                    callback(err);
                } else if (post) {
                    callback(null, databasePostToPublicPost(post));
                } else {
                    callback(null, null);
                }
            });
        }
    };
    
    return self;
};

exports.publicPostRepository = function(mongoDb, callback) {
    mongoDb.collection("posts", function(err, postCollection) {
        if (err) {
            callback(err);
        } else {
            callback(null, {
                posts: function() {
                    return postQuery(postCollection);
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
