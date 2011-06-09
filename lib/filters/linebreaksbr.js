var utils = require('../utils');

exports.linebreaksbr = function(callback, input) {
  var str = input.toString();
  callback(null, new utils.SafeString(str.replace(/\n/g, '<br />')));
};
