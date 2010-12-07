exports.slice = function(callback, input, by) {
  by = by.toString();
  if(by.charAt(0) === ':') {
    by = '0'+by; 
  }
  if(by.charAt(by.length-1) === ':') {
    by = by.slice(0, -1);
  }

  var splitBy = by.split(':'),
    slice = input.slice || (function() {
      input = this.toString();
      return input.slice;
    })();

  callback(null, slice.apply(input, splitBy));
};
