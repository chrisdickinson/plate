var nodes = require('plate/nodes'),
    NodeList = nodes.NodeList;

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

var createBaseResolver = function(content) {
    if({'"':true, "'":true}[content.charAt(0)]) {
        return function(context) {
            return function(args, callback) {
                callback(null, content.slice(1, -1));
            };
        };
    } else if(/^[\d\.]*$/.test(content)) {
        return function(context) { 
            return function(args, callback) {
                var asNum = new Number(content);
                callback(null, asNum.valueOf());
            };
        };
    } else {
        var pieces = content.split('.');
        return function(context) {
            return function(args, callback) {
                var index = -1,
                    length = pieces.length,
                    current = context,
                    eterator = function(err, data) {
                        var callee = arguments.callee;
                        if(err) {
                            callback(err, null);
                        } else try {
                            ++index;
                            current = data;
                            if(index < length) {
                                var piece = pieces[index] == 'super' ? '_super' : pieces[index];
                                var next = current[piece];
                                if(next !== undefined && next !== null) {
                                    if(typeof(next) === 'function') {
                                        next = Function.prototype.apply.call(next, current, [callback]);
                                        if(next !== undefined && typeof(next) !== 'function') {
                                            callee(null, next);
                                        }
                                    } else {
                                        callee(null, next);
                                    }
                                } else {
                                    callback(null, null);
                                } 
                            } else {
                                callback(null, current);
                            }
                        } catch(e) {
                            callback(e, null);
                        }
                    };
                eterator(null, context);
            };
        }; 
    }
};

var createFilterResolver = function(filter_fn, args) {
    return function(context) {
        return function(input, callback) {
            // we have to iterate over all of the argument filters
            // and once we've done that, we can call the filter_fn
            var args_out = [];
            var length = args.length,
                index = -1,
                eterator = function(err, data) {
                    var callee = arguments.callee;
                    if(err) {
                        callback(err, null);                
                    } else try {
                        args_out.push(data);
                        ++index;
                        if(index < length) {
                            args[index](context, callee);
                        } else {
                            args_out.unshift(callback);
                            filter_fn.apply({}, args_out);
                        }
                    } catch(e) {
                        callback(e, null);
                    }
                };
            eterator(null, input);
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
            var index = -1,
                length = filter_chain.length,
                eterator = function(err, data) {
                    var callee = arguments.callee;
                    if(err) {
                        callback(err, null);
                    } else {
                        ++index;

                        if(index < length) {
                            filter_chain[index](context)(data, callee);
                        } else {
                            callback(null, data);
                        }
                    }
                };
            eterator(null, null);
        };
    return resolve;
};

exports.Parser = Parser;
