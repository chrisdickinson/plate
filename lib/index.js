var tokens = require('plate/tokens'),
    parsers = require('plate/parsers'),
    libraries = require('plate/libraries');

var Context = function(dict) {
    for(var name in dict) if(dict.hasOwnProperty(name)) {
        this[name] = dict[name];
    }
    this._original = dict;
    this._copy = function() {
        return Context.copy(this);
    };
};

Context.copy = function(ctxt) {
    var toCopy = {};
    for(var name in ctxt._original) if (ctxt._original.hasOwnProperty(name)) {
        toCopy[name] = ctxt._original[name];
    }
    for(var name in ctxt) if (ctxt.hasOwnProperty(name) && name !== '_original' && name !== '_copy') {
        toCopy[name] = ctxt[name];
    }
    return new Context(toCopy);
};

var Template = function(raw, libs, parser) {
    if(typeof(raw) !== 'string') {
        throw new TypeError("You must pass in a string to render the template.");
    }
    this.raw = raw;
    libs = libs || {};
    this.tag_library = libs.tag_library || new libraries.DefaultTagLibrary();
    this.filter_library = libs.filter_library || new libraries.DefaultFilterLibrary();
    this.plugin_library = libs.plugin_library || new libraries.DefaultPluginLibrary();
    this.parser = parser || parsers.Parser;
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
        incLineNo = function(str) {
            var count = 0;
            for(var i = 0, len = str.length; i < len; ++i) {
                if(str.charAt(i) == '\n') {
                    ++count;
                }
            }
            lineNo += count;
        };

    do {
        MATCH_RE.lastIndex = 0;
        match = MATCH_RE.exec(raw);
        if(match) {
            incLineNo(raw.slice(0, match.index));
            if(match.index > 0) {
                tokens_out.push(new tokens.TextToken(raw.slice(0, match.index)));
            }
            tokens_out.push(new map[match[0].charAt(1)](match[1].replace(/^\s+/g,'').replace(/^\s+$/g, ''), lineNo));
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
