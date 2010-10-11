var cut = function(callback, input, value) {
    var str = input.toString();
    callback(null, str.replace(new RegExp(value, "g"), ''));
};

exports.cut = cut;
