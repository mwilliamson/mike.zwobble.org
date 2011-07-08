var dateformat = require("dateformat");

exports.formatDateTime = function(date) {
    return dateformat(date, "dddd d mmmm yyyy HH:MM", true) + " UTC";
};

exports.formatDate = function(date) {
    return dateformat(date, "dddd d mmmm yyyy", true);
};

exports.formatYearMonth = function(yearMonth) {
    return dateformat(
        new Date(Date.UTC(yearMonth.year, yearMonth.month, 1)),
        "mmmm yyyy",
        true
    );
};
