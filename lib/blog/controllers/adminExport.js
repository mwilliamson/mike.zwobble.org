module.exports = function(postRepository, topicRepository) {
    return function(callback) {
        postRepository.posts().list(function(err, posts) {
            topicRepository.fetchAll(function(err, topics) {
                callback(null, {
                    writeTo: function(response) {
                        response.writeHead(200, {"Content-Type": "application/json"});
                        response.end(JSON.stringify({
                            posts: posts,
                            topics: topics
                        }));
                    }
                });
            });
        });
    };
};

