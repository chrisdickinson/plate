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

var createStringResolver = function(content) {
    return function(context) { return function(args, callback) { callback(null, content); }; };
};

var createNumberResolver = function(content) {
    return function(context) { return function(args, callback) { callback(null, new Number(content).valueOf()); }; };
};

var createContextResolver = function(pieces) {
    return function(context) {
        return function(args, ready) {
            var okay = function(x) { return x !== undefined && x !== null; },
                callable = function(fn) {
                    return typeof(fn) === 'function';
                },
                eter = eterator(pieces),
                current = context,
                error,
                it;

            eter.on_ready(function() {
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
                                  current = data;
                                  it.next();
                              }  
                          });

                          // if it didn't return undefined or null, it's okay to continue, and we store the return value in ``current``.
                          if(okay_continue=okay(ret)) {
                              current = ret;
                          }
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
                it;

            eter.on_ready(function() {
                error ? 
                    callback(error, null) :
                    callback(null, value);
            });

            eter(it=function(filtervar) {
                filtervar(context)(value, function(err, data) {
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

    resolve.original = content;
    return resolve;
};

exports.Parser = Parser;
