var slugs = require("../slugs");

exports.read = function(postParameters) {
    var topics = postParameters.topics.split(",").map(function(topic) {
        return topic.trim();
    }).map(slugs.slugify).filter(function(topic) {
        return topic.length > 0;
    });
    return {
        title: postParameters.title,
        bodyHtml: postParameters.body,
        topics: topics
    };
};
