module.exports = function(content, topicRepository, postParameters) {
    return function(respond) {
        var topicRespond = function(err) {
            if (err) {
                respond(err);
            } else {
                topicRepository.fetchAll(function(err, topics) {
                    if (err) {
                        respond(err);
                    } else {
                        respond(null, content.html("admin-topics", {
                            topics: topics
                        }));
                    }
                });
            }
        };
        
        if (postParameters) {
            topicRepository.addTopic(postParameters["add-topic"], topicRespond);
        } else {
            topicRespond(null)
        }
    };
};

