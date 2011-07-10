exports.mongo = {
    host: "localhost",
    port: require('mongodb').Connection.DEFAULT_PORT,
    database: "mike-zwobble-org"
};

exports.httpPort = 8125;
exports.httpsPort = 8126;
exports.tlsKeyPath = "server.key";
exports.tlsCertPath = "server.crt";

exports.auth = {
    username: "admin",
    hash: "$2a$10$9GFeHTZm6PKprCV0pUlHMuZ6p8oWIIyspbIM.fKrYO9S0c3kGSViy"
};
