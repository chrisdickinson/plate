var nodes = require('../nodes'),
    NodeList = nodes.NodeList,
    Node = nodes.Node;

var IncludeNode = function(templatevar, loader) {
    this.templatevar = templatevar;
    this.loader = loader;
};
IncludeNode.prototype = new Node;
IncludeNode.prototype = render = function(context, callback) {
    var self = this,
        platelib = require('..');
    self.templatevar(context, function(ctxt, tpl) {
        var fn = tpl instanceof platelib.Template ? 
            function(tpl, callback) { callback(null, tpl); } :
            self.loader;

        fn(tpl, function(err, template) {
            template.render(context, callback);
        });
    });
};

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
