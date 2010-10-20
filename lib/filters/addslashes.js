exports.addslashes = function(callback, input) {
    callback(null, input.toString().replace(/'/g, "\\'"));
};
