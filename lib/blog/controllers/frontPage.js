var content = require("../content");

module.exports = function(blah) {
    return function(callback) {
        callback(null, content.html("front-page", {blah: blah}));
    };
}
