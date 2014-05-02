var escape = require('./escape')
  , safe = require('./safe')

module.exports = function(input) {
  var str = input.toString()
    , out = str.split('\n')

  for(var i = 0, len = out.length; i < len; ++i) {
    out[i] = escape(out[i])
  }

  return safe(out.join('<br />'))
}
