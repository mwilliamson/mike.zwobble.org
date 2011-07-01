var paths = require("blog/paths");

exports.pathEndingAtRootMatchesSingleSlash  = function(test) {
    var navigator = paths.navigator(
        paths.end()
    );
    navigator.navigate("/", function(err, result) {
        test.ok(result.matched);
        test.done();
    });
};

exports.pathEndingAtRootDoesntMatchPathOtherThanSingleSlash  = function(test) {
    var navigator = paths.navigator(
        paths.end()
    );
    navigator.navigate("/blogs", function(err, result) {
        test.ok(!result.matched);
        test.done();
    });
};

exports.regexPathMatcherAddsComponentToParameters  = function(test) {
    var digitParameter = paths.parameters.regex(/[0-9]+/);
    var navigator = paths.navigator(
        paths.then(digitParameter,
            paths.end(digitParameter)
        )
    );
    navigator.navigate("/2351", function(err, result) {
        test.ok(result.matched);
        test.equal("2351", result.value);
        test.done();
    });
};

exports.regexPathMatcherDoesntMatchStringsNotMatchingRegex  = function(test) {
    var digitParameter = paths.parameters.regex(/[0-9]+/);
    var navigator = paths.navigator(
        paths.then(digitParameter,
            paths.end(digitParameter)
        )
    );
    navigator.navigate("/rock-and-roll", function(err, result) {
        test.ok(!result.matched);
        test.done();
    });
};

exports.thenTriesMatchersInOrderUntilSuccess  = function(test) {
    var firstParameter = paths.parameters.regex(/1/);
    var secondParameter = paths.parameters.regex(/2/);
    var thirdParameter = paths.parameters.regex(/2/);
    var navigator = paths.navigator(
        paths.firstOf(
            paths.then(firstParameter,
                paths.end()
            ),
            paths.then(secondParameter,
                paths.end(secondParameter)
            ),
            paths.then(thirdParameter,
                paths.end()
            )
        )
    );
    navigator.navigate("/2", function(err, result) {
        test.ok(result.matched);
        test.equal("2", result.value)
        test.done();
    });
};

exports.canConvertValuesFromParameters  = function(test) {
    var digitParameter = paths.parameters.convert(paths.parameters.regex(/[0-9]+/), function(value, callback) {
        callback(null, {matched: true, value: value * 2});
    });
    var navigator = paths.navigator(
        paths.then(digitParameter,
            paths.end(digitParameter)
        )
    );
    navigator.navigate("/23", function(err, result) {
        test.ok(result.matched);
        test.equal(46, result.value);
        test.done();
    });
};

exports.valuesNotConvertedIfParameterDoesntMatch  = function(test) {
    var digitParameter = paths.parameters.convert(paths.parameters.regex(/[0-9]+/), function(value, callback) {
        callback(null, {matched: true, value: value * 2});
    });
    var navigator = paths.navigator(
        paths.then(digitParameter,
            paths.end()
        )
    );
    navigator.navigate("/23a", function(err, result) {
        test.ok(!result.matched);
        test.done();
    });
};

exports.conversionErrorsArePassedBack  = function(test) {
    var digitParameter = paths.parameters.convert(paths.parameters.regex(/[0-9]+/), function(value, callback) {
        callback(new Error("Oh noes"));
    });
    var navigator = paths.navigator(
        paths.then(digitParameter,
            paths.end(digitParameter)
        )
    );
    navigator.navigate("/23", function(err) {
        test.equal("Oh noes", err.message);
        test.done();
    });
};

exports.stringPathMatcherOnlyMatchesExactlyTheSameString = function(test) {
    var navigator = paths.navigator(
        paths.then("blog",
            paths.end()
        )
    );
    navigator.navigate("/blog", function(err, result) {
        test.ok(result.matched);
        test.done();
    });
};

exports.stringPathMatcherDoesntMatchDifferentString = function(test) {
    var navigator = paths.navigator(
        paths.then("blog",
            paths.end()
        )
    );
    navigator.navigate("/Blog", function(err, result) {
        test.ok(!result.matched);
        test.done();
    });
};

exports.canComposeParameters = function(test) {
    var yearParameter = paths.parameters.regex(/[0-9]+/);
    var monthParameter = paths.parameters.regex(/[0-9]+/);
    var dayParameter = paths.parameters.regex(/[0-9]+/);
    
    var dateParameter = paths.parameters.composite(
        yearParameter, monthParameter, dayParameter,
        function(year, month, day, callback) {
            callback(null, {matched: true, value: {year: year, month: month, day: day}});
        }
    );
    
    var navigator = paths.navigator(
        paths.then(yearParameter,
            paths.then(monthParameter,
                paths.then(dayParameter,
                    paths.end(dateParameter)
                )
            )
        )
    );
    navigator.navigate("/2011/06/30/", function(err, result) {
        test.ok(result.matched);
        var date = result.value;
        test.equal("2011", date.year);
        test.equal("06", date.month);
        test.equal("30", date.day);
        test.done();
    });
};

exports.errorsFromCompositionArePassedBack = function(test) {
    var yearParameter = paths.parameters.regex(/[0-9]+/);
    var monthParameter = paths.parameters.regex(/[0-9]+/);
    var dayParameter = paths.parameters.regex(/[0-9]+/);
    
    
    var dateParameter = paths.parameters.composite(
        yearParameter, monthParameter, dayParameter,
        function(year, month, day, callback) {
            callback(new Error("Oh noes"));
        }
    );
    
    var navigator = paths.navigator(
        paths.then(yearParameter,
            paths.then(monthParameter,
                paths.then(dayParameter,
                    paths.end(dateParameter)
                )
            )
        )
    );
    navigator.navigate("/2011/06/30/", function(err, result) {
        test.equal("Oh noes", err.message);
        test.done();
    });
};

exports.notMatchedIfDependencyOfCompositionIsUnavailable = function(test) {
    var yearParameter = paths.parameters.regex(/[0-9]+/);
    var monthParameter = paths.parameters.regex(/[0-9]+/);
    var dayParameter = paths.parameters.regex(/[0-9]+/);
    
    var dateParameter = paths.parameters.composite(
        yearParameter, monthParameter, dayParameter,
        function(year, month, day, callback) {
            callback(null, {matched: true, value: {year: year, month: month, day: day}});
        }
    );
    
    var navigator = paths.navigator(
        paths.then(yearParameter,
            paths.end(dateParameter)
        )
    );
    navigator.navigate("/2011", function(err, result) {
        test.ok(!result.matched);
        test.done();
    });
};

