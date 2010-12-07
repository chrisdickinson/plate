var utils = require('plate/utils');

exports.urlizetrunc = function(callback, input, len) {
  var str = input.toString();
  len = parseInt(len, 10) || 1000;
  callback(null, new utils.SafeString(str.replace(/(((http(s)?:\/\/)|(mailto:))([\w\d\-\.:@])+)/g, function() {
    var ltr = arguments[0].length > len ? arguments[0].slice(0, len) + '...' : arguments[0];
    return '<a href="'+arguments[0]+'">'+ltr+'</a>'; 
  })));
};

