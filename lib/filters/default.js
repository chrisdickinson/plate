exports._default = function(callback, input, def) {
    input ? callback(null, input) : callback(null, def);
};
