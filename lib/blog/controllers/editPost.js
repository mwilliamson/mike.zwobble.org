module.exports = function(content, postRepository) {
    return function(post, respond) {
        respond(null, content.html("edit-post", {post: post, title: "Edit " + post.title}));
    };
};
