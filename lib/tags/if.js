var nodes = require('plate/nodes'),
    NodeList = nodes.NodeList,
    Node = nodes.Node;

var keys = Object.keys instanceof Function ? 
                function(obj) { return Object.keys(obj); } :
                function(obj) {
                    var accum = []; 
                    for(var n in obj) if(obj.hasOwnProperty(n)) {
                        accum.push(n);
                    }
                    return accum; 
                };

var InfixOperator = function(bp, cmp) {
    this.lbp = bp;
    this.cmp = cmp;
}; 

InfixOperator.prototype.nud = function(parser) {
    throw new Error("Unexpected token");
};

InfixOperator.prototype.led = function(lhs, parser) {
    this.first = lhs;
    this.second = parser.expression(this.lbp);
    return this;
};

InfixOperator.prototype.evaluate = function(context, callback) {
    var self = this;
    self.first.evaluate(context, function(err, x) {
        self.second.evaluate(context, function(err, y) {
            callback(err, self.cmp(x, y));
        });
    }); 
};

var PrefixOperator = function(bp, cmp) {
    this.lbp = bp;
    this.cmp = cmp;
};

PrefixOperator.prototype.nud = function(parser) {
    this.first = parser.expression(this.lbp);
    this.second = null;
    return this;
};

PrefixOperator.prototype.led = function(first, parser) {
    throw new Error("Unexpected token");
};

PrefixOperator.prototype.evaluate = function(context, callback) {
    var self = this;
    self.first.evaluate(context, function(err, x) {
        callback(err, self.cmp(x));
    });
};

var LiteralToken = function(value, original) {
    this.lbp = 0;
    this.value = value;
    this.original = original;
};

LiteralToken.prototype.toString = function() {
    return '<LiteralToken: "'+this.original+'">';
};

LiteralToken.prototype.nud = function(parser) {
    return this;
};

LiteralToken.prototype.led = function() {
    throw new Error();
};

LiteralToken.prototype.evaluate = function(context, callback) {
    this.value(context, callback);
};

var EndToken = function() {
    this.lbp = 0;
};

EndToken.prototype.nud = EndToken.prototype.led = function() { throw new Error(); }

var operators = {
    or: function() {
        return new InfixOperator(6, function(x, y) {
                return x || y;
        });
    },
    and: function() {
        return new InfixOperator(7, function(x, y) {
                return x && y;
        });
    },
    not: function() {
        return new PrefixOperator(8, function(x) {
            return !x;
        });
    },
    'in': function() {
        return new InfixOperator(9, function(x, y) {
            if(!(x instanceof Object) && y instanceof Object) {
                y = keys(y);
            }

            if(typeof(x) == 'string' && typeof(y) =='string') {
                return y.indexOf(x) !== -1;
            }

            for(var found = false, i = 0, len = y.length; i < len && !found; ++i) {
                var rhs = y[i];
                if(x instanceof Array) {
                    for(var idx = 0,
                        equal = x.length == rhs.length,
                        xlen = x.length;
                        idx < xlen && equal; ++idx) {

                        equal = (x[idx] === rhs[idx]);
                    }
                    found = equal;
                } else if(x instanceof Object) {
                    if(x === rhs) {
                        return true;
                    }
                    var xkeys = keys(x),
                        rkeys = keys(rhs);

                    if(xkeys.length === rkeys.length) { 
                        for(var i = 0, len = xkeys.length, equal = true;
                            i < len && equal;
                            ++i) {
                            equal = xkeys[i] === rkeys[i] &&
                                    x[xkeys[i]] === rhs[rkeys[i]];
                        }
                        found = equal;
                    } 
                } else {
                    found = x == rhs;
                }
            }
            return found;
        });
    },
    'not in': function() {
        return new InfixOperator(9, function(x, y) {
            return !operators['in']().cmp(x,y);
        });
    },
    '=': function() {
        return new InfixOperator(10, function(x, y) { 
            return x == y;
        });
    },
    '==': function() {
        return new InfixOperator(10, function(x, y) { 
            return x == y;
        });
    },
    '!=': function() {
        return new InfixOperator(10, function(x, y) { 
            return x !== y;
        });
    },
    '>': function() {
        return new InfixOperator(10, function(x, y) { 
            return x > y;
        });
    },
    '>=': function() {
        return new InfixOperator(10, function(x, y) { 
            return x >= y;
        });
    },
    '<': function() {
        return new InfixOperator(10, function(x, y) { 
            return x < y;
        });
    },
    '<=': function() {
        return new InfixOperator(10, function(x, y) { 
            return x <= y;
        });
    }
};

var IfParser = function(tokens, parser) {
    this.createVariable = function(token) {
        return new LiteralToken(parser.compileFilter(token), token);
    };

    var len = tokens.length,
        i = 0,
        mappedTokens = [],
        token;
    while(i < len) {
        token = tokens[i];
        if(token == 'not' && tokens[i+1] == 'in') {
            ++i;
            token = 'not in';
        }
        mappedTokens.push(this.translateToken(token));
        ++i;
    }
    this.tokens = mappedTokens;
    this.pos = 0;
    this.currentToken = this.next();
};

IfParser.prototype.translateToken = function(token) {
    var op = operators[token];
    if(op === undefined) {
        return this.createVariable(token);
    } else {
        return op();
    }
};

IfParser.prototype.next = function() {
    if(this.pos >= this.tokens.length) {
        return new EndToken();
    }
    return this.tokens[this.pos++];
};

IfParser.prototype.parse = function() {
    var retval = this.expression();
    if(!(this.currentToken instanceof EndToken)) {
        throw new Error("Unused "+this.currentToken+" at end of if expression.");
    }
    return retval; 
};

IfParser.prototype.expression = function(rbp) {
    rbp = rbp || 0;
    var t = this.currentToken,
        left;
    this.currentToken = this.next();

    left = t.nud(this);
    while(rbp < this.currentToken.lbp) {
        t = this.currentToken;
        this.currentToken = this.next();
        left = t.led(left, this);
    }
    return left;
};

var IfNode = Node.subclass('IfNode', {
    init:function(predicate, ifTrue, ifFalse) {
        this.predicate = predicate;
        this.ifTrue = ifTrue;
        this.ifFalse = ifFalse;
    },
    render:function(context, callback) {
        var self = this;
        self.predicate.evaluate(context, function(err, data) {
            if(err) {
                callback(err, null);
            } else {
                var which = data ? self.ifTrue : self.ifFalse;
                which.render(context._copy(), callback);
            }
        });
    }
}); 

IfNode.parse = function(contents, parser) {
    var bits = contents.split(/\s+/g).slice(1),
        ifparser = new IfParser(bits, parser),
        variable = ifparser.parse(),
        ifTrue = parser.parse(['else', 'endif']),
        nextToken = parser.tokens.shift(),
        ifFalse = nextToken.isOneOf(['else']) ? (function() { 
            var ret = parser.parse(['endif']);
            parser.tokens.shift();
            return ret;
        })() : new NodeList([]);
    return new IfNode(variable, ifTrue, ifFalse);
};

exports.IfNode = IfNode;
