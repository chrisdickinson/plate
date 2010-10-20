var nodes = require('plate/nodes'),
    NodeList = nodes.NodeList,
    Node = nodes.Node;

var WithNode = Node.subclass('WithNode', {
    init:function(withvar, asvar, nodelist) {
        this.withvar = withvar;
        this.asvar = asvar;
        this.nodelist = nodelist;
    },
    render:function(context, callback) {
        var self = this;
        self.withvar(context, function(err, data) {
            if(err) {
                callback(err, null);
            } else {
                context[self.asvar] = data;

                self.nodelist.render(context, callback);
            }
        });
    }
}); 

WithNode.parse = function(contents, parser) {
    var bits = contents.split(/\s+/g),
        withvar = parser.compileFilter(bits[1]),
        asvar = bits[3],
        nodelist = parser.parse(['endwith']);

    parser.tokens.shift();
    return new WithNode(withvar, asvar, nodelist);
};

exports.WithNode = WithNode;
