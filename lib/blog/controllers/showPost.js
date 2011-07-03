var content = require("../content");

module.exports = function() {
    return function(post, respond) {
        respond(null, content.html("show-post", {post: post}));
    };
};
