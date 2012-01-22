exports.truncatewords = function(callback, input, n) {
  var str = input.toString(),
      num = parseInt(n, 10);

  if(isNaN(num)) return callback(null, input);
  var words = input.split(/\s+/);
  if(words.length <= num) return callback(null, input);
  callback(null, words.slice(0, num).join(' ')+'...');
};
