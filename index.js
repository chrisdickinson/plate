module.exports = require('./lib/index');


try {
  require('express')

  module.exports.compile = require('./lib/express-shim')
} catch(err) {
  console.error(err)

  // do nothing
}
