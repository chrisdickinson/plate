var add = function(callback, input, value) {
    callback(null, parseInt(input, 10) + parseInt(value, 10));
};

exports.add = add;
