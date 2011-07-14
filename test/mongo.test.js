var mongo = require("blog/mongo");

exports.canParseMongoUri = function(test) {
    var uri = "mongodb://bob:blah@host:478/database";
    var result = mongo.parseUri(uri);
    test.equal("bob", result.username);
    test.equal("blah", result.password);
    test.equal("host", result.host);
    test.equal("478", result.port);
    test.equal("database", result.database);
    test.done();
};
