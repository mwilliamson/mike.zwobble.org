var slugify = require("blog/slugs").slugify;

exports.slugifyLeavesNumbersAndLowerCaseCharactersAndHyphensUnchanged = function(test) {
    test.equal("post-1", slugify("post-1"));
    test.done();
};

exports.slugifyConvertsUpperCaseCharactesrToLowerCase = function(test) {
    test.equal("post-1", slugify("Post-1"));
    test.done();
};

exports.slugifyConvertsSpacesToHyphens = function(test) {
    test.equal("post-1", slugify("post 1"));
    test.done();
};

exports.runsOfSpacesAreConvertedToASingleHypen = function(test) {
    test.equal("post-1", slugify("post \t\t    1"));
    test.done();
};

exports.runsOfPunctuationAreConvertedToSingleHyphen = function(test) {
    test.equal("post-1", slugify("post -- 1"));
    test.done();
};

exports.leadingAndTrailingHyphensAreRemoved = function(test) {
    test.equal("dragon", slugify(" Dragon?!"));
    test.done();
};



