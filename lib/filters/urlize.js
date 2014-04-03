var safe = require('./safe')
var url_finder = require('../url_finder')

module.exports = function(input) {
  return safe(url_finder(input, function() {
    return '<a href="'+arguments[0]+'">'+arguments[0]+'</a>';
  }))
}
