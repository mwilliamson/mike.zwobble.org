var editPostController = require("./editPost");

module.exports = function(content, postRepository, postParameters) {
    return function(respond) {
        if (postParameters) {
            postRepository.createPost(postParameters.title, postParameters.body, function(err, post) {
                if (err) {
                    respond(err);
                } else {
                    respond(null, content.redirect(editPostController.url(post)));
                }
            });
        } else {
            respond(null, content.html("new-post"));
        }
    };
};
