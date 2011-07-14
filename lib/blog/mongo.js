var Db = require('mongodb').Db,
    Connection = require('mongodb').Connection,
    Server = require('mongodb').Server,
    settings = require("./settings");

exports.connect = function(callback) {
    var host = settings.mongo.host;
    var port = settings.mongo.port;
    var database = settings.mongo.database;

    var LINE_SIZE = 120;

    var db = new Db(database, new Server(host, port, {}), {native_parser:false});
    db.open(callback);
};

exports.parseUri = function(uri) {
    // mongodb://username:password@host:port/database
    var regex = /^mongodb:\/\/([^:]+:[^@]+@[^:]+):([0-9]+)\/(.+)$/
    var result = uri.match(regex);
    return {
        host: result[1],
        port: result[2],
        database: result[3]
    };
};
