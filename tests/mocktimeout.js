module.exports = function mocktimeout(fn) {
  return function(assert) {
    var sto = setTimeout
    setTimeout = function(_fn) {
      _fn()
    }
    try {
      fn.apply(this, [].slice.call(arguments))
    } finally {
      setTimeout = sto
      assert.end()
    }
  }
}
