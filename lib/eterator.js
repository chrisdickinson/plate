var clear_stack = function(fn) {
  setTimeout(fn, 0);
};

if(typeof(window) !== 'undefined') {

  var setZeroTimeout = function(fn) {
    window.addEventListener('message', function event_listener(ev) {
      window.removeEventListener('message', event_listener, true);

      if(ev.source === window && ev.data === 'zero-timeout') {
        ev.stopPropagation();
        try{ fn(); } catch(err) {}
      }
    }, true);

    window.postMessage('zero-timeout', '*'); 
  };

  if('postMessage' in window)
    clear_stack = setZeroTimeout;
  else
    clear_stack = function(fn){fn();};
}

exports.eterator = function(list) {
  var _l = list.slice();
  var ret = function(block) {
    block.next = function() {
      if(_l.length) {
        var next = _l.shift();
        clear_stack(function() {
          block(next);   
        });
      } else {
        block.done();
      }
    };
    block.done = function() {
      ret.finish();
    };

    clear_stack(block.next);
  };
  ret.on_ready = function(ready) {
    ret.finish = ready;
  };
  return ret;
};
