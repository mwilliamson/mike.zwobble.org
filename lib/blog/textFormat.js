var dust = require("dust");

exports.plainTextToHtml = function(text) {
    var isNotEmptyString = function(str) {
        return str !== "";
    };
    return text
        .split(/\n\s*\n/)
        .filter(isNotEmptyString)
        .map(function(paragraph) {
            return "<p>" + dust.escapeHtml(paragraph) + "</p>";
        }).join("");
};
