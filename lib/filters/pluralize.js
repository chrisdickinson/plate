var length = require('plate/filters/length').length;

exports.pluralize = function(callback, input, plural) {
  plural = (plural || 's').split(',');
  var suffix,
      val = Number(input);

  if(val === 1) {
    suffix = plural.length > 1 ? plural[0] : '';    
  } else {
    suffix = plural[plural.length-1];
  }
  callback(null, suffix);
};
