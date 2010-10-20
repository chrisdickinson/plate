var nodes = require('plate/nodes'),
    NodeList = nodes.NodeList,
    Node = nodes.Node;

var CommentNode = Node.subclass('CommentNode', {
    init:function(nodelist) {
        this.nodelist = nodelist;
    },
    render:function(context, callback) {
        callback(null, '');
    }
}); 

CommentNode.parse = function(contents, parser) {
    var nodelist = parser.parse(['endcomment']);

    parser.tokens.shift();
    return new CommentNode(nodelist);
};

exports.CommentNode = CommentNode;
