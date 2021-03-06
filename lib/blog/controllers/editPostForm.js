var slugs = require("../slugs");

var postHasTopic = function(post, topic) {
    var postTopics = post.latestRevision.topics;
    for (var topicIndex = 0; topicIndex < postTopics.length; topicIndex += 1) {
        if (postTopics[topicIndex].equals(topic._id)) {
            return true;
        }
    }
    return false;
};

module.exports = function(topicRepository, callback) {
    callback(null, {
        read: function(postParameters) {
            var topicsParameter = postParameters.topics;
            if (!topicsParameter) {
                topics = [];
            } else if (Array.isArray(topicsParameter)) {
                topics = topicsParameter;
            } else {
                topics = [topicsParameter];
            }
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
                    var topicContext = topics.map(function(topic) {
                        return {
                            name: topic.name,
                            _id: topic._id,
                            isSelected: post && postHasTopic(post, topic)
                        };
                    });
                    callback(null, {topics: topicContext, post: post});
                }
            });
        }
    });
};
