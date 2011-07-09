var slugs = require("../slugs");

module.exports = function(topicRepository, callback) {
    callback(null, {
        read: function(postParameters) {
            var topics = (postParameters.topics || "").split(",").map(function(topic) {
                return topic.trim();
            }).map(slugs.slugify).filter(function(topic) {
                return topic.length > 0;
            });
            return {
                title: postParameters.title,
                bodyHtml: postParameters.body,
                topics: topics
            };
        },
        templateContext: function(post, callback) {
            topicRepository.fetchAll(function(err, topics) {
                if (err) {
                    callback(err);
                } else {
                    callback(null, {topics: topics, post: post});
                }
            });
        }
    });
};
