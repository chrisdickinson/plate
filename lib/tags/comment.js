var nodes = require('../nodes'),
    Node = nodes.Node;

var CommentNode = function(nodelist) {
    this.nodelist = nodelist;
};

CommentNode.prototype = new Node;
CommentNode.prototype.render = function(context, callback) { callback(null, ''); };

CommentNode.parse = function(contents, parser) {
    var nodelist = parser.parse(['endcomment']);

    parser.tokens.shift();
    return new CommentNode(nodelist);
};

exports.CommentNode = CommentNode;
