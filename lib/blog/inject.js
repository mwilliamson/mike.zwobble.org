var async = require("async");

exports.newInjector = function() {
    var bindings = {};
    
    var dependencyStackLine = function(dependencyStack) {
        return "  " + dependencyStack.length + ") " + dependencyStack[dependencyStack.length - 1];
    };
    
    var noBindingError = function(key) {
        var dependencyStack = [key];
        var error = new Error("No binding for " + key + "\nDependency stack:\n" + dependencyStackLine(dependencyStack));
        error.dependencyStack = dependencyStack;
        return error;
    };
    
    var updateIfBindingError = function(error, key) {
        if ("dependencyStack" in error) {
            error.dependencyStack.push(key);
            error.message += "\n" + dependencyStackLine(error.dependencyStack);
        }
        return error;
    };
    
    var self = {
        bind: function(key) {
            return {
                toProvider: function() {
                    bindings[key] = {
                        dependencyKeys: Array.prototype.slice.call(arguments, 0, arguments.length - 1),
                        provider: arguments[arguments.length - 1]
                    };
                },
                toConstant: function(value) {
                    bindings[key] = {
                        dependencyKeys: [],
                        provider: function(callback) {
                            callback(null, value);
                        }
                    };
                }
            };
        },
        get: function(key, callback) {
            if (key in bindings) {
                var binding = bindings[key];
                async.map(binding.dependencyKeys, self.get, function(err, dependencies) {
                    if (err) {
                        updateIfBindingError(err, key);
                        callback(err);
                    } else {
                        var providerArguments = dependencies.concat([callback]);
                        binding.provider.apply(undefined, providerArguments);
                    }
                });
            } else {
                callback(noBindingError(key));
            }
        }
    };
    self.bind("injector").toConstant(self);
    return self;
};