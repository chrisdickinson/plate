exports.capfirst = function(callback, input) {
    var str = input.toString();
    callback(null, [str.slice(0,1).toUpperCase(), str.slice(1)].join(''));
};
