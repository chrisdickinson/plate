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

    var filters = [
      'add',
      'addslashes',
      'capfirst',
      'center',
      'cut',
      ['default', '_default'],
      'dictsort',
      'dictsortreversed',
      'divisibleby',
      'filesizeformat',
      'first',
      'floatformat',
      'get_digit',
      'index',
      'iteritems',
      'iriencode',
      'join',
      'last',
      'length',
      'length_is',
      'linebreaks',
      'linebreaksbr',
      'linenumbers',
      'ljust',
      'lower',
      'make_list',
      'phone2numeric',
      'pluralize',
      'random',
      'rjust',
      'safe',
      'slice',
      'slugify',
      'striptags',
      'title',
      'truncatewords',
      'unordered_list',
      'upper',
      'urlencode',
      'urlize',
      'urlizetrunc',
      'wordcount',
      'wordwrap',
      'yesno'
    ];

    for(var i = 0, len = filters.length; i < len; ++i) {
      var item = filters[i],
          target = item;
      if(item instanceof Array) {
        target = item[1];
        item = item[0];
      }
      try {
      this.register(item, require('plate/filters/'+item)[target]);
      } catch(err) {
        console.log(err.stack);
      }
    }
};

DefaultFilterLibrary.prototype = new Library();

exports.Library = Library;
exports.DefaultTagLibrary = DefaultTagLibrary;
exports.DefaultFilterLibrary = DefaultFilterLibrary;
exports.DefaultPluginLibrary = Library;
