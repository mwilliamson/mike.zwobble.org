var editPostController = require("./editPost");

module.exports = function(content, editPostForm, postRepository, postParameters) {
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
            editPostForm.templateContext(null, function(err, editPostFormContext) {
                // TODO: handle err
                respond(null, content.html("new-post"), {
                    editPostForm: editPostFormContext
                });
            });
        }
    };
};
