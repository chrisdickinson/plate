var utils = require('./utils'),
    eterator = require('./eterator'),
    parallel = eterator.parallel,
    eterator = eterator.eterator,
    slice = [].slice;

var Node = function() {
    this.init && this.init.apply(this, slice.call(arguments));
};

Node.prototype.toString = function() {
    return this.__name__;
};

var FilterNode = function(filtervar) {
    this.filtervar = filtervar;  
};

FilterNode.prototype.__name__ = 'FILTER';

FilterNode.prototype = new Node;

FilterNode.prototype.render = function(context, ready) {
  this.filtervar(context, function(err, data) {
    if(err) { ready(null, ''); } else {
      data = data === undefined || data === null ? '' : data;
      data = !data.isSafe ? 
          utils.escapeHTML(data+'') :
          data+'';
      ready(null,data);
    }
  });
};

var NodeList = function(nodes) {
    this.nodes = nodes;
};

NodeList.prototype.getNodesByType = function(type) {
    var output = [];
    for(var i = 0, len = this.nodes.length; i < len; ++i) {
        if(this.nodes[i] instanceof type) {
            output.push(this.nodes[i]);
        }
    }
    return output;
};

NodeList.prototype.render = function(context, callback) {
    var list = parallel(this.nodes, function(err, output) {
        err ?
          callback(err) :
          callback(null, output.join(''));
    })

    list(function(node, done) {
      node.render(context.copy(), done);
    });

};

exports.Node = Node;
exports.FilterNode = FilterNode;
exports.NodeList = NodeList;
