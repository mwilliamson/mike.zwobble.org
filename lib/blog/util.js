exports.then = function(callback, ifNoError) {
    return function(err, value) {
        if (err) {
            callback(err);
        } else {
            ifNoError(value, callback);
        }
    };
};
