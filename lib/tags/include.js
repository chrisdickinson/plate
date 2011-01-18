var nodes = require('plate/nodes'),
    NodeList = nodes.NodeList,
    Node = nodes.Node;

var IncludeNode = Node.subclass('IncludeNode', {
    init:function(templatevar, loader) {
        this.templatevar = templatevar;
        this.loader = loader;
    },
    render:function(context, callback) {
        var self = this,
            plate = require('plate');
        self.templatevar(context, function(ctxt, tpl) {
            var fn = tpl instanceof plate.Template ? 
                function(tpl, callback) { callback(null, tpl); } :
                self.loader;

            fn(tpl, function(err, template) {
                template.render(context, callback);
            });
        });
    }
}); 

IncludeNode.parse = function(contents, parser) {
    var bits = contents.split(/\s+/g),
        templatevar = parser.compileFilter(bits[1]),
        loader;
    try {
        loader = parser.pluginLibrary.lookup('loader');
    } catch(err){}

    return new IncludeNode(templatevar, loader);
};

exports.IncludeNode = IncludeNode;
