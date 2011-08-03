var dust = require("dust");

exports.plainTextToHtml = function(text) {
    var isNotEmptyString = function(str) {
        return str !== "";
    };
    return text
        .replace(/\r\n/g, "\n")
        .replace(/\r/g, "\n")
        .split(/\n\s*\n/)
        .filter(isNotEmptyString)
        .map(function(paragraph) {
            return "<p>" + dust.escapeHtml(paragraph) + "</p>";
        }).join("");
};
