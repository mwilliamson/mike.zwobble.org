// mongodb://username:password@host:port/database
var mongoUri = process.env.MONGOLAB_URI;

if (mongoUri) {
    var mongoConnectionDetails = require("mongo").parseUri(mongoUri);
    exports.mongo = {
        host: mongoConnectionDetails.host,
        port: mongoConnectionDetails.port,
        database: mongoConnectionDetails.database
    };
} else {
    exports.mongo = {
        host: "localhost",
        port: require('mongodb').Connection.DEFAULT_PORT,
        database: "mike-zwobble-org"
    };
}

exports.httpPort = process.env.PORT || 8125;

exports.auth = {
    username: "admin",
    hash: process.env.MIKES_BLOG_USER_HASH || "$2a$10$9GFeHTZm6PKprCV0pUlHMuZ6p8oWIIyspbIM.fKrYO9S0c3kGSViy"
};
