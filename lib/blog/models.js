var Schema = require("Schema"),

    BlogPostRevision = new Schema({
        title: String,
        body: String,
        creationDate: Date
    },
    
    BlogPost = new Schema({
        slug: String,
        publicationDate: Date,
        revisions: [BlogPostRevision]
    });

BlogPost.method("isPublished", function() {
    return this.publicationDate !== null;
});

exports.BlogPost = BlogPost;
exports.BlogPostRevision = BlogPostRevision;
