var length = require('plate/filters/length').length;

exports.random = function(callback, input) {
  var cb = input.charAt || function(idx) {
    return this[idx];
  };

  length(function(err, val) {
      callback(null, cb.apply(input, [Math.floor(Math.random() * val)]));
  }, input);
};
