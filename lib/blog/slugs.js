exports.slugRegex = /([a-z0-9\-]+)/

exports.slugify = function(str) {
    return str.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
};
