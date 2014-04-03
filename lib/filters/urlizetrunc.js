var safe = require('./safe')
var url_finder = require('../url_finder')

module.exports = function(input, len) {
  len = parseInt(len, 10) || 1000
  return safe(url_finder(input, function() {
    var ltr = arguments[0].length > len ? arguments[0].slice(0, len) + '...' : arguments[0];
    return '<a href="'+arguments[0]+'">'+ltr+'</a>';
  }))
}
