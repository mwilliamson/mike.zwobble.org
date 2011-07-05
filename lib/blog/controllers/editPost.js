module.exports = function(content, postRepository) {
    return function(post, respond) {
        post.latestRevision = post.revisions[post.revisions.length - 1];
        respond(null, content.html("edit-post", {post: post, title: "Edit " + post.latestRevision.title}));
    };
};
