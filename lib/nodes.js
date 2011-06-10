var utils = require('./utils'),
    eterator = require('./eterator').eterator;

var Node = function() {
    this.init.apply(this, Array.prototype.slice.call(arguments));
};

Node.prototype.toString = function() {
    return this.name;
};

Node.subclass = function(name, opts) {
    var F = function(){},
        SC = function() {
            Node.apply(this, Array.prototype.slice.call(arguments));
        };
    F.prototype = Node.prototype;
    SC.prototype = new F();
    for(var name in opts) if(opts.hasOwnProperty(name)) {
        SC.prototype[name] = opts[name];
    }
    return SC;
};

var FilterNode = Node.subclass('FilterNode', {
    init:function(filtervar) {
        this.filtervar = filtervar;
    },
    render:function(context, callback) {
        this.filtervar(context, function(err, data) {
            if(err) {
                // swallow filternode errors
                callback(null, '');
            } else {
                var isSafe = data.isSafe;
                data = data === undefined || data === null ? '' : data.toString();
                if(!isSafe) {
                    data = utils.escapeHTML(data);
                }
                callback(null, data);
            }
        });
    },
    toString:function() {
      return '<FilterNode: "'+this.filtervar.original+'">';
    }
}); 

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
      node.render(context._copy(), function(err, data) {
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
