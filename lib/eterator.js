
var clear_stack = function(fn) { return setTimeout(fn, 0) }

exports.eterator = function(list) {
  var _l = list.slice()
    , total = _l.length;
  var ret = function(block) {
    block.current = function() {
      return total - _l.length
    }
    block.next = function() {
      if(_l.length) {
        var next = _l.shift();
        clear_stack(function() { block(next) })
      } else {
        block.done();
      }
    };
    block.done = function() {
      ret.finish();
    };

    clear_stack(block.next)
  };
  ret.on_ready = function(ready) {
    ret.finish = ready;
  };
  return ret;
};

exports.parallel = function(list, ready) {
  var _l = list.slice(),
      expecting = _l.length,
      accum = [],
      seen = 0;

  var collect = function(idx, err, data) {
    if(err) {
      // quit the second an error occurs
      // prevent error events from recalling `ready`
      ready(err);
      collect = function(){}
    } else {
      ++seen;
      accum[idx] = data;
      if(seen === expecting) {
        ready(null, accum)
      }
    }
  };

  return function(fn) {
    for(var i = 0, len = _l.length; i < len; ++i) {
      (function(node, idx) {
        fn(node, function(err, data) {
          collect(idx, err, data);
        }, idx); 
      })(_l[i], i) 
    }
    if(_l.length === 0)
      ready(null, [])
  };
};
