module.exports = function(content, postRepository) {
    return function(callback) {
        callback(null, content.html("admin-index"));
    };
};
