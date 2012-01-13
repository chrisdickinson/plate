exports.truncatechars = function(callback, input, n) {
  var str = input.toString(),
      num = parseInt(n, 10);

  if(isNaN(num)) callback(null, input);
  callback(null, input.slice(0, num)+'...');
};
