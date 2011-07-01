var paths = require("blog/paths");

exports.pathEndingAtRootMatchesSingleSlash  = function(test) {
    var navigator = paths.navigator(
        paths.end(function(parameters, callback) {
            callback(null, "root");
        })
    );
    navigator.navigate("/", function(err, result) {
        test.equal("root", result);
        test.done();
    });
};

exports.pathEndingAtRootDoesntMatchPathOtherThanSingleSlash  = function(test) {
    var navigator = paths.navigator(
        paths.end(function(parameters, callback) {
            callback(null, "root");
        })
    );
    navigator.navigate("/blogs", function(err, result) {
        test.equal(null, result);
        test.done();
    });
};

exports.regexPathMatcherAddsComponentToParameters  = function(test) {
    var digitParameter = paths.parameters.regex(/[0-9]+/);
    var navigator = paths.navigator(
        paths.then(digitParameter,
            paths.end(function(parameters, callback) {
                callback(null, parameters);
            })
        )
    );
    navigator.navigate("/2351", function(err, parameters) {
        parameters.get(digitParameter, function(err, digit) {
            test.equal("2351", digit);
            test.done();
        });
    });
};

exports.regexPathMatcherDoesntMatchStringsNotMatchingRegex  = function(test) {
    var digitParameter = paths.parameters.regex(/[0-9]+/);
    var navigator = paths.navigator(
        paths.then(digitParameter,
            paths.end(function(parameters, callback) {
                callback(null, parameters);
            })
        )
    );
    navigator.navigate("/rock-and-roll", function(err, result) {
        test.equal(null, result)
        test.done();
    });
};

exports.thenTriesMatchersInOrderUntilSuccess  = function(test) {
    var navigator = paths.navigator(
        paths.firstOf(
            paths.then(paths.parameters.regex(/1/),
                paths.end(function(parameters, callback) {
                    callback(null, "1");
                })
            ),
            paths.then(paths.parameters.regex(/2/),
                paths.end(function(parameters, callback) {
                    callback(null, "2");
                })
            ),
            paths.then(paths.parameters.regex(/2/),
                paths.end(function(parameters, callback) {
                    callback(null, "3");
                })
            )
        )
    );
    navigator.navigate("/2", function(err, result) {
        test.equal("2", result)
        test.done();
    });
};

exports.canConvertValuesFromParameters  = function(test) {
    var digitParameter = paths.parameters.convert(paths.parameters.regex(/[0-9]+/), function(value, callback) {
        callback(null, {matched: true, value: value * 2});
    });
    var navigator = paths.navigator(
        paths.then(digitParameter,
            paths.end(function(parameters, callback) {
                callback(null, parameters);
            })
        )
    );
    navigator.navigate("/23", function(err, parameters) {
        parameters.get(digitParameter, function(err, digit) {
            test.equal(46, digit);
            test.done();
        });
    });
};

exports.valuesNotConvertedIfParameterDoesntMatch  = function(test) {
    var digitParameter = paths.parameters.convert(paths.parameters.regex(/[0-9]+/), function(value, callback) {
        callback(null, {matched: true, value: value * 2});
    });
    var navigator = paths.navigator(
        paths.then(digitParameter,
            paths.end(function(parameters, callback) {
                callback(null, parameters);
            })
        )
    );
    navigator.navigate("/23a", function(err, result) {
        test.equal(null, result)
        test.done();
    });
};

exports.stringPathMatcherOnlyMatchesExactlyTheSameString = function(test) {
    var navigator = paths.navigator(
        paths.then("blog",
            paths.end(function(parameters, callback) {
                callback(null, "hooray!");
            })
        )
    );
    navigator.navigate("/blog", function(err, result) {
        test.equal("hooray!", result)
        test.done();
    });
};

exports.stringPathMatcherDoesntMatchDifferentString = function(test) {
    var navigator = paths.navigator(
        paths.then("blog",
            paths.end(function(parameters, callback) {
                callback(null, "hooray!");
            })
        )
    );
    navigator.navigate("/Blog", function(err, result) {
        test.equal(null, result)
        test.done();
    });
};

exports.canComposeParameters = function(test) {
    var yearParameter = paths.parameters.regex(/[0-9]+/);
    var monthParameter = paths.parameters.regex(/[0-9]+/);
    var dayParameter = paths.parameters.regex(/[0-9]+/);
    
    var dateParameter = paths.parameters.composite(function(parameters, callback) {
        parameters.getAll(yearParameter, monthParameter, dayParameter, function(err, year, month, day) {
            callback(err, {year: year, month: month, day: day});
        });
    });
    
    var navigator = paths.navigator(
        paths.then(yearParameter,
            paths.then(monthParameter,
                paths.then(dayParameter,
                    paths.end(function(parameters, callback) {
                        callback(null, parameters);
                    })
                )
            )
        )
    );
    navigator.navigate("/2011/06/30/", function(err, parameters) {
        parameters.get(dateParameter, function(err, date) {
            test.equal("2011", date.year);
            test.equal("06", date.month);
            test.equal("30", date.day);
            test.done();
        });
    });
};
