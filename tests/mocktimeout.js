var world = typeof global !== 'undefined' ? global : this 

module.exports = function mocktimeout(fn) {
  return function(assert) {
    var sto = world.setTimeout
    world.setTimeout = function(_fn) {
      _fn()
    }
    try {
      fn.apply(this, [].slice.call(arguments))
    } finally {
      world.setTimeout = sto
      assert.end()
    }
  }
}
