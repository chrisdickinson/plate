exports.divisibleby = function(callback, input, num) {
    callback(null, input % parseInt(num, 10) == 0);
};
