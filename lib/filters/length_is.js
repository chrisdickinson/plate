var length = require('plate/filters/length').length;

exports.length_is = function(callback, input, expected) {
  length(function(err, val) {
    callback(err, parseInt(val, 10) === parseInt(expected, 10));
  }, input);
};
