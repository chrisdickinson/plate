exports.linenumbers = function(callback, input) {
  var str = input.toString(),
      bits = str.split('\n'),
      out = [],
      len = bits.length;

  while(bits.length) out.unshift(len - out.length + '. ' + bits.pop());

  callback(null, out.join('\n'));
};
