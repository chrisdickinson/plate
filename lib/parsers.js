var nodes = require('./nodes'),
    NodeList = nodes.NodeList,
    eterator = require('./eterator').eterator;

var Parser = function(tokens, tagLib, filterLib, pluginLib) {
    this.tokens = tokens;
    this.tagLibrary = tagLib;
    this.filterLibrary = filterLib;
    this.pluginLibrary = pluginLib;
}; 

Parser.prototype.parse = function(parse_until_these) {
    var nodes_out = [],
        token = null;

    while(this.tokens.length > 0) {
        token = this.tokens.shift();
        if(token) {
            if(parse_until_these && token.isOneOf(parse_until_these)) {
                this.tokens.unshift(token);
                return new NodeList(nodes_out);
            } else {
                nodes_out.push(token.createNode(this));
            }
        }
    };
    if(parse_until_these) {
        throw new Error("Expected one of '"+parse_until_these.join("', '")+"'");
    }
    return new NodeList(nodes_out);
};

var Op = function(sync, content, resolver) {
  this.sync = sync
  this.content = content
  this.resolver = resolver || function() { return content }
}

Op.prototype.resolve = function(context, args) {
  if(this.sync) {
    return this.resolver(context, args)
  } else {
    var self = this
    return function(ready) {
      self.resolver(context, args, ready)
    }
  }
}

var LookupOp = function(content) {
  this.content = content
}

LookupOp.prototype.sync = true

LookupOp.prototype.resolve = function(context, args) {
  return context[this.content]
}

LookupOp.prototype.lift = function(varname) {
  return varname +' = '+varname+'["'+this.content+'"]'
}

var LookupCallOp = function(content) {
  this.content = content
}

var noop = function(){}

LookupCallOp.prototype.sync = true

LookupCallOp.prototype.resolve = function(context, args) {
  return context[this.content].apply(context, [noop].concat(args))
}

LookupCallOp.prototype.lift = function(varname) {
  return varname + ' = '+varname+'["'+this.content+'"](function(){})'
}

LookupAsyncCallOp = function(context) {
  this.content = content
}

LookupAsyncCallOp.prototype.sync = false

LookupAsyncCallOp.prototype.resolve = function(context, args, ready) {
  context[this.content].apply(context, [context, ready])
}

LookupAsyncCallOp.prototype.lift = function(varname) {
  return varname+'["'+this.content+'"](function(err, '+varname+') { if(err) return ready(err); '
}

var LiteralOp = function(content) {
  this.content = content
}

LiteralOp.prototype.sync = true

LiteralOp.prototype.resolve = function(context, args) {
  return this.content
}

LiteralOp.prototype.lift = function(varname) {
  return varname + ' = ' + JSON.stringify(this.content)
}


var create_ops_resolver = function(ops) {
  var is_sync = ops
                  .map(function(item) { return item.sync })
                  .reduce(function(lhs, rhs) { return lhs && rhs }, true)
    , len = ops.length
    , ret

  if(is_sync) {
    ret = function(context) {
      return function(args, ready) {
        var current = context
        for(var i = 0; i < len; ++i) {
          current = ops[i].resolve(current, args)
        }
        ready(null, current)
      }
    }
  } else {
    ret = function(context) {
      return function(args, ready) {

      }
    }
  }
  ret.sync = is_sync
  ret.lift = function() {
    var varname = 'var0000'
      , text = ['var '+varname+' = context']
      , cbcount = 0

    text = text.concat(ops.map(function(op) { 
      if(!op.sync) {
        ++cbcount        
      }
      return op.lift(varname)
    }))

    text.push('return ready(null, '+varname+')')

    for(var i = 0; i < cbcount; ++i) { text.push('})') }

    var fn = new Function('context', 'ready', text.join('\n'))

    return fn
  }

  return ret
}

var createStringResolver = function(content) {
    return function(context) { return function(args, callback) { callback(null, content, new LiteralOp(content)); }; };
};

var createNumberResolver = function(content) {
    var num = new Number(content).valueOf()
    return function(context) { return function(args, callback) { callback(null, num, new LiteralOp(num)); }; };
};

var createContextResolver = function(pieces) {
    return function base_resolver(context) {
        return function(args, ready) {
            var okay = function(x) { return x !== undefined && x !== null; },
                callable = function(fn) {
                    return typeof(fn) === 'function';
                },
                eter = eterator(pieces),
                current = context,
                error,
                ops = [],
                it;

            eter.on_ready(function() {
                if(ops.length) {
                  base_resolver.ops_resolver = create_ops_resolver(ops)
                }
                error ?
                    ready(error, null) :
                    ready(null, current);
            });

            eter(it=function(piece) {
              try {
                  var prev = current;

                  piece = piece === 'super' ? '_super' : piece;
                  current = current[piece];

                  if(!okay(current)) {
                      // this attribute ended up being undefined or null, we're out
                      it.done();
                  } else {
                      // if this attribute is okay, we check to see if it's callable or a straight-up value.
                      var okay_continue = !callable(current);

                      // it's not okay to automatically continue if we're a callable.
                      if(!okay_continue) {
                          var tmp;
                          var ret = current.call(prev, tmp=function(err, data) {
                              if(err) {
                                  // the callable emitted an error, so we store it and exit.
                                  error = err;
                                  it.done(); 
                              } else {
                                  // otherwise we get this show on the road.

                                  // async call
                                  ops.push(new LookupAsyncCallOp(piece))
                                  current = data;
                                  it.next();
                              }  
                          });

                          // if it didn't return undefined or null, it's okay to continue, and we store the return value in ``current``.
                          if(okay_continue=okay(ret)) {
                              current = ret;

                              // sync call
                              ops.push(new LookupCallOp(piece))
                          }
                      } else {
                          // sync lookup
                          ops.push(new LookupOp(piece))
                      }
                     
                      // it's okay to continue if ``current`` is scalar, or if the callable returned a scalar value.
                      if(okay_continue) {
                          it.next();
                      }
                  } 
              } catch(err) {
                  // trying to grab the next item off the list triggered an error
                  // OR calling a client callable context variable triggered an error
                  // so we store the error and exit.
                  error = err || new Error();
                  it.done();
              }
            });
        };
    };
};

var createBaseResolver = function(content) {
    if(content.charAt(0) in {'"':true, "'":true}) {
        return createStringResolver(content.slice(1,-1));
    } else if(/^[\d\.]*$/.test(content)) {
        return createNumberResolver(content);
    } else {
        return createContextResolver(content.split('.'));
    }
};

var createFilterResolver = function(filter_fn, args) {
    return function(context) {
        return function(input, ready) {
            var eter = eterator(args),
                values = [],
                error,
                it;

            eter.on_ready(function() {
              if(error) ready(error, null)
              else {
                  values = [ready, input].concat(values);
                  filter_fn.apply({}, values);
              }
            });
          
            eter(it=function(filtervar) {
                filtervar(context, function(err, data) {
                    if(err) {
                        error = err;
                        it.done();
                    } else {
                        values.push(data);
                        it.next();
                    }
                });
            });
        };
    };
};

Parser.prototype.compileFilter = function(content) {
    content = content.replace(/^\s*/g,'').replace(/\s*$/g, '');
    var self = this;
    var pipe_split = content.split('|'),
        filter_chain = (function (items) {
            var output = [],
                item_split = [];
            for(var i = 0, len = items.length; i < len; ++i) {
                item_split = items[i].split(':');
                for(var j = 1, arglen = item_split.length; j < arglen; ++j) {
                    item_split[j] = self.compileFilter(item_split[j]);
                }
                output.push(i == 0 ? 
                            createBaseResolver(item_split[0]) :
                            createFilterResolver(
                                self.filterLibrary.lookup(item_split[0]),
                                item_split.slice(1) 
                            )
                );
            }
            return output;
        })(pipe_split),
        resolve = function(context, callback) {
            var eter = eterator(filter_chain),
                error,
                value,
                all = filter_chain.length,
                it;

            eter.on_ready(function() {
                error ? 
                    callback(error, null) :
                    callback(null, value);
            });

            eter(it=function(filtervar) {
                filtervar(context)(value, function(err, data) {
                    // dynamically replace out the ops_resolver
                    if(filtervar.ops_resolver) {
                      filtervar.ops_resolver.can_lift = true
                      filter_chain[it.current()-1] = filtervar.ops_resolver
                      --all

                      if(all === 0)
                        resolve.can_lift = true
                    }

                    if(err) {
                        error = err;
                        it.done();
                    } else {
                        value = data;
                        it.next();
                    }
                });
            });
        };

    resolve.lift = function() {
      var fns = filter_chain.map(function(piece) { return piece.lift() })
        , fn = function(context, ready) {
            var eter = eterator(fns)
              , current = context
              , err = null
            eter.on_ready(function() { ready(err, current) })

            eter(it=function(fn) {
              fn(current, function(error, new_current) {
                if(error) {
                  err = error
                  current = null
                  it.done()
                } else {
                  current = new_current
                  if(it.current() === fns.length)
                    return ready(err, new_current)

                  it.next()
                }
              })
            })

          }
      fn.can_lift = false
      return fn
    }
    resolve.original = content;
    return resolve;
};

exports.Parser = Parser;
