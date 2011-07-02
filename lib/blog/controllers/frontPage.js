var content = require("../content");

module.exports = function(callback) {
    callback(null, content.html("front-page"));
};
