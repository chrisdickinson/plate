var escape = require('./escape')
  , safe = require('./safe')

module.exports = function(input) {
  var str = input.toString()
    , out = []
    , paras
    , brs

  paras = str.split('\n\n')

  while(paras.length) {
    brs = paras.pop().split('\n')

    for(var i = 0, len = brs.length; i < len; ++i) {
      brs[i] = escape(brs[i])
    }

    out.unshift(brs.join('<br />'))
  }

  return safe('<p>' + out.join('</p><p>') + '</p>')
}
