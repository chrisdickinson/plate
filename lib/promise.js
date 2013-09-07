module.exports = Promise

function Promise() {
  this.trigger = null
}

var cons = Promise
  , proto = cons.prototype

proto.resolve = function(value) {
  var trigger = this.trigger

  if(!value || value.constructor !== cons) {
    return trigger(value)
  }

  value.once('done', trigger)
}

proto.once = function(ev, fn) {
  this.trigger = fn
}

cons.toPromise = function(fn) {
  return function promisified() {
    var args = [].slice.call(arguments)
      , promise = new cons
      , self = this

    args.push(onready)

    setTimeout(bang, 0)

    return promise

    function bang() {
      fn.apply(self, args)
    }

    function onready(err, data) {
      promise.resolve(data)
    }
  }
}
