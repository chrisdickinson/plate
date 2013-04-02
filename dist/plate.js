;(function(e,t,n){function i(n,s){if(!t[n]){if(!e[n]){var o=typeof require=="function"&&require;if(!s&&o)return o(n,!0);if(r)return r(n,!0);throw new Error("Cannot find module '"+n+"'")}var u=t[n]={exports:{}};e[n][0](function(t){var r=e[n][1][t];return i(r?r:t)},u,u.exports)}return t[n].exports}var r=typeof require=="function"&&require;for(var s=0;s<n.length;s++)i(n[s]);return i})({1:[function(require,module,exports){
module.exports = {
    log: function(value) { console.log(value) }
  , error: function(err) { console.error(err, err && err.stack) }
  , info: function(value) { } 
}

},{}],2:[function(require,module,exports){
module.exports = Promise

function Promise() {
  this.trigger = null
}

var cons = Promise
  , proto = cons.prototype

proto.resolve = function(value) {
  var trigger = this.trigger

  if(!value || value.constructor !== cons) {
    return trigger(value)
  }

  value.once('done', trigger)
}

proto.once = function(ev, fn) {
  this.trigger = fn  
}

},{}],3:[function(require,module,exports){
(function(global){var FilterToken = require('./filter_token')
  , TagToken = require('./tag_token')
  , CommentToken = require('./comment_token')
  , TextToken = require('./text_token') 
  , libraries = require('./libraries')
  , Parser = require('./parser')
  , Context = require('./context')
  , Meta = require('./meta')
  , Promise = require('./promise')

module.exports = Template

// circular alias to support old
// versions of plate.
Template.Template = Template
Template.Context = Context

var later = typeof global !== 'undefined' ? 
    function(fn) { global.setTimeout(fn, 0) } :
    function(fn) { this.setTimeout(fn, 0) }

function Template(raw, libraries, parser) {
  if(typeof raw !== 'string') {
    throw new TypeError('input should be a string')
  }

  this.raw = raw

  libraries = libraries || {}

  this.tagLibrary =
    libraries.tag_library || Template.Meta.createTagLibrary()

  this.filterLibrary = 
    libraries.filter_library || Template.Meta.createFilterLibrary()

  this.pluginLibrary = 
    libraries.plugin_library || Template.Meta.createPluginLibrary()

  this.parser = parser || Parser

  this.tokens = null
}

var cons = Template
  , proto = cons.prototype
  , meta = cons.Meta = new Meta

cons.createPluginLibrary = function() {
  return new libraries.DefaultPluginLibrary()
}

proto.getNodeList = function() {
  this.nodelist = this.nodelist || this.parse()

  return this.nodelist
}

proto.parse = function() {
  var parser

  this.tokens = this.tokens || cons.tokenize(this.raw)

  parser = new this.parser(
      this.tokens
    , this.tagLibrary
    , this.filterLibrary
    , this.pluginLibrary
    , this
  )

  return parser.parse()
}

proto.render = protect(function(context, ready) {
  context = new Context(context)

  var result

  result = 
  this
    .getNodeList()
    .render(context)

  if(result.constructor === Promise) {
    result.once('done', function(data) {
      ready(null, data)
    })
  } else {
    later(function() {
      ready(null, result)
    }, 0)
  }

})

function protect(fn) {
  return function(context, ready) {
    if(!context || !ready) {
      throw new TypeError()
    }

    try {
      return fn.call(this, context, ready)
    } catch(e) {
      later(function() {
        ready(e, null)
      }, 0)
    }
  }
}

cons.MATCH_RE = /\{[%#\{](.*?)[\}#%]\}/

cons.tokenize = function(content) {
  var match = null
    , tokens = []
    , lineNo = 1
    , incLineNo = function(str) { lineNo += str.split('\n').length }
    , map = {
          '%': TagToken
        , '#': CommentToken
        , '{': FilterToken
      }
    , rex = this.MATCH_RE
    , literal

  do {
    match = rex.exec(content)
    if(!match)
      continue

    literal = content.slice(0, match.index)
    incLineNo(literal)
    if(match.index)
      tokens.push(new TextToken(literal.slice(0, match.index, lineNo)))

    match[1] = match[1]
      .replace(/^\s+/, '')
      .replace(/\s+$/, '')

    tokens.push(new map[match[0].charAt(1)](match[1], lineNo))

    content = content.slice(match.index + match[0].length)
  } while(content.length && match)

  tokens.push(new TextToken(content))

  return tokens
}

})(window)
},{"./filter_token":4,"./tag_token":5,"./comment_token":6,"./text_token":7,"./libraries":8,"./parser":9,"./context":10,"./meta":11,"./promise":2}],12:[function(require,module,exports){
require('dst')

var plate = require('./lib/index')
if(typeof define !== 'undefined' && define.amd) {
  define('plate', [], function() { return plate })
} else {
  window.plate = plate
}

plate.debug = require('./lib/debug')
plate.utils = plate.date = require('./lib/date')
plate.utils.Promise = require('./lib/promise')
plate.utils.SafeString = function(str) {
  str = new String(str)
  str.safe = true
  return str
}
plate.libraries = require('./lib/libraries')

},{"./lib/debug":1,"./lib/index":3,"./lib/date":13,"./lib/libraries":8,"./lib/promise":2,"dst":14}],8:[function(require,module,exports){
module.exports = {
    Library: require('./library')
  , DefaultPluginLibrary: require('./library')
  , DefaultTagLibrary: require('./defaulttags')
  , DefaultFilterLibrary: require('./defaultfilters')
} 

},{"./library":15,"./defaulttags":16,"./defaultfilters":17}],10:[function(require,module,exports){
module.exports = Context

function Context(from) {
  if(from && from.constructor === Context) {
    return from
  }

  from = from || {}
  for(var key in from) if(from.hasOwnProperty(key)) {
    this[key] = from[key]
  }
}

var cons = Context
  , proto = cons.prototype

proto.copy = function() {
  var F = Function()
  F.name = cons.name
  F.prototype = this
  return new F
}

},{}],14:[function(require,module,exports){
;(function() {

// so, the only way we (reliably) get access to DST in javascript
// is via `Date#getTimezoneOffset`.
//
// this value will switch for a given date based on the presence or absence
// of DST at that date.

function find_dst_threshold (near, far) {
  var near_date = new Date(near)
    , far_date = new Date(far)
    , near_offs = near_date.getTimezoneOffset()
    , far_offs = far_date.getTimezoneOffset()

  if(near_offs === far_offs) return 0

  if(Math.abs(near_date - far_date) < 1000) return near_date

  return find_dst_threshold(near, near+(far-near)/2) || find_dst_threshold(near+(far-near)/2, far)
}


function find_dst_thresholds() {
  var d = new Date()
    , d = new Date(d.getFullYear(), 0, 1)
    , f = new Date(d.getFullYear(), 11, 31)
    , x
    , first
    , second

  x = (f - d) / -2
  first = find_dst_threshold(+d, d - x)
  second = find_dst_threshold(d - x, +f)

  return {
    spring_forward  : first ? (first.getTimezoneOffset() < second.getTimezoneOffset() ? second : first) - new Date(d.getFullYear(), 0, 1, 0, 0) : 0
  , fall_back       : first ? (first.getTimezoneOffset() < second.getTimezoneOffset() ? first : second) - new Date(d.getFullYear(), 0, 1, 0, 0) : 0
  }
}

var THRESHOLDS = find_dst_thresholds()

function is_dst(datetime, thresholds) {

  thresholds = thresholds || THRESHOLDS

  if(thresholds.spring_forward === thresholds.fall_back)
    return false

  var offset = datetime - new Date(datetime.getFullYear(), 0, 1, 0, 0)
    , dst_is_reversed = thresholds.spring_forward > thresholds.fall_back
    , max = Math.max(thresholds.fall_back, thresholds.spring_forward)
    , min = Math.min(thresholds.fall_back, thresholds.spring_forward)

  if(min < offset && offset < max)
    return !dst_is_reversed
  return dst_is_reversed
}

Date.prototype.isDST = function(thresholds) {
  return is_dst(this, thresholds) 
}

is_dst.find_thresholds = find_dst_thresholds

if(typeof module !== 'undefined') {
  module.exports = is_dst
} else {
  window.is_dst = is_dst 
}

})()

},{}],15:[function(require,module,exports){
module.exports = Library

function Library(lib) {
  this.registry = lib || {}
}

var cons = Library
  , proto = cons.prototype

proto.lookup = errorOnNull(function(name) {
  return this.registry[name] || null  
}, "Could not find {0}!")

proto.register = errorOnNull(function(name, item) {
  if(this.registry[name])
    return null

  this.registry[name] = item
}, "{0} is already registered!")


function errorOnNull(fn, msg) {
  return function() {
    var result = fn.call(this, arguments[0], arguments[1])
      , args = arguments

    if(result === null)
      throw new Error(msg.replace(/\{(\d+?)\}/g, function(a, m) {
        return args[+m]
      }))

    return result
  }
}


},{}],4:[function(require,module,exports){
var Token = require('./token')
  , FilterNode = require('./filter_node')

module.exports = FilterToken

function FilterToken(content, line) {
  Token.call(this, content, line)
}

var cons = FilterToken
  , proto = cons.prototype = new Token

proto.constructor = cons

proto.node = function(parser) {
  return new FilterNode(parser.compile(this.content))
}


},{"./token":18,"./filter_node":19}],5:[function(require,module,exports){
module.exports = TagToken

var Token = require('./token')

function TagToken(content, line) {
  Token.call(this, content, line)
}

var cons = TagToken
  , proto = cons.prototype = new Token

proto.constructor = cons

proto.node = function(parser) {
  var tag = parser.tags.lookup(this.name)

  return tag(this.content, parser)
}

},{"./token":18}],6:[function(require,module,exports){
module.exports = CommentToken

var Token = require('./token')

function CommentToken(content, line) {
  Token.call(this, content, line)
}

var cons = CommentToken
  , proto = cons.prototype = new Token

proto.constructor = cons

proto.node = function(parser) {
  // no-operation
  return null
}


},{"./token":18}],7:[function(require,module,exports){
module.exports = TextToken

var Token = require('./token')
  , TextNode = require('./text_node')

function TextToken(content, line) {
  Token.call(this, content, line)
}

var cons = TextToken
  , proto = cons.prototype = new Token

proto.constructor = cons

proto.node = function(parser) {
  return new TextNode(this.content)
}

},{"./token":18,"./text_node":20}],9:[function(require,module,exports){
module.exports = Parser

var NodeList = require('./node_list')

var FilterChain = require('./filter_chain')
  , FilterLookup = require('./filter_lookup')
  , FilterApplication = require('./filter_application')

function Parser(tokens, tags, filters, plugins) {
  this.tokens = tokens
  this.tags = tags
  this.filters = filters
  this.plugins = plugins

  // for use with extends / block tags
  this.loadedBlocks = []
}

var cons = Parser
  , proto = cons.prototype

proto.cache = {}

proto.parse = function(until) {
  var output = []
    , token = null
    , node

  while(this.tokens.length > 0) {
    token = this.tokens.shift()

    if(until && token.is(until)) {
      this.tokens.unshift(token)
      break
    } else if(node = token.node(this)) {
      output.push(node)
    }
  }

  return new NodeList(output)
}

proto.compileNumber = function(content, idx, output) {
  var c
    , decimal = content.charAt(idx) === '.'
    , bits = decimal ? ['0.'] : []

  do {
    c = content.charAt(idx)
    if(c === '.') {
      if(decimal)
        break
      decimal = true
      bits.push('.')
    } else if(/\d/.test(c)) {
      bits.push(c)
    }
  } while(++idx < content.length)

  output.push((decimal ? parseFloat : parseInt)(bits.join(''), 10))

  return idx
}

proto.compileString = function(content, idx, output) {
  var type = content.charAt(idx)
    , escaped = false
    , bits = []
    , c

  ++idx

  do {
    c = content.charAt(idx)

    if(escaped) {
      if(!/['"\\]/.test(c))
        bits.push('\\')

      bits.push(c)
      escaped = false
    } else {
      if(c === '\\') {
        escaped = true
      } else if(c === type) {
        break
      } else {
        bits.push(c)
      }
    }

  } while(++idx < content.length)

  output.push(bits.join(''))

  return idx
}

proto.compileName = function(content, idx, output) {
  var out = []
    , c

  do {
    c = content.charAt(idx)
    if(/[^\w\d\_]/.test(c))
      break

    out.push(c)
  } while(++idx < content.length)

  output.push(out.join(''))

  return idx
}

proto.compileFilter = function(content, idx, output) {
  var filterName
    , oldLen
    , bits

  ++idx

  idx = this.compileName(content, idx, output)
  filterName = output.pop()

  if(content.charAt(idx) !== ':') {
    output.push(new FilterApplication(filterName, []))
    return idx - 1
  }

  ++idx

  oldLen = output.length
  idx = this.compileFull(content, idx, output, true)
  bits = output.splice(oldLen, output.length - oldLen)

  output.push(new FilterApplication(filterName, bits))

  return idx
}

proto.compileLookup = function(content, idx, output) {
  var bits = []

  do {
    idx = this.compileName(content, idx, output)
    bits.push(output.pop())

    if(content.charAt(idx) !== '.')
      break

  } while(++idx < content.length)

  output.push(new FilterLookup(bits))

  return idx - 1
}

proto.compileFull = function(content, idx, output, omitPipe) {
  var c
  output = output || [] 
  idx = idx || 0

  // something|filtername[:arg, arg]
  // "quotes"
  // 1
  // 1.2
  // true | false

  // swallow leading whitespace.
  while(/\s/.test(content.charAt(idx)))
    ++idx

  do {
    c = content.charAt(idx)

    if(/[,\s]/.test(c))
      break

    if(omitPipe && c === '|') {
      --idx
      break
    }

    switch(true) {
      case /[\d\.]/.test(c):
        idx = this.compileNumber(content, idx, output)
        break
      case /['"]/.test(c):
        idx = this.compileString(content, idx, output)
        break
      case c === '|':
        idx = this.compileFilter(content, idx, output)
        break
      default:
        idx = this.compileLookup(content, idx, output)
        break
    }
  } while(++idx < content.length)

  return idx
}

proto.compile = function(content) {
  var output = []

  if(this.cache[content])
    return this.cache[content]

  this.compileFull(content, 0, output)

  output = this.cache[content] = new FilterChain(output, this)
  output.attach(this)

  return output
}

},{"./node_list":21,"./filter_chain":22,"./filter_lookup":23,"./filter_application":24}],11:[function(require,module,exports){
var libraries = require('./libraries')

module.exports = Meta

function Meta() {
  this._autoregister = {
      plugin: {}
    , tag: {}
    , filter: {}
  }

  this._cache = {}

  this._classes = {
      filter: libraries.DefaultFilterLibrary
    , plugin: libraries.DefaultPluginLibrary
    , tag: libraries.DefaultTagLibrary
  }
}

var cons = Meta
  , proto = cons.prototype

proto.createPluginLibrary = createLibrary('plugin')
proto.createFilterLibrary = createLibrary('filter')
proto.createTagLibrary = createLibrary('tag')

proto.registerPlugin = createAutoregister('plugin')
proto.registerFilter = createAutoregister('filter')
proto.registerTag = createAutoregister('tag')

function createAutoregister(name) {
  return function(key, item) {
    if(this._cache[name])
      this._cache[name].register(key, item);
    else
      this._autoregister[name][key] = item;
  }
}

function createLibrary(name) {
  return function() {
    if(this._cache[name])
      return this._cache[name]; 

    var lib = new this._classes[name]

    for(var key in this._autoregister[name]) {
      lib.register(key, this._autoregister[name][key])
    }

    this._cache[name] = lib
    return lib
  }
}


},{"./libraries":8}],16:[function(require,module,exports){
var Library = require('./library')

module.exports = DefaultTags

function DefaultTags() {
  Library.call(this, this.builtins)
}

var cons = DefaultTags
  , proto = cons.prototype = new Library

proto.constructor = cons

proto.builtins = {
    'block': require('./tags/block').parse
  , 'comment': require('./tags/comment').parse
  , 'debug': require('./tags/debug').parse
  , 'extends': require('./tags/extends').parse
  , 'for': require('./tags/for').parse
  , 'if': require('./tags/if/node').parse
  , 'include': require('./tags/include').parse
  , 'now': require('./tags/now').parse
  , 'with': require('./tags/with').parse
}

},{"./library":15,"./tags/block":25,"./tags/comment":26,"./tags/debug":27,"./tags/extends":28,"./tags/for":29,"./tags/if/node":30,"./tags/include":31,"./tags/now":32,"./tags/with":33}],17:[function(require,module,exports){
var Library = require('./library')

module.exports = DefaultFilters

function DefaultFilters() {
  Library.call(this, this.builtins)
}

var cons = DefaultFilters
  , proto = cons.prototype = new Library

proto.constructor = cons

proto.builtins = {
    'add': require('./filters/add')
  , 'addslashes': require('./filters/addslashes')
  , 'capfirst': require('./filters/capfirst')
  , 'center': require('./filters/center')
  , 'cut': require('./filters/cut')
  , 'date': require('./filters/date')
  , 'default': require('./filters/default')
  , 'dictsort': require('./filters/dictsort')
  , 'dictsortreversed': require('./filters/dictsortreversed')
  , 'divisibleby': require('./filters/divisibleby')
  , 'escape': require('./filters/escape')
  , 'filesizeformat': require('./filters/filesizeformat')
  , 'first': require('./filters/first')
  , 'floatformat': require('./filters/floatformat')
  , 'force_escape': require('./filters/force_escape')
  , 'get_digit': require('./filters/get_digit')
  , 'index': require('./filters/index')
  , 'iteritems': require('./filters/iteritems')
  , 'iriencode': require('./filters/iriencode')
  , 'join': require('./filters/join')
  , 'last': require('./filters/last')
  , 'length': require('./filters/length')
  , 'length_is': require('./filters/length_is')
  , 'linebreaks': require('./filters/linebreaks')
  , 'linebreaksbr': require('./filters/linebreaksbr')
  , 'linenumbers': require('./filters/linenumbers')
  , 'ljust': require('./filters/ljust')
  , 'lower': require('./filters/lower')
  , 'make_list': require('./filters/make_list')
  , 'phone2numeric': require('./filters/phone2numeric')
  , 'pluralize': require('./filters/pluralize')
  , 'random': require('./filters/random')
  , 'rjust': require('./filters/rjust')
  , 'safe': require('./filters/safe')
  , 'slice': require('./filters/slice')
  , 'slugify': require('./filters/slugify')
  , 'split': require('./filters/split')
  , 'striptags': require('./filters/striptags')
  , 'timesince': require('./filters/timesince')
  , 'timeuntil': require('./filters/timeuntil')
  , 'title': require('./filters/title')
  , 'truncatechars': require('./filters/truncatechars')
  , 'truncatewords': require('./filters/truncatewords')
  , 'unordered_list': require('./filters/unordered_list')
  , 'upper': require('./filters/upper')
  , 'urlencode': require('./filters/urlencode')
  , 'urlize': require('./filters/urlize')
  , 'urlizetrunc': require('./filters/urlizetrunc')
  , 'wordcount': require('./filters/wordcount')
  , 'wordwrap': require('./filters/wordwrap')
  , 'yesno': require('./filters/yesno')
}


},{"./library":15,"./filters/add":34,"./filters/addslashes":35,"./filters/capfirst":36,"./filters/center":37,"./filters/cut":38,"./filters/date":39,"./filters/default":40,"./filters/dictsort":41,"./filters/dictsortreversed":42,"./filters/divisibleby":43,"./filters/escape":44,"./filters/filesizeformat":45,"./filters/first":46,"./filters/floatformat":47,"./filters/force_escape":48,"./filters/get_digit":49,"./filters/iteritems":50,"./filters/index":51,"./filters/iriencode":52,"./filters/join":53,"./filters/last":54,"./filters/length":55,"./filters/linebreaks":56,"./filters/length_is":57,"./filters/linebreaksbr":58,"./filters/linenumbers":59,"./filters/ljust":60,"./filters/lower":61,"./filters/make_list":62,"./filters/phone2numeric":63,"./filters/pluralize":64,"./filters/random":65,"./filters/rjust":66,"./filters/safe":67,"./filters/slice":68,"./filters/slugify":69,"./filters/split":70,"./filters/striptags":71,"./filters/timesince":72,"./filters/timeuntil":73,"./filters/title":74,"./filters/truncatechars":75,"./filters/truncatewords":76,"./filters/unordered_list":77,"./filters/upper":78,"./filters/urlencode":79,"./filters/urlize":80,"./filters/urlizetrunc":81,"./filters/wordcount":82,"./filters/wordwrap":83,"./filters/yesno":84}],18:[function(require,module,exports){
module.exports = Token

function Token(content, line) {
  this.content = content
  this.line = line

  this.name = content && content.split(' ')[0]
}

var cons = Token
  , proto = cons.prototype

proto.toString = function() {
  // NB: this should only be
  // debug output, so it's
  // probably safe to use
  // JSON.stringify here.
  return '<'+this.constructor.name+': '+JSON.stringify(this.content)+'>'
}

proto.is = function(names) {
  for(var i = 0, len = names.length; i < len; ++i)
    if(names[i] === this.name)
      return true
  return false
}

},{}],20:[function(require,module,exports){
module.exports = TextNode

function TextNode(content) {
  this.content = content
}

var cons = TextNode
  , proto = cons.prototype

proto.render = function(context) {
  return this.content
}

},{}],22:[function(require,module,exports){
module.exports = FilterChain

function FilterChain(bits) {
  this.bits = bits
}

var cons = FilterChain
  , proto = cons.prototype

proto.attach = function(parser) {
  for(var i = 0, len = this.bits.length; i < len; ++i) {
    if(this.bits[i] && this.bits[i].attach) { 
      this.bits[i].attach(parser)
    }
  }
}

proto.resolve = function(context) {
  var result = this.bits[0].resolve ?
      this.bits[0].resolve(context) :
      this.bits[0]

  for(var i = 1, len = this.bits.length; i < len; ++i) {
    result = this.bits[i].resolve(context, result)
  }

  return result
}


},{}],26:[function(require,module,exports){
module.exports = CommentNode

function CommentNode() {
  // no-op.
}

var cons = CommentNode
  , proto = cons.prototype

proto.render = function(context) {
  return ''
}

cons.parse = function(contents, parser) {
  nl = parser.parse(['endcomment'])
  parser.tokens.shift()

  return new cons
}

},{}],34:[function(require,module,exports){
module.exports = function(input, value) {
  return parseInt(input, 10) + parseInt(value, 10)
}

},{}],35:[function(require,module,exports){
module.exports = function(input) {
  return input.toString().replace(/'/g, "\\'")
}

},{}],36:[function(require,module,exports){
module.exports = function(input) {
  var str = input.toString();
  return [str.slice(0,1).toUpperCase(), str.slice(1)].join('')
}

},{}],37:[function(require,module,exports){
module.exports = function(input, len, ready) {
  if(ready === undefined)
    len = 0

  var str = input.toString()
    , value = ' '

  len -= str.length
  if(len < 0) { 
    return str
  }

  var len_half = len/2.0
    , arr = []
    , idx = Math.floor(len_half)

  while(idx-- > 0) {
    arr.push(value)
  }

  arr = arr.join('')
  str = arr + str + arr
  if((len_half - Math.floor(len_half)) > 0) {
    str = input.toString().length % 2 == 0 ? value + str : str + value
  }
  
  return str
}

},{}],38:[function(require,module,exports){
module.exports = function(input, value) {
  var str = input.toString()
  return str.replace(new RegExp(value, "g"), '')
}

},{}],40:[function(require,module,exports){
module.exports = function(input, def, ready) {
  return input ? input : def
}

},{}],43:[function(require,module,exports){
module.exports = function(input, num) {
  return input % parseInt(num, 10) == 0
}

},{}],45:[function(require,module,exports){
module.exports = function(input) {
  var num = (new Number(input)).valueOf()
    , singular = num == 1 ? '' : 's'
    , value 
    
  value =
    num < 1024 ? num + ' byte'+singular :
    num < (1024*1024) ? (num/1024)+' KB' :
    num < (1024*1024*1024) ? (num / (1024*1024)) + ' MB' :
    num / (1024*1024*1024) + ' GB'

  return value
}

},{}],47:[function(require,module,exports){
module.exports = function(input, val) {
  val = parseInt(val, 10)
  val = isNaN(val) ? -1 : val

  var isPositive = val >= 0
    , asNumber = parseFloat(input)
    , absValue = Math.abs(val)
    , pow = Math.pow(10, absValue)
    , pow_minus_one = Math.pow(10, Math.max(absValue-1, 0))
    , asString

  asNumber = Math.round((pow * asNumber) / pow_minus_one)

  if(val !== 0)
    asNumber /= 10

  asString = asNumber.toString()

  if(isPositive) {
    var split = asString.split('.')
      , decimal = split.length > 1 ? split[1] : ''

    while(decimal.length < val) {
      decimal += '0'
    }

    asString = decimal.length ? [split[0], decimal].join('.') : split[0]
  }

  return asString
}

},{}],49:[function(require,module,exports){
module.exports = function(input, digit) {
  var isNum = !isNaN(parseInt(input, 10))
    , str = input.toString()
    , len = str.split('').length

  digit = parseInt(digit, 10)
  if(isNum && !isNaN(digit) && digit <= len) {
    return str.charAt(len - digit)
  }

  return input
}

},{}],50:[function(require,module,exports){
module.exports = function(input) {
  var output = []
  for(var name in input) if(input.hasOwnProperty(name)) {
    output.push([name, input[name]])
  }
  return output
}

},{}],46:[function(require,module,exports){
module.exports = function(input) {
  return input[0]
}

},{}],51:[function(require,module,exports){

},{}],52:[function(require,module,exports){
module.exports = function(input) {
  return input
}

},{}],54:[function(require,module,exports){
module.exports = function(input) {
  var cb = input.charAt || function(ind) { return input[ind]; }

  return cb.call(input, input.length-1);
}

},{}],41:[function(require,module,exports){
module.exports = function(input, key) {
  return input.sort(function(x, y) {
    if(x[key] > y[key]) return 1
    if(x[key] == y[key]) return 0
    if(x[key] < y[key]) return -1
  })
}

},{}],53:[function(require,module,exports){
module.exports = function(input, glue) {
  input = input instanceof Array ? input : input.toString().split('')
  return input.join(glue)
}

},{}],57:[function(require,module,exports){
module.exports = function(input, expected, ready) {
  var tmp
  if(input && typeof input.length === 'function') {
    tmp = input.length(function(err, len) {
      ready(err, err ? null : len === expected)
    })

    return tmp === undefined ? undefined : tmp === expected
  }

  return input.length === expected
}

},{}],59:[function(require,module,exports){
module.exports = function(input) {
  var str = input.toString()
    , bits = str.split('\n')
    , out = []
    , len = bits.length

  while(bits.length) {
    out.unshift(len - out.length + '. ' + bits.pop())
  }

  return out.join('\n')
}

},{}],60:[function(require,module,exports){
module.exports = function(input, num) {
  var bits = (input === null || input === undefined ? '' : input).toString().split('')
    , difference = num - bits.length

  // push returns new length of array.
  while(difference > 0) {
    difference = num - bits.push(' ')
  }

  return bits.join('')
}

},{}],61:[function(require,module,exports){
module.exports = function(input) {
  return input.toString().toLowerCase()
}

},{}],62:[function(require,module,exports){
module.exports = function(input) {
  input = input instanceof Array ? input : input.toString().split('')

  return input
}

},{}],64:[function(require,module,exports){
module.exports = function(input, plural) {
  plural = (plural || 's').split(',')

  var val = Number(input)
    , suffix

  suffix = plural[plural.length-1];
  if(val === 1) {
    suffix = plural.length > 1 ? plural[0] : '';    
  }

  return suffix
}

},{}],65:[function(require,module,exports){
module.exports = function(input) {
  var cb = input.charAt || function(idx) {
    return this[idx];
  };

  return cb.call(input, Math.floor(Math.random() * input.length))
}

},{}],66:[function(require,module,exports){
module.exports = function(input, num) {
  var bits = (input === null || input === undefined ? '' : input).toString().split('')
    , difference = num - bits.length

  // push returns new length of array.
  // NB: [].unshift returns `undefined` in IE<9.
  while(difference > 0) {
    difference = (bits.unshift(' '), num - bits.length)
  }

  return bits.join('')
}

},{}],63:[function(require,module,exports){

var LETTERS = {
'a': '2', 'b': '2', 'c': '2', 'd': '3', 'e': '3',
'f': '3', 'g': '4', 'h': '4', 'i': '4', 'j': '5', 'k': '5', 'l': '5',
'm': '6', 'n': '6', 'o': '6', 'p': '7', 'q': '7', 'r': '7', 's': '7',
't': '8', 'u': '8', 'v': '8', 'w': '9', 'x': '9', 'y': '9', 'z': '9'
};

module.exports = function(input) {
  var str = input.toString().toLowerCase().split('')
    , out = []
    , ltr

  while(str.length) {
    ltr = str.pop()
    out.unshift(LETTERS[ltr] ? LETTERS[ltr] : ltr)
  }

  return out.join('')
}

},{}],68:[function(require,module,exports){
module.exports = function(input, by) {
  by = by.toString()
  if(by.charAt(0) === ':') {
    by = '0'+by
  }

  if(by.charAt(by.length-1) === ':') {
    by = by.slice(0, -1)
  }

  var splitBy = by.split(':')
    , slice = input.slice || (function() {
        input = this.toString()
        return input.slice
      })()

  return slice.apply(input, splitBy)
}

},{}],69:[function(require,module,exports){
module.exports = function(input) {
  input = input.toString()
  return input
        .replace(/[^\w\s\d\-]/g, '')
        .replace(/^\s*/, '')
        .replace(/\s*$/, '')
        .replace(/[\-\s]+/g, '-')
        .toLowerCase()
}

},{}],70:[function(require,module,exports){
module.exports = function(input, by, ready) {
  by = arguments.length === 2 ? ',' : by
  input = ''+input
  return input.split(by)
}

},{}],72:[function(require,module,exports){
module.exports = function(input, n, ready) {
  var input = new Date(input)
    , now   = ready === undefined ? new Date() : new Date(n)
    , diff  = input - now
    , since = Math.abs(diff)

  if(diff > 0)
    return '0 minutes'

  // 365.25 * 24 * 60 * 60 * 1000 === years
  var years =   ~~(since / 31557600000)
    , months =  ~~((since - (years*31557600000)) / 2592000000)
    , days =    ~~((since - (years * 31557600000 + months * 2592000000)) / 86400000)
    , hours =   ~~((since - (years * 31557600000 + months * 2592000000 + days * 86400000)) / 3600000)
    , minutes = ~~((since - (years * 31557600000 + months * 2592000000 + days * 86400000 + hours * 3600000)) / 60000)
    , result = [
        years   ? pluralize(years,    'year') : null
      , months  ? pluralize(months,   'month') : null
      , days    ? pluralize(days,     'day') : null
      , hours   ? pluralize(hours,    'hour') : null
      , minutes ? pluralize(minutes,  'minute') : null
    ]
    , out = []

  for(var i = 0, len = result.length; i < len; ++i) {
    result[i] !== null && out.push(result[i])
  }

  if(!out.length) {
    return '0 minutes'
  }

  return out[0] + (out[1] ? ', ' + out[1] : '')

  function pluralize(x, str) {
    return x + ' ' + str + (x === 1 ? '' : 's')
  }
}

},{}],74:[function(require,module,exports){
module.exports = function(input) {
  var str = input.toString()
    , bits = str.split(/\s{1}/g)
    , out = []
  
  while(bits.length) {
    var word = bits.pop()
    word = word.charAt(0).toUpperCase() + word.slice(1)
    out.push(word)
  }

  out = out.join(' ')
  return out.replace(/([a-z])'([A-Z])/g, function(a, m, x) { return x.toLowerCase() })
}

},{}],75:[function(require,module,exports){
module.exports = function(input, n) {
  var str = input.toString()
    , num = parseInt(n, 10)

  if(isNaN(num))
    return input

  if(input.length <= num)
    return input

  return input.slice(0, num)+'...'
}

},{}],76:[function(require,module,exports){
module.exports = function(input, n) {
  var str = input.toString()
    , num = parseInt(n, 10)
    , words

  if(isNaN(num))
    return input

  words = input.split(/\s+/)

  if(words.length <= num)
    return input

  return words.slice(0, num).join(' ')+'...'
}

},{}],78:[function(require,module,exports){
module.exports = function(input) {
  return input.toString().toUpperCase()
}

},{}],79:[function(require,module,exports){
module.exports = function(input) {
  return escape(input.toString())
}

},{}],82:[function(require,module,exports){
module.exports = function(input) {
  var str = input.toString()
    , bits = str.split(/\s+/g)

  return bits.length
}

},{}],83:[function(require,module,exports){
module.exports = function(input, len) {
  var words = input.toString().split(/\s+/g)
    , out = []
    , len = parseInt(len, 10) || words.length

  while(words.length) {
    out.unshift(words.splice(0, len).join(' '))
  }

  return out.join('\n')
}

},{}],84:[function(require,module,exports){
module.exports = function(input, map) {
  var ourMap = map.toString().split(',')
    , value

  ourMap.length < 3 && ourMap.push(ourMap[1])

  value = ourMap[
    input ? 0 :
    input === false ? 1 :
    2
  ]

  return value
}

},{}],71:[function(require,module,exports){
module.exports = function(input) {
  var str = input.toString()
  return str.replace(/<[^>]*?>/g, '')
}

},{}],55:[function(require,module,exports){
module.exports = function(input, ready) {
  if(input && typeof input.length === 'function') {
    return input.length(ready)
  }
  return input.length
}

},{}],13:[function(require,module,exports){
module.exports = { time: time_format, date: format, DateFormat: DateFormat }

try { require('tz') } catch(e) { }

function capfirst (str) {
  return str.replace(/^(.{1})/, function(a, m) { return m.toUpperCase() })
}

function map (arr, iter) {
  var out = []
  for(var i = 0, len = arr.length; i < len; ++i)
    out.push(iter(arr[i], i, arr))
  return out
}

function reduce(arr, iter, start) {
  arr = arr.slice()
  if(start !== undefined)
    arr.unshift(start)

  if(arr.length === 0)
    throw new Error('reduce of empty array')

  if(arr.length === 1)
    return arr[0]

  var out = arr.slice()
    , item = arr.shift()

  do {
    item = iter(item, arr.shift())
  } while(arr.length)

  return item
}

function strtoarray(str) {
  var arr = []
  for(var i = 0, len = str.length; i < len; ++i)
    arr.push(str.charAt(i))
  return arr
}

var WEEKDAYS = [ 'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday' ]
  , WEEKDAYS_ABBR = map(WEEKDAYS, function(x) { return strtoarray(x).slice(0, 3).join('') })
  , WEEKDAYS_REV = reduce(map(WEEKDAYS, function(x, i) { return [x, i] }), function(lhs, rhs) { lhs[rhs[0]] = rhs[1]; return lhs }, {})
  , MONTHS = [ 'january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december' ]
  , MONTHS_3 = map(MONTHS, function(x) { return strtoarray(x).slice(0, 3).join('') })
  , MONTHS_3_REV = reduce(map(MONTHS_3, function(x, i) { return [x, i] }), function(lhs, rhs) { lhs[rhs[0]] = rhs[1]; return lhs }, {})
  , MONTHS_AP = [
    'Jan.'
  , 'Feb.'
  , 'March'
  , 'April'
  , 'May'
  , 'June'
  , 'July'
  , 'Aug.'
  , 'Sept.'
  , 'Oct.'
  , 'Nov.'
  , 'Dec.'
  ]


var MONTHS_ALT = {
  1: 'January',
  2: 'February',
  3: 'March',
  4: 'April',
  5: 'May',
  6: 'June',
  7: 'July',
  8: 'August',
  9: 'September',
  10: 'October',
  11: 'November',
  12: 'December'
}

function Formatter(t) {
  this.data = t
}

Formatter.prototype.format = function(str) {
  var bits = strtoarray(str)
  , esc = false
  , out = []
  , bit

  while(bits.length) {
    bit = bits.shift()

    if(esc) {
      out.push(bit)
      esc = false
    } else if(bit === '\\') {
      esc = true
    } else if(this[bit]) {
      out.push(this[bit]())
    } else {
      out.push(bit)
    }
  }

  return out.join('')
}

function TimeFormat(t) {
  Formatter.call(this, t)
}

var proto = TimeFormat.prototype = new Formatter()

proto.a = function() {
  // 'a.m.' or 'p.m.'
  if (this.data.getHours() > 11)
    return 'p.m.'
  return 'a.m.'
}

proto.A = function() {
  // 'AM' or 'PM'
  if (this.data.getHours() > 11)
    return 'PM'
  return 'AM'
}

proto.f = function() {
  /*
  Time, in 12-hour hours and minutes, with minutes left off if they're
  zero.
  Examples: '1', '1:30', '2:05', '2'
  Proprietary extension.
  */
  if (this.data.getMinutes() == 0)
    return this.g()
  return this.g() + ":" + this.i()
}

proto.g = function() {
  // Hour, 12-hour format without leading zeros i.e. '1' to '12'
  var h = this.data.getHours()

  return this.data.getHours() % 12 || 12
}

proto.G = function() {
  // Hour, 24-hour format without leading zeros i.e. '0' to '23'
  return this.data.getHours()
}

proto.h = function() {
  // Hour, 12-hour format i.e. '01' to '12'
  return ('0'+this.g()).slice(-2)
}

proto.H = function() {
  // Hour, 24-hour format i.e. '00' to '23'
  return ('0'+this.G()).slice(-2)
}

proto.i = function() {
  // Minutes i.e. '00' to '59'
  return ('0' + this.data.getMinutes()).slice(-2)
}

proto.P = function() {
  /*
  Time, in 12-hour hours, minutes and 'a.m.'/'p.m.', with minutes left off
  if they're zero and the strings 'midnight' and 'noon' if appropriate.
  Examples: '1 a.m.', '1:30 p.m.', 'midnight', 'noon', '12:30 p.m.'
  Proprietary extension.
  */
  var m = this.data.getMinutes()
    , h = this.data.getHours()

  if (m == 0 && h == 0)
    return 'midnight'
  if (m == 0 && h == 12)
    return 'noon'
  return this.f() + " " + this.a()
}

proto.s = function() {
  // Seconds i.e. '00' to '59'
  return ('0'+this.data.getSeconds()).slice(-2)
}

proto.u = function() {
  // Microseconds
  return this.data.getMilliseconds()
}

// DateFormat

function DateFormat(t) {
  this.data = t
  this.year_days = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334]
}

proto = DateFormat.prototype = new TimeFormat()

proto.contructor = DateFormat

proto.b = function() {
  // Month, textual, 3 letters, lowercase e.g. 'jan'
  return MONTHS_3[this.data.getMonth()]
}

proto.c= function() {
  /*
  ISO 8601 Format
  Example : '2008-01-02T10:30:00.000123'
  */
  return this.data.toISOString ? this.data.toISOString() : ''
}

proto.d = function() {
  // Day of the month, 2 digits with leading zeros i.e. '01' to '31'
  return ('0'+this.data.getDate()).slice(-2)
}

proto.D = function() {
  // Day of the week, textual, 3 letters e.g. 'Fri'
  return capfirst(WEEKDAYS_ABBR[this.data.getDay()])
}

proto.E = function() {
  // Alternative month names as required by some locales. Proprietary extension.
  return MONTHS_ALT[this.data.getMonth()+1]
}

proto.F= function() {
  // Month, textual, long e.g. 'January'
  return capfirst(MONTHS[this.data.getMonth()])
}

proto.I = function() {
  // '1' if Daylight Savings Time, '0' otherwise.
  return this.data.isDST() ? '1' : '0'
}

proto.j = function() {
  // Day of the month without leading zeros i.e. '1' to '31'
  return this.data.getDate()
}

proto.l = function() {
  // Day of the week, textual, long e.g. 'Friday'
  return capfirst(WEEKDAYS[this.data.getDay()])
}

proto.L = function() {
  // Boolean for whether it is a leap year i.e. True or False
  // Selects this year's February 29th and checks if the month
  // is still February.
  return (new Date(this.data.getFullYear(), 1, 29).getMonth()) === 1
}

proto.m = function() {
  // Month i.e. '01' to '12'"
  return ('0'+(this.data.getMonth()+1)).slice(-2)
}

proto.M = function() {
  // Month, textual, 3 letters e.g. 'Jan'
  return capfirst(MONTHS_3[this.data.getMonth()])
}

proto.n = function() {
  // Month without leading zeros i.e. '1' to '12'
  return this.data.getMonth() + 1
}

proto.N = function() {
  // Month abbreviation in Associated Press style. Proprietary extension.
  return MONTHS_AP[this.data.getMonth()]
}

proto.O = function() {
  // Difference to Greenwich time in hours e.g. '+0200'

  var tzoffs = this.data.getTimezoneOffset()
    , offs = ~~(tzoffs / 60)
    , mins = ('00' + ~~Math.abs(tzoffs % 60)).slice(-2)
  
  return ((tzoffs > 0) ? '-' : '+') + ('00' + Math.abs(offs)).slice(-2) + mins
}

proto.r = function() {
  // RFC 2822 formatted date e.g. 'Thu, 21 Dec 2000 16:01:07 +0200'
  return this.format('D, j M Y H:i:s O')
}

proto.S = function() {
  /* English ordinal suffix for the day of the month, 2 characters i.e. 'st', 'nd', 'rd' or 'th' */
  var d = this.data.getDate()

  if (d >= 11 && d <= 13)
    return 'th'
  var last = d % 10

  if (last == 1)
    return 'st'
  if (last == 2)
    return 'nd'
  if (last == 3)
    return 'rd'
  return 'th'
}

proto.t = function() {
  // Number of days in the given month i.e. '28' to '31'
  // Use a javascript trick to determine the days in a month
  return 32 - new Date(this.data.getFullYear(), this.data.getMonth(), 32).getDate()
}

proto.T = function() {
  // Time zone of this machine e.g. 'EST' or 'MDT'
  if(this.data.tzinfo) {
    return this.data.tzinfo().abbr || '???'
  }
  return '???'
}

proto.U = function() {
  // Seconds since the Unix epoch (January 1 1970 00:00:00 GMT)
  // UTC() return milliseconds frmo the epoch
  // return Math.round(this.data.UTC() * 1000)
  return ~~(this.data / 1000)
}

proto.w = function() {
  // Day of the week, numeric, i.e. '0' (Sunday) to '6' (Saturday)
  return this.data.getDay()
}

proto.W = function() {
  // ISO-8601 week number of year, weeks starting on Monday
  // Algorithm from http://www.personal.ecu.edu/mccartyr/ISOwdALG.txt
  var jan1_weekday = new Date(this.data.getFullYear(), 0, 1).getDay() 
    , weekday = this.data.getDay()
    , day_of_year = this.z()
    , week_number
    , i = 365

  if(day_of_year <= (8 - jan1_weekday) && jan1_weekday > 4) {
    if(jan1_weekday === 5 || (jan1_weekday === 6 && this.L.call({data:new Date(this.data.getFullYear()-1, 0, 1)}))) {
      week_number = 53
    } else {
      week_number = 52
    }
  } else {
    if(this.L()) {
      i = 366
    }
    if((i - day_of_year) < (4 - weekday)) {
      week_number = 1
    } else {
      week_number = ~~((day_of_year + (7 - weekday) + (jan1_weekday - 1)) / 7)
      if(jan1_weekday > 4)
        week_number -= 1
    }
  }
  return week_number
}

proto.y = function() {
  // Year, 2 digits e.g. '99'
  return (''+this.data.getFullYear()).slice(-2)
}

proto.Y = function() {
  // Year, 4 digits e.g. '1999'
  return this.data.getFullYear()
}

proto.z = function() {
  // Day of the year i.e. '0' to '365'

  doy = this.year_days[this.data.getMonth()] + this.data.getDate()
  if (this.L() && this.data.getMonth() > 1)
    doy += 1
  return doy
}

proto.Z = function() {
  /*
  Time zone offset in seconds (i.e. '-43200' to '43200'). The offset for
  timezones west of UTC is always negative, and for those east of UTC is
  always positive.
  */
  return this.data.getTimezoneOffset() * -60
}


function format(value, format_string) {
  var df = new DateFormat(value)
  return df.format(format_string)
}


function time_format(value, format_string) {
  var tf = new TimeFormat(value)
  return tf.format(format_string)
}

},{"tz":85}],19:[function(require,module,exports){
module.exports = FilterNode

var Promise = require('./promise')
  , debug = require('./debug')

function FilterNode(filter) {
  this.filter = filter
}

var cons = FilterNode
  , proto = cons.prototype

cons.escape = escapeHTML

proto.render = safely(function(context) {
  var self = this
    , result = self.filter.resolve(context)
    , promise

  if(result === undefined)
    return ''

  if(result && result.constructor === Promise) {
    promise = new Promise

    result.once('done', function(result) {
      promise.resolve(self.format(result))
    })

    return promise
  }

  return self.format(result)
})

proto.format = function(result) {
  if(result && result.safe) {
    return result.toString()
  }

  if(result === null || result === undefined)
    return ''

  return escapeHTML(result+'')
}

function safely(fn) {
  return function(context) {
    try {
      return fn.call(this, context)
    } catch(err) {
      debug.info(err) 
      return ''
    }
  }
}

function escapeHTML(str) {
  return str
    .replace(/\&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

},{"./promise":2,"./debug":1}],21:[function(require,module,exports){
module.exports = NodeList

var Promise = require('./promise')

function NodeList(nodes) {
  this.nodes = nodes
}

var cons = NodeList
  , proto = cons.prototype

proto.render = function(context) {
  var promises = []
    , results = []
    , nodes = this.nodes
    , result

  for(var i = 0, len = nodes.length; i < len; ++i) {
    results[i] = result = nodes[i].render(context)

    if(result.constructor === Promise) {
      promises.push(result)
    }
  }

  if(promises.length) {
    return this.resolvePromises(results, promises) 
  }

  return results.join('')
}

proto.resolvePromises = function(results, promises) {
  var self = this
    , promise = new Promise
    , total = promises.length

  for(var i = 0, p = 0, len = results.length; i < len; ++i) {
    if(results[i].constructor !== Promise) 
      continue

    promises[p++].once('done', bind(i, function(idx, result) {
      results[idx] = result

      if(!--total)
        promise.resolve(results.join(''))
    }))
  }

  return promise
}

function bind(num, fn) {
  return function(result) {
    return fn(num, result)
  }
}

},{"./promise":2}],23:[function(require,module,exports){
module.exports = FilterLookup

var Promise = require('./promise')

function FilterLookup(bits) {
  this.bits = bits
}

var cons = FilterLookup
  , proto = cons.prototype

proto.resolve = function(context, fromIDX) {
  fromIDX = fromIDX || 0

  var self = this
    , bits = self.bits
    , current = context
    , temporary = null
    , promise
    , result
    , next

  for(var i = fromIDX, len = bits.length; i < len; ++i) {
    if(current === undefined || current === null) {
      break
    }

    // fix for IE:
    if(bits[i] === 'super') {
      bits[i] = '_super'
    }

    next = current[bits[i]]

    // could be async, could be sync.
    if(typeof next === 'function') {
      promise = new Promise

      promise.once('done', function(data) {
        temporary = data
      })

      current = next.call(current, function(err, data) {
        promise.resolve(err ? null : self.resolve(data, i+1))
      })

      if(temporary !== null)
        current = temporary

      promise.trigger = temporary = null

      if(current === undefined)
        return promise

    } else {
      current = next
    }

  } 

  return current
}

},{"./promise":2}],24:[function(require,module,exports){
module.exports = FilterApplication

var Promise = require('./promise')

function FilterApplication(name, bits) {
  this.name = name
  this.args = bits
  this.filter = null
}

var cons = FilterApplication
  , proto = cons.prototype

proto.attach = function(parser) {
  this.filter = parser.filters.lookup(this.name)
}

proto.resolve = function(context, value, fromIDX, argValues) {
  var self = this
    , promise
    , start = fromIDX || 0
    , result
    , tmp

  argValues = argValues || []

  if(value === undefined) {
    return
  }

  if(value && value.constructor === Promise) {
    promise = new Promise
    value.once('done', function(val) {
      promise.resolve(self.resolve(context, val))
    })

    // start over once we've resolved the base value
    return promise
  }

  for(var i = start, len = self.args.length; i < len; ++i) {
    var argValue = self.args[i].resolve ? 
        self.args[i].resolve(context) :
        self.args[i]

    if(argValue === undefined || argValue === null) {
      argValues[i] = argValue
      continue
    }

    if(argValue.constructor === Promise) {
      promise = new Promise

      argValue.once('done', function(val) {
        argValues[i] = val
        promise.resolve(self.resolve( 
            context
          , value
          , i
          , argValues
        ))
      })

      return promise
    }

    argValues[i] = argValue
  }

  promise = new Promise
  tmp = self.filter.apply(null, [value].concat(argValues).concat([ready]))

  if(tmp !== undefined) {
    result = tmp
  }

  if(result === undefined) {
    return promise
  }

  return result

  function ready(err, data) {
    if(promise.trigger) 
      return promise.resolve(err ? err : data)

    result = data
  }
}

},{"./promise":2}],25:[function(require,module,exports){
module.exports = BlockNode

var Promise = require('../promise')
  , BlockContext = require('../block_context')

function BlockNode(name, nodes) {
  this.name = name
  this.nodes = nodes

  this.context = null
}

var cons = BlockNode
  , proto = cons.prototype

proto.render = function(context) {
  var self = this
    , blockContext = BlockContext.from(context)
    , result
    , block
    , push

  if(!blockContext) {
    context.block = self
    return self.nodes.render(context)
  }

  block = push = blockContext.pop(self.name)

  if(!block) { 
    block = self
  } 

  block = new BlockNode(block.name, block.nodes)

  block.context = context
  block.context.block = block
  context.block = block

  result = block.nodes.render(context)

  if(push) {
    blockContext.push(self.name, push)
  }

  return result

}

proto.isBlockNode = true

proto._super = function() {
  var blockContext = BlockContext.from(this.context)
    , block
    , str

  if(blockContext && (block = blockContext.get(this.name))) {
    str = new String(block.render(this.context))
    str.safe = true
    return str 
  }

  return ''
}

cons.parse = function(contents, parser) {
  var bits = contents.split(' ')
    , name = bits[1]
    , loaded = parser.loadedBlocks
    , nodes

  for(var i = 0, len = loaded.length; i < len; ++i)
    if(loaded[i] === name)
      throw new Error('block tag with the name "'+name+'" appears more than once')

  loaded.push(name)

  nodes = parser.parse(['endblock'])
  parser.tokens.shift()

  return new cons(name, nodes)  
}

},{"../promise":2,"../block_context":86}],27:[function(require,module,exports){
module.exports = DebugNode

var Promise = require('../promise')
  , Context = require('../context')
  , debug = require('../debug')

function DebugNode(varname) {
  this.varname = varname
}

var cons = DebugNode
  , proto = cons.prototype

proto.render = function(context, value) {
  var self = this
    , target = context
    , promise

  if(self.varname !== null) {
    value = arguments.length === 2 ? value : self.varname.resolve(context)
    if(value && value.constructor === Promise) {
      promise = new Promise
      value.once('done', function(data) {
        promise.resolve(self.render(context, data))
      })
      return promise
    }
    target = value
  }

  if(target === context) {
    while(target !== Context.prototype) {
      debug.log(target)
      target = Object.getPrototypeOf(target)
    }
    return ''
  }
  debug.log(target)
  return ''
}

cons.parse = function(contents, parser) {
  var bits = contents.split(' ')

  return new DebugNode(bits[1] ? parser.compile(bits[1]) : null)
}


},{"../context":10,"../promise":2,"../debug":1}],28:[function(require,module,exports){
module.exports = ExtendsNode

var Promise = require('../promise')
  , BlockContext = require('../block_context')


function ExtendsNode(parent, nodes, loader) {
  this.parent = parent
  this.loader = loader

  this.blocks = {}

  for(var i = 0, len = nodes.nodes.length; i < len; ++i) {
    if(!nodes.nodes[i].isBlockNode)
      continue

    this.blocks[nodes.nodes[i].name] = nodes.nodes[i]
  }
}

var cons = ExtendsNode
  , proto = cons.prototype

proto.isExtendsNode = true

proto.render = function(context, parent) {
  var self = this
    , promise

  parent = parent || this.parent.resolve(context)

  if(parent.constructor === Promise) {
    promise = new Promise

    parent.once('done', function(data) {
      promise.resolve(self.render(context, data))
    })

    return promise
  }

  parent = self.get_template(parent)

  if(parent.constructor === Promise) {
    promise = new Promise

    parent.once('done', function(data) {
      promise.resolve(self.render(context, data))
    })  

    return promise
  }

  var blockContext = BlockContext.from(context) || BlockContext.into(context)
    , blocks = {}
    , nodeList = parent.getNodeList()
    , extendsIDX = false

  blockContext.add(self.blocks)

  for(var i = 0, len = nodeList.nodes.length; i < len; ++i) {
    if(nodeList.nodes[i].isExtendsNode) {
      extendsIDX = true
      break
    }

    if(nodeList.nodes[i].isBlockNode) {
      blocks[nodeList.nodes[i].name] = nodeList.nodes[i]
    }
  }

  if(!extendsIDX) {
    blockContext.add(blocks)
  }

  promise = new Promise

  parent.render(context, function(err, data) {
    promise.resolve(data)
  })

  return promise
}

proto.get_template = function(parent) {
  if(typeof parent !== 'string') {
    return parent
  }

  return this.loader(parent)
}

cons.parse = function(contents, parser) {
  var bits = contents.split(' ')
    , parent = parser.compile(bits.slice(1).join(' '))
    , nodes = parser.parse()
    , loader = parser.plugins.lookup('loader')

  return new cons(parent, nodes, loader)
}

},{"../promise":2,"../block_context":86}],29:[function(require,module,exports){
module.exports = ForNode

var NodeList = require('../node_list')
  , Promise = require('../promise')

function ForNode(target, unpack, loop, empty, reversed) {
  this.target = target
  this.unpack = unpack
  this.loop = loop
  this.empty = empty
  this.reversed = reversed
}

var cons = ForNode
  , proto = cons.prototype

function getInIndex(bits) {
  for(var i = 0, len = bits.length; i < len; ++i)
    if(bits[i] === 'in')
      return i

  return -1 
}

proto.render = function(context, value) {
  var self = this
    , arr = value || self.target.resolve(context)
    , promise


  if(arr && arr.constructor === Promise) {
    promise = new Promise
    arr.once('done', function(data) {
      promise.resolve(self.render(context, data))
    })

    return promise
  }

  if(arr === undefined || arr === null) {
    arr = []
  }

  var bits = []
    , promises = []
    , parent = context.forloop
    , loop = {}
    , result
    , ctxt
    , sub

  if(!('length' in arr)) {
    for(var key in arr) if(arr.hasOwnProperty(key)) {
      bits.push(key)
    }

    arr = bits.slice()
    bits.length = 0
  }

  if(!arr.length) {
    return self.empty.render(context)
  }

  sub = self.reversed ? arr.length - 1 : 0

  for(var i = 0, len = arr.length, idx; i < len; ++i) {
    ctxt = context.copy()
    idx = Math.abs(sub - i)
    loop.counter = i + 1
    loop.counter0 = i
    loop.revcounter = len - i
    loop.revcounter0 = len - (i + 1)
    loop.first = i === 0
    loop.last = i === len - 1
    loop.parentloop = parent 
    ctxt.forloop = loop

    if(self.unpack.length === 1)
      ctxt[self.unpack[0]] = arr[idx]
    else for(var u = 0; u < self.unpack.length; ++u)
      ctxt[self.unpack[u]] = arr[idx][u]

    result = self.loop.render(ctxt)
    if(result.constructor === Promise)
      promises.push(result)
     
    bits.push(result) 
  }

  if(promises.length) {
    return self.loop.resolvePromises(bits, promises)
  }

  return bits.join('')
}

cons.parse = function(contents, parser) {
  var bits = contents.split(/\s+/)
    , reversed = bits[bits.length-1] === 'reversed'
    , idxIn = getInIndex(bits)
    , variables = bits.slice(1, idxIn)
    , target = parser.compile(bits[idxIn+1])
    , nodelist = parser.parse(['empty', 'endfor'])
    , unpack = []
    , empty


  if(parser.tokens.shift().is(['empty'])) {
    empty = parser.parse(['endfor'])
    parser.tokens.shift()
  } else {
    empty = new NodeList([])
  }

  variables = variables.join(' ').split(',')
  for(var i = 0, len = variables.length; i < len; ++i) {
    variables[i] = variables[i].replace(/(^\s+|\s+$)/, '')
    if(variables[i])
      unpack.push(variables[i])
  }

  return new cons(target, unpack, nodelist, empty, reversed);
}

},{"../node_list":21,"../promise":2}],32:[function(require,module,exports){
module.exports = NowNode

var format = require('../date').date

function NowNode(formatString) {
  this.format = formatString
}

var cons = NowNode
  , proto = cons.prototype

proto.render = function(context) {
  return format(new Date, this.format)
}

cons.parse = function(contents, parser) {
  var bits = contents.split(' ')
    , fmt = bits.slice(1).join(' ')

  fmt = fmt
    .replace(/^\s+/, '')
    .replace(/\s+$/, '')

  if(/['"]/.test(fmt.charAt(0))) {
    fmt = fmt.slice(1, -1)
  }

  return new NowNode(fmt || 'N j, Y')
}

},{"../date":13}],31:[function(require,module,exports){
module.exports = IncludeNode

var Promise = require('../promise')

function IncludeNode(target_var, loader) {
  this.target_var = target_var
  this.loader = loader
}

var cons = IncludeNode
  , proto = cons.prototype

cons.parse = function(contents, parser) {
  var bits = contents.split(' ')
    , varname = parser.compile(bits.slice(1).join(' '))
    , loader = parser.plugins.lookup('loader')

  return new cons(varname, loader) 
}

proto.render = function(context, target) {
  var self = this
    , promise

  target = target || this.target_var.resolve(context)

  if(target && target.constructor === Promise) {
    promise = new Promise

    target.once('done', function(data) {
      promise.resolve(self.render(context, data))
    })

    return promise
  }

  target = self.get_template(target)

  if(target && target.constructor === Promise) {
    promise = new Promise

    target.once('done', function(data) {
      promise.resolve(self.render(context, data))
    })  

    return promise
  }

  promise = new Promise

  target.render(context.copy(), function(err, data) {
    promise.resolve(data)
  })

  return promise
}

proto.get_template = function(target) {
  if(typeof target === 'string') {
    return this.loader(target)
  }

  // okay, it's probably a template object
  return target
}

},{"../promise":2}],33:[function(require,module,exports){
module.exports = WithNode

var Promise = require('../promise')

function WithNode(with_var, as_var, nodes) {
  this.with_var = with_var
  this.as_var = as_var
  this.nodes = nodes
}

var cons = WithNode
  , proto = cons.prototype

cons.parse = function(contents, parser) {
  var bits = contents.split(/\s+/g)
    , withvar = parser.compile(bits[1])
    , asvar = bits[3]
    , nodelist = parser.parse(['endwith'])

  parser.tokens.shift()
  return new cons(withvar, asvar, nodelist)
}

proto.render = function(context, value) {
  var self = this 
    , result
    , promise

  value = value || self.with_var.resolve(context)

  if(value.constructor === Promise) {
    promise = new Promise

    value.once('done', function(data) {
      promise.resolve(self.render(context, data))
    })

    return promise
  }

  context = context.copy()
  context[self.as_var] = value

  result = self.nodes.render(context)

  return result
}

},{"../promise":2}],39:[function(require,module,exports){
var format = require('../date').date
  
module.exports = function(input, value, ready) {
  if (ready === undefined)
    value = 'N j, Y'

  return format(input.getFullYear ? input : new Date(input), value)
}

},{"../date":13}],42:[function(require,module,exports){
var dictsort = require('./dictsort');

module.exports = function(input, key) {
  return dictsort(input, key).reverse()
}

},{"./dictsort":41}],44:[function(require,module,exports){
var FilterNode = require('../filter_node')

module.exports = function(input) {
  if(input && input.safe) {
    return input
  }

  input = new String(FilterNode.escape(input))
  input.safe = true
  return input
}

},{"../filter_node":19}],48:[function(require,module,exports){
var FilterNode = require('../filter_node')

module.exports = function(input) {
  var x = new String(FilterNode.escape(input+''))
  x.safe = true
  return x
}

},{"../filter_node":19}],56:[function(require,module,exports){
var safe = require('./safe')

module.exports = function(input) {
  var str = input.toString()
    , paras = str.split('\n\n')
    , out = []

  while(paras.length) {
    out.unshift(paras.pop().replace(/\n/g, '<br />'))
  }

  return safe('<p>'+out.join('</p><p>')+'</p>')
}

},{"./safe":67}],58:[function(require,module,exports){
var safe = require('./safe')

module.exports = function(input) {
  var str = input.toString()
  return safe(str.replace(/\n/g, '<br />'))
}

},{"./safe":67}],67:[function(require,module,exports){
var FilterNode = require('../filter_node')

module.exports = function(input) {
  input = new String(input)
  input.safe = true
  return input
}

},{"../filter_node":19}],73:[function(require,module,exports){
var timesince = require('./timesince').timesince

module.exports = function(input, n) {
  var now = n ? new Date(n) : new Date()
  return timesince(now, input)
}

},{"./timesince":72}],77:[function(require,module,exports){
var safe = require('./safe');

var ulparser = function(list) {
  var out = []
    , l = list.slice()
    , item

  while(l.length) {
    item = l.pop()

    if(item instanceof Array)
      out.unshift('<ul>'+ulparser(item)+'</ul>')
    else
      out.unshift('</li><li>'+item)
  }

  // get rid of the leading </li>, if any. add trailing </li>.
  return out.join('').replace(/^<\/li>/, '') + '</li>'
}

module.exports = function(input) {
  return input instanceof Array ?
    safe(ulparser(input)) :
    input
}

},{"./safe":67}],80:[function(require,module,exports){
var safe = require('./safe')

module.exports = function(input) {
  var str = input.toString()
  return safe(str.replace(/(((http(s)?:\/\/)|(mailto:))([\w\d\-\.:@\/])+)/g, function() {
    return '<a href="'+arguments[0]+'">'+arguments[0]+'</a>'; 
  }))
}

},{"./safe":67}],81:[function(require,module,exports){
var safe = require('./safe')

module.exports = function(input, len) {
  var str = input.toString()
  len = parseInt(len, 10) || 1000
  return safe(str.replace(/(((http(s)?:\/\/)|(mailto:))([\w\d\-\.:@])+)/g, function() {
    var ltr = arguments[0].length > len ? arguments[0].slice(0, len) + '...' : arguments[0];
    return '<a href="'+arguments[0]+'">'+ltr+'</a>'; 
  }))
}

},{"./safe":67}],30:[function(require,module,exports){
module.exports = IfNode

var Promise = require('../../promise')
  , NodeList = require('../../node_list')
  , Parser = require('./parser')

function IfNode(predicate, when_true, when_false) {
  this.predicate = predicate
  this.when_true = when_true
  this.when_false = when_false
}

var cons = IfNode
  , proto = cons.prototype

proto.render = function(context, result, times) {
  var self = this
    , promise

  result = times === 1 ? result : this.predicate.evaluate(context)

  if(result && result.constructor === Promise) {
    promise = new Promise

    result.once('done', function(value) {
      promise.resolve(self.render(context, value, 1))
    })

    return promise
  }

  if(result) {
    return this.when_true.render(context)
  }
  return this.when_false.render(context)
}

cons.parse = function(contents, parser) {
  var bits = contents.split(' ').slice(1)
    , ifp = new Parser(bits, parser)
    , predicate
    , when_true
    , when_false
    , next

  predicate = ifp.parse()

  when_true = parser.parse(['else', 'endif'])

  next = parser.tokens.shift()

  if(!next.is(['else'])) {
    when_false = new NodeList([])
  } else {
    when_false = parser.parse(['endif'])
    parser.tokens.shift()
  }

  return new cons(predicate, when_true, when_false)
}

},{"../../promise":2,"../../node_list":21,"./parser":87}],86:[function(require,module,exports){
module.exports = BlockContext

function BlockContext() {
  this.blocks = {}
}

var cons = BlockContext
  , proto = cons.prototype

cons.KEY = '__BLOCK_CONTEXT__'

cons.from = function(context) {
  return context[this.KEY]
}

cons.into = function(context) {
  return context[this.KEY] = new this()
}

proto.add = function(blocks) {
  for(var name in blocks) {
    (this.blocks[name] = this.blocks[name] || []).unshift(blocks[name])
  }
}

proto.get = function(name) {
  var list = this.blocks[name] || []

  return list[list.length - 1]
}

proto.push = function(name, block) {
  (this.blocks[name] = this.blocks[name] || []).push(block)
}

proto.pop = function(name) {
  return (this.blocks[name] = this.blocks[name] || []).pop()
}

},{}],88:[function(require,module,exports){
module.exports = {
  "+0900": [
    {
      "loc": "Asia", 
      "abbr": "JST", 
      "name": "Japan Standard Time"
    }, 
    {
      "loc": "Australia", 
      "abbr": "WDT", 
      "name": "Western Daylight Time"
    } 
  ], 
  "+1345": [
    {
      "loc": "Pacific", 
      "abbr": "CHADT", 
      "name": "Chatham Island Daylight Time"
    }
  ], 
  "+0500": [
    {
      "loc": "Asia", 
      "abbr": "PKT", 
      "name": "Pakistan Standard Time"
    } 
  ], 
  "+0430": [
    {
      "loc": "Asia", 
      "abbr": "AFT", 
      "name": "Afghanistan Time"
    }, 
    {
      "loc": "Asia", 
      "abbr": "IRDT", 
      "name": "Iran Daylight Time"
    }
  ], 
  "+1200": [
    {
      "loc": "Asia", 
      "abbr": "ANAST", 
      "name": "Anadyr Summer Time"
    }, 
    {
      "loc": "Asia", 
      "abbr": "ANAT", 
      "name": "Anadyr Time"
    }, 
    {
      "loc": "Pacific", 
      "abbr": "FJT", 
      "name": "Fiji Time"
    }, 
    {
      "loc": "Pacific", 
      "abbr": "GILT", 
      "name": "Gilbert Island Time"
    }, 
    {
      "loc": "Asia", 
      "abbr": "MAGST", 
      "name": "Magadan Summer Time"
    }, 
    {
      "loc": "Pacific", 
      "abbr": "MHT", 
      "name": "Marshall Islands Time"
    }, 
    {
      "loc": "Pacific", 
      "abbr": "NZST", 
      "name": "New Zealand Standard Time"
    }, 
    {
      "loc": "Asia", 
      "abbr": "PETST", 
      "name": "Kamchatka Summer Time"
    }, 
    {
      "loc": "Asia", 
      "abbr": "PETT", 
      "name": "Kamchatka Time"
    }, 
    {
      "loc": "Pacific", 
      "abbr": "TVT", 
      "name": "Tuvalu Time"
    }, 
    {
      "loc": "Pacific", 
      "abbr": "WFT", 
      "name": "Wallis and Futuna Time"
    }
  ], 
  "-1100": [
    {
      "loc": "Pacific", 
      "abbr": "SST", 
      "name": "Samoa Standard Time"
    }, 
    {
      "loc": "Pacific", 
      "abbr": "WST", 
      "name": "West Samoa Time"
    } 
  ], 
  "+1400": [
    {
      "loc": "Pacific", 
      "abbr": "LINT", 
      "name": "Line Islands Time"
    }
  ], 
  "-0230": [
    {
      "loc": "North America", 
      "abbr": "HAT", 
      "name": "Heure Avanc\u00e9e de Terre-Neuve"
    }, 
    {
      "loc": "North America", 
      "abbr": "NDT", 
      "name": "Newfoundland Daylight Time"
    }
  ], 
  "-0100": [
    {
      "loc": "Africa", 
      "abbr": "CVT", 
      "name": "Cape Verde Time"
    }, 
    {
      "loc": "North America", 
      "abbr": "EGT", 
      "name": "East Greenland Time"
    } 
  ], 
  "-1200": [
    {
      "loc": "Military", 
      "abbr": "Y", 
      "name": "Yankee Time Zone"
    }
  ], 
  "+0800": [
    {
      "loc": "Asia", 
      "abbr": "CST", 
      "name": "China Standard Time"
    }, 
    {
      "loc": "Asia", 
      "abbr": "KRAST", 
      "name": "Krasnoyarsk Summer Time"
    }, 
    {
      "loc": "Australia", 
      "abbr": "WST", 
      "name": "Western Standard Time"
    }
  ], 
  "+0630": [
    {
      "loc": "Asia", 
      "abbr": "MMT", 
      "name": "Myanmar Time"
    },
    {
      "loc": "Indian Ocean", 
      "abbr": "CCT", 
      "name": "Cocos Islands Time"
    }
  ], 
  "-0430": [
    {
      "loc": "South America", 
      "abbr": "HLV", 
      "name": "Hora Legal de Venezuela"
    }, 
    {
      "loc": "South America", 
      "abbr": "VET", 
      "name": "Venezuelan Standard Time"
    }
  ], 
  "-0700": [
    {
      "loc": "North America", 
      "abbr": "MST", 
      "name": "Mountain Standard Time"
    }, 
    {
      "loc": "North America", 
      "abbr": "PDT", 
      "name": "Pacific Daylight Time"
    }, 
    {
      "loc": "North America", 
      "abbr": "HAP", 
      "name": "Heure Avanc\u00e9e du Pacifique"
    }, 
    {
      "loc": "North America", 
      "abbr": "HNR", 
      "name": "Heure Normale des Rocheuses"
    } 
  ], 
  "-0200": [
    {
      "loc": "South America", 
      "abbr": "FNT", 
      "name": "Fernando de Noronha Time"
    }, 
    {
      "loc": "North America", 
      "abbr": "WGST", 
      "name": "Western Greenland Summer Time"
    },
    {
      "loc": "North America", 
      "abbr": "PMDT", 
      "name": "Pierre & Miquelon Daylight Time"
    }, 
    {
      "loc": "South America", 
      "abbr": "UYST", 
      "name": "Uruguay Summer Time"
    }, 
    {
      "loc": "South America", 
      "abbr": "BRST", 
      "name": "Brasilia Summer Time"
    } 
  ], 
  "+1030": [
    {
      "loc": "Australia", 
      "abbr": "CDT", 
      "name": "Central Daylight Time"
    }, 
    {
      "loc": "Australia", 
      "abbr": "LHST", 
      "name": "Lord Howe Standard Time"
    }
  ], 
  "+0300": [
    {
      "loc": "Europe", 
      "abbr": "MSK", 
      "name": "Moscow Standard Time"
    },
    {
      "loc": "Asia", 
      "abbr": "IDT", 
      "name": "Israel Daylight Time"
    }, 
    {
      "loc": "Asia", 
      "abbr": "AST", 
      "name": "Arabia Standard Time"
    }, 
    {
      "loc": "Indian Ocean", 
      "abbr": "EAT", 
      "name": "East Africa Time"
    }, 
    {
      "loc": "Europe", 
      "abbr": "EEST", 
      "name": "Eastern European Summer Time"
    }, 
    {
      "loc": "Africa", 
      "abbr": "EAT", 
      "name": "Eastern Africa Time"
    } 
  ], 
  "UTC": [
    {
      "loc": "Atlantic", 
      "abbr": "AZOST", 
      "name": "Azores Summer Time"
    }, 
    {
      "loc": "North America", 
      "abbr": "EGST", 
      "name": "Eastern Greenland Summer Time"
    }, 
    {
      "loc": "Africa", 
      "abbr": "GMT", 
      "name": "Greenwich Mean Time"
    }, 
    {
      "loc": "Europe", 
      "abbr": "GMT", 
      "name": "Greenwich Mean Time"
    }, 
    {
      "loc": "Africa", 
      "abbr": "WET", 
      "name": "Western European Time"
    }, 
    {
      "loc": "Europe", 
      "abbr": "WET", 
      "name": "Western European Time"
    }, 
    {
      "loc": "Africa", 
      "abbr": "WT", 
      "name": "Western Sahara Standard Time"
    }, 
    {
      "loc": "Military", 
      "abbr": "Z", 
      "name": "Zulu Time Zone"
    }
  ], 
  "+0400": [
    {
      "loc": "Asia", 
      "abbr": "AMT", 
      "name": "Armenia Time"
    }, 
    {
      "loc": "Asia", 
      "abbr": "AZT", 
      "name": "Azerbaijan Time"
    }, 
    {
      "loc": "Military", 
      "abbr": "D", 
      "name": "Delta Time Zone"
    }, 
    {
      "loc": "Asia", 
      "abbr": "GET", 
      "name": "Georgia Standard Time"
    }, 
    {
      "loc": "Asia", 
      "abbr": "GST", 
      "name": "Gulf Standard Time"
    }, 
    {
      "loc": "Europe", 
      "abbr": "KUYT", 
      "name": "Kuybyshev Time"
    }, 
    {
      "loc": "Europe", 
      "abbr": "MSD", 
      "name": "Moscow Daylight Time"
    }, 
    {
      "loc": "Africa", 
      "abbr": "MUT", 
      "name": "Mauritius Time"
    }, 
    {
      "loc": "Africa", 
      "abbr": "RET", 
      "name": "Reunion Time"
    }, 
    {
      "loc": "Europe", 
      "abbr": "SAMT", 
      "name": "Samara Time"
    }, 
    {
      "loc": "Africa", 
      "abbr": "SCT", 
      "name": "Seychelles Time"
    }
  ], 
  "+0700": [
    {
      "loc": "Australia", 
      "abbr": "CXT", 
      "name": "Christmas Island Time"
    }, 
    {
      "loc": "Antarctica", 
      "abbr": "DAVT", 
      "name": "Davis Time"
    }, 
    {
      "loc": "Military", 
      "abbr": "G", 
      "name": "Golf Time Zone"
    }, 
    {
      "loc": "Asia", 
      "abbr": "HOVT", 
      "name": "Hovd Time"
    }, 
    {
      "loc": "Asia", 
      "abbr": "ICT", 
      "name": "Indochina Time"
    }, 
    {
      "loc": "Asia", 
      "abbr": "KRAT", 
      "name": "Krasnoyarsk Time"
    }, 
    {
      "loc": "Asia", 
      "abbr": "NOVST", 
      "name": "Novosibirsk Summer Time"
    }, 
    {
      "loc": "Asia", 
      "abbr": "OMSST", 
      "name": "Omsk Summer Time"
    }, 
    {
      "loc": "Asia", 
      "abbr": "WIB", 
      "name": "Western Indonesian Time"
    }
  ], 
  "+0200": [
    {
      "loc": "Military", 
      "abbr": "B", 
      "name": "Bravo Time Zone"
    }, 
    {
      "loc": "Africa", 
      "abbr": "CAT", 
      "name": "Central Africa Time"
    }, 
    {
      "loc": "Europe", 
      "abbr": "CEST", 
      "name": "Central European Summer Time"
    }, 
    {
      "loc": "Africa", 
      "abbr": "EET", 
      "name": "Eastern European Time"
    }, 
    {
      "loc": "Asia", 
      "abbr": "EET", 
      "name": "Eastern European Time"
    }, 
    {
      "loc": "Europe", 
      "abbr": "EET", 
      "name": "Eastern European Time"
    }, 
    {
      "loc": "Asia", 
      "abbr": "IST", 
      "name": "Israel Standard Time"
    }, 
    {
      "loc": "Africa", 
      "abbr": "SAST", 
      "name": "South Africa Standard Time"
    }, 
    {
      "loc": "Africa", 
      "abbr": "WAST", 
      "name": "West Africa Summer Time"
    }
  ], 
  "-1000": [
    {
      "loc": "Pacific", 
      "abbr": "CKT", 
      "name": "Cook Island Time"
    }, 
    {
      "loc": "North America", 
      "abbr": "HAST", 
      "name": "Hawaii-Aleutian Standard Time"
    }, 
    {
      "loc": "Pacific", 
      "abbr": "TAHT", 
      "name": "Tahiti Time"
    }, 
    {
      "loc": "Pacific", 
      "abbr": "TKT", 
      "name": "Tokelau Time"
    }, 
    {
      "loc": "Military", 
      "abbr": "W", 
      "name": "Whiskey Time Zone"
    }
  ], 
  "+0930": [
    {
      "loc": "Australia", 
      "abbr": "CST", 
      "name": "Central Standard Time"
    }
  ], 
  "+0530": [
    {
      "loc": "Asia", 
      "abbr": "IST", 
      "name": "India Standard Time"
    }
  ], 
  "+1300": [
    {
      "loc": "Pacific", 
      "abbr": "FJST", 
      "name": "Fiji Summer Time"
    }, 
    {
      "loc": "Antarctica", 
      "abbr": "NZDT", 
      "name": "New Zealand Daylight Time"
    }, 
    {
      "loc": "Pacific", 
      "abbr": "NZDT", 
      "name": "New Zealand Daylight Time"
    }, 
    {
      "loc": "Pacific", 
      "abbr": "PHOT", 
      "name": "Phoenix Island Time"
    }
  ], 
  "+0545": [
    {
      "loc": "Asia", 
      "abbr": "NPT", 
      "name": "Nepal Time"
    }
  ], 
  "+1000": [
    {
      "loc": "Pacific", 
      "abbr": "ChST", 
      "name": "Chamorro Standard Time"
    }, 
    {
      "loc": "Australia", 
      "abbr": "EST", 
      "name": "Eastern Standard Time"
    }, 
    {
      "loc": "Military", 
      "abbr": "K", 
      "name": "Kilo Time Zone"
    }, 
    {
      "loc": "Pacific", 
      "abbr": "PGT", 
      "name": "Papua New Guinea Time"
    }, 
    {
      "loc": "Asia", 
      "abbr": "VLAT", 
      "name": "Vladivostok Time"
    }, 
    {
      "loc": "Asia", 
      "abbr": "YAKST", 
      "name": "Yakutsk Summer Time"
    }, 
    {
      "loc": "Pacific", 
      "abbr": "YAPT", 
      "name": "Yap Time"
    }
  ], 
  "-0600": [
    {
      "loc": "North America", 
      "abbr": "CST", 
      "name": "Central Standard Time"
    }, 
    {
      "loc": "North America", 
      "abbr": "MDT", 
      "name": "Mountain Daylight Time"
    }, 
    {
      "loc": "Pacific", 
      "abbr": "GALT", 
      "name": "Galapagos Time"
    }, 
    {
      "loc": "North America", 
      "abbr": "HAR", 
      "name": "Heure Avanc\u00e9e des Rocheuses"
    }, 
    {
      "loc": "North America", 
      "abbr": "HNC", 
      "name": "Heure Normale du Centre"
    }, 
    {
      "loc": "Central America", 
      "abbr": "HNC", 
      "name": "Heure Normale du Centre"
    }, 
    {
      "loc": "Central America", 
      "abbr": "CST", 
      "name": "Central Standard Time"
    }, 
    {
      "loc": "Pacific", 
      "abbr": "EAST", 
      "name": "Easter Island Standard Time"
    }
  ], 
  "+0100": [
    {
      "loc": "Europe", 
      "abbr": "CET", 
      "name": "Central European Time"
    }, 
    {
      "loc": "Europe", 
      "abbr": "BST", 
      "name": "British Summer Time"
    }, 
    {
      "loc": "Africa", 
      "abbr": "CET", 
      "name": "Central European Time"
    }, 
    {
      "loc": "Africa", 
      "abbr": "WEST", 
      "name": "Western European Summer Time"
    }, 
    {
      "loc": "Europe", 
      "abbr": "WEST", 
      "name": "Western European Summer Time"
    }, 
    {
      "loc": "Africa", 
      "abbr": "WST", 
      "name": "Western Sahara Summer Time"
    },
    {
      "loc": "Africa", 
      "abbr": "WAT", 
      "name": "West Africa Time"
    }
  ], 
  "-0400": [
    {
      "loc": "North America", 
      "abbr": "AST", 
      "name": "Atlantic Standard Time"
    }, 
    {
      "loc": "North America", 
      "abbr": "EDT", 
      "name": "Eastern Daylight Time"
    }, 
    {
      "loc": "South America", 
      "abbr": "CLT", 
      "name": "Chile Standard Time"
    }, 
    {
      "loc": "South America", 
      "abbr": "FKT", 
      "name": "Falkland Island Time"
    }, 
    {
      "loc": "South America", 
      "abbr": "GYT", 
      "name": "Guyana Time"
    }, 
    {
      "loc": "South America", 
      "abbr": "PYT", 
      "name": "Paraguay Time"
    }, 
    {
      "loc": "South America", 
      "abbr": "AMT", 
      "name": "Amazon Time"
    } 
  ], 
  "-0330": [
    {
      "loc": "North America", 
      "abbr": "NST", 
      "name": "Newfoundland Standard Time"
    }
  ], 
  "-0500": [
    {
      "loc": "North America", 
      "abbr": "EST", 
      "name": "Eastern Standard Time"
    }, 
    {
      "loc": "North America", 
      "abbr": "CDT", 
      "name": "Central Daylight Time"
    }, 
    {
      "loc": "South America", 
      "abbr": "COT", 
      "name": "Colombia Time"
    }, 
    {
      "loc": "Caribbean", 
      "abbr": "CST", 
      "name": "Cuba Standard Time"
    }, 
    {
      "loc": "Pacific", 
      "abbr": "EASST", 
      "name": "Easter Island Summer Time"
    }, 
    {
      "loc": "South America", 
      "abbr": "ECT", 
      "name": "Ecuador Time"
    }, 
    {
      "loc": "Central America", 
      "abbr": "EST", 
      "name": "Eastern Standard Time"
    }, 
    {
      "loc": "Caribbean", 
      "abbr": "EST", 
      "name": "Eastern Standard Time"
    }, 
    {
      "loc": "Central America", 
      "abbr": "ET", 
      "name": "Tiempo del Este"
    }, 
    {
      "loc": "Caribbean", 
      "abbr": "ET", 
      "name": "Tiempo del Este"
    }, 
    {
      "loc": "North America", 
      "abbr": "ET", 
      "name": "Tiempo Del Este"
    }, 
    {
      "loc": "North America", 
      "abbr": "HAC", 
      "name": "Heure Avanc\u00e9e du Centre"
    }, 
    {
      "loc": "South America", 
      "abbr": "PET", 
      "name": "Peru Time"
    } 
  ], 
  "-0900": [
    {
      "loc": "North America", 
      "abbr": "AKST", 
      "name": "Alaska Standard Time"
    }, 
    {
      "loc": "North America", 
      "abbr": "HADT", 
      "name": "Hawaii-Aleutian Daylight Time"
    } 
  ], 
  "-0300": [
    {
      "loc": "North America", 
      "abbr": "ADT", 
      "name": "Atlantic Daylight Time"
    }, 
    {
      "loc": "South America", 
      "abbr": "AMST", 
      "name": "Amazon Summer Time"
    }, 
    {
      "loc": "South America", 
      "abbr": "BRT", 
      "name": "Bras\u00edlia time"
    } 
  ], 
  "+1245": [
    {
      "loc": "Pacific", 
      "abbr": "CHAST", 
      "name": "Chatham Island Standard Time"
    }
  ], 
  "+0600": [
    {
      "loc": "Asia", 
      "abbr": "BST", 
      "name": "Bangladesh Standard Time"
    }, 
    {
      "loc": "Asia", 
      "abbr": "YEKST", 
      "name": "Yekaterinburg Summer Time"
    },
    {
      "loc": "Asia", 
      "abbr": "BST", 
      "name": "Bangladesh Standard Time"
    } 
  ], 
  "-0930": [
    {
      "loc": "Pacific", 
      "abbr": "MART", 
      "name": "Marquesas Time"
    }
  ], 
  "+0330": [
    {
      "loc": "Asia", 
      "abbr": "IRST", 
      "name": "Iran Standard Time"
    }
  ], 
  "+1130": [
    {
      "loc": "Australia", 
      "abbr": "NFT", 
      "name": "Norfolk Time"
    }
  ], 
  "+1100": [
    {
      "loc": "Asia", 
      "abbr": "VLAST", 
      "name": "Vladivostok Summer Time"
    }, 
    {
      "loc": "Australia", 
      "abbr": "EDT", 
      "name": "Eastern Daylight Time"
    }, 
    {
      "loc": "Pacific", 
      "abbr": "NCT", 
      "name": "New Caledonia Time"
    }, 
    {
      "loc": "Pacific", 
      "abbr": "PONT", 
      "name": "Pohnpei Standard Time"
    }, 
    {
      "loc": "Pacific", 
      "abbr": "SBT", 
      "name": "Solomon IslandsTime"
    }, 
    {
      "loc": "Pacific", 
      "abbr": "VUT", 
      "name": "Vanuatu Time"
    }
  ], 
  "-0800": [
    {
      "loc": "North America", 
      "abbr": "PST", 
      "name": "Pacific Standard Time"
    }, 
    {
      "loc": "North America", 
      "abbr": "AKDT", 
      "name": "Alaska Daylight Time"
    } 
  ]
}

},{}],87:[function(require,module,exports){
module.exports = IfParser

var LiteralToken = require('./literal')
  , EndToken = require('./end')
  , operators = require('./operators')

function IfParser(tokens, parser) {
  this.createVariable = function(token) {
    return new LiteralToken(parser.compile(token), token)
  }

  var len = tokens.length
    , i = 0
    , mappedTokens = []
    , token

  while(i < len) {
    token = tokens[i]
    if(token == 'not' && tokens[i+1] == 'in') {
      ++i
      token = 'not in'
    }
    mappedTokens.push(this.translateToken(token))
    ++i
  }

  this.pos = 0
  this.tokens = mappedTokens
  this.currentToken = this.next()
}

var cons = IfParser
  , proto = cons.prototype

proto.translateToken = function(token) {
  var op = operators[token]

  if(op === undefined) {
    return this.createVariable(token)
  }

  return op()
}

proto.next = function() {
  if(this.pos >= this.tokens.length) {
    return new EndToken()
  }
  return this.tokens[this.pos++]
}

proto.parse = function() {
  var retval = this.expression()

  if(!(this.currentToken.constructor === EndToken)) {
    throw new Error("Unused "+this.currentToken+" at end of if expression.")
  }

  return retval
}

proto.expression = function(rbp) {
  rbp = rbp || 0

  var t = this.currentToken
    , left

  this.currentToken = this.next()

  left = t.nud(this)
  while(rbp < this.currentToken.lbp) {
    t = this.currentToken

    this.currentToken = this.next()

    left = t.led(left, this)
  }

  return left
}

},{"./literal":89,"./end":90,"./operators":91}],89:[function(require,module,exports){
module.exports = LiteralToken

function LiteralToken(value, original) {
  this.lbp = 0
  this.value = value
}

var cons = LiteralToken
  , proto = cons.prototype

proto.nud = function(parser) {
  return this
}

proto.led = function() {
  throw new Error()
}

proto.evaluate = function(context) {
  if(!this.value)
    return this.value

  if(!this.value.resolve)
    return this.value

  return this.value.resolve(context)
}

},{}],90:[function(require,module,exports){
module.exports = EndToken

function EndToken() {
  this.lbp = 0
}

},{}],85:[function(require,module,exports){
var tz = require('./tz')
  , isDST = require('dst')

module.exports = tzinfo

function get_offset_fmt(tzoffs) {
  var offs = ~~(tzoffs / 60)
    , mins = ('00' + ~~Math.abs(tzoffs % 60)).slice(-2)

  offs = ((tzoffs > 0) ? '-' : '+') + ('00' + Math.abs(offs)).slice(-2) + mins

  return offs
}

function tzinfo(date, tz_list, determine_dst, TZ) {

  var fmt = get_offset_fmt(date.getTimezoneOffset())

  TZ = TZ || tz
  tz_list = tz_list || TZ[fmt]
  determine_dst = determine_dst || isDST

  var date_is_dst = determine_dst(date)
    , date_dst_thresholds = determine_dst.find_thresholds()
    , has_dst = date_dst_thresholds.spring_forward !== date_dst_thresholds.fall_back
    , is_north = has_dst && date_dst_thresholds.spring_forward < date_dst_thresholds.fall_back 
    , list = (tz_list || []).slice()
    , filtered = []

  if(!is_north)
    list = list.reverse()

  for(var i = 0, len = list.length; i < len; ++i) {
    if(date_is_dst === /([Dd]aylight|[Ss]ummer)/.test(list[i].name)) {
      filtered.push(list[i])
    }
  }
  list = filtered
  if(!list.length) return {}

  return {
      'name':     list[0].name
    , 'loc':      list[0].loc
    , 'abbr':     list[0].abbr
    , 'offset':   fmt
  }
} 

tzinfo.get_offset_format = get_offset_fmt
tzinfo.tz_list = tz

Date.prototype.tzinfo = function() {
  return tzinfo(this)
}

Date.prototype.tzoffset = function() {
  return 'GMT'+get_offset_fmt(this.getTimezoneOffset())
}

},{"./tz":88,"dst":14}],91:[function(require,module,exports){
var InfixOperator = require('./infix')
  , PrefixOperator = require('./prefix')

var keys

keys = Object.keys || keyshim

function keyshim(obj) {
  var accum = []

  for(var n in obj) if(obj.hasOwnProperty(n)) {
    accum.push(n)
  }

  return accum
}

module.exports = {
    'or': function() {
      return new InfixOperator(6, function(x, y) {
          return x || y
      })
    }

  , 'and': function() {
      return new InfixOperator(7, function(x, y) {
          return x && y
      })
    }

  , 'not': function() {
      return new PrefixOperator(8, function(x) {
        return !x
      })
    }

  , 'in': function() {
      return new InfixOperator(9, in_operator)
    }

  , 'not in': function() {
    return new InfixOperator(9, function(x, y) {
      return !in_operator(x,y)
    })
  }

  , '=': function() {
    return new InfixOperator(10, function(x, y) { 
      return x == y
    })
  }

  , '==': function() {
      return new InfixOperator(10, function(x, y) { 
        return x == y
      })
    }

  , '!=': function() {
      return new InfixOperator(10, function(x, y) { 
        return x !== y
      })
    }

  , '>': function() {
      return new InfixOperator(10, function(x, y) { 
        return x > y
      })
    }

  , '>=': function() {
      return new InfixOperator(10, function(x, y) { 
        return x >= y
      })
    }

  , '<': function() {
      return new InfixOperator(10, function(x, y) { 
        return x < y
      })
    }

  , '<=': function() {
      return new InfixOperator(10, function(x, y) { 
        return x <= y
      })
    }
}

function in_operator(x, y) {
  if(!(x instanceof Object) && y instanceof Object) {
    if(!(y && 'length' in y)) {
      y = keys(y)
    }
  }

  if(typeof(x) == 'string' && typeof(y) =='string') {
    return y.indexOf(x) !== -1
  }

  if(x === undefined || x === null)
    return false

  if(y === undefined || y === null)
    return false

  for(var found = false, i = 0, len = y.length; i < len && !found; ++i) {
    var rhs = y[i]
    if(x instanceof Array) {
      for(var idx = 0,
        equal = x.length == rhs.length,
        xlen = x.length;
        idx < xlen && equal; ++idx) {

        equal = (x[idx] === rhs[idx])
      }
      found = equal

    } else if(x instanceof Object) {
      if(x === rhs) {
        return true
      }
      var xkeys = keys(x),
        rkeys = keys(rhs)

      if(xkeys.length === rkeys.length) { 
        for(var i = 0, len = xkeys.length, equal = true;
          i < len && equal;
          ++i) {
          equal = xkeys[i] === rkeys[i] &&
              x[xkeys[i]] === rhs[rkeys[i]]
        }
        found = equal
      } 
    } else {
      found = x == rhs
    }
  }
  return found
}

},{"./infix":92,"./prefix":93}],92:[function(require,module,exports){
module.exports = InfixOperator

var Promise = require('../../promise')

function InfixOperator(bp, cmp) {
  this.lbp = bp
  this.cmp = cmp

  this.first = 
  this.second = null
} 

var cons = InfixOperator
  , proto = cons.prototype

proto.nud = function(parser) {
  throw new Error("Unexpected token")
}

proto.led = function(lhs, parser) {
  this.first = lhs
  this.second = parser.expression(this.lbp)
  return this
}

proto.evaluate = function(context, first, second, sentFirst, sentSecond) {
  var self = this
    , promise

  first = sentFirst ? first : self.first.evaluate(context)

  if(first && first.constructor === Promise) {
    promise = new Promise

    first.once('done', function(data) {
      promise.resolve(self.evaluate(context, data, null, true, false))
    })

    return promise
  }

  second = sentSecond ? second : self.second.evaluate(context)

  if(second && second.constructor === Promise) {
    promise = new Promise

    second.once('done', function(data) {
      promise.resolve(self.evaluate(context, first, data, true, true))
    })

    return promise
  }

  return self.cmp(first, second)
}


},{"../../promise":2}],93:[function(require,module,exports){
module.exports = PrefixOperator

var Promise = require('../../promise')

function PrefixOperator(bp, cmp) {
  this.lbp = bp
  this.cmp = cmp

  this.first = 
  this.second = null
}

var cons = PrefixOperator
  , proto = cons.prototype

proto.nud = function(parser) {
  this.first = parser.expression(this.lbp)
  this.second = null
  return this
}

proto.led = function(first, parser) {
  throw new Error("Unexpected token")
}

proto.evaluate = function(context, first, times) {
  var self = this
    , promise

  first = times === 1 ? first : self.first.evaluate(context)

  if(first && first.constructor === Promise) {
    promise = new Promise

    first.once('done', function(data) {
      promise.resolve(self.evaluate(context, data, 1))
    })

    return promise
  }

  return self.cmp(first)
}

},{"../../promise":2}]},{},[12])
;