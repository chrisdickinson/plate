exports.get_digit = function(callback, input, digit) {
  var isNum = !isNaN(parseInt(input, 10)),
      str = input.toString(),
      len = str.split('').length;

  digit = parseInt(digit, 10);
  if(isNum && !isNaN(digit) && digit <= len) {
    callback(null, str.charAt(len - digit));
  } else {
    callback(null, input);
  }
};
