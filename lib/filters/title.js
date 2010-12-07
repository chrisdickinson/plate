exports.title = function(callback, input) {
  var str = input.toString(),
      bits = str.split(/\s{1}/g),
      out = [];
  
  while(bits.length) {
    var word = bits.pop();
    word = word.charAt(0).toUpperCase() + word.slice(1);
    out.push(word);
  }
  out = out.join(' ');
  callback(null, out.replace(/([a-z])'([A-Z])/g, function() { return arguments[2].toLowerCase(); }));
};
