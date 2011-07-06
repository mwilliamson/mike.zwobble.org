var async = require("async");

exports.newInjector = function(subInjector) {
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
    
    var callWithDependencies = function(key, func, dependencyKeys, callback) {
        async.map(dependencyKeys, self.get, function(err, dependencies) {
            if (err) {
                updateIfBindingError(err, key);
                callback(err);
            } else {
                var providerArguments = dependencies.concat([callback]);
                func.apply(undefined, providerArguments);
            }
        });
    };
    
    var self = {
        isBound: function(key) {
            return key in bindings;
        },
        bind: function(key) {
            var bindingObject = {
                toProvider: function(provider) {
                    bindings[key] = {
                        dependencyKeys: Array.prototype.slice.call(arguments, 1),
                        provider: provider
                    };
                    return bindingObject;
                },
                toSyncProvider: function(provider) {
                    bindings[key] = {
                        dependencyKeys: Array.prototype.slice.call(arguments, 1),
                        provider: function() {
                            var callback = arguments[arguments.length - 1];
                            var providerArguments = Array.prototype.slice.call(arguments, 0, arguments.length - 1);
                            callback(null, provider.apply(undefined, providerArguments));
                        }
                    };
                    return bindingObject;
                },
                toConstant: function(value) {
                    bindings[key] = {
                        dependencyKeys: [],
                        provider: function(callback) {
                            callback(null, value);
                        }
                    };
                    return bindingObject;
                },
                memoize: function() {
                    var provider = bindings[key].provider;
                    var evaluating = false;
                    var waitingCallbacks = [];
                    bindings[key].provider = function() {
                        var callback = arguments[arguments.length - 1];
                        waitingCallbacks.push(callback);
                        if (!evaluating) {
                            evaluating = true;
                            var baseProviderArguments = Array.prototype.slice.call(arguments, 0, arguments.length - 1);
                            baseProviderArguments.push(function(err, value) {
                                bindings[key] = {
                                    dependencyKeys: [],
                                    provider: function(callback) {
                                        callback(err, value);
                                    }
                                };
                                waitingCallbacks.forEach(function(waitingCallback) {
                                    waitingCallback(err, value);
                                });
                            });
                            provider.apply(null, baseProviderArguments);
                        }
                    };
                    return bindingObject;
                }
            };
            return bindingObject;
        },
        get: function(key, callback) {
            if (key in bindings) {
                var binding = bindings[key];
                callWithDependencies(key, binding.provider, binding.dependencyKeys, callback);
            } else if (subInjector !== undefined) {
                subInjector.get(key, callback);
            } else {
                callback(noBindingError(key));
            }
        },
        callFunction: function(func) {
            var dependencyKeys = Array.prototype.slice.call(arguments, 1, arguments.length - 1);
            var callback = arguments[arguments.length - 1];
            callWithDependencies("anonymous", func, dependencyKeys, callback);
        }
    };
    self.bind("injector").toConstant(self);
    return self;
};
