exports.slugify = function(callback, input) {
  input = input.toString();
  callback(null, input.replace(/[^\w\s\d\-]/g, '').replace(/^\s*/, '').replace(/\s*$/, '').replace(/[\-\s]+/g, '-').toLowerCase());
};
