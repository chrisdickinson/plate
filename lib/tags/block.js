var nodes = require('plate/nodes'),
    NodeList = nodes.NodeList,
    Node = nodes.Node;

var BLOCK_CONTEXT_KEY = 'block_context';

var BlockContext = function() {
    this.blocks = {};
};

BlockContext.prototype.addBlocks = function(blocks) {
    var self = this,
        pushOrCreate = function(name, block) {
        if(self.blocks[name]) {
            self.blocks[name].unshift(block);
        } else {
            self.blocks[name] = [block];
        }
    };

    for(var name in blocks) if(blocks.hasOwnProperty(name)) {
        pushOrCreate(name, blocks[name]);
    }
};

BlockContext.prototype.pop = function(name) {
    if(this.blocks[name]) {
      return this.blocks[name].pop();
    } else return null;
};

BlockContext.prototype.push = function(name, block) {
    this.blocks[name].push(block);
};

BlockContext.prototype.getBlock = function(name) {
    if(this.blocks[name]) {
        return this.blocks[name].slice(-1)[0];
    }
    return null;
};

var BlockNode = Node.subclass('BlockNode', {
    init:function(name, nodelist) {
        this.name = name;
        this.nodelist = nodelist;
    },
    render:function(context, callback) {
        var self = this,
            blockContext = context[BLOCK_CONTEXT_KEY];
        if(blockContext) {
            var block, push;
            push = block = blockContext.pop(this.name);
            if(!block) {
                block = this;
            }
            block = new BlockNode(block.name, block.nodelist);
            block.context = context;
            block.context['block'] = block;
            context.block = block;
            block.nodelist.render(context, function(err, data) {
                if(push) {
                    blockContext.push(self.name, push);
                }
                callback(err, data);
            });
        } else {
            context.block = this;
            this.nodelist.render(context, callback);
        }
    },
    _super:function(callback) {
        if(this.context[BLOCK_CONTEXT_KEY] && this.context[BLOCK_CONTEXT_KEY].getBlock(this.name)) {
            this.context[BLOCK_CONTEXT_KEY].getBlock(this.name).render(this.context, callback); 
        } else {
            callback(null, '');
        }
    }
}); 

BlockNode.parse = function(contents, parser) {
    var bits = contents.split(/\s+/g),
        blockName = bits[1],
        loadedBlocks = parser.__loadedBlocks || [];

    for(var i = 0, len = loadedBlocks.length; i < len; ++i) {
        if(loadedBlocks[i] === blockName) {
            throw new Error("block tag with name '"+blockName+"' appears more than once");
        }
    }
    loadedBlocks.push(blockName);
    parser.__loadedBlocks = loadedBlocks;

    var nodeList = parser.parse(['endblock']);
    parser.tokens.shift();

    return new BlockNode(blockName, nodeList);
};

exports.BlockNode = BlockNode;
exports.BlockContext = BlockContext;
exports.BLOCK_CONTEXT_KEY = BLOCK_CONTEXT_KEY;
