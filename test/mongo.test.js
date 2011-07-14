var mongo = require("blog/mongo");

exports.canParseMongoUri = function(test) {
    var uri = "mongodb://username:password@host:478/database";
    var result = mongo.parseUri(uri);
    test.equal("username:password@host", result.host);
    test.equal("478", result.port);
    test.equal("database", result.database);
    test.done();
};
