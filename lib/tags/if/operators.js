var InfixOperator = require('./infix')
  , PrefixOperator = require('./prefix')

var keys

keys = Object.keys || keyshim

function keyshim(obj) {
  var accum = []

  for(var n in obj) if(obj.hasOwnProperty(n)) {
    accum.push(n)
  }

  return accum
}

module.exports = {
    'or': function() {
      return new InfixOperator(6, function(x, y) {
          return x || y
      })
    }

  , 'and': function() {
      return new InfixOperator(7, function(x, y) {
          return x && y
      })
    }

  , 'not': function() {
      return new PrefixOperator(8, function(x) {
        return !x
      })
    }

  , 'in': function() {
      return new InfixOperator(9, in_operator)
    }

  , 'not in': function() {
    return new InfixOperator(9, function(x, y) {
      return !in_operator(x,y)
    })
  }

  , '=': function() {
    return new InfixOperator(10, function(x, y) { 
      return x == y
    })
  }

  , '==': function() {
      return new InfixOperator(10, function(x, y) { 
        return x == y
      })
    }

  , '!=': function() {
      return new InfixOperator(10, function(x, y) { 
        return x !== y
      })
    }

  , '>': function() {
      return new InfixOperator(10, function(x, y) { 
        return x > y
      })
    }

  , '>=': function() {
      return new InfixOperator(10, function(x, y) { 
        return x >= y
      })
    }

  , '<': function() {
      return new InfixOperator(10, function(x, y) { 
        return x < y
      })
    }

  , '<=': function() {
      return new InfixOperator(10, function(x, y) { 
        return x <= y
      })
    }
}

function in_operator(x, y) {
  if(!(x instanceof Object) && y instanceof Object) {
    if(!(y && 'length' in y)) {
      y = keys(y)
    }
  }

  if(typeof(x) == 'string' && typeof(y) =='string') {
    return y.indexOf(x) !== -1
  }

  if(x === undefined || x === null)
    return false

  if(y === undefined || y === null)
    return false

  for(var found = false, i = 0, len = y.length; i < len && !found; ++i) {
    var rhs = y[i]
    if(x instanceof Array) {
      for(var idx = 0,
        equal = x.length == rhs.length,
        xlen = x.length;
        idx < xlen && equal; ++idx) {

        equal = (x[idx] === rhs[idx])
      }
      found = equal

    } else if(x instanceof Object) {
      if(x === rhs) {
        return true
      }
      var xkeys = keys(x),
        rkeys = keys(rhs)

      if(xkeys.length === rkeys.length) { 
        for(var i = 0, len = xkeys.length, equal = true;
          i < len && equal;
          ++i) {
          equal = xkeys[i] === rkeys[i] &&
              x[xkeys[i]] === rhs[rkeys[i]]
        }
        found = equal
      } 
    } else {
      found = x == rhs
    }
  }
  return found
}
