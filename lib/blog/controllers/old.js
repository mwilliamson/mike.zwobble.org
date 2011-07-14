var showPostController = require("./showPost"),
    slugs = require("../slugs");

exports.root = function(content) {
    return function(respond) {
        respond(null, content.permanentRedirect("/"));
    };
};

exports.post = function(content) {
    return function(year, month, slug, respond) {
        respond(null, content.permanentRedirect(showPostController.url(year, month - 1, slugs.slugify(slug.replace("_", "-")))));
    };
};
