module.exports = Library

var Promise = require('./promise')

function Library(lib) {
  this.registry = lib || {}
}

var cons = Library
  , proto = cons.prototype

proto.lookup = errorOnNull(function(name) {
  var out = this.registry[name] || null

  if(typeof out === 'function' && out.length === 2 && name === 'loader') {
    out = Promise.toPromise(out)
  }

  return out
}, "Could not find {0}!")

proto.register = errorOnNull(function(name, item) {
  if(this.registry[name])
    return null

  this.registry[name] = item
}, "{0} is already registered!")


function errorOnNull(fn, msg) {
  return function() {
    var result = fn.call(this, arguments[0], arguments[1])
      , args = arguments

    if(result === null)
      throw new Error(msg.replace(/\{(\d+?)\}/g, function(a, m) {
        return args[+m]
      }))

    return result
  }
}

