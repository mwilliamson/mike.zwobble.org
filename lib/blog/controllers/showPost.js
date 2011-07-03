module.exports = function(content) {
    return function(post, respond) {
        respond(null, content.html("show-post", {post: post, title: post.title}));
    };
};
