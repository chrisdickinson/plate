var utils = require('./utils'),
    eterator = require('./eterator').eterator,
    slice = [].slice;

var Node = function() {
    this.init && this.init.apply(this, slice.call(arguments));
};

Node.prototype.toString = function() {
    return this.constructor.name;
};

var FilterNode = function(filtervar) {
    this.filtervar = filtervar;  
};

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
    var eter = eterator(this.nodes),
        output = [],
        error = null,
        it;

    eter.on_ready(function() {
      error ?
        callback(error) :
        callback(null, output.join(''));
    });

    eter(it=function(node) {
      node.render(context.copy(), function(err, data) {
        if(err) {
          error = err;
          it.done();
        } else {
          output.push(data);
          it.next();
        }
      });
    });
};

exports.Node = Node;
exports.FilterNode = FilterNode;
exports.NodeList = NodeList;
