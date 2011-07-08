var editPostController = require("./editPost");
var editPostForm = require("./editPostForm");

module.exports = function(content, postRepository, postParameters) {
    return function(respond) {
        if (postParameters) {
            var fields = editPostForm.read(postParameters);
            postRepository.createPost(fields, function(err, post) {
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
