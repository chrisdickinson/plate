exports.truncatewords = function(callback, input, n) {
  var str = input.toString(),
      num = parseInt(n, 10);

  if(isNaN(num)) callback(null, input);
  callback(null, input.split(/\s+/).slice(0, num).join(' ')+'...');
};
