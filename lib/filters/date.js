exports.date = function(callback, input, value) {
    if (value === null)
        value = 'N j, Y';
    callback(null, format(value, value));
}
