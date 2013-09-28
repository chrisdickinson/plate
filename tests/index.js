var _require = require

require('./tags')

try {
  _require('./plugins')
} catch(err) {

}

require('./plate')
require('./filters')
require('./utils')
require('./if_tag')
