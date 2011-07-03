module.exports = function(content, postRepository) {
    return function(callback) {
        postRepository.posts().list(function(err, posts) {
            callback(null, content.html("admin-index", {posts: posts}));
        });
    };
};
