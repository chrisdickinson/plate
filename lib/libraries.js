var Library = function() {
    this.registry = {};
};

Library.prototype.lookup = function(name) {
    if(this.registry[name]) {
        return this.registry[name];
    }
    throw new Error("Could not find " + name + " !");
};

Library.prototype.register = function(name, item) {
    if(this.registry[name]) {
        throw new Error(name + " is already registered!");
    }
    this.registry[name] = item;
};

var DefaultTagLibrary = function() {
    this.registry = {};

    this.register('with', require('./tags/with').WithNode.parse);
    this.register('for', require('./tags/for').ForNode.parse);
};

DefaultTagLibrary.prototype = new Library();

exports.Library = Library;
exports.DefaultTagLibrary = DefaultTagLibrary;
exports.DefaultFilterLibrary = Library;
