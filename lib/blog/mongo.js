exports.connect = function(callback) {
    var Db = require('mongodb').Db,
        Connection = require('mongodb').Connection,
        Server = require('mongodb').Server;

    var host = process.env['MONGO_NODE_DRIVER_HOST'] != null ? process.env['MONGO_NODE_DRIVER_HOST'] : 'localhost';
    var port = process.env['MONGO_NODE_DRIVER_PORT'] != null ? process.env['MONGO_NODE_DRIVER_PORT'] : Connection.DEFAULT_PORT;

    var LINE_SIZE = 120;

    var db = new Db('mike-zwobble-org', new Server("localhost", Connection.DEFAULT_PORT, {}), {native_parser:false});
    db.open(callback);
};
