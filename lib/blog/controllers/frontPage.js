module.exports = function(content, postRepository) {
    return function(callback) {
        postRepository.posts().list({}, function(err, posts) {
            if (err) {
                callback(err);
            } else {
                callback(null, content.html("front-page", {posts: posts}));
            }
        });
    };
}
