module.exports = function(content, postRepository) {
    return function(callback) {
        postRepository.posts().list({}, function(err, posts) {
            if (err) {
                callback(err);
            } else {
                callback(null, content.text("feed.atom", "application/atom+xml", {
                    posts: posts,
                    lastUpdated: Math.max.apply(Math, posts.map(function(post) {
                        return post.latestRevision.date;
                    }))
                }));
            }
        });
    };
}
