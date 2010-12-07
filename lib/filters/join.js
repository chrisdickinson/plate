exports.join = function(callback, input, glue) {
  input = input instanceof Array ? input : input.toString().split('');
  callback(null, input.join(glue));
};
