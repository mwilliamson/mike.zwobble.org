var paths = require("blog/paths"),
    inject = require("blog/inject");

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

exports.cannotBacktrack  = function(test) {
    var navigator = paths.navigator(
        paths.firstOf(
            paths.then("blogs"
            ),
            paths.then("blogs",
                paths.end()
            )
        )
    );
    navigator.navigate("/blogs/blogs", function(err, result) {
        test.ok(!result.matched);
        test.done();
    });
};

exports.canConvertValuesFromParameters  = function(test) {
    var digitParameter = paths.parameters.convert(paths.parameters.regex(/[0-9]+/), function(value, callback) {
        callback.ok(value * 2);
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
        callback(null, {status: paths.parameters.status.ok, value: value * 2});
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
        callback.error(new Error("Oh noes"));
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
            callback.ok({year: year, month: month, day: day});
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

exports.canPassArrayOfParametersToCompositeParameterBuilder = function(test) {
    var yearParameter = paths.parameters.regex(/[0-9]+/);
    var monthParameter = paths.parameters.regex(/[0-9]+/);
    var dayParameter = paths.parameters.regex(/[0-9]+/);
    
    var dateParameter = paths.parameters.composite(
        [yearParameter, monthParameter, dayParameter],
        function(values, callback) {
            callback.ok({year: values[0], month: values[1], day: values[2]});
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
            callback.error(new Error("Oh noes"));
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
            callback.ok({year: year, month: month, day: day});
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

exports.usingControllerGivesValueThatCallsControllerWithSpecifiedParameterValues = function(test) {
    var yearParameter = paths.parameters.regex(/[0-9]+/);
    var monthParameter = paths.parameters.regex(/[0-9]+/);
    
    var controller = function(year, month, callback) {
        callback(null, {year: year, month: month});
    };
    
    var navigator = paths.navigator(
        paths.then(yearParameter,
            paths.then(monthParameter,
                paths.end(paths.useController(controller, yearParameter, monthParameter))
            )
        )
    );
    navigator.navigate("/2011/06", function(err, result) {
        test.ok(result.matched);
        result.value(function(err, value) {
            test.equal("2011", value.year);
            test.equal("06", value.month);
            test.done();
        });
    });
};

exports.anythingMatchesAnyPathAndAddsRemainingPathToParameters = function(test) {
    var yearParameter = paths.parameters.regex(/[0-9]+/);
    
    var controller = function(year, remainingPath, callback) {
        callback(null, {year: year, remainingPath: remainingPath});
    };
    
    var navigator = paths.navigator(
        paths.then(yearParameter,
            paths.anything(paths.useController(controller, yearParameter, paths.parameters.remainingPath))
        )
    );
    navigator.navigate("/2011/06/first-post", function(err, result) {
        test.ok(result.matched);
        result.value(function(err, value) {
            test.equal("2011", value.year);
            test.equal("06/first-post", value.remainingPath);
            test.done();
        });
    });
};

exports.canPassCustomParameterBuilder = function(test) {
    var slugParameter = paths.parameters.regex(/[a-z\-]+/);
    
    var postParameter = function() {
        return paths.parameters.composite(
            slugParameter,
            function(slug, callback) {
                callback.ok({slug: slug});
            }
        );
    };
    
    var navigator = paths.navigator(
        paths.then(slugParameter,
            paths.end(postParameter)
        ),
        function(parameter, callback) {
            var isFunction = function(obj) {
                return !!(obj && obj.constructor && obj.call && obj.apply);
            }
            if (isFunction(parameter)) {
                callback(parameter());
            } else {
                callback(parameter);
            }
        }
    );
    navigator.navigate("/first-post", function(err, result) {
        test.ok(result.matched);
        test.equal("first-post", result.value.slug);
        test.done();
    });
};
