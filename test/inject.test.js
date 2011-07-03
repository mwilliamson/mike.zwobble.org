var inject = require("blog/inject");

var sys = require("sys");

exports.canBindConstants = function(test) {
    var injector = inject.newInjector();
    injector.bind("username").toConstant("Bob");
    injector.get("username", function(err, username) {
        test.equal("Bob", username);
        test.done();
    });
};

exports.errorIfThereIsNoBindingForKey = function(test) {
    var injector = inject.newInjector();
    injector.get("username", function(err, username) {
        test.equal("No binding for username", err.message.split("\n")[0]);
        test.done();
    });
};

exports.canBindToFunctions = function(test) {
    var injector = inject.newInjector();
    injector.bind("username").toProvider(function(callback) {
        callback(null, "Bob");
    });
    injector.get("username", function(err, username) {
        test.equal("Bob", username);
        test.done();
    });
};

exports.canBindFunctionWithDependencies = function(test) {
    var injector = inject.newInjector();
    injector.bind("user").toConstant({name: "Bob"});
    injector.bind("username").toProvider(function(user, callback) {
        callback(null, user.name);
    }, "user");
    injector.get("username", function(err, username) {
        test.equal("Bob", username);
        test.done();
    });
};

exports.canBindSyncFunctionWithDependencies = function(test) {
    var injector = inject.newInjector();
    injector.bind("user").toConstant({name: "Bob"});
    injector.bind("username").toSyncProvider(function(user) {
        return user.name;
    }, "user");
    injector.get("username", function(err, username) {
        test.equal("Bob", username);
        test.done();
    });
};

exports.errorIfDependencyNotAvailable = function(test) {
    var injector = inject.newInjector();
    injector.bind("username").toProvider(function(user, callback) {
        callback(null, user.name);
    }, "user");
    injector.get("username", function(err, username) {
        test.equal("No binding for user", err.message.split("\n")[0]);
        test.done();
    });
};

exports.dependencyStackIsDescribedInErrors = function(test) {
    var injector = inject.newInjector();
    injector.bind("username").toProvider(function(user, callback) {
        callback(null, user.name);
    }, "user");
    injector.bind("first-name").toProvider(function(name, callback) {
        callback(null, name.first);
    }, "username");
    injector.get("first-name", function(err, username) {
        test.equal("No binding for user\nDependency stack:\n  1) user\n  2) username\n  3) first-name", err.message);
        test.done();
    });
};

exports.injectorIsBound = function(test) {
    var injector = inject.newInjector();
    injector.get("injector", function(err, injectorResult) {
        test.equal(injector, injectorResult);
        test.done();
    });
};

exports.canDetermineIfKeyIsBound = function(test) {
    var injector = inject.newInjector();
    injector.bind("user").toConstant({});
    test.ok(injector.isBound("user"));
    test.ok(!injector.isBound("userRepository"));
    test.done();
};
