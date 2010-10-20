var nodes = require('plate/nodes'),
    FilterNode = nodes.FilterNode;

var Token = function(content, lineNumber) {
    this.content = content;
    this.lineNumber = lineNumber;
    this.name = this.content.split(/\s+/g)[0];
};

Token.prototype.toString = function() {
    return '<'+this.repr+': "'+this.content.slice(0,20)+'">';
};

Token.prototype.isOneOf = function(names) {
    if(this.isTag()) {
        for(var i = 0, len = names.length; i < len; ++i) {
            if(this.name == names[i]) {
                return true;
            }
        }
    }
    return false;
};

Token.prototype.createNode = function(parser) {
    return this.creationFunction(this.content, parser);
};

Token.prototype.isTag = function() { return false; };

Token.subclass = function(proto) {
    var F = function() {},
        SC = function() {
            Token.apply(this, Array.prototype.slice.call(arguments));
        };
    F.prototype = Token.prototype;
    SC.prototype = new F();
    for(var name in proto) if(proto.hasOwnProperty(name)) {
        SC.prototype[name] = proto[name];
    }
    return SC;
};

var TextToken = Token.subclass({
    creationFunction:function(content, parser) {
        return {
            render:function(context, callback) {
                callback(null, content);
            }
        };
    },
    repr:'TextToken'
});

var TagToken = Token.subclass({
    creationFunction:function(content, parser) {
        return parser.tagLibrary.lookup(this.name)(content.replace(/^\s*/, '').replace(/\s*$/, ''), parser);
    },
    isTag:function() { return true; },
    repr:'TagToken'
});

var FilterToken = Token.subclass({
    creationFunction:function(content, parser) {
        var filtervar = parser.compileFilter(content);
        return new FilterNode(filtervar);
    },
    repr:'FilterToken'
});

var CommentToken = Token.subclass({
    creationFunction:function(content, parser) {
        return {
            render:function(context, callback) {
                callback(null, '');
            }
        }; 
    },
    repr:'CommentToken'
});

exports.CommentToken = CommentToken;
exports.FilterToken = FilterToken;
exports.TagToken = TagToken;
exports.TextToken = TextToken;
exports.Token = Token;
