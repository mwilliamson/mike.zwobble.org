module.exports = function(content, postRepository, postParameters) {
    return function(post, respond) {
        var editRespond = function(err) {
            if (err) {
                respond(err);
            } else {
                respond(null, content.html("edit-post", {post: post, title: "Edit " + post.latestRevision.title}));
            }
        };
        
        if (postParameters) {
            postRepository.updatePost(post, postParameters.title, postParameters.body, editRespond);
        } else {
            editRespond(null, post)
        }
    };
};

module.exports.url = function(post) {
    return "/admin/post/" + post._id + "/";
};
