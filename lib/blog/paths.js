var url = require("url"),
    async = require("async");

var buildComponentsFromPath = function(path) {
    var components = path.split("/").filter(function(str) {
        return str.length > 0;
    });
    var index = 0;
    return {
        hasNext: function() {
            return index < components.length;
        },
        peek: function() {
            return components[index];
        },
        next: function() {
            return components[index++];
        },
        remainingPath: function() {
            return components.slice(index).join("/");
        }
    };
};

var buildNewParameters = function(parameterBuilder) {
    var parameters = {};
    var self = {
        add: function(parameter, value) {
            parameterBuilder(parameter, function(parameter) {
                parameters[parameter.id] = value;
            });
        },
        get: function(parameter, resultCallback) {
            parameterBuilder(parameter, function(parameter) {
                var key = parameter.id;
                if (key in parameters) {
                    resultCallback.ok(parameters[key]);
                } else if (parameter.buildFromParameters) {
                    parameter.buildFromParameters(self, resultCallback);
                } else {
                    resultCallback.unmatched();
                }
            });
        }
    };
    return self;
};

exports.navigator = function(pathMatcher, parameterBuilder) {
    parameterBuilder = parameterBuilder || function(parameter, callback) {
        callback(parameter);
    };
    return {
        navigate: function(path, callback) {
            var parameters = buildNewParameters(parameterBuilder);
            var unmatchedResult = function() {
                callback(null, {matched: false});
            };
            pathMatcher.match(buildComponentsFromPath(path), parameters, {
                ok: function(value) {
                    callback(null, {matched: true, value: value});
                },
                notFound: unmatchedResult,
                unmatched: unmatchedResult,
                error: function(err) {
                    callback(err);
                }
            });
        }
    };
};

exports.firstOf = function() {
    var subMatchers = Array.prototype.slice.call(arguments, 0);
    return {
        match: function(components, parameterValues, resultCallback) {
            async.forEachSeries(subMatchers, function(subMatcher, tryNextSubMatcher) {
                subMatcher.match(components, parameterValues, {
                    ok: resultCallback.ok,
                    notFound: resultCallback.notFound,
                    unmatched: function() {
                        tryNextSubMatcher();
                    },
                    error: resultCallback.error
                });
            }, function() {
                resultCallback.unmatched();
            });
        }
    };
};

exports.end = function(parameter) {
    return {
        match: function(components, parameterValues, resultCallback) {
            if (components.hasNext()) {
                resultCallback.unmatched()
            } else {
                if (parameter) {
                    parameterValues.get(parameter, resultCallback);
                } else {
                    resultCallback.ok();
                }
            }
        }
    };
};

exports.anything = function(parameter) {
    return {
        match: function(components, parameterValues, callback) {
            parameterValues.add(exports.parameters.remainingPath, components.remainingPath());
            parameterValues.get(parameter, callback);
        }
    };
};

exports.useController = function(controller) {
    var controllerParameters = Array.prototype.slice.call(arguments, 1);
    return exports.parameters.composite(controllerParameters, function(controllerParameterValues, callback) {
        callback.ok(function(respond) {
            var controllerArguments = controllerParameterValues.concat(respond);
            controller.apply(undefined, controllerArguments);
        });
    });
};

exports.then = function(parameter) {
    var subMatchers = Array.prototype.slice.call(arguments, 1);
    if (Object.prototype.toString.call(parameter) === "[object String]") {
        parameter = exports.parameters.string(parameter);   
    }
    return {
        match: function(components, parameterValues, resultCallback) {
            parameter.match(components.peek(), {
                ok: function(value) {
                    parameterValues.add(parameter, value);
                    components.next();
                    
                    exports.firstOf.apply(undefined, subMatchers).match(components, parameterValues, {
                        ok: resultCallback.ok,
                        notFound: resultCallback.notFound,
                        unmatched: resultCallback.notFound,
                        error: resultCallback.error
                    });
                },
                notFound: resultCallback.notFound,
                unmatched: resultCallback.unmatched,
                error: resultCallback.error
            });
        }
    };
};

var nextParameterId = (function() {
    var id = 1;
    return function() {
        return id++;
    };
})();

exports.parameters = {};

exports.parameters.remainingPath = {
    id: nextParameterId()
};

exports.parameters.buildPathParameter = function(matcher) {
    return {
        id: nextParameterId(),
        match: matcher
    };
};

exports.parameters.string = function(str) {
    return exports.parameters.buildPathParameter(function(component, resultCallback) {
        status: component === str ? resultCallback.ok() : resultCallback.unmatched();
    });
};

exports.parameters.regex = function(regex) {
    return exports.parameters.buildPathParameter(function(component, resultCallback) {
        var regexResult = regex.exec(component);
        if (regexResult !== null && regexResult.index === 0 && regexResult[0] === component) {
            resultCallback.ok(component);
        } else {
            resultCallback.unmatched();
        }
    });
};

exports.parameters.convert = function(baseParameter, func) {
    return exports.parameters.buildPathParameter(function(component, resultCallback) {
        baseParameter.match(component, {
            ok: function(value) {
                func(value, resultCallback);
            },
            notFound: resultCallback.notFound,
            unmatched: resultCallback.unmatched,
            error: resultCallback.error
        });
    });
};

exports.parameters.composite = function(parameters, parameterBuilder) {
    var isArray = Array.isArray(parameters);
    if (!isArray) {
        var parameters = Array.prototype.slice.call(arguments, 0, arguments.length - 1);
        var parameterBuilder = arguments[arguments.length - 1];
    }
    return {
        id: nextParameterId(),
        buildFromParameters: function(parameterValues, resultCallback) {
            async.map(parameters, function(parameter, callback) {
                var unmatched = function() {
                    callback(null, {matched: false});
                };
                parameterValues.get(parameter, {
                    ok: function(value) {
                        callback(null, {matched: true, value: value});
                    },
                    notFound: unmatched,
                    unmatched: unmatched,
                    error: function(err) {
                        callback(err);
                    }
                });
            }, function(err, requiredParameterResults) {
                if (err) {
                    resultCallback.error(err);
                } else {
                    if (requiredParameterResults.some(function(result) { return !result.matched; })) {
                        resultCallback.notFound();
                    } else {
                        var requiredParameterValues = requiredParameterResults.map(function(result) {
                            return result.value;
                        });
                        if (isArray) {
                            parameterBuilder(requiredParameterValues, resultCallback);
                        } else {
                            parameterBuilder.apply(undefined, requiredParameterValues.concat([resultCallback]));
                        }
                    }
                }
            });
        }
    };
};

exports.parameters.injectable = function(parameter) {
    var dependencyKeys = Array.prototype.slice.call(arguments, 1);
    
};
