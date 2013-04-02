module.exports = FilterNode

var Promise = require('./promise')
  , debug = require('./debug')

function FilterNode(filter) {
  this.filter = filter
}

var cons = FilterNode
  , proto = cons.prototype

cons.escape = escapeHTML

proto.render = safely(function(context) {
  var self = this
    , result = self.filter.resolve(context)
    , promise

  if(result === undefined)
    return ''

  if(result && result.constructor === Promise) {
    promise = new Promise

    result.once('done', function(result) {
      promise.resolve(self.format(result))
    })

    return promise
  }

  return self.format(result)
})

proto.format = function(result) {
  if(result && result.safe) {
    return result.toString()
  }

  if(result === null || result === undefined)
    return ''

  return escapeHTML(result+'')
}

function safely(fn) {
  return function(context) {
    try {
      return fn.call(this, context)
    } catch(err) {
      debug.info(err) 
      return ''
    }
  }
}

function escapeHTML(str) {
  return str
    .replace(/\&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
