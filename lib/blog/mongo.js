var Db = require('mongodb').Db,
    Connection = require('mongodb').Connection,
    Server = require('mongodb').Server,
    settings = require("./settings"),
    memo = require("./memo");

var connectToMongo = memo.async(function(callback) {
    var host = settings.mongo.host;
    var port = settings.mongo.port;
    var database = settings.mongo.database;
    var username = settings.mongo.username;
    var password = settings.mongo.password;

    var db = new Db(database, new Server(host, port, {auto_reconnect: true}), {native_parser:false});
    db.open(function(err, value) {
        if (err) {
            callback(err);
        } else {
            if (username && password) {
                db.authenticate(username, password, function() {
                    callback(err, value);
                });
            } else {
                callback(err, value);
            }
        }
    });
});

exports.connect = function(callback) {
    connectToMongo(function(err, connection) {
        if (err) {
            callback(err);
        } else {
            callback(err, connection)
            // TODO: listen for broken connection, then:
            // connectToMongo.clear();
        }
    });
};

exports.parseUri = function(uri) {
    // mongodb://username:password@host:port/database
    var regex = /^mongodb:\/\/([^:]+):([^@]+)@([^:]+):([0-9]+)\/(.+)$/
    var result = uri.match(regex);
    return {
        username: result[1],
        password: result[2],
        host: result[3],
        port: result[4],
        database: result[5]
    };
};
