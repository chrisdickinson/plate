var _default = function(callback, input, def) {
    input ? callback(null, input) : callback(null, def);
};

exports._default = _default;
