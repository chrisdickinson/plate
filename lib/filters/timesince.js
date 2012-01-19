exports.timesince = function(callback, input, n) {
  var input = new Date(input)
    , now   = n ? new Date(n) : new Date()
    , diff  = input - now
    , since = Math.abs(diff)

  if(diff > 0)
    return callback(null, '0 minutes')

  // 365.25 * 24 * 60 * 60 * 1000 === years
  var years =   ~~(since / 31557600000)
    , months =  ~~((since - (years*31557600000)) / 2592000000)
    , days =    ~~((since - (years * 31557600000 + months * 2592000000)) / 86400000)
    , hours =   ~~((since - (years * 31557600000 + months * 2592000000 + days * 86400000)) / 3600000)
    , minutes = ~~((since - (years * 31557600000 + months * 2592000000 + days * 86400000 + hours * 3600000)) / 60000)
    , result = [
        years   ? pluralize(years,    'year') : null
      , months  ? pluralize(months,   'month') : null
      , days    ? pluralize(days,     'day') : null
      , hours   ? pluralize(hours,    'hour') : null
      , minutes ? pluralize(minutes,  'minute') : null
    ]
    , out = []

  for(var i = 0, len = result.length; i < len; ++i) {
    result[i] !== null && out.push(result[i])
  }

  if(!out.length) {
    return callback(null, '0 minutes')
  }

  return callback(null, out[0] + (out[1] ? ', ' + out[1] : ''))

  function pluralize(x, str) {
    return x + ' ' + str + (x === 1 ? '' : 's')
  }
}
