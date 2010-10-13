var getGlobalObject, exportsObject;

try {
    exportsObject = exports;
    getGlobalObject = require('../namespace').getGlobalObject;
} catch(err) {}

(function(global) {
    var nodes = global.require('nodes'),
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

    exporter = global.getExporter('tags.comment');
    exporter('CommentNode', CommentNode);
})(getGlobalObject('plate', exportsObject));
