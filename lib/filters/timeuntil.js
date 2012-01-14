
var timesince = require('./timesince').timesince

exports.timeuntil = function(callback, input, n) {
  var now = n ? new Date(n) : new Date()
  return timesince(callback, now, input)

}
