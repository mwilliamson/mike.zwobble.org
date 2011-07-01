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
                callback(null, parameters[parameter.id]);
            } else if (parameter.buildFromParameters) {
                parameter.buildFromParameters(self, callback);
            } else {
                callback(new Error("Could not get requested parameter"));
            }
        },
        getAll: function() {
            var parametersToGet = Array.prototype.slice.call(arguments, 0, arguments.length - 1);
            var callback = arguments[arguments.length - 1];
            
            async.map(parametersToGet, function(parameter, callback) {
                self.get(parameter, callback)
            }, function(err, parameterValues) {
                if (err) {
                    callback(err);
                } else {
                    callback.apply(undefined, [null].concat(parameterValues));
                }
            });
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
                } else {
                    callback(null, result.value);
                }
            });
        }
    };
};

exports.firstOf = function() {
    var subMatchers = Array.prototype.slice.call(arguments, 0);
    return {
        match: function(components, parameters, callback) {
            async.forEachSeries(subMatchers, function(subMatcher, tryNextSubMatcher) {
                subMatcher.match(components, parameters, function(err, result) {
                    if (err) {
                        callback(err);
                    } else if (result.matched) {
                        callback(null, result);
                    } else {
                        tryNextSubMatcher();
                    }
                });
            }, function() {
                callback(null, {matched: false});
            });
        }
    };
};

exports.end = function(func) {
    return {
        match: function(components, parameters, callback) {
            if (components.hasNext()) {
                callback(null, {
                    matched: false
                });
            } else {
                func(parameters, function(err, value) {
                    callback(err, {
                        matched: true,
                        value: value
                    });
                });
            }
        }
    };
};

exports.then = function(parameter) {
    var subMatchers = Array.prototype.slice.call(arguments, 1);
    if (Object.prototype.toString.call(parameter) === "[object String]") {
        parameter = exports.parameters.string(parameter);   
    }
    return {
        match: function(components, parameters, callback) {
            parameter.match(components.peek(), function(err, matchResult) {
                if (matchResult.matched) {
                    parameters.add(parameter, matchResult.value);
                    components.next();
                    
                    exports.firstOf.apply(undefined, subMatchers).match(components, parameters, callback);
                } else {
                    callback(null, {matched: false});
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

exports.parameters.buildPathParameter = function(matcher) {
    return {
        id: nextParameterId(),
        match: matcher
    };
};

exports.parameters.string = function(str) {
    return exports.parameters.buildPathParameter(function(component, callback) {
        callback(null, {matched: component === str});
    });
};

exports.parameters.regex = function(regex) {
    return exports.parameters.buildPathParameter(function(component, callback) {
        var regexResult = regex.exec(component);
        if (regexResult !== null && regexResult.index === 0 && regexResult[0] === component) {
            callback(null, {matched: true, value: component});
        } else {
            callback(null, {matched: false});
        }
    });
};

exports.parameters.convert = function(baseParameter, func) {
    return exports.parameters.buildPathParameter(function(component, callback) {
        baseParameter.match(component, function(err, result) {
            if (err) {
                callback(err);
            } else if (result.matched) {
                func(result.value, callback);
            } else {
                callback(null, result);
            }
            
        });
    });
};

exports.parameters.composite = function(buildFromParameters) {
    return {
        id: nextParameterId(),
        buildFromParameters: buildFromParameters
    };
};
