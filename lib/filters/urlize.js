var utils = require('plate/utils');

exports.urlize = function(callback, input) {
  var str = input.toString();
  callback(null, new utils.SafeString(str.replace(/(((http(s)?:\/\/)|(mailto:))([\w\d\-\.:@\/])+)/g, function() {
    return '<a href="'+arguments[0]+'">'+arguments[0]+'</a>'; 
  })));
};
