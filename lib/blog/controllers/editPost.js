module.exports = function(content, editPostForm, postRepository, postParameters) {
    return function(post, respond) {
        var editRespond = function(err) {
            if (err) {
                respond(err);
            } else {
                editPostForm.templateContext(post, function(err, editPostFormContext) {
                    // TODO: handle err
                    respond(null, content.html("edit-post", {
                        post: post,
                        title: "Edit " + post.latestRevision.title,
                        editPostForm: editPostFormContext
                    }));
                });
            }
        };
        
        if (postParameters) {
            if (postParameters.action === "publish") {
                postRepository.publishPost(post, editRespond);
            } else {
                var fields = editPostForm.read(postParameters);
                postRepository.updatePost(post, fields, editRespond);
            }
        } else {
            editRespond(null, post)
        }
    };
};

module.exports.url = function(post) {
    return "/admin/post/" + post._id + "/";
};
