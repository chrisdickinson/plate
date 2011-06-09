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
    this.register('if', require('./tags/if').IfNode.parse);

    this.register('extends', require('./tags/extends').ExtendsNode.parse);
    this.register('block', require('./tags/block').BlockNode.parse);
    this.register('include', require('./tags/include').IncludeNode.parse);
    this.register('comment', require('./tags/comment').CommentNode.parse);
};

DefaultTagLibrary.prototype = new Library();

var DefaultFilterLibrary = function() {
    this.registry = {};

    this.register('add', require('./filters/add').add);
    this.register('addslashes', require('./filters/addslashes').addslashes);
    this.register('capfirst', require('./filters/capfirst').capfirst);
    this.register('center', require('./filters/center').center);
    this.register('cut', require('./filters/cut').cut);
    this.register('default', require('./filters/default')._default);
    this.register('dictsort', require('./filters/dictsort').dictsort);
    this.register('dictsortreversed', require('./filters/dictsortreversed').dictsortreversed);
    this.register('divisibleby', require('./filters/divisibleby').divisibleby);
    this.register('filesizeformat', require('./filters/filesizeformat').filesizeformat);
    this.register('first', require('./filters/first').first);
    this.register('floatformat', require('./filters/floatformat').floatformat);
    this.register('get_digit', require('./filters/get_digit').get_digit);
    this.register('index', require('./filters/index').index);
    this.register('iteritems', require('./filters/iteritems').iteritems);
    this.register('iriencode', require('./filters/iriencode').iriencode);
    this.register('join', require('./filters/join').join);
    this.register('last', require('./filters/last').last);
    this.register('length', require('./filters/length').length);
    this.register('length_is', require('./filters/length_is').length_is);
    this.register('linebreaks', require('./filters/linebreaks').linebreaks);
    this.register('linebreaksbr', require('./filters/linebreaksbr').linebreaksbr);
    this.register('linenumbers', require('./filters/linenumbers').linenumbers);
    this.register('ljust', require('./filters/ljust').ljust);
    this.register('lower', require('./filters/lower').lower);
    this.register('make_list', require('./filters/make_list').make_list);
    this.register('phone2numeric', require('./filters/phone2numeric').phone2numeric);
    this.register('pluralize', require('./filters/pluralize').pluralize);
    this.register('random', require('./filters/random').random);
    this.register('rjust', require('./filters/rjust').rjust);
    this.register('safe', require('./filters/safe').safe);
    this.register('slice', require('./filters/slice').slice);
    this.register('slugify', require('./filters/slugify').slugify);
    this.register('striptags', require('./filters/striptags').striptags);
    this.register('title', require('./filters/title').title);
    this.register('truncatewords', require('./filters/truncatewords').truncatewords);
    this.register('unordered_list', require('./filters/unordered_list').unordered_list);
    this.register('upper', require('./filters/upper').upper);
    this.register('urlencode', require('./filters/urlencode').urlencode);
    this.register('urlize', require('./filters/urlize').urlize);
    this.register('urlizetrunc', require('./filters/urlizetrunc').urlizetrunc);
    this.register('wordcount', require('./filters/wordcount').wordcount);
    this.register('wordwrap', require('./filters/wordwrap').wordwrap);
    this.register('yesno', require('./filters/yesno').yesno);
};

DefaultFilterLibrary.prototype = new Library();

exports.Library = Library;
exports.DefaultTagLibrary = DefaultTagLibrary;
exports.DefaultFilterLibrary = DefaultFilterLibrary;
exports.DefaultPluginLibrary = Library;
