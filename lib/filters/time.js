var time_format = require('../date').time

module.exports = function(input, value) {
  if (value === null)
    value = 'H:M:S'

  return time_format(input, value)
}
