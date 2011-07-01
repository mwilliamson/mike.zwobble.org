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
                callback(parameters[parameter.id]);
            } else if (parameter.buildFromParameters) {
                parameter.buildFromParameters(self, callback);
            } else {
                callback();
            }
        },
        getAll: function() {
            var parametersToGet = Array.prototype.slice.call(arguments, 0, arguments.length - 1);
            var callback = arguments[arguments.length - 1];
            
            async.map(parametersToGet, function(parameter, callback) {
                self.get(parameter, function(value) {
                    callback(null, value);
                })
            }, function(err, parameterValues) {
                callback.apply(undefined, parameterValues);
            });
        }
    };
    return self;
};

exports.navigator = function(pathMatcher) {
    return {
        navigate: function(path, callback) {
            var parameters = buildNewParameters();
            pathMatcher.match(buildComponentsFromPath(path), parameters, function(result) {
                callback(result.value);
            });
        }
    };
};

exports.firstOf = function() {
    var subMatchers = Array.prototype.slice.call(arguments, 0);
    return {
        match: function(components, parameters, callback) {
            async.forEachSeries(subMatchers, function(subMatcher, tryNextSubMatcher) {
                subMatcher.match(components, parameters, function(result) {
                    if (result.matched) {
                        callback(result);
                    } else {
                        tryNextSubMatcher();
                    }
                });
            }, function() {
                callback({matched: false});
            });
        }
    };
};

exports.end = function(func) {
    return {
        match: function(components, parameters, callback) {
            if (components.hasNext()) {
                callback({
                    matched: false
                });
            } else {
                func(parameters, function(value) {
                    callback({
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
            parameter.match(components.peek(), function(matchResult) {
                if (matchResult.matched) {
                    parameters.add(parameter, matchResult.value);
                    components.next();
                    
                    exports.firstOf.apply(undefined, subMatchers).match(components, parameters, callback);
                } else {
                    callback({matched: false});
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
        callback({matched: component === str});
    });
};

exports.parameters.regex = function(regex) {
    return exports.parameters.buildPathParameter(function(component, callback) {
        var regexResult = regex.exec(component);
        if (regexResult !== null && regexResult.index === 0 && regexResult[0] === component) {
            callback({matched: true, value: component});
        } else {
            callback({matched: false});
        }
    });
};

exports.parameters.convert = function(baseParameter, func) {
    return exports.parameters.buildPathParameter(function(component, callback) {
        baseParameter.match(component, function(result) {
            if (result.matched) {
                func(result.value, callback);
            } else {
                callback(result);
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
