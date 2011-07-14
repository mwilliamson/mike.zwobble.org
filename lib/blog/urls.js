var decimalOfLength = function(value, length) {
    var str = value.toString();
    while (str.length < length) {
        str = "0" + str;
    };
    return str;
};

exports.yearMonthForUrl = function(yearMonth) {
    return {
        year: yearMonth.year.toString(),
        month: decimalOfLength(yearMonth.month + 1, 2)
    };
};
