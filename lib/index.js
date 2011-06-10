var tokens = require('./tokens'),
    parsers = require('./parsers'),
    libraries = require('./libraries');

var Context = function(dict) {
    if(dict) {
        for(var name in dict) if(dict.hasOwnProperty(name)) {
            this[name] = dict[name];
        }
    }
};

Context.prototype.copy = function() {
    var sup = function(){},
        cpy;

    sup.prototype = this;
    return new sup; 
};

var Template = function(raw, libs, parser) {
    if(typeof(raw) !== 'string') {
        throw new TypeError("You must pass in a string to render the template.");
    }
    this.raw = raw;
    libs = libs || {};
    this.tag_library = libs.tag_library || Template.Meta.createTagLibrary();
    this.filter_library = libs.filter_library || Template.Meta.createFilterLibrary();
    this.plugin_library = libs.plugin_library || Template.Meta.createPluginLibrary();
    this.parser = parser || parsers.Parser;
};

Template.Meta = {
  _autoregister:{plugin:{}, tag:{}, filter:{}},
  _classes:{plugin:libraries.DefaultPluginLibrary,tag:libraries.DefaultTagLibrary,filter:libraries.DefaultFilterLibrary},
  _cache:{}
};

var createGetLibraryMethod = function(name) {
  return function() {
    if(this._cache[name])
      return this._cache[name]; 

    var lib = new this._classes[name];
    for(var key in this._autoregister[name]) if(this._autoregister[name].hasOwnProperty(key)) {
      lib.register(key, this._autoregister[name][key]);
    }

    this._cache[name] = lib;
    return lib;
  };
};

var createSetAutoregisterMethod = function(name) {
  return function(key, item) {
    if(this._cache[name])
      this._cache[name].register(key, item);
    else
      this._autoregister[name][key] = item;
  };
};

Template.Meta.createPluginLibrary = createGetLibraryMethod('plugin');
Template.Meta.createFilterLibrary = createGetLibraryMethod('filter');
Template.Meta.createTagLibrary = createGetLibraryMethod('tag');
Template.Meta.registerPlugin = createSetAutoregisterMethod('plugin');
Template.Meta.registerFilter = createSetAutoregisterMethod('filter');
Template.Meta.registerTag = createSetAutoregisterMethod('tag');
  
Template.createPluginLibrary = function() {
  return new libraries.DefaultPluginLibrary();
};

Template.prototype.getNodeList = function() {
    if(!this.tokens) {
        this.tokens = Template.tokenize(this.raw);
    }

    if(!this.nodelist) {
        var parser = new this.parser(
            this.tokens,
            this.tag_library,
            this.filter_library,
            this.plugin_library,
            this);
        this.nodelist = parser.parse();
    }

    return this.nodelist;
};

Template.prototype.render = function(context, callback) {
    if(typeof(context) !== 'object') {
        throw new TypeError("You must pass in an instance of Object or plate.Context");
    }

    try {
        if(!(context instanceof Context)) {
            context = new Context(context);
        }
        this.getNodeList();
        this.nodelist.render(context, callback);
    } catch(err) {
        callback(err, null);
    }
};


var MATCH_RE = /\{[%#\{](.*?)[\}#%]\}/g;

Template.tokenize = function(original) {
    var raw = original.slice(),
        match = null,
        map = {
            '%':tokens.TagToken,
            '#':tokens.CommentToken,
            '{':tokens.FilterToken
        },
        tokens_out = [],
        lineNo = 1,
        repl_re = /[^\n]*/gm,
        incLineNo = function(str) {
            lineNo += str.replace(repl_re, '').length;
        };

    do {
        MATCH_RE.lastIndex = 0;
        match = MATCH_RE.exec(raw);
        if(match) {
            var str = raw.slice(0, match.index);
            incLineNo(str);
            if(match.index > 0) {
                tokens_out.push(new tokens.TextToken(str));
            }

            var token_data = match[1].replace(/^\s+/g, '').replace(/\s+$/g, ''),
                token_cls = map[match[0].charAt(1)];

            tokens_out.push(new token_cls(token_data, lineNo));
            raw = raw.slice(match.index+match[0].length);
        }
    } while(match);
    if(raw) {
        tokens_out.push(new tokens.TextToken(raw));
    }
    return tokens_out;
};

exports.Context = Context;
exports.Template = Template;
