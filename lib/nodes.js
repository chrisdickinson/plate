var utils = require('plate/utils');

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
    var length = this.nodes.length,
        nodes = this.nodes,
        index = -1,
        output = [],
        eterator = function(err, data) {
            var callee = arguments.callee;
            if(err) {
                callback(err, null);
            } else {
                output.push(data);
                ++index;
                if(index < length) {
                    try {
                        nodes[index].render(context._copy(), callee);
                    } catch(err) {
                        callback(err, null);
                    }
                } else {
                    callback(null, output.slice(1).join(''));
                }
            }
        };
    eterator();
};

exports.Node = Node;
exports.FilterNode = FilterNode;
exports.NodeList = NodeList;
