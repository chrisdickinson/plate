exports.last = function(callback, input) {
  var cb = input.charAt || function(ind) { return input[ind]; };
  callback(null, cb.call(input, input.length-1));
};
