module.exports = function(postRepository) {
    return function(callback) {
        postRepository.posts().list(function(err, posts) {
            callback(null, {
                writeTo: function(response) {
                    response.writeHead(200, {"Content-Type": "application/json"});
                    response.end(JSON.stringify(posts));
                }
            });
        });
    };
};

