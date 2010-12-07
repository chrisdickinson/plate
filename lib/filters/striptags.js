exports.striptags = function(callback, input) {
  var str = input.toString();
  callback(null, str.replace(/<[^>]*?>/g, ''));
};
