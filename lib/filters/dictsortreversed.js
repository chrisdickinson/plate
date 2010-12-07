var dictsort = require('plate/filters/dictsort').dictsort;

exports.dictsortreversed = function(callback, input, key) {
    dictsort(function(err, result) {
        if(err) { 
            callback(err, null);
        } else {
            callback(null, result.reverse()); 
        }
    }, input, key);
};
