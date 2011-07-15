var topics = require("blog/topics");

var topicIdCounter = 0;

var topic = function(name) {
    topicIdCounter += 1;
    var id = topicIdCounter;
    return {
        slug: name,
        name: name,
        _id: {
            toHexString: function() {
                return id.toString();
            }
        }
    };
};

exports.fetchingOfAllTopicsIsCached = function(test) {
    var topicsInDatabase = [topic("hardware"), topic("software")];
    var numberOfCalls = 0;
    var topicRepository = {
        fetchAll: function(callback) {
            numberOfCalls += 1;
            callback(null, topicsInDatabase);
        }
    };
    topics.cachedTopicRepository(topicRepository, function(err, cachedTopicRepository) {
        cachedTopicRepository.fetchAll(function(err, fetchedTopics) {
            test.equal(topicsInDatabase, fetchedTopics);
            cachedTopicRepository.fetchAll(function(err, fetchedTopics) {
                test.equal(topicsInDatabase, fetchedTopics);
                test.equal(1, numberOfCalls);
                test.done();
            });
        });
    });
};

exports.errorFromUnderlyingTopicRepositoryCausesConstructionError = function(test) {
    var topicsInDatabase = [topic("hardware"), topic("software")];
    var numberOfCalls = 0;
    var topicRepository = {
        fetchAll: function(callback) {
            numberOfCalls += 1;
            if (numberOfCalls === 1) {
                callback(new Error("Oh noes"));
            } else {
                callback(null, topicsInDatabase);
            }
        }
    };
    topics.cachedTopicRepository(topicRepository, function(err, cachedTopicRepository) {
        test.equal("Oh noes", err.message);
        test.done();
    });
};

exports.canFetchTopicBySlugFromCache = function(test) {
    var softwareTopic = topic("software");
    var topicsInDatabase = [topic("hardware"), softwareTopic];
    var numberOfCalls = 0;
    var topicRepository = {
        fetchAll: function(callback) {
            numberOfCalls += 1;
            callback(null, topicsInDatabase);
        }
    };
    topics.cachedTopicRepository(topicRepository, function(err, cachedTopicRepository) {
        cachedTopicRepository.fetchBySlug("software", function(err, fetchedTopic) {
            test.equal(softwareTopic, fetchedTopic);
            cachedTopicRepository.fetchBySlug("software", function(err, fetchedTopic) {
                test.equal(softwareTopic, fetchedTopic);
                test.equal(1, numberOfCalls);
                test.done();
            });
        });
    });
};

exports.resultIsUndefinedIfCannotFindTopicWithSlug = function(test) {
    var topicRepository = {
        fetchAll: function(callback) {
            callback(null, []);
        }
    };
    topics.cachedTopicRepository(topicRepository, function(err, cachedTopicRepository) {
        cachedTopicRepository.fetchBySlug("software", function(err, fetchedTopic) {
            test.equal(undefined, fetchedTopic);
            test.done();
        });
    });
};

exports.canFetchTopicByIdHexStringFromCache = function(test) {
    var softwareTopic = topic("software");
    var topicsInDatabase = [topic("hardware"), softwareTopic];
    var numberOfCalls = 0;
    var topicRepository = {
        fetchAll: function(callback) {
            numberOfCalls += 1;
            callback(null, topicsInDatabase);
        }
    };
    topics.cachedTopicRepository(topicRepository, function(err, cachedTopicRepository) {
        cachedTopicRepository.fetchById(softwareTopic._id, function(err, fetchedTopic) {
            test.equal(softwareTopic, fetchedTopic);
            cachedTopicRepository.fetchById(softwareTopic._id, function(err, fetchedTopic) {
                test.equal(softwareTopic, fetchedTopic);
                test.equal(1, numberOfCalls);
                test.done();
            });
        });
    });
};

exports.canFetchTopicByObjectIdFromCache = function(test) {
    var softwareTopic = topic("software");
    var topicsInDatabase = [topic("hardware"), softwareTopic];
    var numberOfCalls = 0;
    var topicRepository = {
        fetchAll: function(callback) {
            numberOfCalls += 1;
            callback(null, topicsInDatabase);
        }
    };
    topics.cachedTopicRepository(topicRepository, function(err, cachedTopicRepository) {
        cachedTopicRepository.fetchById(softwareTopic._id.toHexString(), function(err, fetchedTopic) {
            test.equal(softwareTopic, fetchedTopic);
            cachedTopicRepository.fetchById(softwareTopic._id.toHexString(), function(err, fetchedTopic) {
                test.equal(softwareTopic, fetchedTopic);
                test.equal(1, numberOfCalls);
                test.done();
            });
        });
    });
};

exports.addingTopicsAddsTopicToBothCacheAndDatabase = function(test) {
    var topicsInDatabase = [topic("hardware"), topic("software")];
    var numberOfAddTopicCalls = 0;
    var topicRepository = {
        fetchAll: function(callback) {
            callback(null, topicsInDatabase);
        },
        addTopic: function(name, callback) {
            numberOfAddTopicCalls += 1;
            callback(null, topic(name));
        }
    };
    topics.cachedTopicRepository(topicRepository, function(err, cachedTopicRepository) {
        cachedTopicRepository.addTopic("testing", function(err, testingTopic) {
            test.equal(1, numberOfAddTopicCalls);
            test.equal("testing", testingTopic.name);
            cachedTopicRepository.fetchBySlug("testing", function(err, fetchedTopic) {
                test.equal(testingTopic, fetchedTopic);
                test.done();
            });
        });
    });
};

exports.topicsAreAddedInAlphabeticalOrder = function(test) {
    var hardwareTopic = topic("hardware");
    var testingTopic = topic("testing");
    var topicsInDatabase = [hardwareTopic, testingTopic];
    var topicRepository = {
        fetchAll: function(callback) {
            callback(null, topicsInDatabase);
        },
        addTopic: function(name, callback) {
            callback(null, topic(name));
        }
    };
    topics.cachedTopicRepository(topicRepository, function(err, cachedTopicRepository) {
        cachedTopicRepository.addTopic("software", function(err, softwareTopic) {
            cachedTopicRepository.fetchAll(function(err, fetchedTopics) {
                test.equal(hardwareTopic, fetchedTopics[0]);
                test.equal(softwareTopic, fetchedTopics[1]);
                test.equal(testingTopic, fetchedTopics[2]);
                test.equal(3, fetchedTopics.length);
                test.done();
            });
        });
    });
};

exports.topicIsNotAddedToCacheIfErrorAddingToDatabase = function(test) {
    var topicsInDatabase = [topic("hardware"), topic("software")];
    var topicRepository = {
        fetchAll: function(callback) {
            callback(null, topicsInDatabase);
        },
        addTopic: function(name, callback) {
            callback(new Error("Oh noes"), null);
        }
    };
    topics.cachedTopicRepository(topicRepository, function(err, cachedTopicRepository) {
        cachedTopicRepository.addTopic("testing", function(err, testingTopic) {
            test.equal("Oh noes", err.message);
            cachedTopicRepository.fetchBySlug("testing", function(err, fetchedTopic) {
                test.equal(undefined, fetchedTopic);
                test.done();
            });
        });
    });
};
