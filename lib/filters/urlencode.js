exports.urlencode = function(callback, input) {
  callback(null, escape(input.toString()));
};
