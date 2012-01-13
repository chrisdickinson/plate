var exp = function(data) {
  for(var key in data)
    exports[key] = data[key]
}

exp(require('./filters'))
exp(require('./tags'))
exp(require('./plugins'))
exp(require('./plate'))
