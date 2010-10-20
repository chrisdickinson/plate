exports.dictsort = function(callback, input, key) {
    callback(null, input.sort(function(x, y) {
        if(x[key] > y[key]) return 1;
        if(x[key] == y[key]) return 0;
        if(x[key] < y[key]) return -1;
    }));
};

exports.dictsortreversed = function(callback, input, key) {
    exports.dictsort(function(err, result) {
        if(err) { 
            callback(err, null);
        } else {
            callback(null, result.reverse()); 
        }
    }, input, key);
};
