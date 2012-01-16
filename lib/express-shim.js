var express = require('express')
  , http = require('http')
  , res = http.ServerResponse.prototype
  , EE = require('events').EventEmitter

var original_render = res._render

res._render = function(view, opts, fn, parent, sub) {
  var self = this

  return original_render.call(this, view, opts, wrapped, parent, sub)

  function wrapped(err, value) {
    if(value instanceof EE) {
      value.on('error', process)
      value.on('data',  process.bind(null, null))
    } else {
      process(err, value)
    }

    function process(err, html) {
      if(fn) {
        try { fn(err, html) } catch(e) { self.req.next(e) }
      } else {
        err ?
          self.req.next(err) :
          self.send(html)
      }
    }
  }
}

module.exports = function(str, options) {
  var plate = require('plate')
    , tpl = new plate.Template(str)

  return function(context) {
    var ee = new EE
    process.nextTick(tpl.render.bind(tpl, context, function(err, html) {
      err ? 
        ee.emit('error', err) :
        ee.emit('data',  html)
    }))
    return ee
  } 
}
