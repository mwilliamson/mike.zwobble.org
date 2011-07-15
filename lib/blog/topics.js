var ObjectID = require('mongodb/lib/mongodb/bson/bson').ObjectID;
var slugs = require("./slugs");

var compareTopics = function(first, second) {
    var firstName = first.name;
    var secondName = second.name;
    if (firstName < secondName) {
        return -1;
    } else if (firstName === secondName) {
        return 0;
    } else {
        return 1;
    }
};

exports.cachedTopicRepository = function(topicRepository, callback) {
    topicRepository.fetchAll(function(err, topics) {
        if (err) {
            callback(err);
        } else {
            var fetchByCriteria = function(criteria, callback) {
                for (var i = 0; i < topics.length; i += 1) {
                    if (criteria(topics[i])) {
                        callback(null, topics[i]);
                        return;
                    }
                }
                callback();
            };
            callback(null, {
                fetchAll: function(callback) {
                    callback(null, topics);
                },
                fetchBySlug: function(slug, callback) {
                    fetchByCriteria(function(topic) {
                        return topic.slug === slug;
                    }, callback);
                },
                fetchById: function(id, callback) {
                    fetchByCriteria(function(topic) {
                        return topic._id.toHexString() === id;
                    }, callback);
                },
                addTopic: function(name, callback) {
                    topicRepository.addTopic(name, function(err, topic) {
                        if (err) {
                            callback(err);
                        } else {
                            topics.push(topic);
                            topics.sort(compareTopics);
                            callback(null, topic);
                        }
                    });
                }
            });
        }
    });
};

exports.topicRepository = function(mongoDb, callback) {
    mongoDb.collection("topics", function(err, topicCollection) {
        topicCollection.ensureIndex({slug: 1}, {unique: true}, function() {
            callback(null, {
                addTopic: function(name, callback) {
                    topicCollection.save({
                        slug: slugs.slugify(name),
                        name: name
                    }, {safe: true}, callback);
                },
                fetchById: function(id, callback) {
                    if (!(id instanceof ObjectID)) {
                        id = new ObjectID(id);
                    }
                    topicCollection.findOne({_id: id}, callback);
                },
                fetchBySlug: function(slug, callback) {
                    topicCollection.findOne({slug: slug}, callback);
                },
                fetchAll: function(callback) {
                    topicCollection.find({}, {}, {"sort": [["name", 1]]}, function(err, topics) {
                        if (err) {
                            callback(err);
                        } else {
                            topics.toArray(callback);
                        }
                    });
                }
            });
        });
    });
}
