var plainTextToHtml = require("blog/textFormat").plainTextToHtml;

exports.emptyStringIsConvertedToEmptyString = function(test) {
    test.equal("", plainTextToHtml(""));
    test.done();
};

exports.singleParagraphWithSingleNewlinesIsWrappedInParagraphTags = function(test) {
    test.equal("<p>Hello\nthere</p>", plainTextToHtml("Hello\nthere"));
    test.done();
};

exports.doubleNewlinesSeparateParagraphs = function(test) {
    test.equal("<p>Hello there.</p><p>Great article!</p>", plainTextToHtml("Hello there.\n\nGreat article!"));
    test.done();
};

exports.multipleNewLinesWithWhitespaceIsTreatedAsParagraphSeparator = function(test) {
    test.equal("<p>Hello there.</p><p>Great article!</p>", plainTextToHtml("Hello there.\n  \n  \nGreat article!"));
    test.done();
};

exports.outputIsHtmlEscaped = function(test) {
    test.equal('<p>Vic &amp; Bob&lt;script src=&quot;evil&quot;&gt;</p>', plainTextToHtml('Vic & Bob<script src="evil">'));
    test.done();
};

exports.newLinesOfDifferentFormatsAreConverted = function(test) {
    test.equal("<p>Hello there.</p><p>Great article!</p>", plainTextToHtml("Hello there.\r\n\r\nGreat article!"));
    test.equal("<p>Hello there.</p><p>Great article!</p>", plainTextToHtml("Hello there.\r\rGreat article!"));
    test.done();
};
