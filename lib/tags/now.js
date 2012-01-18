var nodes = require('../nodes'),
    format = require('../utils').format,
    Node = nodes.Node;

var NowNode = function(str) {
  this.format = str
};
NowNode.prototype = new Node;
NowNode.prototype.newDate = function() { return new Date }

NowNode.prototype.render = function(context, ready) {
  ready(null, format(this.newDate(), this.format))
};

NowNode.parse = function(contents, parser) {
    var bits = contents.split(' '),
        fmt = bits.slice(1).join(' ')

    fmt = fmt.replace(/^\s*/, '')
             .replace(/\s*$/, '')

    fmt.charAt(0) in {'"':1, "'":1} && 
      (fmt = fmt.slice(1));

    fmt.charAt(fmt.length-1) in {'"':1, "'":1} &&
      (fmt = fmt.slice(0, -1));

    return new NowNode(fmt || 'N j, Y')
};

exports.NowNode = NowNode;

