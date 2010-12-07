exports.wordwrap = function(callback, input, len) {
  var words = input.toString().split(/\s+/g),
      out = [],
      len = parseInt(len, 10) || words.length;

  while(words.length) {
    out.unshift(words.splice(0, len).join(' '));
  };
  callback(null, out.join('\n'));
};
