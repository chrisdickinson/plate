exports.wordcount = function(callback, input) {
  var str = input.toString(),
      bits = str.split(/\s+/g);
  callback(null, bits.length);
};
