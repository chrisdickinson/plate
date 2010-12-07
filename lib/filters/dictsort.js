exports.dictsort = function(callback, input, key) {
    callback(null, input.sort(function(x, y) {
        if(x[key] > y[key]) return 1;
        if(x[key] == y[key]) return 0;
        if(x[key] < y[key]) return -1;
    }));
};
