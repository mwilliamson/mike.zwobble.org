module.exports = function(content, postRepository) {
    return function(callback) {
        postRepository.posts().list(function(err, posts) {
            var numberForSorting = function(post) {
                if (post.isPublished) {
                    return post.publicationDate.getTime();
                } else {
                    return post.latestRevision.date.getTime();
                }
            };
            posts.sort(function(first, second) {
                return numberForSorting(second) - numberForSorting(first);
            });
            callback(null, content.html("admin-index", {posts: posts}));
        });
    };
};
