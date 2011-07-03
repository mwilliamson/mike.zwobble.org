var dateformat = require("dateformat");

exports.formatDate = function(date) {
    return dateformat(date, "dddd d mmmm yyyy");
};

exports.formatYearMonth = function(yearMonth) {
    return dateformat(
        new Date(Date.UTC(yearMonth.year, yearMonth.month, 1)),
        "mmmm yyyy"
    );
};
