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

    this.register('with', require('plate/tags/with').WithNode.parse);
    this.register('for', require('plate/tags/for').ForNode.parse);
    this.register('if', require('plate/tags/if').IfNode.parse);

    this.register('extends', require('plate/tags/extends').ExtendsNode.parse);
    this.register('block', require('plate/tags/block').BlockNode.parse);
    this.register('include', require('plate/tags/include').IncludeNode.parse);
    this.register('comment', require('plate/tags/comment').CommentNode.parse);
};

DefaultTagLibrary.prototype = new Library();

var DefaultFilterLibrary = function() {
    this.registry = {};

    this.register('add', require('plate/filters/add').add);
    this.register('addslashes', require('plate/filters/addslashes').addslashes);
    this.register('capfirst', require('plate/filters/capfirst').capfirst);
    this.register('center', require('plate/filters/center').center);
    this.register('cut', require('plate/filters/cut').cut);
    this.register('default', require('plate/filters/default')._default);
    this.register('dictsort', require('plate/filters/dictsort').dictsort);
    this.register('dictsortreversed', require('plate/filters/dictsort').dictsortreversed);
    this.register('divisibleby', require('plate/filters/divisibleby').divisibleby);
    this.register('filesizeformat', require('plate/filters/filesizeformat').filesizeformat);
    this.register('first', require('plate/filters/first').first);
    this.register('floatformat', require('plate/filters/floatformat').floatformat);
    this.register('safe', require('plate/filters/safe').safe);
};

DefaultFilterLibrary.prototype = new Library();

exports.Library = Library;
exports.DefaultTagLibrary = DefaultTagLibrary;
exports.DefaultFilterLibrary = DefaultFilterLibrary;
exports.DefaultPluginLibrary = Library;
