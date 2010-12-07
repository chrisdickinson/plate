exports.length = function(callback, input) {
  var cb = input.length instanceof Function ? input.length : function(lambda) {
    lambda(null, input.length);
  };
  cb.apply(input, [function(err, len) {
    callback(null, len);
  }]);
};
