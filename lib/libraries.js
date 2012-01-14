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
    this.registry = (function() {
        var F = function(){};
        F.prototype = DefaultTagLibrary.default_library;
        return new F;
    })();
};

DefaultTagLibrary.prototype = new Library();

DefaultTagLibrary.default_library = {
    'with':require('./tags/with').WithNode.parse,
    'for':require('./tags/for').ForNode.parse,
    'if':require('./tags/if').IfNode.parse,
    'extends':require('./tags/extends').ExtendsNode.parse,
    'block':require('./tags/block').BlockNode.parse,
    'include':require('./tags/include').IncludeNode.parse,
    'comment':require('./tags/comment').CommentNode.parse
};

var DefaultFilterLibrary = function() {
    this.registry = (function() {
        var F = function(){};
        F.prototype = DefaultFilterLibrary.default_library;
        return new F;
    })();
};

DefaultFilterLibrary.prototype = new Library();

DefaultFilterLibrary.default_library = {
    'add':require('./filters/add').add,
    'addslashes':require('./filters/addslashes').addslashes,
    'capfirst':require('./filters/capfirst').capfirst,
    'center':require('./filters/center').center,
    'cut':require('./filters/cut').cut,
    'default':require('./filters/default')._default,
    'dictsort':require('./filters/dictsort').dictsort,
    'dictsortreversed':require('./filters/dictsortreversed').dictsortreversed,
    'divisibleby':require('./filters/divisibleby').divisibleby,
    'filesizeformat':require('./filters/filesizeformat').filesizeformat,
    'first':require('./filters/first').first,
    'floatformat':require('./filters/floatformat').floatformat,
    'get_digit':require('./filters/get_digit').get_digit,
    'index':require('./filters/index').index,
    'iteritems':require('./filters/iteritems').iteritems,
    'iriencode':require('./filters/iriencode').iriencode,
    'join':require('./filters/join').join,
    'last':require('./filters/last').last,
    'length':require('./filters/length').length,
    'length_is':require('./filters/length_is').length_is,
    'linebreaks':require('./filters/linebreaks').linebreaks,
    'linebreaksbr':require('./filters/linebreaksbr').linebreaksbr,
    'linenumbers':require('./filters/linenumbers').linenumbers,
    'ljust':require('./filters/ljust').ljust,
    'lower':require('./filters/lower').lower,
    'make_list':require('./filters/make_list').make_list,
    'phone2numeric':require('./filters/phone2numeric').phone2numeric,
    'pluralize':require('./filters/pluralize').pluralize,
    'random':require('./filters/random').random,
    'rjust':require('./filters/rjust').rjust,
    'safe':require('./filters/safe').safe,
    'slice':require('./filters/slice').slice,
    'slugify':require('./filters/slugify').slugify,
    'striptags':require('./filters/striptags').striptags,
    'timesince':require('./filters/timesince').timesince,
    'timeuntil':require('./filters/timeuntil').timeuntil,
    'title':require('./filters/title').title,
    'truncatechars':require('./filters/truncatechars').truncatechars,
    'truncatewords':require('./filters/truncatewords').truncatewords,
    'unordered_list':require('./filters/unordered_list').unordered_list,
    'upper':require('./filters/upper').upper,
    'urlencode':require('./filters/urlencode').urlencode,
    'urlize':require('./filters/urlize').urlize,
    'urlizetrunc':require('./filters/urlizetrunc').urlizetrunc,
    'wordcount':require('./filters/wordcount').wordcount,
    'wordwrap':require('./filters/wordwrap').wordwrap,
    'yesno':require('./filters/yesno').yesno
};

exports.Library = Library;
exports.DefaultTagLibrary = DefaultTagLibrary;
exports.DefaultFilterLibrary = DefaultFilterLibrary;
exports.DefaultPluginLibrary = Library;
