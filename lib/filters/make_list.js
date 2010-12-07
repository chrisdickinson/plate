exports.make_list = function(callback, input) {
  input = input instanceof Array ? input : input.toString().split('');

  callback(null, input);
};
