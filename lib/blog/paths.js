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

var buildNewParameters = function() {
    var parameters = {};
    var self = {
        add: function(parameter, value) {
            parameters[parameter.id] = value;
        },
        get: function(parameter, callback) {
            if (parameter.id in parameters) {
                callback(null, {status: status.ok, value: parameters[parameter.id]});
            } else if (parameter.buildFromParameters) {
                parameter.buildFromParameters(self, callback);
            } else {
                callback(null, {status: status.notFound});
            }
        }
    };
    return self;
};

exports.navigator = function(pathMatcher) {
    return {
        navigate: function(path, callback) {
            var parameters = buildNewParameters();
            pathMatcher.match(buildComponentsFromPath(path), parameters, function(err, result) {
                if (err) {
                    callback(err);
                } else if (result.status === status.ok) {
                    callback(null, {matched: true, value: result.value});
                } else {
                    callback(null, {matched: false});
                }
            });
        }
    };
};

exports.firstOf = function() {
    var subMatchers = Array.prototype.slice.call(arguments, 0);
    return {
        match: function(components, parameterValues, callback) {
            async.forEachSeries(subMatchers, function(subMatcher, tryNextSubMatcher) {
                subMatcher.match(components, parameterValues, function(err, result) {
                    if (err) {
                        callback(err);
                    } else if (result.status !== status.unmatched) {
                        callback(null, result);
                    } else {
                        tryNextSubMatcher();
                    }
                });
            }, function() {
                callback(null, {status: status.unmatched});
            });
        }
    };
};

exports.end = function(parameter) {
    return {
        match: function(components, parameterValues, callback) {
            if (components.hasNext()) {
                callback(null, {status: status.unmatched});
            } else {
                if (parameter) {
                    parameterValues.get(parameter, callback);
                } else {
                    callback(null, {status: status.ok});
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
        callback(null, {status: status.ok, value: function(respond) {
            var controllerArguments = controllerParameterValues.concat(respond);
            controller.apply(undefined, controllerArguments);
        }});
    });
};

exports.then = function(parameter) {
    var subMatchers = Array.prototype.slice.call(arguments, 1);
    if (Object.prototype.toString.call(parameter) === "[object String]") {
        parameter = exports.parameters.string(parameter);   
    }
    return {
        match: function(components, parameterValues, callback) {
            parameter.match(components.peek(), function(err, matchResult) {
                if (err) {
                    callback(err);
                } else if (matchResult.status === status.ok) {
                    parameterValues.add(parameter, matchResult.value);
                    components.next();
                    
                    exports.firstOf.apply(undefined, subMatchers).match(components, parameterValues, function(err, result) {
                        if (err) {
                            callback(err);
                        } else if (result.status !== status.ok) {
                            callback(null, {status: status.notFound});
                        } else {
                            callback(err, result);
                        }
                    });
                } else {
                    callback(null, {status: status.unmatched});
                }
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

var status = exports.parameters.status = {
    ok: 200,
    notFound: 404,
    unmatched: 0
};

exports.parameters.buildPathParameter = function(matcher) {
    return {
        id: nextParameterId(),
        match: matcher
    };
};

exports.parameters.string = function(str) {
    return exports.parameters.buildPathParameter(function(component, callback) {
        callback(null, {status: component === str ? status.ok : status.unmatched});
    });
};

exports.parameters.regex = function(regex) {
    return exports.parameters.buildPathParameter(function(component, callback) {
        var regexResult = regex.exec(component);
        if (regexResult !== null && regexResult.index === 0 && regexResult[0] === component) {
            callback(null, {status: status.ok, value: component});
        } else {
            callback(null, {status: status.unmatched});
        }
    });
};

exports.parameters.convert = function(baseParameter, func) {
    return exports.parameters.buildPathParameter(function(component, callback) {
        baseParameter.match(component, function(err, result) {
            if (err) {
                callback(err);
            } else if (result.status === status.ok) {
                func(result.value, callback);
            } else {
                callback(null, result);
            }
            
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
        buildFromParameters: function(parameterValues, callback) {
            async.map(parameters, function(parameter, callback) {
                parameterValues.get(parameter, callback);
            }, function(err, requiredParameterResults) {
                if (err) {
                    callback(err);
                } else {
                    if (requiredParameterResults.some(function(result) { return result.status !== status.ok; })) {
                        callback(null, {status: status.notFound});
                    } else {
                        var requiredParameterValues = requiredParameterResults.map(function(result) {
                            return result.value;
                        });
                        if (isArray) {
                            parameterBuilder(requiredParameterValues, callback);
                        } else {
                            parameterBuilder.apply(undefined, requiredParameterValues.concat([callback]));
                        }
                    }
                }
            });
        }
    };
};
