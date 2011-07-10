var ObjectID = require('mongodb/lib/mongodb/bson/bson').ObjectID;
var slugs = require("./slugs");

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