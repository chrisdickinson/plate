var getGlobalObject, exportsObject;

try {
    exportsObject = exports;
    getGlobalObject = require('./namespace').getGlobalObject;
} catch(err) {}

(function(global) {
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

        this.register('with', global.require('tags.with').WithNode.parse);
        this.register('for', global.require('tags.for').ForNode.parse);
        this.register('if', global.require('tags.if').IfNode.parse);

        this.register('extends', global.require('tags.extends').ExtendsNode.parse);
        this.register('block', global.require('tags.block').BlockNode.parse);
        this.register('include', global.require('tags.include').IncludeNode.parse);
    };

    DefaultTagLibrary.prototype = new Library();

    var DefaultFilterLibrary = function() {
        this.registry = {};

        this.register('add', global.require('filters.add').add);
        this.register('addslashes', global.require('filters.addslashes').addslashes);
        this.register('capfirst', global.require('filters.capfirst').capfirst);
        this.register('center', global.require('filters.center').center);
        this.register('cut', global.require('filters.cut').cut);
        this.register('default', global.require('filters.default')._default);
        this.register('dictsort', global.require('filters.dictsort').dictsort);
        this.register('dictsortreversed', global.require('filters.dictsort').dictsortreversed);
        this.register('divisibleby', global.require('filters.divisibleby').divisibleby);
        this.register('filesizeformat', global.require('filters.filesizeformat').filesizeformat);
        this.register('first', global.require('filters.first').first);
        this.register('safe', global.require('filters.safe').safe);
    };

    DefaultFilterLibrary.prototype = new Library();

    var exporter = global.getExporter('libraries');
    exporter('Library', Library);
    exporter('DefaultTagLibrary', DefaultTagLibrary);
    exporter('DefaultFilterLibrary', DefaultFilterLibrary);
    exporter('DefaultPluginLibrary', Library);
})(getGlobalObject('plate', exportsObject));
