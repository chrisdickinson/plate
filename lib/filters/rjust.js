exports.rjust = function(callback, input, num) {
  var bits = input.toString().split(''),
      difference = num - bits.length;

  // push returns new length of array.
  while(difference > 0) difference = num - bits.unshift(' ');

  callback(null, bits.join(''));
};

