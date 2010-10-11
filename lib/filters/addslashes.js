var addslashes = function(callback, input) {
    callback(null, input.toString().replace(/'/g, "\\'"));
};

exports.addslashes = addslashes;
