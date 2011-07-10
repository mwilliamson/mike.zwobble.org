exports.mongo = {
    host: "localhost",
    port: require('mongodb').Connection.DEFAULT_PORT,
    database: "mike-zwobble-org"
};

exports.httpPort = 8125;
exports.httpsPort = 8126;
exports.tlsKeyPath = "server.key";
exports.tlsCertPath = "server.crt";
