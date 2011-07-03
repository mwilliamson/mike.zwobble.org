var postQuery = function(postCollection) {
    return {
        list: function(range, callback) {
            postCollection.find({isPublished: true}, {"sort": [["publicationDate", -1]]}).toArray(function(err, posts) {
                if (err) {
                    callback(err);
                } else {
                    callback(null, posts.map(function(post) {
                        // TODO: only grab the latest revision when querying
                        var latestRevision = post.revisions[post.revisions.length - 1];
                        return {
                            slug: post.slug,
                            publicationDate: post.publicationDate,
                            title: latestRevision.title,
                            bodyHtml: latestRevision.bodyHtml
                        };
                    }));
                }
            });
        }
    };
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
