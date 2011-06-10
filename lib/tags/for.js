var nodes = require('../nodes'),
    eterator = require('../eterator').eterator,
    NodeList = nodes.NodeList,
    Node = nodes.Node;

var ForNode = function(from, to, inner, outer, reversed) {
    this.from = from;
    this.to = to;
    this.inner = inner;
    this.outer = outer;
    this.reversed = reversed;
};

ForNode.prototype = new Node;
ForNode.prototype.render = function(context, callback) {
    var self = this,
        parentloop = {};

    if(context.forloop) {
        for(var name in context.forloop) if(context.forloop.hasOwnProperty(name)) {
            parentloop[name] = context.forloop[name];
        }
    }

    self.from(context, function(err, values) {
        if(err) {
            callback(err, null);
        } else {
            if(self.reversed) {
                values = [].reverse.call([].slice.call(values));
            }
            if(values && values.length) {

                var eter = eterator(values),
                    accum = [],
                    error,
                    it;

                eter.on_ready(function() {
                    error ?
                        callback(error, null) :
                        callback(null, accum.join(''));
                });

                eter(it=function(value) {
                    var ctxt = self.createContext(context, parentloop, value, accum.length, values.length);
                    self.inner.render(ctxt, function(err, data) {
                        if(err) {
                            error = err;
                            it.done();
                        } else {
                            accum.push(data);
                            it.next();
                        }
                    });
                });
            } else {
                self.outer.render(context, callback); 
            }
        }
    });
};

ForNode.prototype.createContext = function(ctxt, parentloop, values, index, length) {
    var output = ctxt.copy();
    if(this.to.length > 1) {
        for(var i = 0, len = this.to.length; i < len; ++i) {
            ctxt[this.to[i]] = values[i];
        }
    } else {
        ctxt[this.to[0]] = values;
    }

    var forLoop = {
            counter:index+1,
            counter0:index,
            revcounter:length-index,
            revcounter0:length-(index+1),
            first:index == 0,
            last:index == (length-1),
            parentloop:parentloop
        };
    ctxt.forloop = forLoop;
    return ctxt;
};

// {% for (x | x, y...) in (var) [reversed] %} 
ForNode.parse = function(contents, parser) {
    var bits = contents.replace(/\s*$/,'').split(/\s+/g),
        reversed = bits.slice(-1)[0] === 'reversed',
        in_index = (function() { 
            for(var i = 0, len = bits.length; i < len; ++i) {
                if(bits[i] == 'in') { return i; }
            }
            throw new Error("for tag must include 'in'");
        })(),
        variable_bits = bits.slice(1, in_index),
        unpack = [],
        arrayVar = parser.compileFilter(bits[in_index+1]),
        nodelist = parser.parse(['empty', 'endfor']),
        empty = new NodeList([]);


    if(parser.tokens.shift().isOneOf(['empty'])) {
        empty = parser.parse(['endfor']);
        parser.tokens.shift();
    } 

    for(var i = 0, len = variable_bits.length; i < len; ++i) {
        var innerbits = variable_bits[i].split(',');

        for(var j = 0, jlen = innerbits.length; j < jlen; ++j) {
            if(innerbits[j].length > 0) {
                unpack.push(innerbits[j]);
            }
        }
    }

    return new ForNode(arrayVar, unpack, nodelist, empty, reversed);
};

exports.ForNode = ForNode;
