var getGlobalObject, exportsObject;

try {
    exportsObject = exports;
    getGlobalObject = require('../namespace').getGlobalObject;
} catch(err) {}

(function(global) {
    var dictsort = function(callback, input, key) {
        callback(null, input.sort(function(x, y) {
            if(x[key] > y[key]) return 1;
            if(x[key] == y[key]) return 0;
            if(x[key] < y[key]) return -1;
        }));
    };

    var dictsortreversed = function(callback, input, key) {
        dictsort(function(err, result) {
            if(err) { 
                callback(err, null);
            } else {
                callback(null, result.reverse()); 
            }
        }, input, key);
    };

    var exporter = global.getExporter('filters.dictsort');
    exporter("dictsort", dictsort);
    exporter("dictsortreversed", dictsortreversed);
})(getGlobalObject('plate', exportsObject));
