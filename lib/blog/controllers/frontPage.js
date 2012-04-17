module.exports = function(content, postRepository) {
    var postsPerPage = 10;
    return function(pageNumber, callback) {
        if (!callback) {
            callback = pageNumber;
            pageNumber = 1;
        }
        postRepository.posts().list({}, function(err, allPosts) {
            if (err) {
                callback(err);
            } else {
                var firstPostIndex = (pageNumber - 1) * postsPerPage;
                var lastPostIndex = firstPostIndex + postsPerPage;
                
                var previousPageLink =
                    pageNumber === 1 ? null :
                    pageNumber === 2 ? "/" :
                    "/page/" + (pageNumber - 1) + "/";
                
                var nextPageLink = lastPostIndex <= allPosts.length ? "/page/" + (pageNumber + 1) + "/" : null;
                
                var posts = allPosts.slice(firstPostIndex, lastPostIndex);
                callback(null, content.html("front-page", {
                    posts: posts,
                    previousPageLink: previousPageLink,
                    nextPageLink: nextPageLink
                }));
            }
        });
    };
}
