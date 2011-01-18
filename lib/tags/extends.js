var nodes = require('plate/nodes'),
    NodeList = nodes.NodeList,
    Node = nodes.Node,
    blocktag = require('plate/tags/block'),
    BlockContext = blocktag.BlockContext,
    BlockNode = blocktag.BlockNode,
    BLOCK_CONTEXT_KEY = blocktag.BLOCK_CONTEXT_KEY;

var ExtendsNode = Node.subclass('ExtendsNode', {
    init:function(parent_expr, nodelist, loader_plugin) {
        this.parent_expr = parent_expr;
        this.nodelist = nodelist;
        this.loader_plugin = loader_plugin;
        var blocks = this.nodelist.getNodesByType(BlockNode),
            outblocks = {};
        for(var i = 0, len = blocks.length; i < len; ++i) {
            outblocks[blocks[i].name] = blocks[i];
        }
        this.blocks = outblocks;
    },
    render:function(context, callback) {
        var self = this,
            plate = require('plate');
        self.parent_expr(context, function(err, tpl) {
            if(err) {
                callback(err, null);
            } else {
                var fn = tpl instanceof plate.Template ? function(tpl, callback) { callback(null, tpl); } :
                         function(tpl, callback) { self.loader_plugin(tpl, callback); };
                fn(tpl, function(err, template) {
                    if(!context[BLOCK_CONTEXT_KEY]) {
                        context[BLOCK_CONTEXT_KEY] = new BlockContext();
                    }
                    var blockContext = context[BLOCK_CONTEXT_KEY];
                    blockContext.addBlocks(self.blocks);
                    var blocks = {},
                        nodeList = template.getNodeList();
                    for(var i = 0, len = nodeList.nodes.length; i < len; ++i) {
                        var node = nodeList.nodes[i];
                        if(!(node instanceof ExtendsNode)) {
                            var nodes = nodeList.getNodesByType(BlockNode),
                                outnodes = {};
                            for(var j = 0, jlen = nodes.length; j < jlen; ++j) {
                                outnodes[nodes[j].name] = nodes[j];
                            }
                            blockContext.addBlocks(outnodes);
                            break;
                        }
                    }
                    template.render(context, callback);
                });
            }
        });
    }
}); 

ExtendsNode.parse = function(contents, parser) {
    var bits = contents.split(/\s+/g),
        parent = parser.compileFilter(bits[1]),
        nodelist = parser.parse();
    var loader = null;
    try {
        loader = parser.pluginLibrary.lookup('loader');
    } catch(err) {}

    return new ExtendsNode(parent, nodelist, loader);
};

exports.ExtendsNode = ExtendsNode;
