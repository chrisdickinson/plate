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
},{"./filter_token":4,"./tag_token":5,"./comment_token":6,"./text_token":7,"./libraries":8,"./parser":9,"./context":10,"./meta":11,"./promise":2}],8:[function(require,module,exports){
module.exports = {
    Library: require('./library')
  , DefaultPluginLibrary: require('./library')
  , DefaultTagLibrary: require('./defaulttags')
  , DefaultFilterLibrary: require('./defaultfilters')
} 

},{"./library":12,"./defaulttags":13,"./defaultfilters":14}],15:[function(require,module,exports){
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

},{"./lib/index":3,"./lib/date":16,"./lib/debug":1,"./lib/libraries":8,"./lib/promise":2,"dst":17}],10:[function(require,module,exports){
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

},{}],12:[function(require,module,exports){
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


},{}],17:[function(require,module,exports){
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


},{"./libraries":8}],13:[function(require,module,exports){
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

},{"./library":12,"./tags/block":25,"./tags/comment":26,"./tags/debug":27,"./tags/extends":28,"./tags/for":29,"./tags/if/node":30,"./tags/include":31,"./tags/now":32,"./tags/with":33}],14:[function(require,module,exports){
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


},{"./library":12,"./filters/add":34,"./filters/addslashes":35,"./filters/capfirst":36,"./filters/center":37,"./filters/cut":38,"./filters/date":39,"./filters/default":40,"./filters/dictsort":41,"./filters/dictsortreversed":42,"./filters/divisibleby":43,"./filters/escape":44,"./filters/filesizeformat":45,"./filters/first":46,"./filters/floatformat":47,"./filters/force_escape":48,"./filters/get_digit":49,"./filters/index":50,"./filters/iteritems":51,"./filters/iriencode":52,"./filters/join":53,"./filters/last":54,"./filters/length":55,"./filters/length_is":56,"./filters/linebreaks":57,"./filters/linebreaksbr":58,"./filters/linenumbers":59,"./filters/ljust":60,"./filters/lower":61,"./filters/make_list":62,"./filters/phone2numeric":63,"./filters/pluralize":64,"./filters/random":65,"./filters/rjust":66,"./filters/safe":67,"./filters/slice":68,"./filters/slugify":69,"./filters/split":70,"./filters/striptags":71,"./filters/timesince":72,"./filters/timeuntil":73,"./filters/title":74,"./filters/truncatechars":75,"./filters/truncatewords":76,"./filters/unordered_list":77,"./filters/upper":78,"./filters/urlencode":79,"./filters/urlize":80,"./filters/urlizetrunc":81,"./filters/wordcount":82,"./filters/wordwrap":83,"./filters/yesno":84}],18:[function(require,module,exports){
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

},{}],41:[function(require,module,exports){
module.exports = function(input, key) {
  return input.sort(function(x, y) {
    if(x[key] > y[key]) return 1
    if(x[key] == y[key]) return 0
    if(x[key] < y[key]) return -1
  })
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

},{}],46:[function(require,module,exports){
module.exports = function(input) {
  return input[0]
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

},{}],51:[function(require,module,exports){
module.exports = function(input) {
  var output = []
  for(var name in input) if(input.hasOwnProperty(name)) {
    output.push([name, input[name]])
  }
  return output
}

},{}],52:[function(require,module,exports){
module.exports = function(input) {
  return input
}

},{}],53:[function(require,module,exports){
module.exports = function(input, glue) {
  input = input instanceof Array ? input : input.toString().split('')
  return input.join(glue)
}

},{}],54:[function(require,module,exports){
module.exports = function(input) {
  var cb = input.charAt || function(ind) { return input[ind]; }

  return cb.call(input, input.length-1);
}

},{}],55:[function(require,module,exports){
module.exports = function(input, ready) {
  if(input && typeof input.length === 'function') {
    return input.length(ready)
  }
  return input.length
}

},{}],56:[function(require,module,exports){
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

},{}],71:[function(require,module,exports){
module.exports = function(input) {
  var str = input.toString()
  return str.replace(/<[^>]*?>/g, '')
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

},{}],16:[function(require,module,exports){
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


},{"../promise":2,"../context":10,"../debug":1}],28:[function(require,module,exports){
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

},{"../node_list":21,"../promise":2}],31:[function(require,module,exports){
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

},{"../promise":2}],32:[function(require,module,exports){
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

},{"../date":16}],33:[function(require,module,exports){
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

},{"../date":16}],42:[function(require,module,exports){
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

},{"../filter_node":19}],57:[function(require,module,exports){
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

},{"../../node_list":21,"../../promise":2,"./parser":87}],86:[function(require,module,exports){
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

},{"./tz":88,"dst":17}],91:[function(require,module,exports){
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

},{"../../promise":2}]},{},[15])
//@ sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIgcGxhdGUvbGliL2RlYnVnLmpzIiwiIHBsYXRlL2xpYi9wcm9taXNlLmpzIiwiIHBsYXRlL2xpYi9pbmRleC5qcyIsIiBwbGF0ZS9saWIvbGlicmFyaWVzLmpzIiwiIHBsYXRlL2Jyb3dzZXIuanMiLCIgcGxhdGUvbGliL2NvbnRleHQuanMiLCIgcGxhdGUvbGliL2xpYnJhcnkuanMiLCIgcGxhdGUvbm9kZV9tb2R1bGVzL2RzdC9pbmRleC5qcyIsIiBwbGF0ZS9saWIvZmlsdGVyX3Rva2VuLmpzIiwiIHBsYXRlL2xpYi90YWdfdG9rZW4uanMiLCIgcGxhdGUvbGliL2NvbW1lbnRfdG9rZW4uanMiLCIgcGxhdGUvbGliL3RleHRfdG9rZW4uanMiLCIgcGxhdGUvbGliL3BhcnNlci5qcyIsIiBwbGF0ZS9saWIvbWV0YS5qcyIsIiBwbGF0ZS9saWIvZGVmYXVsdHRhZ3MuanMiLCIgcGxhdGUvbGliL2RlZmF1bHRmaWx0ZXJzLmpzIiwiIHBsYXRlL2xpYi90b2tlbi5qcyIsIiBwbGF0ZS9saWIvdGV4dF9ub2RlLmpzIiwiIHBsYXRlL2xpYi9maWx0ZXJfY2hhaW4uanMiLCIgcGxhdGUvbGliL3RhZ3MvY29tbWVudC5qcyIsIiBwbGF0ZS9saWIvZmlsdGVycy9hZGQuanMiLCIgcGxhdGUvbGliL2ZpbHRlcnMvYWRkc2xhc2hlcy5qcyIsIiBwbGF0ZS9saWIvZmlsdGVycy9jYXBmaXJzdC5qcyIsIiBwbGF0ZS9saWIvZmlsdGVycy9jZW50ZXIuanMiLCIgcGxhdGUvbGliL2ZpbHRlcnMvY3V0LmpzIiwiIHBsYXRlL2xpYi9maWx0ZXJzL2RlZmF1bHQuanMiLCIgcGxhdGUvbGliL2ZpbHRlcnMvZGljdHNvcnQuanMiLCIgcGxhdGUvbGliL2ZpbHRlcnMvZGl2aXNpYmxlYnkuanMiLCIgcGxhdGUvbGliL2ZpbHRlcnMvZmlsZXNpemVmb3JtYXQuanMiLCIgcGxhdGUvbGliL2ZpbHRlcnMvZmlyc3QuanMiLCIgcGxhdGUvbGliL2ZpbHRlcnMvZmxvYXRmb3JtYXQuanMiLCIgcGxhdGUvbGliL2ZpbHRlcnMvZ2V0X2RpZ2l0LmpzIiwiIHBsYXRlL2xpYi9maWx0ZXJzL2luZGV4LmpzIiwiIHBsYXRlL2xpYi9maWx0ZXJzL2l0ZXJpdGVtcy5qcyIsIiBwbGF0ZS9saWIvZmlsdGVycy9pcmllbmNvZGUuanMiLCIgcGxhdGUvbGliL2ZpbHRlcnMvam9pbi5qcyIsIiBwbGF0ZS9saWIvZmlsdGVycy9sYXN0LmpzIiwiIHBsYXRlL2xpYi9maWx0ZXJzL2xlbmd0aC5qcyIsIiBwbGF0ZS9saWIvZmlsdGVycy9sZW5ndGhfaXMuanMiLCIgcGxhdGUvbGliL2ZpbHRlcnMvbGluZW51bWJlcnMuanMiLCIgcGxhdGUvbGliL2ZpbHRlcnMvbGp1c3QuanMiLCIgcGxhdGUvbGliL2ZpbHRlcnMvbG93ZXIuanMiLCIgcGxhdGUvbGliL2ZpbHRlcnMvbWFrZV9saXN0LmpzIiwiIHBsYXRlL2xpYi9maWx0ZXJzL3Bob25lMm51bWVyaWMuanMiLCIgcGxhdGUvbGliL2ZpbHRlcnMvcGx1cmFsaXplLmpzIiwiIHBsYXRlL2xpYi9maWx0ZXJzL3JhbmRvbS5qcyIsIiBwbGF0ZS9saWIvZmlsdGVycy9yanVzdC5qcyIsIiBwbGF0ZS9saWIvZmlsdGVycy9zbGljZS5qcyIsIiBwbGF0ZS9saWIvZmlsdGVycy9zbHVnaWZ5LmpzIiwiIHBsYXRlL2xpYi9maWx0ZXJzL3NwbGl0LmpzIiwiIHBsYXRlL2xpYi9maWx0ZXJzL3N0cmlwdGFncy5qcyIsIiBwbGF0ZS9saWIvZmlsdGVycy90aW1lc2luY2UuanMiLCIgcGxhdGUvbGliL2ZpbHRlcnMvdGl0bGUuanMiLCIgcGxhdGUvbGliL2ZpbHRlcnMvdHJ1bmNhdGVjaGFycy5qcyIsIiBwbGF0ZS9saWIvZmlsdGVycy90cnVuY2F0ZXdvcmRzLmpzIiwiIHBsYXRlL2xpYi9maWx0ZXJzL3VwcGVyLmpzIiwiIHBsYXRlL2xpYi9maWx0ZXJzL3VybGVuY29kZS5qcyIsIiBwbGF0ZS9saWIvZmlsdGVycy93b3JkY291bnQuanMiLCIgcGxhdGUvbGliL2ZpbHRlcnMvd29yZHdyYXAuanMiLCIgcGxhdGUvbGliL2ZpbHRlcnMveWVzbm8uanMiLCIgcGxhdGUvbGliL2RhdGUuanMiLCIgcGxhdGUvbGliL2ZpbHRlcl9ub2RlLmpzIiwiIHBsYXRlL2xpYi9ub2RlX2xpc3QuanMiLCIgcGxhdGUvbGliL2ZpbHRlcl9sb29rdXAuanMiLCIgcGxhdGUvbGliL2ZpbHRlcl9hcHBsaWNhdGlvbi5qcyIsIiBwbGF0ZS9saWIvdGFncy9ibG9jay5qcyIsIiBwbGF0ZS9saWIvdGFncy9kZWJ1Zy5qcyIsIiBwbGF0ZS9saWIvdGFncy9leHRlbmRzLmpzIiwiIHBsYXRlL2xpYi90YWdzL2Zvci5qcyIsIiBwbGF0ZS9saWIvdGFncy9pbmNsdWRlLmpzIiwiIHBsYXRlL2xpYi90YWdzL25vdy5qcyIsIiBwbGF0ZS9saWIvdGFncy93aXRoLmpzIiwiIHBsYXRlL2xpYi9maWx0ZXJzL2RhdGUuanMiLCIgcGxhdGUvbGliL2ZpbHRlcnMvZGljdHNvcnRyZXZlcnNlZC5qcyIsIiBwbGF0ZS9saWIvZmlsdGVycy9lc2NhcGUuanMiLCIgcGxhdGUvbGliL2ZpbHRlcnMvZm9yY2VfZXNjYXBlLmpzIiwiIHBsYXRlL2xpYi9maWx0ZXJzL2xpbmVicmVha3MuanMiLCIgcGxhdGUvbGliL2ZpbHRlcnMvbGluZWJyZWFrc2JyLmpzIiwiIHBsYXRlL2xpYi9maWx0ZXJzL3NhZmUuanMiLCIgcGxhdGUvbGliL2ZpbHRlcnMvdGltZXVudGlsLmpzIiwiIHBsYXRlL2xpYi9maWx0ZXJzL3Vub3JkZXJlZF9saXN0LmpzIiwiIHBsYXRlL2xpYi9maWx0ZXJzL3VybGl6ZS5qcyIsIiBwbGF0ZS9saWIvZmlsdGVycy91cmxpemV0cnVuYy5qcyIsIiBwbGF0ZS9saWIvdGFncy9pZi9ub2RlLmpzIiwiIHBsYXRlL2xpYi9ibG9ja19jb250ZXh0LmpzIiwiIHBsYXRlL25vZGVfbW9kdWxlcy90ei90ei5qcyIsIiBwbGF0ZS9saWIvdGFncy9pZi9wYXJzZXIuanMiLCIgcGxhdGUvbGliL3RhZ3MvaWYvbGl0ZXJhbC5qcyIsIiBwbGF0ZS9saWIvdGFncy9pZi9lbmQuanMiLCIgcGxhdGUvbm9kZV9tb2R1bGVzL3R6L2luZGV4LmpzIiwiIHBsYXRlL2xpYi90YWdzL2lmL29wZXJhdG9ycy5qcyIsIiBwbGF0ZS9saWIvdGFncy9pZi9pbmZpeC5qcyIsIiBwbGF0ZS9saWIvdGFncy9pZi9wcmVmaXguanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNOQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25DQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4TkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNaQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkJBO0FBQ0E7QUFDQTtBQUNBOztBQ0hBO0FBQ0E7QUFDQTtBQUNBOztBQ0hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNKQTtBQUNBO0FBQ0E7QUFDQTs7QUNIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1BBO0FBQ0E7QUFDQTtBQUNBOztBQ0hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDYkE7QUFDQTtBQUNBO0FBQ0E7O0FDSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDWkE7O0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNQQTtBQUNBO0FBQ0E7QUFDQTs7QUNIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ0pBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNOQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNaQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNaQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDWEE7QUFDQTtBQUNBO0FBQ0E7O0FDSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ0xBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNiQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1BBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1pBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNUQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNkQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNaQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNmQTtBQUNBO0FBQ0E7QUFDQTs7QUNIQTtBQUNBO0FBQ0E7QUFDQTs7QUNIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNOQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDWEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2WkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbEZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1SEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDWEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNQQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ05BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDUEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNURBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6M0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUlBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsInNvdXJjZXNDb250ZW50IjpbIm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGxvZzogZnVuY3Rpb24odmFsdWUpIHsgY29uc29sZS5sb2codmFsdWUpIH1cbiAgLCBlcnJvcjogZnVuY3Rpb24oZXJyKSB7IGNvbnNvbGUuZXJyb3IoZXJyLCBlcnIgJiYgZXJyLnN0YWNrKSB9XG4gICwgaW5mbzogZnVuY3Rpb24odmFsdWUpIHsgfSBcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gUHJvbWlzZVxuXG5mdW5jdGlvbiBQcm9taXNlKCkge1xuICB0aGlzLnRyaWdnZXIgPSBudWxsXG59XG5cbnZhciBjb25zID0gUHJvbWlzZVxuICAsIHByb3RvID0gY29ucy5wcm90b3R5cGVcblxucHJvdG8ucmVzb2x2ZSA9IGZ1bmN0aW9uKHZhbHVlKSB7XG4gIHZhciB0cmlnZ2VyID0gdGhpcy50cmlnZ2VyXG5cbiAgaWYoIXZhbHVlIHx8IHZhbHVlLmNvbnN0cnVjdG9yICE9PSBjb25zKSB7XG4gICAgcmV0dXJuIHRyaWdnZXIodmFsdWUpXG4gIH1cblxuICB2YWx1ZS5vbmNlKCdkb25lJywgdHJpZ2dlcilcbn1cblxucHJvdG8ub25jZSA9IGZ1bmN0aW9uKGV2LCBmbikge1xuICB0aGlzLnRyaWdnZXIgPSBmbiAgXG59XG4iLCIoZnVuY3Rpb24oZ2xvYmFsKXt2YXIgRmlsdGVyVG9rZW4gPSByZXF1aXJlKCcuL2ZpbHRlcl90b2tlbicpXG4gICwgVGFnVG9rZW4gPSByZXF1aXJlKCcuL3RhZ190b2tlbicpXG4gICwgQ29tbWVudFRva2VuID0gcmVxdWlyZSgnLi9jb21tZW50X3Rva2VuJylcbiAgLCBUZXh0VG9rZW4gPSByZXF1aXJlKCcuL3RleHRfdG9rZW4nKSBcbiAgLCBsaWJyYXJpZXMgPSByZXF1aXJlKCcuL2xpYnJhcmllcycpXG4gICwgUGFyc2VyID0gcmVxdWlyZSgnLi9wYXJzZXInKVxuICAsIENvbnRleHQgPSByZXF1aXJlKCcuL2NvbnRleHQnKVxuICAsIE1ldGEgPSByZXF1aXJlKCcuL21ldGEnKVxuICAsIFByb21pc2UgPSByZXF1aXJlKCcuL3Byb21pc2UnKVxuXG5tb2R1bGUuZXhwb3J0cyA9IFRlbXBsYXRlXG5cbi8vIGNpcmN1bGFyIGFsaWFzIHRvIHN1cHBvcnQgb2xkXG4vLyB2ZXJzaW9ucyBvZiBwbGF0ZS5cblRlbXBsYXRlLlRlbXBsYXRlID0gVGVtcGxhdGVcblRlbXBsYXRlLkNvbnRleHQgPSBDb250ZXh0XG5cbnZhciBsYXRlciA9IHR5cGVvZiBnbG9iYWwgIT09ICd1bmRlZmluZWQnID8gXG4gICAgZnVuY3Rpb24oZm4pIHsgZ2xvYmFsLnNldFRpbWVvdXQoZm4sIDApIH0gOlxuICAgIGZ1bmN0aW9uKGZuKSB7IHRoaXMuc2V0VGltZW91dChmbiwgMCkgfVxuXG5mdW5jdGlvbiBUZW1wbGF0ZShyYXcsIGxpYnJhcmllcywgcGFyc2VyKSB7XG4gIGlmKHR5cGVvZiByYXcgIT09ICdzdHJpbmcnKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcignaW5wdXQgc2hvdWxkIGJlIGEgc3RyaW5nJylcbiAgfVxuXG4gIHRoaXMucmF3ID0gcmF3XG5cbiAgbGlicmFyaWVzID0gbGlicmFyaWVzIHx8IHt9XG5cbiAgdGhpcy50YWdMaWJyYXJ5ID1cbiAgICBsaWJyYXJpZXMudGFnX2xpYnJhcnkgfHwgVGVtcGxhdGUuTWV0YS5jcmVhdGVUYWdMaWJyYXJ5KClcblxuICB0aGlzLmZpbHRlckxpYnJhcnkgPSBcbiAgICBsaWJyYXJpZXMuZmlsdGVyX2xpYnJhcnkgfHwgVGVtcGxhdGUuTWV0YS5jcmVhdGVGaWx0ZXJMaWJyYXJ5KClcblxuICB0aGlzLnBsdWdpbkxpYnJhcnkgPSBcbiAgICBsaWJyYXJpZXMucGx1Z2luX2xpYnJhcnkgfHwgVGVtcGxhdGUuTWV0YS5jcmVhdGVQbHVnaW5MaWJyYXJ5KClcblxuICB0aGlzLnBhcnNlciA9IHBhcnNlciB8fCBQYXJzZXJcblxuICB0aGlzLnRva2VucyA9IG51bGxcbn1cblxudmFyIGNvbnMgPSBUZW1wbGF0ZVxuICAsIHByb3RvID0gY29ucy5wcm90b3R5cGVcbiAgLCBtZXRhID0gY29ucy5NZXRhID0gbmV3IE1ldGFcblxuY29ucy5jcmVhdGVQbHVnaW5MaWJyYXJ5ID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiBuZXcgbGlicmFyaWVzLkRlZmF1bHRQbHVnaW5MaWJyYXJ5KClcbn1cblxucHJvdG8uZ2V0Tm9kZUxpc3QgPSBmdW5jdGlvbigpIHtcbiAgdGhpcy5ub2RlbGlzdCA9IHRoaXMubm9kZWxpc3QgfHwgdGhpcy5wYXJzZSgpXG5cbiAgcmV0dXJuIHRoaXMubm9kZWxpc3Rcbn1cblxucHJvdG8ucGFyc2UgPSBmdW5jdGlvbigpIHtcbiAgdmFyIHBhcnNlclxuXG4gIHRoaXMudG9rZW5zID0gdGhpcy50b2tlbnMgfHwgY29ucy50b2tlbml6ZSh0aGlzLnJhdylcblxuICBwYXJzZXIgPSBuZXcgdGhpcy5wYXJzZXIoXG4gICAgICB0aGlzLnRva2Vuc1xuICAgICwgdGhpcy50YWdMaWJyYXJ5XG4gICAgLCB0aGlzLmZpbHRlckxpYnJhcnlcbiAgICAsIHRoaXMucGx1Z2luTGlicmFyeVxuICAgICwgdGhpc1xuICApXG5cbiAgcmV0dXJuIHBhcnNlci5wYXJzZSgpXG59XG5cbnByb3RvLnJlbmRlciA9IHByb3RlY3QoZnVuY3Rpb24oY29udGV4dCwgcmVhZHkpIHtcbiAgY29udGV4dCA9IG5ldyBDb250ZXh0KGNvbnRleHQpXG5cbiAgdmFyIHJlc3VsdFxuXG4gIHJlc3VsdCA9IFxuICB0aGlzXG4gICAgLmdldE5vZGVMaXN0KClcbiAgICAucmVuZGVyKGNvbnRleHQpXG5cbiAgaWYocmVzdWx0LmNvbnN0cnVjdG9yID09PSBQcm9taXNlKSB7XG4gICAgcmVzdWx0Lm9uY2UoJ2RvbmUnLCBmdW5jdGlvbihkYXRhKSB7XG4gICAgICByZWFkeShudWxsLCBkYXRhKVxuICAgIH0pXG4gIH0gZWxzZSB7XG4gICAgbGF0ZXIoZnVuY3Rpb24oKSB7XG4gICAgICByZWFkeShudWxsLCByZXN1bHQpXG4gICAgfSwgMClcbiAgfVxuXG59KVxuXG5mdW5jdGlvbiBwcm90ZWN0KGZuKSB7XG4gIHJldHVybiBmdW5jdGlvbihjb250ZXh0LCByZWFkeSkge1xuICAgIGlmKCFjb250ZXh0IHx8ICFyZWFkeSkge1xuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcigpXG4gICAgfVxuXG4gICAgdHJ5IHtcbiAgICAgIHJldHVybiBmbi5jYWxsKHRoaXMsIGNvbnRleHQsIHJlYWR5KVxuICAgIH0gY2F0Y2goZSkge1xuICAgICAgbGF0ZXIoZnVuY3Rpb24oKSB7XG4gICAgICAgIHJlYWR5KGUsIG51bGwpXG4gICAgICB9LCAwKVxuICAgIH1cbiAgfVxufVxuXG5jb25zLk1BVENIX1JFID0gL1xce1slI1xce10oLio/KVtcXH0jJV1cXH0vXG5cbmNvbnMudG9rZW5pemUgPSBmdW5jdGlvbihjb250ZW50KSB7XG4gIHZhciBtYXRjaCA9IG51bGxcbiAgICAsIHRva2VucyA9IFtdXG4gICAgLCBsaW5lTm8gPSAxXG4gICAgLCBpbmNMaW5lTm8gPSBmdW5jdGlvbihzdHIpIHsgbGluZU5vICs9IHN0ci5zcGxpdCgnXFxuJykubGVuZ3RoIH1cbiAgICAsIG1hcCA9IHtcbiAgICAgICAgICAnJSc6IFRhZ1Rva2VuXG4gICAgICAgICwgJyMnOiBDb21tZW50VG9rZW5cbiAgICAgICAgLCAneyc6IEZpbHRlclRva2VuXG4gICAgICB9XG4gICAgLCByZXggPSB0aGlzLk1BVENIX1JFXG4gICAgLCBsaXRlcmFsXG5cbiAgZG8ge1xuICAgIG1hdGNoID0gcmV4LmV4ZWMoY29udGVudClcbiAgICBpZighbWF0Y2gpXG4gICAgICBjb250aW51ZVxuXG4gICAgbGl0ZXJhbCA9IGNvbnRlbnQuc2xpY2UoMCwgbWF0Y2guaW5kZXgpXG4gICAgaW5jTGluZU5vKGxpdGVyYWwpXG4gICAgaWYobWF0Y2guaW5kZXgpXG4gICAgICB0b2tlbnMucHVzaChuZXcgVGV4dFRva2VuKGxpdGVyYWwuc2xpY2UoMCwgbWF0Y2guaW5kZXgsIGxpbmVObykpKVxuXG4gICAgbWF0Y2hbMV0gPSBtYXRjaFsxXVxuICAgICAgLnJlcGxhY2UoL15cXHMrLywgJycpXG4gICAgICAucmVwbGFjZSgvXFxzKyQvLCAnJylcblxuICAgIHRva2Vucy5wdXNoKG5ldyBtYXBbbWF0Y2hbMF0uY2hhckF0KDEpXShtYXRjaFsxXSwgbGluZU5vKSlcblxuICAgIGNvbnRlbnQgPSBjb250ZW50LnNsaWNlKG1hdGNoLmluZGV4ICsgbWF0Y2hbMF0ubGVuZ3RoKVxuICB9IHdoaWxlKGNvbnRlbnQubGVuZ3RoICYmIG1hdGNoKVxuXG4gIHRva2Vucy5wdXNoKG5ldyBUZXh0VG9rZW4oY29udGVudCkpXG5cbiAgcmV0dXJuIHRva2Vuc1xufVxuXG59KSh3aW5kb3cpIiwibW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgTGlicmFyeTogcmVxdWlyZSgnLi9saWJyYXJ5JylcbiAgLCBEZWZhdWx0UGx1Z2luTGlicmFyeTogcmVxdWlyZSgnLi9saWJyYXJ5JylcbiAgLCBEZWZhdWx0VGFnTGlicmFyeTogcmVxdWlyZSgnLi9kZWZhdWx0dGFncycpXG4gICwgRGVmYXVsdEZpbHRlckxpYnJhcnk6IHJlcXVpcmUoJy4vZGVmYXVsdGZpbHRlcnMnKVxufSBcbiIsInJlcXVpcmUoJ2RzdCcpXG5cbnZhciBwbGF0ZSA9IHJlcXVpcmUoJy4vbGliL2luZGV4JylcbmlmKHR5cGVvZiBkZWZpbmUgIT09ICd1bmRlZmluZWQnICYmIGRlZmluZS5hbWQpIHtcbiAgZGVmaW5lKCdwbGF0ZScsIFtdLCBmdW5jdGlvbigpIHsgcmV0dXJuIHBsYXRlIH0pXG59IGVsc2Uge1xuICB3aW5kb3cucGxhdGUgPSBwbGF0ZVxufVxuXG5wbGF0ZS5kZWJ1ZyA9IHJlcXVpcmUoJy4vbGliL2RlYnVnJylcbnBsYXRlLnV0aWxzID0gcGxhdGUuZGF0ZSA9IHJlcXVpcmUoJy4vbGliL2RhdGUnKVxucGxhdGUudXRpbHMuUHJvbWlzZSA9IHJlcXVpcmUoJy4vbGliL3Byb21pc2UnKVxucGxhdGUudXRpbHMuU2FmZVN0cmluZyA9IGZ1bmN0aW9uKHN0cikge1xuICBzdHIgPSBuZXcgU3RyaW5nKHN0cilcbiAgc3RyLnNhZmUgPSB0cnVlXG4gIHJldHVybiBzdHJcbn1cbnBsYXRlLmxpYnJhcmllcyA9IHJlcXVpcmUoJy4vbGliL2xpYnJhcmllcycpXG4iLCJtb2R1bGUuZXhwb3J0cyA9IENvbnRleHRcblxuZnVuY3Rpb24gQ29udGV4dChmcm9tKSB7XG4gIGlmKGZyb20gJiYgZnJvbS5jb25zdHJ1Y3RvciA9PT0gQ29udGV4dCkge1xuICAgIHJldHVybiBmcm9tXG4gIH1cblxuICBmcm9tID0gZnJvbSB8fCB7fVxuICBmb3IodmFyIGtleSBpbiBmcm9tKSBpZihmcm9tLmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICB0aGlzW2tleV0gPSBmcm9tW2tleV1cbiAgfVxufVxuXG52YXIgY29ucyA9IENvbnRleHRcbiAgLCBwcm90byA9IGNvbnMucHJvdG90eXBlXG5cbnByb3RvLmNvcHkgPSBmdW5jdGlvbigpIHtcbiAgdmFyIEYgPSBGdW5jdGlvbigpXG4gIEYubmFtZSA9IGNvbnMubmFtZVxuICBGLnByb3RvdHlwZSA9IHRoaXNcbiAgcmV0dXJuIG5ldyBGXG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IExpYnJhcnlcblxuZnVuY3Rpb24gTGlicmFyeShsaWIpIHtcbiAgdGhpcy5yZWdpc3RyeSA9IGxpYiB8fCB7fVxufVxuXG52YXIgY29ucyA9IExpYnJhcnlcbiAgLCBwcm90byA9IGNvbnMucHJvdG90eXBlXG5cbnByb3RvLmxvb2t1cCA9IGVycm9yT25OdWxsKGZ1bmN0aW9uKG5hbWUpIHtcbiAgcmV0dXJuIHRoaXMucmVnaXN0cnlbbmFtZV0gfHwgbnVsbCAgXG59LCBcIkNvdWxkIG5vdCBmaW5kIHswfSFcIilcblxucHJvdG8ucmVnaXN0ZXIgPSBlcnJvck9uTnVsbChmdW5jdGlvbihuYW1lLCBpdGVtKSB7XG4gIGlmKHRoaXMucmVnaXN0cnlbbmFtZV0pXG4gICAgcmV0dXJuIG51bGxcblxuICB0aGlzLnJlZ2lzdHJ5W25hbWVdID0gaXRlbVxufSwgXCJ7MH0gaXMgYWxyZWFkeSByZWdpc3RlcmVkIVwiKVxuXG5cbmZ1bmN0aW9uIGVycm9yT25OdWxsKGZuLCBtc2cpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgIHZhciByZXN1bHQgPSBmbi5jYWxsKHRoaXMsIGFyZ3VtZW50c1swXSwgYXJndW1lbnRzWzFdKVxuICAgICAgLCBhcmdzID0gYXJndW1lbnRzXG5cbiAgICBpZihyZXN1bHQgPT09IG51bGwpXG4gICAgICB0aHJvdyBuZXcgRXJyb3IobXNnLnJlcGxhY2UoL1xceyhcXGQrPylcXH0vZywgZnVuY3Rpb24oYSwgbSkge1xuICAgICAgICByZXR1cm4gYXJnc1srbV1cbiAgICAgIH0pKVxuXG4gICAgcmV0dXJuIHJlc3VsdFxuICB9XG59XG5cbiIsIjsoZnVuY3Rpb24oKSB7XG5cbi8vIHNvLCB0aGUgb25seSB3YXkgd2UgKHJlbGlhYmx5KSBnZXQgYWNjZXNzIHRvIERTVCBpbiBqYXZhc2NyaXB0XG4vLyBpcyB2aWEgYERhdGUjZ2V0VGltZXpvbmVPZmZzZXRgLlxuLy9cbi8vIHRoaXMgdmFsdWUgd2lsbCBzd2l0Y2ggZm9yIGEgZ2l2ZW4gZGF0ZSBiYXNlZCBvbiB0aGUgcHJlc2VuY2Ugb3IgYWJzZW5jZVxuLy8gb2YgRFNUIGF0IHRoYXQgZGF0ZS5cblxuZnVuY3Rpb24gZmluZF9kc3RfdGhyZXNob2xkIChuZWFyLCBmYXIpIHtcbiAgdmFyIG5lYXJfZGF0ZSA9IG5ldyBEYXRlKG5lYXIpXG4gICAgLCBmYXJfZGF0ZSA9IG5ldyBEYXRlKGZhcilcbiAgICAsIG5lYXJfb2ZmcyA9IG5lYXJfZGF0ZS5nZXRUaW1lem9uZU9mZnNldCgpXG4gICAgLCBmYXJfb2ZmcyA9IGZhcl9kYXRlLmdldFRpbWV6b25lT2Zmc2V0KClcblxuICBpZihuZWFyX29mZnMgPT09IGZhcl9vZmZzKSByZXR1cm4gMFxuXG4gIGlmKE1hdGguYWJzKG5lYXJfZGF0ZSAtIGZhcl9kYXRlKSA8IDEwMDApIHJldHVybiBuZWFyX2RhdGVcblxuICByZXR1cm4gZmluZF9kc3RfdGhyZXNob2xkKG5lYXIsIG5lYXIrKGZhci1uZWFyKS8yKSB8fCBmaW5kX2RzdF90aHJlc2hvbGQobmVhcisoZmFyLW5lYXIpLzIsIGZhcilcbn1cblxuXG5mdW5jdGlvbiBmaW5kX2RzdF90aHJlc2hvbGRzKCkge1xuICB2YXIgZCA9IG5ldyBEYXRlKClcbiAgICAsIGQgPSBuZXcgRGF0ZShkLmdldEZ1bGxZZWFyKCksIDAsIDEpXG4gICAgLCBmID0gbmV3IERhdGUoZC5nZXRGdWxsWWVhcigpLCAxMSwgMzEpXG4gICAgLCB4XG4gICAgLCBmaXJzdFxuICAgICwgc2Vjb25kXG5cbiAgeCA9IChmIC0gZCkgLyAtMlxuICBmaXJzdCA9IGZpbmRfZHN0X3RocmVzaG9sZCgrZCwgZCAtIHgpXG4gIHNlY29uZCA9IGZpbmRfZHN0X3RocmVzaG9sZChkIC0geCwgK2YpXG5cbiAgcmV0dXJuIHtcbiAgICBzcHJpbmdfZm9yd2FyZCAgOiBmaXJzdCA/IChmaXJzdC5nZXRUaW1lem9uZU9mZnNldCgpIDwgc2Vjb25kLmdldFRpbWV6b25lT2Zmc2V0KCkgPyBzZWNvbmQgOiBmaXJzdCkgLSBuZXcgRGF0ZShkLmdldEZ1bGxZZWFyKCksIDAsIDEsIDAsIDApIDogMFxuICAsIGZhbGxfYmFjayAgICAgICA6IGZpcnN0ID8gKGZpcnN0LmdldFRpbWV6b25lT2Zmc2V0KCkgPCBzZWNvbmQuZ2V0VGltZXpvbmVPZmZzZXQoKSA/IGZpcnN0IDogc2Vjb25kKSAtIG5ldyBEYXRlKGQuZ2V0RnVsbFllYXIoKSwgMCwgMSwgMCwgMCkgOiAwXG4gIH1cbn1cblxudmFyIFRIUkVTSE9MRFMgPSBmaW5kX2RzdF90aHJlc2hvbGRzKClcblxuZnVuY3Rpb24gaXNfZHN0KGRhdGV0aW1lLCB0aHJlc2hvbGRzKSB7XG5cbiAgdGhyZXNob2xkcyA9IHRocmVzaG9sZHMgfHwgVEhSRVNIT0xEU1xuXG4gIGlmKHRocmVzaG9sZHMuc3ByaW5nX2ZvcndhcmQgPT09IHRocmVzaG9sZHMuZmFsbF9iYWNrKVxuICAgIHJldHVybiBmYWxzZVxuXG4gIHZhciBvZmZzZXQgPSBkYXRldGltZSAtIG5ldyBEYXRlKGRhdGV0aW1lLmdldEZ1bGxZZWFyKCksIDAsIDEsIDAsIDApXG4gICAgLCBkc3RfaXNfcmV2ZXJzZWQgPSB0aHJlc2hvbGRzLnNwcmluZ19mb3J3YXJkID4gdGhyZXNob2xkcy5mYWxsX2JhY2tcbiAgICAsIG1heCA9IE1hdGgubWF4KHRocmVzaG9sZHMuZmFsbF9iYWNrLCB0aHJlc2hvbGRzLnNwcmluZ19mb3J3YXJkKVxuICAgICwgbWluID0gTWF0aC5taW4odGhyZXNob2xkcy5mYWxsX2JhY2ssIHRocmVzaG9sZHMuc3ByaW5nX2ZvcndhcmQpXG5cbiAgaWYobWluIDwgb2Zmc2V0ICYmIG9mZnNldCA8IG1heClcbiAgICByZXR1cm4gIWRzdF9pc19yZXZlcnNlZFxuICByZXR1cm4gZHN0X2lzX3JldmVyc2VkXG59XG5cbkRhdGUucHJvdG90eXBlLmlzRFNUID0gZnVuY3Rpb24odGhyZXNob2xkcykge1xuICByZXR1cm4gaXNfZHN0KHRoaXMsIHRocmVzaG9sZHMpIFxufVxuXG5pc19kc3QuZmluZF90aHJlc2hvbGRzID0gZmluZF9kc3RfdGhyZXNob2xkc1xuXG5pZih0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJykge1xuICBtb2R1bGUuZXhwb3J0cyA9IGlzX2RzdFxufSBlbHNlIHtcbiAgd2luZG93LmlzX2RzdCA9IGlzX2RzdCBcbn1cblxufSkoKVxuIiwidmFyIFRva2VuID0gcmVxdWlyZSgnLi90b2tlbicpXG4gICwgRmlsdGVyTm9kZSA9IHJlcXVpcmUoJy4vZmlsdGVyX25vZGUnKVxuXG5tb2R1bGUuZXhwb3J0cyA9IEZpbHRlclRva2VuXG5cbmZ1bmN0aW9uIEZpbHRlclRva2VuKGNvbnRlbnQsIGxpbmUpIHtcbiAgVG9rZW4uY2FsbCh0aGlzLCBjb250ZW50LCBsaW5lKVxufVxuXG52YXIgY29ucyA9IEZpbHRlclRva2VuXG4gICwgcHJvdG8gPSBjb25zLnByb3RvdHlwZSA9IG5ldyBUb2tlblxuXG5wcm90by5jb25zdHJ1Y3RvciA9IGNvbnNcblxucHJvdG8ubm9kZSA9IGZ1bmN0aW9uKHBhcnNlcikge1xuICByZXR1cm4gbmV3IEZpbHRlck5vZGUocGFyc2VyLmNvbXBpbGUodGhpcy5jb250ZW50KSlcbn1cblxuIiwibW9kdWxlLmV4cG9ydHMgPSBUYWdUb2tlblxuXG52YXIgVG9rZW4gPSByZXF1aXJlKCcuL3Rva2VuJylcblxuZnVuY3Rpb24gVGFnVG9rZW4oY29udGVudCwgbGluZSkge1xuICBUb2tlbi5jYWxsKHRoaXMsIGNvbnRlbnQsIGxpbmUpXG59XG5cbnZhciBjb25zID0gVGFnVG9rZW5cbiAgLCBwcm90byA9IGNvbnMucHJvdG90eXBlID0gbmV3IFRva2VuXG5cbnByb3RvLmNvbnN0cnVjdG9yID0gY29uc1xuXG5wcm90by5ub2RlID0gZnVuY3Rpb24ocGFyc2VyKSB7XG4gIHZhciB0YWcgPSBwYXJzZXIudGFncy5sb29rdXAodGhpcy5uYW1lKVxuXG4gIHJldHVybiB0YWcodGhpcy5jb250ZW50LCBwYXJzZXIpXG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IENvbW1lbnRUb2tlblxuXG52YXIgVG9rZW4gPSByZXF1aXJlKCcuL3Rva2VuJylcblxuZnVuY3Rpb24gQ29tbWVudFRva2VuKGNvbnRlbnQsIGxpbmUpIHtcbiAgVG9rZW4uY2FsbCh0aGlzLCBjb250ZW50LCBsaW5lKVxufVxuXG52YXIgY29ucyA9IENvbW1lbnRUb2tlblxuICAsIHByb3RvID0gY29ucy5wcm90b3R5cGUgPSBuZXcgVG9rZW5cblxucHJvdG8uY29uc3RydWN0b3IgPSBjb25zXG5cbnByb3RvLm5vZGUgPSBmdW5jdGlvbihwYXJzZXIpIHtcbiAgLy8gbm8tb3BlcmF0aW9uXG4gIHJldHVybiBudWxsXG59XG5cbiIsIm1vZHVsZS5leHBvcnRzID0gVGV4dFRva2VuXG5cbnZhciBUb2tlbiA9IHJlcXVpcmUoJy4vdG9rZW4nKVxuICAsIFRleHROb2RlID0gcmVxdWlyZSgnLi90ZXh0X25vZGUnKVxuXG5mdW5jdGlvbiBUZXh0VG9rZW4oY29udGVudCwgbGluZSkge1xuICBUb2tlbi5jYWxsKHRoaXMsIGNvbnRlbnQsIGxpbmUpXG59XG5cbnZhciBjb25zID0gVGV4dFRva2VuXG4gICwgcHJvdG8gPSBjb25zLnByb3RvdHlwZSA9IG5ldyBUb2tlblxuXG5wcm90by5jb25zdHJ1Y3RvciA9IGNvbnNcblxucHJvdG8ubm9kZSA9IGZ1bmN0aW9uKHBhcnNlcikge1xuICByZXR1cm4gbmV3IFRleHROb2RlKHRoaXMuY29udGVudClcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gUGFyc2VyXG5cbnZhciBOb2RlTGlzdCA9IHJlcXVpcmUoJy4vbm9kZV9saXN0JylcblxudmFyIEZpbHRlckNoYWluID0gcmVxdWlyZSgnLi9maWx0ZXJfY2hhaW4nKVxuICAsIEZpbHRlckxvb2t1cCA9IHJlcXVpcmUoJy4vZmlsdGVyX2xvb2t1cCcpXG4gICwgRmlsdGVyQXBwbGljYXRpb24gPSByZXF1aXJlKCcuL2ZpbHRlcl9hcHBsaWNhdGlvbicpXG5cbmZ1bmN0aW9uIFBhcnNlcih0b2tlbnMsIHRhZ3MsIGZpbHRlcnMsIHBsdWdpbnMpIHtcbiAgdGhpcy50b2tlbnMgPSB0b2tlbnNcbiAgdGhpcy50YWdzID0gdGFnc1xuICB0aGlzLmZpbHRlcnMgPSBmaWx0ZXJzXG4gIHRoaXMucGx1Z2lucyA9IHBsdWdpbnNcblxuICAvLyBmb3IgdXNlIHdpdGggZXh0ZW5kcyAvIGJsb2NrIHRhZ3NcbiAgdGhpcy5sb2FkZWRCbG9ja3MgPSBbXVxufVxuXG52YXIgY29ucyA9IFBhcnNlclxuICAsIHByb3RvID0gY29ucy5wcm90b3R5cGVcblxucHJvdG8uY2FjaGUgPSB7fVxuXG5wcm90by5wYXJzZSA9IGZ1bmN0aW9uKHVudGlsKSB7XG4gIHZhciBvdXRwdXQgPSBbXVxuICAgICwgdG9rZW4gPSBudWxsXG4gICAgLCBub2RlXG5cbiAgd2hpbGUodGhpcy50b2tlbnMubGVuZ3RoID4gMCkge1xuICAgIHRva2VuID0gdGhpcy50b2tlbnMuc2hpZnQoKVxuXG4gICAgaWYodW50aWwgJiYgdG9rZW4uaXModW50aWwpKSB7XG4gICAgICB0aGlzLnRva2Vucy51bnNoaWZ0KHRva2VuKVxuICAgICAgYnJlYWtcbiAgICB9IGVsc2UgaWYobm9kZSA9IHRva2VuLm5vZGUodGhpcykpIHtcbiAgICAgIG91dHB1dC5wdXNoKG5vZGUpXG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIG5ldyBOb2RlTGlzdChvdXRwdXQpXG59XG5cbnByb3RvLmNvbXBpbGVOdW1iZXIgPSBmdW5jdGlvbihjb250ZW50LCBpZHgsIG91dHB1dCkge1xuICB2YXIgY1xuICAgICwgZGVjaW1hbCA9IGNvbnRlbnQuY2hhckF0KGlkeCkgPT09ICcuJ1xuICAgICwgYml0cyA9IGRlY2ltYWwgPyBbJzAuJ10gOiBbXVxuXG4gIGRvIHtcbiAgICBjID0gY29udGVudC5jaGFyQXQoaWR4KVxuICAgIGlmKGMgPT09ICcuJykge1xuICAgICAgaWYoZGVjaW1hbClcbiAgICAgICAgYnJlYWtcbiAgICAgIGRlY2ltYWwgPSB0cnVlXG4gICAgICBiaXRzLnB1c2goJy4nKVxuICAgIH0gZWxzZSBpZigvXFxkLy50ZXN0KGMpKSB7XG4gICAgICBiaXRzLnB1c2goYylcbiAgICB9XG4gIH0gd2hpbGUoKytpZHggPCBjb250ZW50Lmxlbmd0aClcblxuICBvdXRwdXQucHVzaCgoZGVjaW1hbCA/IHBhcnNlRmxvYXQgOiBwYXJzZUludCkoYml0cy5qb2luKCcnKSwgMTApKVxuXG4gIHJldHVybiBpZHhcbn1cblxucHJvdG8uY29tcGlsZVN0cmluZyA9IGZ1bmN0aW9uKGNvbnRlbnQsIGlkeCwgb3V0cHV0KSB7XG4gIHZhciB0eXBlID0gY29udGVudC5jaGFyQXQoaWR4KVxuICAgICwgZXNjYXBlZCA9IGZhbHNlXG4gICAgLCBiaXRzID0gW11cbiAgICAsIGNcblxuICArK2lkeFxuXG4gIGRvIHtcbiAgICBjID0gY29udGVudC5jaGFyQXQoaWR4KVxuXG4gICAgaWYoZXNjYXBlZCkge1xuICAgICAgaWYoIS9bJ1wiXFxcXF0vLnRlc3QoYykpXG4gICAgICAgIGJpdHMucHVzaCgnXFxcXCcpXG5cbiAgICAgIGJpdHMucHVzaChjKVxuICAgICAgZXNjYXBlZCA9IGZhbHNlXG4gICAgfSBlbHNlIHtcbiAgICAgIGlmKGMgPT09ICdcXFxcJykge1xuICAgICAgICBlc2NhcGVkID0gdHJ1ZVxuICAgICAgfSBlbHNlIGlmKGMgPT09IHR5cGUpIHtcbiAgICAgICAgYnJlYWtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGJpdHMucHVzaChjKVxuICAgICAgfVxuICAgIH1cblxuICB9IHdoaWxlKCsraWR4IDwgY29udGVudC5sZW5ndGgpXG5cbiAgb3V0cHV0LnB1c2goYml0cy5qb2luKCcnKSlcblxuICByZXR1cm4gaWR4XG59XG5cbnByb3RvLmNvbXBpbGVOYW1lID0gZnVuY3Rpb24oY29udGVudCwgaWR4LCBvdXRwdXQpIHtcbiAgdmFyIG91dCA9IFtdXG4gICAgLCBjXG5cbiAgZG8ge1xuICAgIGMgPSBjb250ZW50LmNoYXJBdChpZHgpXG4gICAgaWYoL1teXFx3XFxkXFxfXS8udGVzdChjKSlcbiAgICAgIGJyZWFrXG5cbiAgICBvdXQucHVzaChjKVxuICB9IHdoaWxlKCsraWR4IDwgY29udGVudC5sZW5ndGgpXG5cbiAgb3V0cHV0LnB1c2gob3V0LmpvaW4oJycpKVxuXG4gIHJldHVybiBpZHhcbn1cblxucHJvdG8uY29tcGlsZUZpbHRlciA9IGZ1bmN0aW9uKGNvbnRlbnQsIGlkeCwgb3V0cHV0KSB7XG4gIHZhciBmaWx0ZXJOYW1lXG4gICAgLCBvbGRMZW5cbiAgICAsIGJpdHNcblxuICArK2lkeFxuXG4gIGlkeCA9IHRoaXMuY29tcGlsZU5hbWUoY29udGVudCwgaWR4LCBvdXRwdXQpXG4gIGZpbHRlck5hbWUgPSBvdXRwdXQucG9wKClcblxuICBpZihjb250ZW50LmNoYXJBdChpZHgpICE9PSAnOicpIHtcbiAgICBvdXRwdXQucHVzaChuZXcgRmlsdGVyQXBwbGljYXRpb24oZmlsdGVyTmFtZSwgW10pKVxuICAgIHJldHVybiBpZHggLSAxXG4gIH1cblxuICArK2lkeFxuXG4gIG9sZExlbiA9IG91dHB1dC5sZW5ndGhcbiAgaWR4ID0gdGhpcy5jb21waWxlRnVsbChjb250ZW50LCBpZHgsIG91dHB1dCwgdHJ1ZSlcbiAgYml0cyA9IG91dHB1dC5zcGxpY2Uob2xkTGVuLCBvdXRwdXQubGVuZ3RoIC0gb2xkTGVuKVxuXG4gIG91dHB1dC5wdXNoKG5ldyBGaWx0ZXJBcHBsaWNhdGlvbihmaWx0ZXJOYW1lLCBiaXRzKSlcblxuICByZXR1cm4gaWR4XG59XG5cbnByb3RvLmNvbXBpbGVMb29rdXAgPSBmdW5jdGlvbihjb250ZW50LCBpZHgsIG91dHB1dCkge1xuICB2YXIgYml0cyA9IFtdXG5cbiAgZG8ge1xuICAgIGlkeCA9IHRoaXMuY29tcGlsZU5hbWUoY29udGVudCwgaWR4LCBvdXRwdXQpXG4gICAgYml0cy5wdXNoKG91dHB1dC5wb3AoKSlcblxuICAgIGlmKGNvbnRlbnQuY2hhckF0KGlkeCkgIT09ICcuJylcbiAgICAgIGJyZWFrXG5cbiAgfSB3aGlsZSgrK2lkeCA8IGNvbnRlbnQubGVuZ3RoKVxuXG4gIG91dHB1dC5wdXNoKG5ldyBGaWx0ZXJMb29rdXAoYml0cykpXG5cbiAgcmV0dXJuIGlkeCAtIDFcbn1cblxucHJvdG8uY29tcGlsZUZ1bGwgPSBmdW5jdGlvbihjb250ZW50LCBpZHgsIG91dHB1dCwgb21pdFBpcGUpIHtcbiAgdmFyIGNcbiAgb3V0cHV0ID0gb3V0cHV0IHx8IFtdIFxuICBpZHggPSBpZHggfHwgMFxuXG4gIC8vIHNvbWV0aGluZ3xmaWx0ZXJuYW1lWzphcmcsIGFyZ11cbiAgLy8gXCJxdW90ZXNcIlxuICAvLyAxXG4gIC8vIDEuMlxuICAvLyB0cnVlIHwgZmFsc2VcblxuICAvLyBzd2FsbG93IGxlYWRpbmcgd2hpdGVzcGFjZS5cbiAgd2hpbGUoL1xccy8udGVzdChjb250ZW50LmNoYXJBdChpZHgpKSlcbiAgICArK2lkeFxuXG4gIGRvIHtcbiAgICBjID0gY29udGVudC5jaGFyQXQoaWR4KVxuXG4gICAgaWYoL1ssXFxzXS8udGVzdChjKSlcbiAgICAgIGJyZWFrXG5cbiAgICBpZihvbWl0UGlwZSAmJiBjID09PSAnfCcpIHtcbiAgICAgIC0taWR4XG4gICAgICBicmVha1xuICAgIH1cblxuICAgIHN3aXRjaCh0cnVlKSB7XG4gICAgICBjYXNlIC9bXFxkXFwuXS8udGVzdChjKTpcbiAgICAgICAgaWR4ID0gdGhpcy5jb21waWxlTnVtYmVyKGNvbnRlbnQsIGlkeCwgb3V0cHV0KVxuICAgICAgICBicmVha1xuICAgICAgY2FzZSAvWydcIl0vLnRlc3QoYyk6XG4gICAgICAgIGlkeCA9IHRoaXMuY29tcGlsZVN0cmluZyhjb250ZW50LCBpZHgsIG91dHB1dClcbiAgICAgICAgYnJlYWtcbiAgICAgIGNhc2UgYyA9PT0gJ3wnOlxuICAgICAgICBpZHggPSB0aGlzLmNvbXBpbGVGaWx0ZXIoY29udGVudCwgaWR4LCBvdXRwdXQpXG4gICAgICAgIGJyZWFrXG4gICAgICBkZWZhdWx0OlxuICAgICAgICBpZHggPSB0aGlzLmNvbXBpbGVMb29rdXAoY29udGVudCwgaWR4LCBvdXRwdXQpXG4gICAgICAgIGJyZWFrXG4gICAgfVxuICB9IHdoaWxlKCsraWR4IDwgY29udGVudC5sZW5ndGgpXG5cbiAgcmV0dXJuIGlkeFxufVxuXG5wcm90by5jb21waWxlID0gZnVuY3Rpb24oY29udGVudCkge1xuICB2YXIgb3V0cHV0ID0gW11cblxuICBpZih0aGlzLmNhY2hlW2NvbnRlbnRdKVxuICAgIHJldHVybiB0aGlzLmNhY2hlW2NvbnRlbnRdXG5cbiAgdGhpcy5jb21waWxlRnVsbChjb250ZW50LCAwLCBvdXRwdXQpXG5cbiAgb3V0cHV0ID0gdGhpcy5jYWNoZVtjb250ZW50XSA9IG5ldyBGaWx0ZXJDaGFpbihvdXRwdXQsIHRoaXMpXG4gIG91dHB1dC5hdHRhY2godGhpcylcblxuICByZXR1cm4gb3V0cHV0XG59XG4iLCJ2YXIgbGlicmFyaWVzID0gcmVxdWlyZSgnLi9saWJyYXJpZXMnKVxuXG5tb2R1bGUuZXhwb3J0cyA9IE1ldGFcblxuZnVuY3Rpb24gTWV0YSgpIHtcbiAgdGhpcy5fYXV0b3JlZ2lzdGVyID0ge1xuICAgICAgcGx1Z2luOiB7fVxuICAgICwgdGFnOiB7fVxuICAgICwgZmlsdGVyOiB7fVxuICB9XG5cbiAgdGhpcy5fY2FjaGUgPSB7fVxuXG4gIHRoaXMuX2NsYXNzZXMgPSB7XG4gICAgICBmaWx0ZXI6IGxpYnJhcmllcy5EZWZhdWx0RmlsdGVyTGlicmFyeVxuICAgICwgcGx1Z2luOiBsaWJyYXJpZXMuRGVmYXVsdFBsdWdpbkxpYnJhcnlcbiAgICAsIHRhZzogbGlicmFyaWVzLkRlZmF1bHRUYWdMaWJyYXJ5XG4gIH1cbn1cblxudmFyIGNvbnMgPSBNZXRhXG4gICwgcHJvdG8gPSBjb25zLnByb3RvdHlwZVxuXG5wcm90by5jcmVhdGVQbHVnaW5MaWJyYXJ5ID0gY3JlYXRlTGlicmFyeSgncGx1Z2luJylcbnByb3RvLmNyZWF0ZUZpbHRlckxpYnJhcnkgPSBjcmVhdGVMaWJyYXJ5KCdmaWx0ZXInKVxucHJvdG8uY3JlYXRlVGFnTGlicmFyeSA9IGNyZWF0ZUxpYnJhcnkoJ3RhZycpXG5cbnByb3RvLnJlZ2lzdGVyUGx1Z2luID0gY3JlYXRlQXV0b3JlZ2lzdGVyKCdwbHVnaW4nKVxucHJvdG8ucmVnaXN0ZXJGaWx0ZXIgPSBjcmVhdGVBdXRvcmVnaXN0ZXIoJ2ZpbHRlcicpXG5wcm90by5yZWdpc3RlclRhZyA9IGNyZWF0ZUF1dG9yZWdpc3RlcigndGFnJylcblxuZnVuY3Rpb24gY3JlYXRlQXV0b3JlZ2lzdGVyKG5hbWUpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uKGtleSwgaXRlbSkge1xuICAgIGlmKHRoaXMuX2NhY2hlW25hbWVdKVxuICAgICAgdGhpcy5fY2FjaGVbbmFtZV0ucmVnaXN0ZXIoa2V5LCBpdGVtKTtcbiAgICBlbHNlXG4gICAgICB0aGlzLl9hdXRvcmVnaXN0ZXJbbmFtZV1ba2V5XSA9IGl0ZW07XG4gIH1cbn1cblxuZnVuY3Rpb24gY3JlYXRlTGlicmFyeShuYW1lKSB7XG4gIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICBpZih0aGlzLl9jYWNoZVtuYW1lXSlcbiAgICAgIHJldHVybiB0aGlzLl9jYWNoZVtuYW1lXTsgXG5cbiAgICB2YXIgbGliID0gbmV3IHRoaXMuX2NsYXNzZXNbbmFtZV1cblxuICAgIGZvcih2YXIga2V5IGluIHRoaXMuX2F1dG9yZWdpc3RlcltuYW1lXSkge1xuICAgICAgbGliLnJlZ2lzdGVyKGtleSwgdGhpcy5fYXV0b3JlZ2lzdGVyW25hbWVdW2tleV0pXG4gICAgfVxuXG4gICAgdGhpcy5fY2FjaGVbbmFtZV0gPSBsaWJcbiAgICByZXR1cm4gbGliXG4gIH1cbn1cblxuIiwidmFyIExpYnJhcnkgPSByZXF1aXJlKCcuL2xpYnJhcnknKVxuXG5tb2R1bGUuZXhwb3J0cyA9IERlZmF1bHRUYWdzXG5cbmZ1bmN0aW9uIERlZmF1bHRUYWdzKCkge1xuICBMaWJyYXJ5LmNhbGwodGhpcywgdGhpcy5idWlsdGlucylcbn1cblxudmFyIGNvbnMgPSBEZWZhdWx0VGFnc1xuICAsIHByb3RvID0gY29ucy5wcm90b3R5cGUgPSBuZXcgTGlicmFyeVxuXG5wcm90by5jb25zdHJ1Y3RvciA9IGNvbnNcblxucHJvdG8uYnVpbHRpbnMgPSB7XG4gICAgJ2Jsb2NrJzogcmVxdWlyZSgnLi90YWdzL2Jsb2NrJykucGFyc2VcbiAgLCAnY29tbWVudCc6IHJlcXVpcmUoJy4vdGFncy9jb21tZW50JykucGFyc2VcbiAgLCAnZGVidWcnOiByZXF1aXJlKCcuL3RhZ3MvZGVidWcnKS5wYXJzZVxuICAsICdleHRlbmRzJzogcmVxdWlyZSgnLi90YWdzL2V4dGVuZHMnKS5wYXJzZVxuICAsICdmb3InOiByZXF1aXJlKCcuL3RhZ3MvZm9yJykucGFyc2VcbiAgLCAnaWYnOiByZXF1aXJlKCcuL3RhZ3MvaWYvbm9kZScpLnBhcnNlXG4gICwgJ2luY2x1ZGUnOiByZXF1aXJlKCcuL3RhZ3MvaW5jbHVkZScpLnBhcnNlXG4gICwgJ25vdyc6IHJlcXVpcmUoJy4vdGFncy9ub3cnKS5wYXJzZVxuICAsICd3aXRoJzogcmVxdWlyZSgnLi90YWdzL3dpdGgnKS5wYXJzZVxufVxuIiwidmFyIExpYnJhcnkgPSByZXF1aXJlKCcuL2xpYnJhcnknKVxuXG5tb2R1bGUuZXhwb3J0cyA9IERlZmF1bHRGaWx0ZXJzXG5cbmZ1bmN0aW9uIERlZmF1bHRGaWx0ZXJzKCkge1xuICBMaWJyYXJ5LmNhbGwodGhpcywgdGhpcy5idWlsdGlucylcbn1cblxudmFyIGNvbnMgPSBEZWZhdWx0RmlsdGVyc1xuICAsIHByb3RvID0gY29ucy5wcm90b3R5cGUgPSBuZXcgTGlicmFyeVxuXG5wcm90by5jb25zdHJ1Y3RvciA9IGNvbnNcblxucHJvdG8uYnVpbHRpbnMgPSB7XG4gICAgJ2FkZCc6IHJlcXVpcmUoJy4vZmlsdGVycy9hZGQnKVxuICAsICdhZGRzbGFzaGVzJzogcmVxdWlyZSgnLi9maWx0ZXJzL2FkZHNsYXNoZXMnKVxuICAsICdjYXBmaXJzdCc6IHJlcXVpcmUoJy4vZmlsdGVycy9jYXBmaXJzdCcpXG4gICwgJ2NlbnRlcic6IHJlcXVpcmUoJy4vZmlsdGVycy9jZW50ZXInKVxuICAsICdjdXQnOiByZXF1aXJlKCcuL2ZpbHRlcnMvY3V0JylcbiAgLCAnZGF0ZSc6IHJlcXVpcmUoJy4vZmlsdGVycy9kYXRlJylcbiAgLCAnZGVmYXVsdCc6IHJlcXVpcmUoJy4vZmlsdGVycy9kZWZhdWx0JylcbiAgLCAnZGljdHNvcnQnOiByZXF1aXJlKCcuL2ZpbHRlcnMvZGljdHNvcnQnKVxuICAsICdkaWN0c29ydHJldmVyc2VkJzogcmVxdWlyZSgnLi9maWx0ZXJzL2RpY3Rzb3J0cmV2ZXJzZWQnKVxuICAsICdkaXZpc2libGVieSc6IHJlcXVpcmUoJy4vZmlsdGVycy9kaXZpc2libGVieScpXG4gICwgJ2VzY2FwZSc6IHJlcXVpcmUoJy4vZmlsdGVycy9lc2NhcGUnKVxuICAsICdmaWxlc2l6ZWZvcm1hdCc6IHJlcXVpcmUoJy4vZmlsdGVycy9maWxlc2l6ZWZvcm1hdCcpXG4gICwgJ2ZpcnN0JzogcmVxdWlyZSgnLi9maWx0ZXJzL2ZpcnN0JylcbiAgLCAnZmxvYXRmb3JtYXQnOiByZXF1aXJlKCcuL2ZpbHRlcnMvZmxvYXRmb3JtYXQnKVxuICAsICdmb3JjZV9lc2NhcGUnOiByZXF1aXJlKCcuL2ZpbHRlcnMvZm9yY2VfZXNjYXBlJylcbiAgLCAnZ2V0X2RpZ2l0JzogcmVxdWlyZSgnLi9maWx0ZXJzL2dldF9kaWdpdCcpXG4gICwgJ2luZGV4JzogcmVxdWlyZSgnLi9maWx0ZXJzL2luZGV4JylcbiAgLCAnaXRlcml0ZW1zJzogcmVxdWlyZSgnLi9maWx0ZXJzL2l0ZXJpdGVtcycpXG4gICwgJ2lyaWVuY29kZSc6IHJlcXVpcmUoJy4vZmlsdGVycy9pcmllbmNvZGUnKVxuICAsICdqb2luJzogcmVxdWlyZSgnLi9maWx0ZXJzL2pvaW4nKVxuICAsICdsYXN0JzogcmVxdWlyZSgnLi9maWx0ZXJzL2xhc3QnKVxuICAsICdsZW5ndGgnOiByZXF1aXJlKCcuL2ZpbHRlcnMvbGVuZ3RoJylcbiAgLCAnbGVuZ3RoX2lzJzogcmVxdWlyZSgnLi9maWx0ZXJzL2xlbmd0aF9pcycpXG4gICwgJ2xpbmVicmVha3MnOiByZXF1aXJlKCcuL2ZpbHRlcnMvbGluZWJyZWFrcycpXG4gICwgJ2xpbmVicmVha3Nicic6IHJlcXVpcmUoJy4vZmlsdGVycy9saW5lYnJlYWtzYnInKVxuICAsICdsaW5lbnVtYmVycyc6IHJlcXVpcmUoJy4vZmlsdGVycy9saW5lbnVtYmVycycpXG4gICwgJ2xqdXN0JzogcmVxdWlyZSgnLi9maWx0ZXJzL2xqdXN0JylcbiAgLCAnbG93ZXInOiByZXF1aXJlKCcuL2ZpbHRlcnMvbG93ZXInKVxuICAsICdtYWtlX2xpc3QnOiByZXF1aXJlKCcuL2ZpbHRlcnMvbWFrZV9saXN0JylcbiAgLCAncGhvbmUybnVtZXJpYyc6IHJlcXVpcmUoJy4vZmlsdGVycy9waG9uZTJudW1lcmljJylcbiAgLCAncGx1cmFsaXplJzogcmVxdWlyZSgnLi9maWx0ZXJzL3BsdXJhbGl6ZScpXG4gICwgJ3JhbmRvbSc6IHJlcXVpcmUoJy4vZmlsdGVycy9yYW5kb20nKVxuICAsICdyanVzdCc6IHJlcXVpcmUoJy4vZmlsdGVycy9yanVzdCcpXG4gICwgJ3NhZmUnOiByZXF1aXJlKCcuL2ZpbHRlcnMvc2FmZScpXG4gICwgJ3NsaWNlJzogcmVxdWlyZSgnLi9maWx0ZXJzL3NsaWNlJylcbiAgLCAnc2x1Z2lmeSc6IHJlcXVpcmUoJy4vZmlsdGVycy9zbHVnaWZ5JylcbiAgLCAnc3BsaXQnOiByZXF1aXJlKCcuL2ZpbHRlcnMvc3BsaXQnKVxuICAsICdzdHJpcHRhZ3MnOiByZXF1aXJlKCcuL2ZpbHRlcnMvc3RyaXB0YWdzJylcbiAgLCAndGltZXNpbmNlJzogcmVxdWlyZSgnLi9maWx0ZXJzL3RpbWVzaW5jZScpXG4gICwgJ3RpbWV1bnRpbCc6IHJlcXVpcmUoJy4vZmlsdGVycy90aW1ldW50aWwnKVxuICAsICd0aXRsZSc6IHJlcXVpcmUoJy4vZmlsdGVycy90aXRsZScpXG4gICwgJ3RydW5jYXRlY2hhcnMnOiByZXF1aXJlKCcuL2ZpbHRlcnMvdHJ1bmNhdGVjaGFycycpXG4gICwgJ3RydW5jYXRld29yZHMnOiByZXF1aXJlKCcuL2ZpbHRlcnMvdHJ1bmNhdGV3b3JkcycpXG4gICwgJ3Vub3JkZXJlZF9saXN0JzogcmVxdWlyZSgnLi9maWx0ZXJzL3Vub3JkZXJlZF9saXN0JylcbiAgLCAndXBwZXInOiByZXF1aXJlKCcuL2ZpbHRlcnMvdXBwZXInKVxuICAsICd1cmxlbmNvZGUnOiByZXF1aXJlKCcuL2ZpbHRlcnMvdXJsZW5jb2RlJylcbiAgLCAndXJsaXplJzogcmVxdWlyZSgnLi9maWx0ZXJzL3VybGl6ZScpXG4gICwgJ3VybGl6ZXRydW5jJzogcmVxdWlyZSgnLi9maWx0ZXJzL3VybGl6ZXRydW5jJylcbiAgLCAnd29yZGNvdW50JzogcmVxdWlyZSgnLi9maWx0ZXJzL3dvcmRjb3VudCcpXG4gICwgJ3dvcmR3cmFwJzogcmVxdWlyZSgnLi9maWx0ZXJzL3dvcmR3cmFwJylcbiAgLCAneWVzbm8nOiByZXF1aXJlKCcuL2ZpbHRlcnMveWVzbm8nKVxufVxuXG4iLCJtb2R1bGUuZXhwb3J0cyA9IFRva2VuXG5cbmZ1bmN0aW9uIFRva2VuKGNvbnRlbnQsIGxpbmUpIHtcbiAgdGhpcy5jb250ZW50ID0gY29udGVudFxuICB0aGlzLmxpbmUgPSBsaW5lXG5cbiAgdGhpcy5uYW1lID0gY29udGVudCAmJiBjb250ZW50LnNwbGl0KCcgJylbMF1cbn1cblxudmFyIGNvbnMgPSBUb2tlblxuICAsIHByb3RvID0gY29ucy5wcm90b3R5cGVcblxucHJvdG8udG9TdHJpbmcgPSBmdW5jdGlvbigpIHtcbiAgLy8gTkI6IHRoaXMgc2hvdWxkIG9ubHkgYmVcbiAgLy8gZGVidWcgb3V0cHV0LCBzbyBpdCdzXG4gIC8vIHByb2JhYmx5IHNhZmUgdG8gdXNlXG4gIC8vIEpTT04uc3RyaW5naWZ5IGhlcmUuXG4gIHJldHVybiAnPCcrdGhpcy5jb25zdHJ1Y3Rvci5uYW1lKyc6ICcrSlNPTi5zdHJpbmdpZnkodGhpcy5jb250ZW50KSsnPidcbn1cblxucHJvdG8uaXMgPSBmdW5jdGlvbihuYW1lcykge1xuICBmb3IodmFyIGkgPSAwLCBsZW4gPSBuYW1lcy5sZW5ndGg7IGkgPCBsZW47ICsraSlcbiAgICBpZihuYW1lc1tpXSA9PT0gdGhpcy5uYW1lKVxuICAgICAgcmV0dXJuIHRydWVcbiAgcmV0dXJuIGZhbHNlXG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IFRleHROb2RlXG5cbmZ1bmN0aW9uIFRleHROb2RlKGNvbnRlbnQpIHtcbiAgdGhpcy5jb250ZW50ID0gY29udGVudFxufVxuXG52YXIgY29ucyA9IFRleHROb2RlXG4gICwgcHJvdG8gPSBjb25zLnByb3RvdHlwZVxuXG5wcm90by5yZW5kZXIgPSBmdW5jdGlvbihjb250ZXh0KSB7XG4gIHJldHVybiB0aGlzLmNvbnRlbnRcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gRmlsdGVyQ2hhaW5cblxuZnVuY3Rpb24gRmlsdGVyQ2hhaW4oYml0cykge1xuICB0aGlzLmJpdHMgPSBiaXRzXG59XG5cbnZhciBjb25zID0gRmlsdGVyQ2hhaW5cbiAgLCBwcm90byA9IGNvbnMucHJvdG90eXBlXG5cbnByb3RvLmF0dGFjaCA9IGZ1bmN0aW9uKHBhcnNlcikge1xuICBmb3IodmFyIGkgPSAwLCBsZW4gPSB0aGlzLmJpdHMubGVuZ3RoOyBpIDwgbGVuOyArK2kpIHtcbiAgICBpZih0aGlzLmJpdHNbaV0gJiYgdGhpcy5iaXRzW2ldLmF0dGFjaCkgeyBcbiAgICAgIHRoaXMuYml0c1tpXS5hdHRhY2gocGFyc2VyKVxuICAgIH1cbiAgfVxufVxuXG5wcm90by5yZXNvbHZlID0gZnVuY3Rpb24oY29udGV4dCkge1xuICB2YXIgcmVzdWx0ID0gdGhpcy5iaXRzWzBdLnJlc29sdmUgP1xuICAgICAgdGhpcy5iaXRzWzBdLnJlc29sdmUoY29udGV4dCkgOlxuICAgICAgdGhpcy5iaXRzWzBdXG5cbiAgZm9yKHZhciBpID0gMSwgbGVuID0gdGhpcy5iaXRzLmxlbmd0aDsgaSA8IGxlbjsgKytpKSB7XG4gICAgcmVzdWx0ID0gdGhpcy5iaXRzW2ldLnJlc29sdmUoY29udGV4dCwgcmVzdWx0KVxuICB9XG5cbiAgcmV0dXJuIHJlc3VsdFxufVxuXG4iLCJtb2R1bGUuZXhwb3J0cyA9IENvbW1lbnROb2RlXG5cbmZ1bmN0aW9uIENvbW1lbnROb2RlKCkge1xuICAvLyBuby1vcC5cbn1cblxudmFyIGNvbnMgPSBDb21tZW50Tm9kZVxuICAsIHByb3RvID0gY29ucy5wcm90b3R5cGVcblxucHJvdG8ucmVuZGVyID0gZnVuY3Rpb24oY29udGV4dCkge1xuICByZXR1cm4gJydcbn1cblxuY29ucy5wYXJzZSA9IGZ1bmN0aW9uKGNvbnRlbnRzLCBwYXJzZXIpIHtcbiAgbmwgPSBwYXJzZXIucGFyc2UoWydlbmRjb21tZW50J10pXG4gIHBhcnNlci50b2tlbnMuc2hpZnQoKVxuXG4gIHJldHVybiBuZXcgY29uc1xufVxuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihpbnB1dCwgdmFsdWUpIHtcbiAgcmV0dXJuIHBhcnNlSW50KGlucHV0LCAxMCkgKyBwYXJzZUludCh2YWx1ZSwgMTApXG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGlucHV0KSB7XG4gIHJldHVybiBpbnB1dC50b1N0cmluZygpLnJlcGxhY2UoLycvZywgXCJcXFxcJ1wiKVxufVxuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihpbnB1dCkge1xuICB2YXIgc3RyID0gaW5wdXQudG9TdHJpbmcoKTtcbiAgcmV0dXJuIFtzdHIuc2xpY2UoMCwxKS50b1VwcGVyQ2FzZSgpLCBzdHIuc2xpY2UoMSldLmpvaW4oJycpXG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGlucHV0LCBsZW4sIHJlYWR5KSB7XG4gIGlmKHJlYWR5ID09PSB1bmRlZmluZWQpXG4gICAgbGVuID0gMFxuXG4gIHZhciBzdHIgPSBpbnB1dC50b1N0cmluZygpXG4gICAgLCB2YWx1ZSA9ICcgJ1xuXG4gIGxlbiAtPSBzdHIubGVuZ3RoXG4gIGlmKGxlbiA8IDApIHsgXG4gICAgcmV0dXJuIHN0clxuICB9XG5cbiAgdmFyIGxlbl9oYWxmID0gbGVuLzIuMFxuICAgICwgYXJyID0gW11cbiAgICAsIGlkeCA9IE1hdGguZmxvb3IobGVuX2hhbGYpXG5cbiAgd2hpbGUoaWR4LS0gPiAwKSB7XG4gICAgYXJyLnB1c2godmFsdWUpXG4gIH1cblxuICBhcnIgPSBhcnIuam9pbignJylcbiAgc3RyID0gYXJyICsgc3RyICsgYXJyXG4gIGlmKChsZW5faGFsZiAtIE1hdGguZmxvb3IobGVuX2hhbGYpKSA+IDApIHtcbiAgICBzdHIgPSBpbnB1dC50b1N0cmluZygpLmxlbmd0aCAlIDIgPT0gMCA/IHZhbHVlICsgc3RyIDogc3RyICsgdmFsdWVcbiAgfVxuICBcbiAgcmV0dXJuIHN0clxufVxuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihpbnB1dCwgdmFsdWUpIHtcbiAgdmFyIHN0ciA9IGlucHV0LnRvU3RyaW5nKClcbiAgcmV0dXJuIHN0ci5yZXBsYWNlKG5ldyBSZWdFeHAodmFsdWUsIFwiZ1wiKSwgJycpXG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGlucHV0LCBkZWYsIHJlYWR5KSB7XG4gIHJldHVybiBpbnB1dCA/IGlucHV0IDogZGVmXG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGlucHV0LCBrZXkpIHtcbiAgcmV0dXJuIGlucHV0LnNvcnQoZnVuY3Rpb24oeCwgeSkge1xuICAgIGlmKHhba2V5XSA+IHlba2V5XSkgcmV0dXJuIDFcbiAgICBpZih4W2tleV0gPT0geVtrZXldKSByZXR1cm4gMFxuICAgIGlmKHhba2V5XSA8IHlba2V5XSkgcmV0dXJuIC0xXG4gIH0pXG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGlucHV0LCBudW0pIHtcbiAgcmV0dXJuIGlucHV0ICUgcGFyc2VJbnQobnVtLCAxMCkgPT0gMFxufVxuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihpbnB1dCkge1xuICB2YXIgbnVtID0gKG5ldyBOdW1iZXIoaW5wdXQpKS52YWx1ZU9mKClcbiAgICAsIHNpbmd1bGFyID0gbnVtID09IDEgPyAnJyA6ICdzJ1xuICAgICwgdmFsdWUgXG4gICAgXG4gIHZhbHVlID1cbiAgICBudW0gPCAxMDI0ID8gbnVtICsgJyBieXRlJytzaW5ndWxhciA6XG4gICAgbnVtIDwgKDEwMjQqMTAyNCkgPyAobnVtLzEwMjQpKycgS0InIDpcbiAgICBudW0gPCAoMTAyNCoxMDI0KjEwMjQpID8gKG51bSAvICgxMDI0KjEwMjQpKSArICcgTUInIDpcbiAgICBudW0gLyAoMTAyNCoxMDI0KjEwMjQpICsgJyBHQidcblxuICByZXR1cm4gdmFsdWVcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oaW5wdXQpIHtcbiAgcmV0dXJuIGlucHV0WzBdXG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGlucHV0LCB2YWwpIHtcbiAgdmFsID0gcGFyc2VJbnQodmFsLCAxMClcbiAgdmFsID0gaXNOYU4odmFsKSA/IC0xIDogdmFsXG5cbiAgdmFyIGlzUG9zaXRpdmUgPSB2YWwgPj0gMFxuICAgICwgYXNOdW1iZXIgPSBwYXJzZUZsb2F0KGlucHV0KVxuICAgICwgYWJzVmFsdWUgPSBNYXRoLmFicyh2YWwpXG4gICAgLCBwb3cgPSBNYXRoLnBvdygxMCwgYWJzVmFsdWUpXG4gICAgLCBwb3dfbWludXNfb25lID0gTWF0aC5wb3coMTAsIE1hdGgubWF4KGFic1ZhbHVlLTEsIDApKVxuICAgICwgYXNTdHJpbmdcblxuICBhc051bWJlciA9IE1hdGgucm91bmQoKHBvdyAqIGFzTnVtYmVyKSAvIHBvd19taW51c19vbmUpXG5cbiAgaWYodmFsICE9PSAwKVxuICAgIGFzTnVtYmVyIC89IDEwXG5cbiAgYXNTdHJpbmcgPSBhc051bWJlci50b1N0cmluZygpXG5cbiAgaWYoaXNQb3NpdGl2ZSkge1xuICAgIHZhciBzcGxpdCA9IGFzU3RyaW5nLnNwbGl0KCcuJylcbiAgICAgICwgZGVjaW1hbCA9IHNwbGl0Lmxlbmd0aCA+IDEgPyBzcGxpdFsxXSA6ICcnXG5cbiAgICB3aGlsZShkZWNpbWFsLmxlbmd0aCA8IHZhbCkge1xuICAgICAgZGVjaW1hbCArPSAnMCdcbiAgICB9XG5cbiAgICBhc1N0cmluZyA9IGRlY2ltYWwubGVuZ3RoID8gW3NwbGl0WzBdLCBkZWNpbWFsXS5qb2luKCcuJykgOiBzcGxpdFswXVxuICB9XG5cbiAgcmV0dXJuIGFzU3RyaW5nXG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGlucHV0LCBkaWdpdCkge1xuICB2YXIgaXNOdW0gPSAhaXNOYU4ocGFyc2VJbnQoaW5wdXQsIDEwKSlcbiAgICAsIHN0ciA9IGlucHV0LnRvU3RyaW5nKClcbiAgICAsIGxlbiA9IHN0ci5zcGxpdCgnJykubGVuZ3RoXG5cbiAgZGlnaXQgPSBwYXJzZUludChkaWdpdCwgMTApXG4gIGlmKGlzTnVtICYmICFpc05hTihkaWdpdCkgJiYgZGlnaXQgPD0gbGVuKSB7XG4gICAgcmV0dXJuIHN0ci5jaGFyQXQobGVuIC0gZGlnaXQpXG4gIH1cblxuICByZXR1cm4gaW5wdXRcbn1cbiIsbnVsbCwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihpbnB1dCkge1xuICB2YXIgb3V0cHV0ID0gW11cbiAgZm9yKHZhciBuYW1lIGluIGlucHV0KSBpZihpbnB1dC5oYXNPd25Qcm9wZXJ0eShuYW1lKSkge1xuICAgIG91dHB1dC5wdXNoKFtuYW1lLCBpbnB1dFtuYW1lXV0pXG4gIH1cbiAgcmV0dXJuIG91dHB1dFxufVxuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihpbnB1dCkge1xuICByZXR1cm4gaW5wdXRcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oaW5wdXQsIGdsdWUpIHtcbiAgaW5wdXQgPSBpbnB1dCBpbnN0YW5jZW9mIEFycmF5ID8gaW5wdXQgOiBpbnB1dC50b1N0cmluZygpLnNwbGl0KCcnKVxuICByZXR1cm4gaW5wdXQuam9pbihnbHVlKVxufVxuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihpbnB1dCkge1xuICB2YXIgY2IgPSBpbnB1dC5jaGFyQXQgfHwgZnVuY3Rpb24oaW5kKSB7IHJldHVybiBpbnB1dFtpbmRdOyB9XG5cbiAgcmV0dXJuIGNiLmNhbGwoaW5wdXQsIGlucHV0Lmxlbmd0aC0xKTtcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oaW5wdXQsIHJlYWR5KSB7XG4gIGlmKGlucHV0ICYmIHR5cGVvZiBpbnB1dC5sZW5ndGggPT09ICdmdW5jdGlvbicpIHtcbiAgICByZXR1cm4gaW5wdXQubGVuZ3RoKHJlYWR5KVxuICB9XG4gIHJldHVybiBpbnB1dC5sZW5ndGhcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oaW5wdXQsIGV4cGVjdGVkLCByZWFkeSkge1xuICB2YXIgdG1wXG4gIGlmKGlucHV0ICYmIHR5cGVvZiBpbnB1dC5sZW5ndGggPT09ICdmdW5jdGlvbicpIHtcbiAgICB0bXAgPSBpbnB1dC5sZW5ndGgoZnVuY3Rpb24oZXJyLCBsZW4pIHtcbiAgICAgIHJlYWR5KGVyciwgZXJyID8gbnVsbCA6IGxlbiA9PT0gZXhwZWN0ZWQpXG4gICAgfSlcblxuICAgIHJldHVybiB0bXAgPT09IHVuZGVmaW5lZCA/IHVuZGVmaW5lZCA6IHRtcCA9PT0gZXhwZWN0ZWRcbiAgfVxuXG4gIHJldHVybiBpbnB1dC5sZW5ndGggPT09IGV4cGVjdGVkXG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGlucHV0KSB7XG4gIHZhciBzdHIgPSBpbnB1dC50b1N0cmluZygpXG4gICAgLCBiaXRzID0gc3RyLnNwbGl0KCdcXG4nKVxuICAgICwgb3V0ID0gW11cbiAgICAsIGxlbiA9IGJpdHMubGVuZ3RoXG5cbiAgd2hpbGUoYml0cy5sZW5ndGgpIHtcbiAgICBvdXQudW5zaGlmdChsZW4gLSBvdXQubGVuZ3RoICsgJy4gJyArIGJpdHMucG9wKCkpXG4gIH1cblxuICByZXR1cm4gb3V0LmpvaW4oJ1xcbicpXG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGlucHV0LCBudW0pIHtcbiAgdmFyIGJpdHMgPSAoaW5wdXQgPT09IG51bGwgfHwgaW5wdXQgPT09IHVuZGVmaW5lZCA/ICcnIDogaW5wdXQpLnRvU3RyaW5nKCkuc3BsaXQoJycpXG4gICAgLCBkaWZmZXJlbmNlID0gbnVtIC0gYml0cy5sZW5ndGhcblxuICAvLyBwdXNoIHJldHVybnMgbmV3IGxlbmd0aCBvZiBhcnJheS5cbiAgd2hpbGUoZGlmZmVyZW5jZSA+IDApIHtcbiAgICBkaWZmZXJlbmNlID0gbnVtIC0gYml0cy5wdXNoKCcgJylcbiAgfVxuXG4gIHJldHVybiBiaXRzLmpvaW4oJycpXG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGlucHV0KSB7XG4gIHJldHVybiBpbnB1dC50b1N0cmluZygpLnRvTG93ZXJDYXNlKClcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oaW5wdXQpIHtcbiAgaW5wdXQgPSBpbnB1dCBpbnN0YW5jZW9mIEFycmF5ID8gaW5wdXQgOiBpbnB1dC50b1N0cmluZygpLnNwbGl0KCcnKVxuXG4gIHJldHVybiBpbnB1dFxufVxuIiwiXG52YXIgTEVUVEVSUyA9IHtcbidhJzogJzInLCAnYic6ICcyJywgJ2MnOiAnMicsICdkJzogJzMnLCAnZSc6ICczJyxcbidmJzogJzMnLCAnZyc6ICc0JywgJ2gnOiAnNCcsICdpJzogJzQnLCAnaic6ICc1JywgJ2snOiAnNScsICdsJzogJzUnLFxuJ20nOiAnNicsICduJzogJzYnLCAnbyc6ICc2JywgJ3AnOiAnNycsICdxJzogJzcnLCAncic6ICc3JywgJ3MnOiAnNycsXG4ndCc6ICc4JywgJ3UnOiAnOCcsICd2JzogJzgnLCAndyc6ICc5JywgJ3gnOiAnOScsICd5JzogJzknLCAneic6ICc5J1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihpbnB1dCkge1xuICB2YXIgc3RyID0gaW5wdXQudG9TdHJpbmcoKS50b0xvd2VyQ2FzZSgpLnNwbGl0KCcnKVxuICAgICwgb3V0ID0gW11cbiAgICAsIGx0clxuXG4gIHdoaWxlKHN0ci5sZW5ndGgpIHtcbiAgICBsdHIgPSBzdHIucG9wKClcbiAgICBvdXQudW5zaGlmdChMRVRURVJTW2x0cl0gPyBMRVRURVJTW2x0cl0gOiBsdHIpXG4gIH1cblxuICByZXR1cm4gb3V0LmpvaW4oJycpXG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGlucHV0LCBwbHVyYWwpIHtcbiAgcGx1cmFsID0gKHBsdXJhbCB8fCAncycpLnNwbGl0KCcsJylcblxuICB2YXIgdmFsID0gTnVtYmVyKGlucHV0KVxuICAgICwgc3VmZml4XG5cbiAgc3VmZml4ID0gcGx1cmFsW3BsdXJhbC5sZW5ndGgtMV07XG4gIGlmKHZhbCA9PT0gMSkge1xuICAgIHN1ZmZpeCA9IHBsdXJhbC5sZW5ndGggPiAxID8gcGx1cmFsWzBdIDogJyc7ICAgIFxuICB9XG5cbiAgcmV0dXJuIHN1ZmZpeFxufVxuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihpbnB1dCkge1xuICB2YXIgY2IgPSBpbnB1dC5jaGFyQXQgfHwgZnVuY3Rpb24oaWR4KSB7XG4gICAgcmV0dXJuIHRoaXNbaWR4XTtcbiAgfTtcblxuICByZXR1cm4gY2IuY2FsbChpbnB1dCwgTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogaW5wdXQubGVuZ3RoKSlcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oaW5wdXQsIG51bSkge1xuICB2YXIgYml0cyA9IChpbnB1dCA9PT0gbnVsbCB8fCBpbnB1dCA9PT0gdW5kZWZpbmVkID8gJycgOiBpbnB1dCkudG9TdHJpbmcoKS5zcGxpdCgnJylcbiAgICAsIGRpZmZlcmVuY2UgPSBudW0gLSBiaXRzLmxlbmd0aFxuXG4gIC8vIHB1c2ggcmV0dXJucyBuZXcgbGVuZ3RoIG9mIGFycmF5LlxuICAvLyBOQjogW10udW5zaGlmdCByZXR1cm5zIGB1bmRlZmluZWRgIGluIElFPDkuXG4gIHdoaWxlKGRpZmZlcmVuY2UgPiAwKSB7XG4gICAgZGlmZmVyZW5jZSA9IChiaXRzLnVuc2hpZnQoJyAnKSwgbnVtIC0gYml0cy5sZW5ndGgpXG4gIH1cblxuICByZXR1cm4gYml0cy5qb2luKCcnKVxufVxuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihpbnB1dCwgYnkpIHtcbiAgYnkgPSBieS50b1N0cmluZygpXG4gIGlmKGJ5LmNoYXJBdCgwKSA9PT0gJzonKSB7XG4gICAgYnkgPSAnMCcrYnlcbiAgfVxuXG4gIGlmKGJ5LmNoYXJBdChieS5sZW5ndGgtMSkgPT09ICc6Jykge1xuICAgIGJ5ID0gYnkuc2xpY2UoMCwgLTEpXG4gIH1cblxuICB2YXIgc3BsaXRCeSA9IGJ5LnNwbGl0KCc6JylcbiAgICAsIHNsaWNlID0gaW5wdXQuc2xpY2UgfHwgKGZ1bmN0aW9uKCkge1xuICAgICAgICBpbnB1dCA9IHRoaXMudG9TdHJpbmcoKVxuICAgICAgICByZXR1cm4gaW5wdXQuc2xpY2VcbiAgICAgIH0pKClcblxuICByZXR1cm4gc2xpY2UuYXBwbHkoaW5wdXQsIHNwbGl0QnkpXG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGlucHV0KSB7XG4gIGlucHV0ID0gaW5wdXQudG9TdHJpbmcoKVxuICByZXR1cm4gaW5wdXRcbiAgICAgICAgLnJlcGxhY2UoL1teXFx3XFxzXFxkXFwtXS9nLCAnJylcbiAgICAgICAgLnJlcGxhY2UoL15cXHMqLywgJycpXG4gICAgICAgIC5yZXBsYWNlKC9cXHMqJC8sICcnKVxuICAgICAgICAucmVwbGFjZSgvW1xcLVxcc10rL2csICctJylcbiAgICAgICAgLnRvTG93ZXJDYXNlKClcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oaW5wdXQsIGJ5LCByZWFkeSkge1xuICBieSA9IGFyZ3VtZW50cy5sZW5ndGggPT09IDIgPyAnLCcgOiBieVxuICBpbnB1dCA9ICcnK2lucHV0XG4gIHJldHVybiBpbnB1dC5zcGxpdChieSlcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oaW5wdXQpIHtcbiAgdmFyIHN0ciA9IGlucHV0LnRvU3RyaW5nKClcbiAgcmV0dXJuIHN0ci5yZXBsYWNlKC88W14+XSo/Pi9nLCAnJylcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oaW5wdXQsIG4sIHJlYWR5KSB7XG4gIHZhciBpbnB1dCA9IG5ldyBEYXRlKGlucHV0KVxuICAgICwgbm93ICAgPSByZWFkeSA9PT0gdW5kZWZpbmVkID8gbmV3IERhdGUoKSA6IG5ldyBEYXRlKG4pXG4gICAgLCBkaWZmICA9IGlucHV0IC0gbm93XG4gICAgLCBzaW5jZSA9IE1hdGguYWJzKGRpZmYpXG5cbiAgaWYoZGlmZiA+IDApXG4gICAgcmV0dXJuICcwIG1pbnV0ZXMnXG5cbiAgLy8gMzY1LjI1ICogMjQgKiA2MCAqIDYwICogMTAwMCA9PT0geWVhcnNcbiAgdmFyIHllYXJzID0gICB+fihzaW5jZSAvIDMxNTU3NjAwMDAwKVxuICAgICwgbW9udGhzID0gIH5+KChzaW5jZSAtICh5ZWFycyozMTU1NzYwMDAwMCkpIC8gMjU5MjAwMDAwMClcbiAgICAsIGRheXMgPSAgICB+figoc2luY2UgLSAoeWVhcnMgKiAzMTU1NzYwMDAwMCArIG1vbnRocyAqIDI1OTIwMDAwMDApKSAvIDg2NDAwMDAwKVxuICAgICwgaG91cnMgPSAgIH5+KChzaW5jZSAtICh5ZWFycyAqIDMxNTU3NjAwMDAwICsgbW9udGhzICogMjU5MjAwMDAwMCArIGRheXMgKiA4NjQwMDAwMCkpIC8gMzYwMDAwMClcbiAgICAsIG1pbnV0ZXMgPSB+figoc2luY2UgLSAoeWVhcnMgKiAzMTU1NzYwMDAwMCArIG1vbnRocyAqIDI1OTIwMDAwMDAgKyBkYXlzICogODY0MDAwMDAgKyBob3VycyAqIDM2MDAwMDApKSAvIDYwMDAwKVxuICAgICwgcmVzdWx0ID0gW1xuICAgICAgICB5ZWFycyAgID8gcGx1cmFsaXplKHllYXJzLCAgICAneWVhcicpIDogbnVsbFxuICAgICAgLCBtb250aHMgID8gcGx1cmFsaXplKG1vbnRocywgICAnbW9udGgnKSA6IG51bGxcbiAgICAgICwgZGF5cyAgICA/IHBsdXJhbGl6ZShkYXlzLCAgICAgJ2RheScpIDogbnVsbFxuICAgICAgLCBob3VycyAgID8gcGx1cmFsaXplKGhvdXJzLCAgICAnaG91cicpIDogbnVsbFxuICAgICAgLCBtaW51dGVzID8gcGx1cmFsaXplKG1pbnV0ZXMsICAnbWludXRlJykgOiBudWxsXG4gICAgXVxuICAgICwgb3V0ID0gW11cblxuICBmb3IodmFyIGkgPSAwLCBsZW4gPSByZXN1bHQubGVuZ3RoOyBpIDwgbGVuOyArK2kpIHtcbiAgICByZXN1bHRbaV0gIT09IG51bGwgJiYgb3V0LnB1c2gocmVzdWx0W2ldKVxuICB9XG5cbiAgaWYoIW91dC5sZW5ndGgpIHtcbiAgICByZXR1cm4gJzAgbWludXRlcydcbiAgfVxuXG4gIHJldHVybiBvdXRbMF0gKyAob3V0WzFdID8gJywgJyArIG91dFsxXSA6ICcnKVxuXG4gIGZ1bmN0aW9uIHBsdXJhbGl6ZSh4LCBzdHIpIHtcbiAgICByZXR1cm4geCArICcgJyArIHN0ciArICh4ID09PSAxID8gJycgOiAncycpXG4gIH1cbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oaW5wdXQpIHtcbiAgdmFyIHN0ciA9IGlucHV0LnRvU3RyaW5nKClcbiAgICAsIGJpdHMgPSBzdHIuc3BsaXQoL1xcc3sxfS9nKVxuICAgICwgb3V0ID0gW11cbiAgXG4gIHdoaWxlKGJpdHMubGVuZ3RoKSB7XG4gICAgdmFyIHdvcmQgPSBiaXRzLnBvcCgpXG4gICAgd29yZCA9IHdvcmQuY2hhckF0KDApLnRvVXBwZXJDYXNlKCkgKyB3b3JkLnNsaWNlKDEpXG4gICAgb3V0LnB1c2god29yZClcbiAgfVxuXG4gIG91dCA9IG91dC5qb2luKCcgJylcbiAgcmV0dXJuIG91dC5yZXBsYWNlKC8oW2Etel0pJyhbQS1aXSkvZywgZnVuY3Rpb24oYSwgbSwgeCkgeyByZXR1cm4geC50b0xvd2VyQ2FzZSgpIH0pXG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGlucHV0LCBuKSB7XG4gIHZhciBzdHIgPSBpbnB1dC50b1N0cmluZygpXG4gICAgLCBudW0gPSBwYXJzZUludChuLCAxMClcblxuICBpZihpc05hTihudW0pKVxuICAgIHJldHVybiBpbnB1dFxuXG4gIGlmKGlucHV0Lmxlbmd0aCA8PSBudW0pXG4gICAgcmV0dXJuIGlucHV0XG5cbiAgcmV0dXJuIGlucHV0LnNsaWNlKDAsIG51bSkrJy4uLidcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oaW5wdXQsIG4pIHtcbiAgdmFyIHN0ciA9IGlucHV0LnRvU3RyaW5nKClcbiAgICAsIG51bSA9IHBhcnNlSW50KG4sIDEwKVxuICAgICwgd29yZHNcblxuICBpZihpc05hTihudW0pKVxuICAgIHJldHVybiBpbnB1dFxuXG4gIHdvcmRzID0gaW5wdXQuc3BsaXQoL1xccysvKVxuXG4gIGlmKHdvcmRzLmxlbmd0aCA8PSBudW0pXG4gICAgcmV0dXJuIGlucHV0XG5cbiAgcmV0dXJuIHdvcmRzLnNsaWNlKDAsIG51bSkuam9pbignICcpKycuLi4nXG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGlucHV0KSB7XG4gIHJldHVybiBpbnB1dC50b1N0cmluZygpLnRvVXBwZXJDYXNlKClcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oaW5wdXQpIHtcbiAgcmV0dXJuIGVzY2FwZShpbnB1dC50b1N0cmluZygpKVxufVxuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihpbnB1dCkge1xuICB2YXIgc3RyID0gaW5wdXQudG9TdHJpbmcoKVxuICAgICwgYml0cyA9IHN0ci5zcGxpdCgvXFxzKy9nKVxuXG4gIHJldHVybiBiaXRzLmxlbmd0aFxufVxuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihpbnB1dCwgbGVuKSB7XG4gIHZhciB3b3JkcyA9IGlucHV0LnRvU3RyaW5nKCkuc3BsaXQoL1xccysvZylcbiAgICAsIG91dCA9IFtdXG4gICAgLCBsZW4gPSBwYXJzZUludChsZW4sIDEwKSB8fCB3b3Jkcy5sZW5ndGhcblxuICB3aGlsZSh3b3Jkcy5sZW5ndGgpIHtcbiAgICBvdXQudW5zaGlmdCh3b3Jkcy5zcGxpY2UoMCwgbGVuKS5qb2luKCcgJykpXG4gIH1cblxuICByZXR1cm4gb3V0LmpvaW4oJ1xcbicpXG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGlucHV0LCBtYXApIHtcbiAgdmFyIG91ck1hcCA9IG1hcC50b1N0cmluZygpLnNwbGl0KCcsJylcbiAgICAsIHZhbHVlXG5cbiAgb3VyTWFwLmxlbmd0aCA8IDMgJiYgb3VyTWFwLnB1c2gob3VyTWFwWzFdKVxuXG4gIHZhbHVlID0gb3VyTWFwW1xuICAgIGlucHV0ID8gMCA6XG4gICAgaW5wdXQgPT09IGZhbHNlID8gMSA6XG4gICAgMlxuICBdXG5cbiAgcmV0dXJuIHZhbHVlXG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IHsgdGltZTogdGltZV9mb3JtYXQsIGRhdGU6IGZvcm1hdCwgRGF0ZUZvcm1hdDogRGF0ZUZvcm1hdCB9XG5cbnRyeSB7IHJlcXVpcmUoJ3R6JykgfSBjYXRjaChlKSB7IH1cblxuZnVuY3Rpb24gY2FwZmlyc3QgKHN0cikge1xuICByZXR1cm4gc3RyLnJlcGxhY2UoL14oLnsxfSkvLCBmdW5jdGlvbihhLCBtKSB7IHJldHVybiBtLnRvVXBwZXJDYXNlKCkgfSlcbn1cblxuZnVuY3Rpb24gbWFwIChhcnIsIGl0ZXIpIHtcbiAgdmFyIG91dCA9IFtdXG4gIGZvcih2YXIgaSA9IDAsIGxlbiA9IGFyci5sZW5ndGg7IGkgPCBsZW47ICsraSlcbiAgICBvdXQucHVzaChpdGVyKGFycltpXSwgaSwgYXJyKSlcbiAgcmV0dXJuIG91dFxufVxuXG5mdW5jdGlvbiByZWR1Y2UoYXJyLCBpdGVyLCBzdGFydCkge1xuICBhcnIgPSBhcnIuc2xpY2UoKVxuICBpZihzdGFydCAhPT0gdW5kZWZpbmVkKVxuICAgIGFyci51bnNoaWZ0KHN0YXJ0KVxuXG4gIGlmKGFyci5sZW5ndGggPT09IDApXG4gICAgdGhyb3cgbmV3IEVycm9yKCdyZWR1Y2Ugb2YgZW1wdHkgYXJyYXknKVxuXG4gIGlmKGFyci5sZW5ndGggPT09IDEpXG4gICAgcmV0dXJuIGFyclswXVxuXG4gIHZhciBvdXQgPSBhcnIuc2xpY2UoKVxuICAgICwgaXRlbSA9IGFyci5zaGlmdCgpXG5cbiAgZG8ge1xuICAgIGl0ZW0gPSBpdGVyKGl0ZW0sIGFyci5zaGlmdCgpKVxuICB9IHdoaWxlKGFyci5sZW5ndGgpXG5cbiAgcmV0dXJuIGl0ZW1cbn1cblxuZnVuY3Rpb24gc3RydG9hcnJheShzdHIpIHtcbiAgdmFyIGFyciA9IFtdXG4gIGZvcih2YXIgaSA9IDAsIGxlbiA9IHN0ci5sZW5ndGg7IGkgPCBsZW47ICsraSlcbiAgICBhcnIucHVzaChzdHIuY2hhckF0KGkpKVxuICByZXR1cm4gYXJyXG59XG5cbnZhciBXRUVLREFZUyA9IFsgJ3N1bmRheScsICdtb25kYXknLCAndHVlc2RheScsICd3ZWRuZXNkYXknLCAndGh1cnNkYXknLCAnZnJpZGF5JywgJ3NhdHVyZGF5JyBdXG4gICwgV0VFS0RBWVNfQUJCUiA9IG1hcChXRUVLREFZUywgZnVuY3Rpb24oeCkgeyByZXR1cm4gc3RydG9hcnJheSh4KS5zbGljZSgwLCAzKS5qb2luKCcnKSB9KVxuICAsIFdFRUtEQVlTX1JFViA9IHJlZHVjZShtYXAoV0VFS0RBWVMsIGZ1bmN0aW9uKHgsIGkpIHsgcmV0dXJuIFt4LCBpXSB9KSwgZnVuY3Rpb24obGhzLCByaHMpIHsgbGhzW3Joc1swXV0gPSByaHNbMV07IHJldHVybiBsaHMgfSwge30pXG4gICwgTU9OVEhTID0gWyAnamFudWFyeScsICdmZWJydWFyeScsICdtYXJjaCcsICdhcHJpbCcsICdtYXknLCAnanVuZScsICdqdWx5JywgJ2F1Z3VzdCcsICdzZXB0ZW1iZXInLCAnb2N0b2JlcicsICdub3ZlbWJlcicsICdkZWNlbWJlcicgXVxuICAsIE1PTlRIU18zID0gbWFwKE1PTlRIUywgZnVuY3Rpb24oeCkgeyByZXR1cm4gc3RydG9hcnJheSh4KS5zbGljZSgwLCAzKS5qb2luKCcnKSB9KVxuICAsIE1PTlRIU18zX1JFViA9IHJlZHVjZShtYXAoTU9OVEhTXzMsIGZ1bmN0aW9uKHgsIGkpIHsgcmV0dXJuIFt4LCBpXSB9KSwgZnVuY3Rpb24obGhzLCByaHMpIHsgbGhzW3Joc1swXV0gPSByaHNbMV07IHJldHVybiBsaHMgfSwge30pXG4gICwgTU9OVEhTX0FQID0gW1xuICAgICdKYW4uJ1xuICAsICdGZWIuJ1xuICAsICdNYXJjaCdcbiAgLCAnQXByaWwnXG4gICwgJ01heSdcbiAgLCAnSnVuZSdcbiAgLCAnSnVseSdcbiAgLCAnQXVnLidcbiAgLCAnU2VwdC4nXG4gICwgJ09jdC4nXG4gICwgJ05vdi4nXG4gICwgJ0RlYy4nXG4gIF1cblxuXG52YXIgTU9OVEhTX0FMVCA9IHtcbiAgMTogJ0phbnVhcnknLFxuICAyOiAnRmVicnVhcnknLFxuICAzOiAnTWFyY2gnLFxuICA0OiAnQXByaWwnLFxuICA1OiAnTWF5JyxcbiAgNjogJ0p1bmUnLFxuICA3OiAnSnVseScsXG4gIDg6ICdBdWd1c3QnLFxuICA5OiAnU2VwdGVtYmVyJyxcbiAgMTA6ICdPY3RvYmVyJyxcbiAgMTE6ICdOb3ZlbWJlcicsXG4gIDEyOiAnRGVjZW1iZXInXG59XG5cbmZ1bmN0aW9uIEZvcm1hdHRlcih0KSB7XG4gIHRoaXMuZGF0YSA9IHRcbn1cblxuRm9ybWF0dGVyLnByb3RvdHlwZS5mb3JtYXQgPSBmdW5jdGlvbihzdHIpIHtcbiAgdmFyIGJpdHMgPSBzdHJ0b2FycmF5KHN0cilcbiAgLCBlc2MgPSBmYWxzZVxuICAsIG91dCA9IFtdXG4gICwgYml0XG5cbiAgd2hpbGUoYml0cy5sZW5ndGgpIHtcbiAgICBiaXQgPSBiaXRzLnNoaWZ0KClcblxuICAgIGlmKGVzYykge1xuICAgICAgb3V0LnB1c2goYml0KVxuICAgICAgZXNjID0gZmFsc2VcbiAgICB9IGVsc2UgaWYoYml0ID09PSAnXFxcXCcpIHtcbiAgICAgIGVzYyA9IHRydWVcbiAgICB9IGVsc2UgaWYodGhpc1tiaXRdKSB7XG4gICAgICBvdXQucHVzaCh0aGlzW2JpdF0oKSlcbiAgICB9IGVsc2Uge1xuICAgICAgb3V0LnB1c2goYml0KVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiBvdXQuam9pbignJylcbn1cblxuZnVuY3Rpb24gVGltZUZvcm1hdCh0KSB7XG4gIEZvcm1hdHRlci5jYWxsKHRoaXMsIHQpXG59XG5cbnZhciBwcm90byA9IFRpbWVGb3JtYXQucHJvdG90eXBlID0gbmV3IEZvcm1hdHRlcigpXG5cbnByb3RvLmEgPSBmdW5jdGlvbigpIHtcbiAgLy8gJ2EubS4nIG9yICdwLm0uJ1xuICBpZiAodGhpcy5kYXRhLmdldEhvdXJzKCkgPiAxMSlcbiAgICByZXR1cm4gJ3AubS4nXG4gIHJldHVybiAnYS5tLidcbn1cblxucHJvdG8uQSA9IGZ1bmN0aW9uKCkge1xuICAvLyAnQU0nIG9yICdQTSdcbiAgaWYgKHRoaXMuZGF0YS5nZXRIb3VycygpID4gMTEpXG4gICAgcmV0dXJuICdQTSdcbiAgcmV0dXJuICdBTSdcbn1cblxucHJvdG8uZiA9IGZ1bmN0aW9uKCkge1xuICAvKlxuICBUaW1lLCBpbiAxMi1ob3VyIGhvdXJzIGFuZCBtaW51dGVzLCB3aXRoIG1pbnV0ZXMgbGVmdCBvZmYgaWYgdGhleSdyZVxuICB6ZXJvLlxuICBFeGFtcGxlczogJzEnLCAnMTozMCcsICcyOjA1JywgJzInXG4gIFByb3ByaWV0YXJ5IGV4dGVuc2lvbi5cbiAgKi9cbiAgaWYgKHRoaXMuZGF0YS5nZXRNaW51dGVzKCkgPT0gMClcbiAgICByZXR1cm4gdGhpcy5nKClcbiAgcmV0dXJuIHRoaXMuZygpICsgXCI6XCIgKyB0aGlzLmkoKVxufVxuXG5wcm90by5nID0gZnVuY3Rpb24oKSB7XG4gIC8vIEhvdXIsIDEyLWhvdXIgZm9ybWF0IHdpdGhvdXQgbGVhZGluZyB6ZXJvcyBpLmUuICcxJyB0byAnMTInXG4gIHZhciBoID0gdGhpcy5kYXRhLmdldEhvdXJzKClcblxuICByZXR1cm4gdGhpcy5kYXRhLmdldEhvdXJzKCkgJSAxMiB8fCAxMlxufVxuXG5wcm90by5HID0gZnVuY3Rpb24oKSB7XG4gIC8vIEhvdXIsIDI0LWhvdXIgZm9ybWF0IHdpdGhvdXQgbGVhZGluZyB6ZXJvcyBpLmUuICcwJyB0byAnMjMnXG4gIHJldHVybiB0aGlzLmRhdGEuZ2V0SG91cnMoKVxufVxuXG5wcm90by5oID0gZnVuY3Rpb24oKSB7XG4gIC8vIEhvdXIsIDEyLWhvdXIgZm9ybWF0IGkuZS4gJzAxJyB0byAnMTInXG4gIHJldHVybiAoJzAnK3RoaXMuZygpKS5zbGljZSgtMilcbn1cblxucHJvdG8uSCA9IGZ1bmN0aW9uKCkge1xuICAvLyBIb3VyLCAyNC1ob3VyIGZvcm1hdCBpLmUuICcwMCcgdG8gJzIzJ1xuICByZXR1cm4gKCcwJyt0aGlzLkcoKSkuc2xpY2UoLTIpXG59XG5cbnByb3RvLmkgPSBmdW5jdGlvbigpIHtcbiAgLy8gTWludXRlcyBpLmUuICcwMCcgdG8gJzU5J1xuICByZXR1cm4gKCcwJyArIHRoaXMuZGF0YS5nZXRNaW51dGVzKCkpLnNsaWNlKC0yKVxufVxuXG5wcm90by5QID0gZnVuY3Rpb24oKSB7XG4gIC8qXG4gIFRpbWUsIGluIDEyLWhvdXIgaG91cnMsIG1pbnV0ZXMgYW5kICdhLm0uJy8ncC5tLicsIHdpdGggbWludXRlcyBsZWZ0IG9mZlxuICBpZiB0aGV5J3JlIHplcm8gYW5kIHRoZSBzdHJpbmdzICdtaWRuaWdodCcgYW5kICdub29uJyBpZiBhcHByb3ByaWF0ZS5cbiAgRXhhbXBsZXM6ICcxIGEubS4nLCAnMTozMCBwLm0uJywgJ21pZG5pZ2h0JywgJ25vb24nLCAnMTI6MzAgcC5tLidcbiAgUHJvcHJpZXRhcnkgZXh0ZW5zaW9uLlxuICAqL1xuICB2YXIgbSA9IHRoaXMuZGF0YS5nZXRNaW51dGVzKClcbiAgICAsIGggPSB0aGlzLmRhdGEuZ2V0SG91cnMoKVxuXG4gIGlmIChtID09IDAgJiYgaCA9PSAwKVxuICAgIHJldHVybiAnbWlkbmlnaHQnXG4gIGlmIChtID09IDAgJiYgaCA9PSAxMilcbiAgICByZXR1cm4gJ25vb24nXG4gIHJldHVybiB0aGlzLmYoKSArIFwiIFwiICsgdGhpcy5hKClcbn1cblxucHJvdG8ucyA9IGZ1bmN0aW9uKCkge1xuICAvLyBTZWNvbmRzIGkuZS4gJzAwJyB0byAnNTknXG4gIHJldHVybiAoJzAnK3RoaXMuZGF0YS5nZXRTZWNvbmRzKCkpLnNsaWNlKC0yKVxufVxuXG5wcm90by51ID0gZnVuY3Rpb24oKSB7XG4gIC8vIE1pY3Jvc2Vjb25kc1xuICByZXR1cm4gdGhpcy5kYXRhLmdldE1pbGxpc2Vjb25kcygpXG59XG5cbi8vIERhdGVGb3JtYXRcblxuZnVuY3Rpb24gRGF0ZUZvcm1hdCh0KSB7XG4gIHRoaXMuZGF0YSA9IHRcbiAgdGhpcy55ZWFyX2RheXMgPSBbMCwgMzEsIDU5LCA5MCwgMTIwLCAxNTEsIDE4MSwgMjEyLCAyNDMsIDI3MywgMzA0LCAzMzRdXG59XG5cbnByb3RvID0gRGF0ZUZvcm1hdC5wcm90b3R5cGUgPSBuZXcgVGltZUZvcm1hdCgpXG5cbnByb3RvLmNvbnRydWN0b3IgPSBEYXRlRm9ybWF0XG5cbnByb3RvLmIgPSBmdW5jdGlvbigpIHtcbiAgLy8gTW9udGgsIHRleHR1YWwsIDMgbGV0dGVycywgbG93ZXJjYXNlIGUuZy4gJ2phbidcbiAgcmV0dXJuIE1PTlRIU18zW3RoaXMuZGF0YS5nZXRNb250aCgpXVxufVxuXG5wcm90by5jPSBmdW5jdGlvbigpIHtcbiAgLypcbiAgSVNPIDg2MDEgRm9ybWF0XG4gIEV4YW1wbGUgOiAnMjAwOC0wMS0wMlQxMDozMDowMC4wMDAxMjMnXG4gICovXG4gIHJldHVybiB0aGlzLmRhdGEudG9JU09TdHJpbmcgPyB0aGlzLmRhdGEudG9JU09TdHJpbmcoKSA6ICcnXG59XG5cbnByb3RvLmQgPSBmdW5jdGlvbigpIHtcbiAgLy8gRGF5IG9mIHRoZSBtb250aCwgMiBkaWdpdHMgd2l0aCBsZWFkaW5nIHplcm9zIGkuZS4gJzAxJyB0byAnMzEnXG4gIHJldHVybiAoJzAnK3RoaXMuZGF0YS5nZXREYXRlKCkpLnNsaWNlKC0yKVxufVxuXG5wcm90by5EID0gZnVuY3Rpb24oKSB7XG4gIC8vIERheSBvZiB0aGUgd2VlaywgdGV4dHVhbCwgMyBsZXR0ZXJzIGUuZy4gJ0ZyaSdcbiAgcmV0dXJuIGNhcGZpcnN0KFdFRUtEQVlTX0FCQlJbdGhpcy5kYXRhLmdldERheSgpXSlcbn1cblxucHJvdG8uRSA9IGZ1bmN0aW9uKCkge1xuICAvLyBBbHRlcm5hdGl2ZSBtb250aCBuYW1lcyBhcyByZXF1aXJlZCBieSBzb21lIGxvY2FsZXMuIFByb3ByaWV0YXJ5IGV4dGVuc2lvbi5cbiAgcmV0dXJuIE1PTlRIU19BTFRbdGhpcy5kYXRhLmdldE1vbnRoKCkrMV1cbn1cblxucHJvdG8uRj0gZnVuY3Rpb24oKSB7XG4gIC8vIE1vbnRoLCB0ZXh0dWFsLCBsb25nIGUuZy4gJ0phbnVhcnknXG4gIHJldHVybiBjYXBmaXJzdChNT05USFNbdGhpcy5kYXRhLmdldE1vbnRoKCldKVxufVxuXG5wcm90by5JID0gZnVuY3Rpb24oKSB7XG4gIC8vICcxJyBpZiBEYXlsaWdodCBTYXZpbmdzIFRpbWUsICcwJyBvdGhlcndpc2UuXG4gIHJldHVybiB0aGlzLmRhdGEuaXNEU1QoKSA/ICcxJyA6ICcwJ1xufVxuXG5wcm90by5qID0gZnVuY3Rpb24oKSB7XG4gIC8vIERheSBvZiB0aGUgbW9udGggd2l0aG91dCBsZWFkaW5nIHplcm9zIGkuZS4gJzEnIHRvICczMSdcbiAgcmV0dXJuIHRoaXMuZGF0YS5nZXREYXRlKClcbn1cblxucHJvdG8ubCA9IGZ1bmN0aW9uKCkge1xuICAvLyBEYXkgb2YgdGhlIHdlZWssIHRleHR1YWwsIGxvbmcgZS5nLiAnRnJpZGF5J1xuICByZXR1cm4gY2FwZmlyc3QoV0VFS0RBWVNbdGhpcy5kYXRhLmdldERheSgpXSlcbn1cblxucHJvdG8uTCA9IGZ1bmN0aW9uKCkge1xuICAvLyBCb29sZWFuIGZvciB3aGV0aGVyIGl0IGlzIGEgbGVhcCB5ZWFyIGkuZS4gVHJ1ZSBvciBGYWxzZVxuICAvLyBTZWxlY3RzIHRoaXMgeWVhcidzIEZlYnJ1YXJ5IDI5dGggYW5kIGNoZWNrcyBpZiB0aGUgbW9udGhcbiAgLy8gaXMgc3RpbGwgRmVicnVhcnkuXG4gIHJldHVybiAobmV3IERhdGUodGhpcy5kYXRhLmdldEZ1bGxZZWFyKCksIDEsIDI5KS5nZXRNb250aCgpKSA9PT0gMVxufVxuXG5wcm90by5tID0gZnVuY3Rpb24oKSB7XG4gIC8vIE1vbnRoIGkuZS4gJzAxJyB0byAnMTInXCJcbiAgcmV0dXJuICgnMCcrKHRoaXMuZGF0YS5nZXRNb250aCgpKzEpKS5zbGljZSgtMilcbn1cblxucHJvdG8uTSA9IGZ1bmN0aW9uKCkge1xuICAvLyBNb250aCwgdGV4dHVhbCwgMyBsZXR0ZXJzIGUuZy4gJ0phbidcbiAgcmV0dXJuIGNhcGZpcnN0KE1PTlRIU18zW3RoaXMuZGF0YS5nZXRNb250aCgpXSlcbn1cblxucHJvdG8ubiA9IGZ1bmN0aW9uKCkge1xuICAvLyBNb250aCB3aXRob3V0IGxlYWRpbmcgemVyb3MgaS5lLiAnMScgdG8gJzEyJ1xuICByZXR1cm4gdGhpcy5kYXRhLmdldE1vbnRoKCkgKyAxXG59XG5cbnByb3RvLk4gPSBmdW5jdGlvbigpIHtcbiAgLy8gTW9udGggYWJicmV2aWF0aW9uIGluIEFzc29jaWF0ZWQgUHJlc3Mgc3R5bGUuIFByb3ByaWV0YXJ5IGV4dGVuc2lvbi5cbiAgcmV0dXJuIE1PTlRIU19BUFt0aGlzLmRhdGEuZ2V0TW9udGgoKV1cbn1cblxucHJvdG8uTyA9IGZ1bmN0aW9uKCkge1xuICAvLyBEaWZmZXJlbmNlIHRvIEdyZWVud2ljaCB0aW1lIGluIGhvdXJzIGUuZy4gJyswMjAwJ1xuXG4gIHZhciB0em9mZnMgPSB0aGlzLmRhdGEuZ2V0VGltZXpvbmVPZmZzZXQoKVxuICAgICwgb2ZmcyA9IH5+KHR6b2ZmcyAvIDYwKVxuICAgICwgbWlucyA9ICgnMDAnICsgfn5NYXRoLmFicyh0em9mZnMgJSA2MCkpLnNsaWNlKC0yKVxuICBcbiAgcmV0dXJuICgodHpvZmZzID4gMCkgPyAnLScgOiAnKycpICsgKCcwMCcgKyBNYXRoLmFicyhvZmZzKSkuc2xpY2UoLTIpICsgbWluc1xufVxuXG5wcm90by5yID0gZnVuY3Rpb24oKSB7XG4gIC8vIFJGQyAyODIyIGZvcm1hdHRlZCBkYXRlIGUuZy4gJ1RodSwgMjEgRGVjIDIwMDAgMTY6MDE6MDcgKzAyMDAnXG4gIHJldHVybiB0aGlzLmZvcm1hdCgnRCwgaiBNIFkgSDppOnMgTycpXG59XG5cbnByb3RvLlMgPSBmdW5jdGlvbigpIHtcbiAgLyogRW5nbGlzaCBvcmRpbmFsIHN1ZmZpeCBmb3IgdGhlIGRheSBvZiB0aGUgbW9udGgsIDIgY2hhcmFjdGVycyBpLmUuICdzdCcsICduZCcsICdyZCcgb3IgJ3RoJyAqL1xuICB2YXIgZCA9IHRoaXMuZGF0YS5nZXREYXRlKClcblxuICBpZiAoZCA+PSAxMSAmJiBkIDw9IDEzKVxuICAgIHJldHVybiAndGgnXG4gIHZhciBsYXN0ID0gZCAlIDEwXG5cbiAgaWYgKGxhc3QgPT0gMSlcbiAgICByZXR1cm4gJ3N0J1xuICBpZiAobGFzdCA9PSAyKVxuICAgIHJldHVybiAnbmQnXG4gIGlmIChsYXN0ID09IDMpXG4gICAgcmV0dXJuICdyZCdcbiAgcmV0dXJuICd0aCdcbn1cblxucHJvdG8udCA9IGZ1bmN0aW9uKCkge1xuICAvLyBOdW1iZXIgb2YgZGF5cyBpbiB0aGUgZ2l2ZW4gbW9udGggaS5lLiAnMjgnIHRvICczMSdcbiAgLy8gVXNlIGEgamF2YXNjcmlwdCB0cmljayB0byBkZXRlcm1pbmUgdGhlIGRheXMgaW4gYSBtb250aFxuICByZXR1cm4gMzIgLSBuZXcgRGF0ZSh0aGlzLmRhdGEuZ2V0RnVsbFllYXIoKSwgdGhpcy5kYXRhLmdldE1vbnRoKCksIDMyKS5nZXREYXRlKClcbn1cblxucHJvdG8uVCA9IGZ1bmN0aW9uKCkge1xuICAvLyBUaW1lIHpvbmUgb2YgdGhpcyBtYWNoaW5lIGUuZy4gJ0VTVCcgb3IgJ01EVCdcbiAgaWYodGhpcy5kYXRhLnR6aW5mbykge1xuICAgIHJldHVybiB0aGlzLmRhdGEudHppbmZvKCkuYWJiciB8fCAnPz8/J1xuICB9XG4gIHJldHVybiAnPz8/J1xufVxuXG5wcm90by5VID0gZnVuY3Rpb24oKSB7XG4gIC8vIFNlY29uZHMgc2luY2UgdGhlIFVuaXggZXBvY2ggKEphbnVhcnkgMSAxOTcwIDAwOjAwOjAwIEdNVClcbiAgLy8gVVRDKCkgcmV0dXJuIG1pbGxpc2Vjb25kcyBmcm1vIHRoZSBlcG9jaFxuICAvLyByZXR1cm4gTWF0aC5yb3VuZCh0aGlzLmRhdGEuVVRDKCkgKiAxMDAwKVxuICByZXR1cm4gfn4odGhpcy5kYXRhIC8gMTAwMClcbn1cblxucHJvdG8udyA9IGZ1bmN0aW9uKCkge1xuICAvLyBEYXkgb2YgdGhlIHdlZWssIG51bWVyaWMsIGkuZS4gJzAnIChTdW5kYXkpIHRvICc2JyAoU2F0dXJkYXkpXG4gIHJldHVybiB0aGlzLmRhdGEuZ2V0RGF5KClcbn1cblxucHJvdG8uVyA9IGZ1bmN0aW9uKCkge1xuICAvLyBJU08tODYwMSB3ZWVrIG51bWJlciBvZiB5ZWFyLCB3ZWVrcyBzdGFydGluZyBvbiBNb25kYXlcbiAgLy8gQWxnb3JpdGhtIGZyb20gaHR0cDovL3d3dy5wZXJzb25hbC5lY3UuZWR1L21jY2FydHlyL0lTT3dkQUxHLnR4dFxuICB2YXIgamFuMV93ZWVrZGF5ID0gbmV3IERhdGUodGhpcy5kYXRhLmdldEZ1bGxZZWFyKCksIDAsIDEpLmdldERheSgpIFxuICAgICwgd2Vla2RheSA9IHRoaXMuZGF0YS5nZXREYXkoKVxuICAgICwgZGF5X29mX3llYXIgPSB0aGlzLnooKVxuICAgICwgd2Vla19udW1iZXJcbiAgICAsIGkgPSAzNjVcblxuICBpZihkYXlfb2ZfeWVhciA8PSAoOCAtIGphbjFfd2Vla2RheSkgJiYgamFuMV93ZWVrZGF5ID4gNCkge1xuICAgIGlmKGphbjFfd2Vla2RheSA9PT0gNSB8fCAoamFuMV93ZWVrZGF5ID09PSA2ICYmIHRoaXMuTC5jYWxsKHtkYXRhOm5ldyBEYXRlKHRoaXMuZGF0YS5nZXRGdWxsWWVhcigpLTEsIDAsIDEpfSkpKSB7XG4gICAgICB3ZWVrX251bWJlciA9IDUzXG4gICAgfSBlbHNlIHtcbiAgICAgIHdlZWtfbnVtYmVyID0gNTJcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgaWYodGhpcy5MKCkpIHtcbiAgICAgIGkgPSAzNjZcbiAgICB9XG4gICAgaWYoKGkgLSBkYXlfb2ZfeWVhcikgPCAoNCAtIHdlZWtkYXkpKSB7XG4gICAgICB3ZWVrX251bWJlciA9IDFcbiAgICB9IGVsc2Uge1xuICAgICAgd2Vla19udW1iZXIgPSB+figoZGF5X29mX3llYXIgKyAoNyAtIHdlZWtkYXkpICsgKGphbjFfd2Vla2RheSAtIDEpKSAvIDcpXG4gICAgICBpZihqYW4xX3dlZWtkYXkgPiA0KVxuICAgICAgICB3ZWVrX251bWJlciAtPSAxXG4gICAgfVxuICB9XG4gIHJldHVybiB3ZWVrX251bWJlclxufVxuXG5wcm90by55ID0gZnVuY3Rpb24oKSB7XG4gIC8vIFllYXIsIDIgZGlnaXRzIGUuZy4gJzk5J1xuICByZXR1cm4gKCcnK3RoaXMuZGF0YS5nZXRGdWxsWWVhcigpKS5zbGljZSgtMilcbn1cblxucHJvdG8uWSA9IGZ1bmN0aW9uKCkge1xuICAvLyBZZWFyLCA0IGRpZ2l0cyBlLmcuICcxOTk5J1xuICByZXR1cm4gdGhpcy5kYXRhLmdldEZ1bGxZZWFyKClcbn1cblxucHJvdG8ueiA9IGZ1bmN0aW9uKCkge1xuICAvLyBEYXkgb2YgdGhlIHllYXIgaS5lLiAnMCcgdG8gJzM2NSdcblxuICBkb3kgPSB0aGlzLnllYXJfZGF5c1t0aGlzLmRhdGEuZ2V0TW9udGgoKV0gKyB0aGlzLmRhdGEuZ2V0RGF0ZSgpXG4gIGlmICh0aGlzLkwoKSAmJiB0aGlzLmRhdGEuZ2V0TW9udGgoKSA+IDEpXG4gICAgZG95ICs9IDFcbiAgcmV0dXJuIGRveVxufVxuXG5wcm90by5aID0gZnVuY3Rpb24oKSB7XG4gIC8qXG4gIFRpbWUgem9uZSBvZmZzZXQgaW4gc2Vjb25kcyAoaS5lLiAnLTQzMjAwJyB0byAnNDMyMDAnKS4gVGhlIG9mZnNldCBmb3JcbiAgdGltZXpvbmVzIHdlc3Qgb2YgVVRDIGlzIGFsd2F5cyBuZWdhdGl2ZSwgYW5kIGZvciB0aG9zZSBlYXN0IG9mIFVUQyBpc1xuICBhbHdheXMgcG9zaXRpdmUuXG4gICovXG4gIHJldHVybiB0aGlzLmRhdGEuZ2V0VGltZXpvbmVPZmZzZXQoKSAqIC02MFxufVxuXG5cbmZ1bmN0aW9uIGZvcm1hdCh2YWx1ZSwgZm9ybWF0X3N0cmluZykge1xuICB2YXIgZGYgPSBuZXcgRGF0ZUZvcm1hdCh2YWx1ZSlcbiAgcmV0dXJuIGRmLmZvcm1hdChmb3JtYXRfc3RyaW5nKVxufVxuXG5cbmZ1bmN0aW9uIHRpbWVfZm9ybWF0KHZhbHVlLCBmb3JtYXRfc3RyaW5nKSB7XG4gIHZhciB0ZiA9IG5ldyBUaW1lRm9ybWF0KHZhbHVlKVxuICByZXR1cm4gdGYuZm9ybWF0KGZvcm1hdF9zdHJpbmcpXG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IEZpbHRlck5vZGVcblxudmFyIFByb21pc2UgPSByZXF1aXJlKCcuL3Byb21pc2UnKVxuICAsIGRlYnVnID0gcmVxdWlyZSgnLi9kZWJ1ZycpXG5cbmZ1bmN0aW9uIEZpbHRlck5vZGUoZmlsdGVyKSB7XG4gIHRoaXMuZmlsdGVyID0gZmlsdGVyXG59XG5cbnZhciBjb25zID0gRmlsdGVyTm9kZVxuICAsIHByb3RvID0gY29ucy5wcm90b3R5cGVcblxuY29ucy5lc2NhcGUgPSBlc2NhcGVIVE1MXG5cbnByb3RvLnJlbmRlciA9IHNhZmVseShmdW5jdGlvbihjb250ZXh0KSB7XG4gIHZhciBzZWxmID0gdGhpc1xuICAgICwgcmVzdWx0ID0gc2VsZi5maWx0ZXIucmVzb2x2ZShjb250ZXh0KVxuICAgICwgcHJvbWlzZVxuXG4gIGlmKHJlc3VsdCA9PT0gdW5kZWZpbmVkKVxuICAgIHJldHVybiAnJ1xuXG4gIGlmKHJlc3VsdCAmJiByZXN1bHQuY29uc3RydWN0b3IgPT09IFByb21pc2UpIHtcbiAgICBwcm9taXNlID0gbmV3IFByb21pc2VcblxuICAgIHJlc3VsdC5vbmNlKCdkb25lJywgZnVuY3Rpb24ocmVzdWx0KSB7XG4gICAgICBwcm9taXNlLnJlc29sdmUoc2VsZi5mb3JtYXQocmVzdWx0KSlcbiAgICB9KVxuXG4gICAgcmV0dXJuIHByb21pc2VcbiAgfVxuXG4gIHJldHVybiBzZWxmLmZvcm1hdChyZXN1bHQpXG59KVxuXG5wcm90by5mb3JtYXQgPSBmdW5jdGlvbihyZXN1bHQpIHtcbiAgaWYocmVzdWx0ICYmIHJlc3VsdC5zYWZlKSB7XG4gICAgcmV0dXJuIHJlc3VsdC50b1N0cmluZygpXG4gIH1cblxuICBpZihyZXN1bHQgPT09IG51bGwgfHwgcmVzdWx0ID09PSB1bmRlZmluZWQpXG4gICAgcmV0dXJuICcnXG5cbiAgcmV0dXJuIGVzY2FwZUhUTUwocmVzdWx0KycnKVxufVxuXG5mdW5jdGlvbiBzYWZlbHkoZm4pIHtcbiAgcmV0dXJuIGZ1bmN0aW9uKGNvbnRleHQpIHtcbiAgICB0cnkge1xuICAgICAgcmV0dXJuIGZuLmNhbGwodGhpcywgY29udGV4dClcbiAgICB9IGNhdGNoKGVycikge1xuICAgICAgZGVidWcuaW5mbyhlcnIpIFxuICAgICAgcmV0dXJuICcnXG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIGVzY2FwZUhUTUwoc3RyKSB7XG4gIHJldHVybiBzdHJcbiAgICAucmVwbGFjZSgvXFwmL2csICcmYW1wOycpXG4gICAgLnJlcGxhY2UoLzwvZywgJyZsdDsnKVxuICAgIC5yZXBsYWNlKC8+L2csICcmZ3Q7JylcbiAgICAucmVwbGFjZSgvXCIvZywgJyZxdW90OycpXG4gICAgLnJlcGxhY2UoLycvZywgJyYjMzk7Jylcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gTm9kZUxpc3RcblxudmFyIFByb21pc2UgPSByZXF1aXJlKCcuL3Byb21pc2UnKVxuXG5mdW5jdGlvbiBOb2RlTGlzdChub2Rlcykge1xuICB0aGlzLm5vZGVzID0gbm9kZXNcbn1cblxudmFyIGNvbnMgPSBOb2RlTGlzdFxuICAsIHByb3RvID0gY29ucy5wcm90b3R5cGVcblxucHJvdG8ucmVuZGVyID0gZnVuY3Rpb24oY29udGV4dCkge1xuICB2YXIgcHJvbWlzZXMgPSBbXVxuICAgICwgcmVzdWx0cyA9IFtdXG4gICAgLCBub2RlcyA9IHRoaXMubm9kZXNcbiAgICAsIHJlc3VsdFxuXG4gIGZvcih2YXIgaSA9IDAsIGxlbiA9IG5vZGVzLmxlbmd0aDsgaSA8IGxlbjsgKytpKSB7XG4gICAgcmVzdWx0c1tpXSA9IHJlc3VsdCA9IG5vZGVzW2ldLnJlbmRlcihjb250ZXh0KVxuXG4gICAgaWYocmVzdWx0LmNvbnN0cnVjdG9yID09PSBQcm9taXNlKSB7XG4gICAgICBwcm9taXNlcy5wdXNoKHJlc3VsdClcbiAgICB9XG4gIH1cblxuICBpZihwcm9taXNlcy5sZW5ndGgpIHtcbiAgICByZXR1cm4gdGhpcy5yZXNvbHZlUHJvbWlzZXMocmVzdWx0cywgcHJvbWlzZXMpIFxuICB9XG5cbiAgcmV0dXJuIHJlc3VsdHMuam9pbignJylcbn1cblxucHJvdG8ucmVzb2x2ZVByb21pc2VzID0gZnVuY3Rpb24ocmVzdWx0cywgcHJvbWlzZXMpIHtcbiAgdmFyIHNlbGYgPSB0aGlzXG4gICAgLCBwcm9taXNlID0gbmV3IFByb21pc2VcbiAgICAsIHRvdGFsID0gcHJvbWlzZXMubGVuZ3RoXG5cbiAgZm9yKHZhciBpID0gMCwgcCA9IDAsIGxlbiA9IHJlc3VsdHMubGVuZ3RoOyBpIDwgbGVuOyArK2kpIHtcbiAgICBpZihyZXN1bHRzW2ldLmNvbnN0cnVjdG9yICE9PSBQcm9taXNlKSBcbiAgICAgIGNvbnRpbnVlXG5cbiAgICBwcm9taXNlc1twKytdLm9uY2UoJ2RvbmUnLCBiaW5kKGksIGZ1bmN0aW9uKGlkeCwgcmVzdWx0KSB7XG4gICAgICByZXN1bHRzW2lkeF0gPSByZXN1bHRcblxuICAgICAgaWYoIS0tdG90YWwpXG4gICAgICAgIHByb21pc2UucmVzb2x2ZShyZXN1bHRzLmpvaW4oJycpKVxuICAgIH0pKVxuICB9XG5cbiAgcmV0dXJuIHByb21pc2Vcbn1cblxuZnVuY3Rpb24gYmluZChudW0sIGZuKSB7XG4gIHJldHVybiBmdW5jdGlvbihyZXN1bHQpIHtcbiAgICByZXR1cm4gZm4obnVtLCByZXN1bHQpXG4gIH1cbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gRmlsdGVyTG9va3VwXG5cbnZhciBQcm9taXNlID0gcmVxdWlyZSgnLi9wcm9taXNlJylcblxuZnVuY3Rpb24gRmlsdGVyTG9va3VwKGJpdHMpIHtcbiAgdGhpcy5iaXRzID0gYml0c1xufVxuXG52YXIgY29ucyA9IEZpbHRlckxvb2t1cFxuICAsIHByb3RvID0gY29ucy5wcm90b3R5cGVcblxucHJvdG8ucmVzb2x2ZSA9IGZ1bmN0aW9uKGNvbnRleHQsIGZyb21JRFgpIHtcbiAgZnJvbUlEWCA9IGZyb21JRFggfHwgMFxuXG4gIHZhciBzZWxmID0gdGhpc1xuICAgICwgYml0cyA9IHNlbGYuYml0c1xuICAgICwgY3VycmVudCA9IGNvbnRleHRcbiAgICAsIHRlbXBvcmFyeSA9IG51bGxcbiAgICAsIHByb21pc2VcbiAgICAsIHJlc3VsdFxuICAgICwgbmV4dFxuXG4gIGZvcih2YXIgaSA9IGZyb21JRFgsIGxlbiA9IGJpdHMubGVuZ3RoOyBpIDwgbGVuOyArK2kpIHtcbiAgICBpZihjdXJyZW50ID09PSB1bmRlZmluZWQgfHwgY3VycmVudCA9PT0gbnVsbCkge1xuICAgICAgYnJlYWtcbiAgICB9XG5cbiAgICAvLyBmaXggZm9yIElFOlxuICAgIGlmKGJpdHNbaV0gPT09ICdzdXBlcicpIHtcbiAgICAgIGJpdHNbaV0gPSAnX3N1cGVyJ1xuICAgIH1cblxuICAgIG5leHQgPSBjdXJyZW50W2JpdHNbaV1dXG5cbiAgICAvLyBjb3VsZCBiZSBhc3luYywgY291bGQgYmUgc3luYy5cbiAgICBpZih0eXBlb2YgbmV4dCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgcHJvbWlzZSA9IG5ldyBQcm9taXNlXG5cbiAgICAgIHByb21pc2Uub25jZSgnZG9uZScsIGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgdGVtcG9yYXJ5ID0gZGF0YVxuICAgICAgfSlcblxuICAgICAgY3VycmVudCA9IG5leHQuY2FsbChjdXJyZW50LCBmdW5jdGlvbihlcnIsIGRhdGEpIHtcbiAgICAgICAgcHJvbWlzZS5yZXNvbHZlKGVyciA/IG51bGwgOiBzZWxmLnJlc29sdmUoZGF0YSwgaSsxKSlcbiAgICAgIH0pXG5cbiAgICAgIGlmKHRlbXBvcmFyeSAhPT0gbnVsbClcbiAgICAgICAgY3VycmVudCA9IHRlbXBvcmFyeVxuXG4gICAgICBwcm9taXNlLnRyaWdnZXIgPSB0ZW1wb3JhcnkgPSBudWxsXG5cbiAgICAgIGlmKGN1cnJlbnQgPT09IHVuZGVmaW5lZClcbiAgICAgICAgcmV0dXJuIHByb21pc2VcblxuICAgIH0gZWxzZSB7XG4gICAgICBjdXJyZW50ID0gbmV4dFxuICAgIH1cblxuICB9IFxuXG4gIHJldHVybiBjdXJyZW50XG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IEZpbHRlckFwcGxpY2F0aW9uXG5cbnZhciBQcm9taXNlID0gcmVxdWlyZSgnLi9wcm9taXNlJylcblxuZnVuY3Rpb24gRmlsdGVyQXBwbGljYXRpb24obmFtZSwgYml0cykge1xuICB0aGlzLm5hbWUgPSBuYW1lXG4gIHRoaXMuYXJncyA9IGJpdHNcbiAgdGhpcy5maWx0ZXIgPSBudWxsXG59XG5cbnZhciBjb25zID0gRmlsdGVyQXBwbGljYXRpb25cbiAgLCBwcm90byA9IGNvbnMucHJvdG90eXBlXG5cbnByb3RvLmF0dGFjaCA9IGZ1bmN0aW9uKHBhcnNlcikge1xuICB0aGlzLmZpbHRlciA9IHBhcnNlci5maWx0ZXJzLmxvb2t1cCh0aGlzLm5hbWUpXG59XG5cbnByb3RvLnJlc29sdmUgPSBmdW5jdGlvbihjb250ZXh0LCB2YWx1ZSwgZnJvbUlEWCwgYXJnVmFsdWVzKSB7XG4gIHZhciBzZWxmID0gdGhpc1xuICAgICwgcHJvbWlzZVxuICAgICwgc3RhcnQgPSBmcm9tSURYIHx8IDBcbiAgICAsIHJlc3VsdFxuICAgICwgdG1wXG5cbiAgYXJnVmFsdWVzID0gYXJnVmFsdWVzIHx8IFtdXG5cbiAgaWYodmFsdWUgPT09IHVuZGVmaW5lZCkge1xuICAgIHJldHVyblxuICB9XG5cbiAgaWYodmFsdWUgJiYgdmFsdWUuY29uc3RydWN0b3IgPT09IFByb21pc2UpIHtcbiAgICBwcm9taXNlID0gbmV3IFByb21pc2VcbiAgICB2YWx1ZS5vbmNlKCdkb25lJywgZnVuY3Rpb24odmFsKSB7XG4gICAgICBwcm9taXNlLnJlc29sdmUoc2VsZi5yZXNvbHZlKGNvbnRleHQsIHZhbCkpXG4gICAgfSlcblxuICAgIC8vIHN0YXJ0IG92ZXIgb25jZSB3ZSd2ZSByZXNvbHZlZCB0aGUgYmFzZSB2YWx1ZVxuICAgIHJldHVybiBwcm9taXNlXG4gIH1cblxuICBmb3IodmFyIGkgPSBzdGFydCwgbGVuID0gc2VsZi5hcmdzLmxlbmd0aDsgaSA8IGxlbjsgKytpKSB7XG4gICAgdmFyIGFyZ1ZhbHVlID0gc2VsZi5hcmdzW2ldLnJlc29sdmUgPyBcbiAgICAgICAgc2VsZi5hcmdzW2ldLnJlc29sdmUoY29udGV4dCkgOlxuICAgICAgICBzZWxmLmFyZ3NbaV1cblxuICAgIGlmKGFyZ1ZhbHVlID09PSB1bmRlZmluZWQgfHwgYXJnVmFsdWUgPT09IG51bGwpIHtcbiAgICAgIGFyZ1ZhbHVlc1tpXSA9IGFyZ1ZhbHVlXG4gICAgICBjb250aW51ZVxuICAgIH1cblxuICAgIGlmKGFyZ1ZhbHVlLmNvbnN0cnVjdG9yID09PSBQcm9taXNlKSB7XG4gICAgICBwcm9taXNlID0gbmV3IFByb21pc2VcblxuICAgICAgYXJnVmFsdWUub25jZSgnZG9uZScsIGZ1bmN0aW9uKHZhbCkge1xuICAgICAgICBhcmdWYWx1ZXNbaV0gPSB2YWxcbiAgICAgICAgcHJvbWlzZS5yZXNvbHZlKHNlbGYucmVzb2x2ZSggXG4gICAgICAgICAgICBjb250ZXh0XG4gICAgICAgICAgLCB2YWx1ZVxuICAgICAgICAgICwgaVxuICAgICAgICAgICwgYXJnVmFsdWVzXG4gICAgICAgICkpXG4gICAgICB9KVxuXG4gICAgICByZXR1cm4gcHJvbWlzZVxuICAgIH1cblxuICAgIGFyZ1ZhbHVlc1tpXSA9IGFyZ1ZhbHVlXG4gIH1cblxuICBwcm9taXNlID0gbmV3IFByb21pc2VcbiAgdG1wID0gc2VsZi5maWx0ZXIuYXBwbHkobnVsbCwgW3ZhbHVlXS5jb25jYXQoYXJnVmFsdWVzKS5jb25jYXQoW3JlYWR5XSkpXG5cbiAgaWYodG1wICE9PSB1bmRlZmluZWQpIHtcbiAgICByZXN1bHQgPSB0bXBcbiAgfVxuXG4gIGlmKHJlc3VsdCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgcmV0dXJuIHByb21pc2VcbiAgfVxuXG4gIHJldHVybiByZXN1bHRcblxuICBmdW5jdGlvbiByZWFkeShlcnIsIGRhdGEpIHtcbiAgICBpZihwcm9taXNlLnRyaWdnZXIpIFxuICAgICAgcmV0dXJuIHByb21pc2UucmVzb2x2ZShlcnIgPyBlcnIgOiBkYXRhKVxuXG4gICAgcmVzdWx0ID0gZGF0YVxuICB9XG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IEJsb2NrTm9kZVxuXG52YXIgUHJvbWlzZSA9IHJlcXVpcmUoJy4uL3Byb21pc2UnKVxuICAsIEJsb2NrQ29udGV4dCA9IHJlcXVpcmUoJy4uL2Jsb2NrX2NvbnRleHQnKVxuXG5mdW5jdGlvbiBCbG9ja05vZGUobmFtZSwgbm9kZXMpIHtcbiAgdGhpcy5uYW1lID0gbmFtZVxuICB0aGlzLm5vZGVzID0gbm9kZXNcblxuICB0aGlzLmNvbnRleHQgPSBudWxsXG59XG5cbnZhciBjb25zID0gQmxvY2tOb2RlXG4gICwgcHJvdG8gPSBjb25zLnByb3RvdHlwZVxuXG5wcm90by5yZW5kZXIgPSBmdW5jdGlvbihjb250ZXh0KSB7XG4gIHZhciBzZWxmID0gdGhpc1xuICAgICwgYmxvY2tDb250ZXh0ID0gQmxvY2tDb250ZXh0LmZyb20oY29udGV4dClcbiAgICAsIHJlc3VsdFxuICAgICwgYmxvY2tcbiAgICAsIHB1c2hcblxuICBpZighYmxvY2tDb250ZXh0KSB7XG4gICAgY29udGV4dC5ibG9jayA9IHNlbGZcbiAgICByZXR1cm4gc2VsZi5ub2Rlcy5yZW5kZXIoY29udGV4dClcbiAgfVxuXG4gIGJsb2NrID0gcHVzaCA9IGJsb2NrQ29udGV4dC5wb3Aoc2VsZi5uYW1lKVxuXG4gIGlmKCFibG9jaykgeyBcbiAgICBibG9jayA9IHNlbGZcbiAgfSBcblxuICBibG9jayA9IG5ldyBCbG9ja05vZGUoYmxvY2submFtZSwgYmxvY2subm9kZXMpXG5cbiAgYmxvY2suY29udGV4dCA9IGNvbnRleHRcbiAgYmxvY2suY29udGV4dC5ibG9jayA9IGJsb2NrXG4gIGNvbnRleHQuYmxvY2sgPSBibG9ja1xuXG4gIHJlc3VsdCA9IGJsb2NrLm5vZGVzLnJlbmRlcihjb250ZXh0KVxuXG4gIGlmKHB1c2gpIHtcbiAgICBibG9ja0NvbnRleHQucHVzaChzZWxmLm5hbWUsIHB1c2gpXG4gIH1cblxuICByZXR1cm4gcmVzdWx0XG5cbn1cblxucHJvdG8uaXNCbG9ja05vZGUgPSB0cnVlXG5cbnByb3RvLl9zdXBlciA9IGZ1bmN0aW9uKCkge1xuICB2YXIgYmxvY2tDb250ZXh0ID0gQmxvY2tDb250ZXh0LmZyb20odGhpcy5jb250ZXh0KVxuICAgICwgYmxvY2tcbiAgICAsIHN0clxuXG4gIGlmKGJsb2NrQ29udGV4dCAmJiAoYmxvY2sgPSBibG9ja0NvbnRleHQuZ2V0KHRoaXMubmFtZSkpKSB7XG4gICAgc3RyID0gbmV3IFN0cmluZyhibG9jay5yZW5kZXIodGhpcy5jb250ZXh0KSlcbiAgICBzdHIuc2FmZSA9IHRydWVcbiAgICByZXR1cm4gc3RyIFxuICB9XG5cbiAgcmV0dXJuICcnXG59XG5cbmNvbnMucGFyc2UgPSBmdW5jdGlvbihjb250ZW50cywgcGFyc2VyKSB7XG4gIHZhciBiaXRzID0gY29udGVudHMuc3BsaXQoJyAnKVxuICAgICwgbmFtZSA9IGJpdHNbMV1cbiAgICAsIGxvYWRlZCA9IHBhcnNlci5sb2FkZWRCbG9ja3NcbiAgICAsIG5vZGVzXG5cbiAgZm9yKHZhciBpID0gMCwgbGVuID0gbG9hZGVkLmxlbmd0aDsgaSA8IGxlbjsgKytpKVxuICAgIGlmKGxvYWRlZFtpXSA9PT0gbmFtZSlcbiAgICAgIHRocm93IG5ldyBFcnJvcignYmxvY2sgdGFnIHdpdGggdGhlIG5hbWUgXCInK25hbWUrJ1wiIGFwcGVhcnMgbW9yZSB0aGFuIG9uY2UnKVxuXG4gIGxvYWRlZC5wdXNoKG5hbWUpXG5cbiAgbm9kZXMgPSBwYXJzZXIucGFyc2UoWydlbmRibG9jayddKVxuICBwYXJzZXIudG9rZW5zLnNoaWZ0KClcblxuICByZXR1cm4gbmV3IGNvbnMobmFtZSwgbm9kZXMpICBcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gRGVidWdOb2RlXG5cbnZhciBQcm9taXNlID0gcmVxdWlyZSgnLi4vcHJvbWlzZScpXG4gICwgQ29udGV4dCA9IHJlcXVpcmUoJy4uL2NvbnRleHQnKVxuICAsIGRlYnVnID0gcmVxdWlyZSgnLi4vZGVidWcnKVxuXG5mdW5jdGlvbiBEZWJ1Z05vZGUodmFybmFtZSkge1xuICB0aGlzLnZhcm5hbWUgPSB2YXJuYW1lXG59XG5cbnZhciBjb25zID0gRGVidWdOb2RlXG4gICwgcHJvdG8gPSBjb25zLnByb3RvdHlwZVxuXG5wcm90by5yZW5kZXIgPSBmdW5jdGlvbihjb250ZXh0LCB2YWx1ZSkge1xuICB2YXIgc2VsZiA9IHRoaXNcbiAgICAsIHRhcmdldCA9IGNvbnRleHRcbiAgICAsIHByb21pc2VcblxuICBpZihzZWxmLnZhcm5hbWUgIT09IG51bGwpIHtcbiAgICB2YWx1ZSA9IGFyZ3VtZW50cy5sZW5ndGggPT09IDIgPyB2YWx1ZSA6IHNlbGYudmFybmFtZS5yZXNvbHZlKGNvbnRleHQpXG4gICAgaWYodmFsdWUgJiYgdmFsdWUuY29uc3RydWN0b3IgPT09IFByb21pc2UpIHtcbiAgICAgIHByb21pc2UgPSBuZXcgUHJvbWlzZVxuICAgICAgdmFsdWUub25jZSgnZG9uZScsIGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgcHJvbWlzZS5yZXNvbHZlKHNlbGYucmVuZGVyKGNvbnRleHQsIGRhdGEpKVxuICAgICAgfSlcbiAgICAgIHJldHVybiBwcm9taXNlXG4gICAgfVxuICAgIHRhcmdldCA9IHZhbHVlXG4gIH1cblxuICBpZih0YXJnZXQgPT09IGNvbnRleHQpIHtcbiAgICB3aGlsZSh0YXJnZXQgIT09IENvbnRleHQucHJvdG90eXBlKSB7XG4gICAgICBkZWJ1Zy5sb2codGFyZ2V0KVxuICAgICAgdGFyZ2V0ID0gT2JqZWN0LmdldFByb3RvdHlwZU9mKHRhcmdldClcbiAgICB9XG4gICAgcmV0dXJuICcnXG4gIH1cbiAgZGVidWcubG9nKHRhcmdldClcbiAgcmV0dXJuICcnXG59XG5cbmNvbnMucGFyc2UgPSBmdW5jdGlvbihjb250ZW50cywgcGFyc2VyKSB7XG4gIHZhciBiaXRzID0gY29udGVudHMuc3BsaXQoJyAnKVxuXG4gIHJldHVybiBuZXcgRGVidWdOb2RlKGJpdHNbMV0gPyBwYXJzZXIuY29tcGlsZShiaXRzWzFdKSA6IG51bGwpXG59XG5cbiIsIm1vZHVsZS5leHBvcnRzID0gRXh0ZW5kc05vZGVcblxudmFyIFByb21pc2UgPSByZXF1aXJlKCcuLi9wcm9taXNlJylcbiAgLCBCbG9ja0NvbnRleHQgPSByZXF1aXJlKCcuLi9ibG9ja19jb250ZXh0JylcblxuXG5mdW5jdGlvbiBFeHRlbmRzTm9kZShwYXJlbnQsIG5vZGVzLCBsb2FkZXIpIHtcbiAgdGhpcy5wYXJlbnQgPSBwYXJlbnRcbiAgdGhpcy5sb2FkZXIgPSBsb2FkZXJcblxuICB0aGlzLmJsb2NrcyA9IHt9XG5cbiAgZm9yKHZhciBpID0gMCwgbGVuID0gbm9kZXMubm9kZXMubGVuZ3RoOyBpIDwgbGVuOyArK2kpIHtcbiAgICBpZighbm9kZXMubm9kZXNbaV0uaXNCbG9ja05vZGUpXG4gICAgICBjb250aW51ZVxuXG4gICAgdGhpcy5ibG9ja3Nbbm9kZXMubm9kZXNbaV0ubmFtZV0gPSBub2Rlcy5ub2Rlc1tpXVxuICB9XG59XG5cbnZhciBjb25zID0gRXh0ZW5kc05vZGVcbiAgLCBwcm90byA9IGNvbnMucHJvdG90eXBlXG5cbnByb3RvLmlzRXh0ZW5kc05vZGUgPSB0cnVlXG5cbnByb3RvLnJlbmRlciA9IGZ1bmN0aW9uKGNvbnRleHQsIHBhcmVudCkge1xuICB2YXIgc2VsZiA9IHRoaXNcbiAgICAsIHByb21pc2VcblxuICBwYXJlbnQgPSBwYXJlbnQgfHwgdGhpcy5wYXJlbnQucmVzb2x2ZShjb250ZXh0KVxuXG4gIGlmKHBhcmVudC5jb25zdHJ1Y3RvciA9PT0gUHJvbWlzZSkge1xuICAgIHByb21pc2UgPSBuZXcgUHJvbWlzZVxuXG4gICAgcGFyZW50Lm9uY2UoJ2RvbmUnLCBmdW5jdGlvbihkYXRhKSB7XG4gICAgICBwcm9taXNlLnJlc29sdmUoc2VsZi5yZW5kZXIoY29udGV4dCwgZGF0YSkpXG4gICAgfSlcblxuICAgIHJldHVybiBwcm9taXNlXG4gIH1cblxuICBwYXJlbnQgPSBzZWxmLmdldF90ZW1wbGF0ZShwYXJlbnQpXG5cbiAgaWYocGFyZW50LmNvbnN0cnVjdG9yID09PSBQcm9taXNlKSB7XG4gICAgcHJvbWlzZSA9IG5ldyBQcm9taXNlXG5cbiAgICBwYXJlbnQub25jZSgnZG9uZScsIGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgIHByb21pc2UucmVzb2x2ZShzZWxmLnJlbmRlcihjb250ZXh0LCBkYXRhKSlcbiAgICB9KSAgXG5cbiAgICByZXR1cm4gcHJvbWlzZVxuICB9XG5cbiAgdmFyIGJsb2NrQ29udGV4dCA9IEJsb2NrQ29udGV4dC5mcm9tKGNvbnRleHQpIHx8IEJsb2NrQ29udGV4dC5pbnRvKGNvbnRleHQpXG4gICAgLCBibG9ja3MgPSB7fVxuICAgICwgbm9kZUxpc3QgPSBwYXJlbnQuZ2V0Tm9kZUxpc3QoKVxuICAgICwgZXh0ZW5kc0lEWCA9IGZhbHNlXG5cbiAgYmxvY2tDb250ZXh0LmFkZChzZWxmLmJsb2NrcylcblxuICBmb3IodmFyIGkgPSAwLCBsZW4gPSBub2RlTGlzdC5ub2Rlcy5sZW5ndGg7IGkgPCBsZW47ICsraSkge1xuICAgIGlmKG5vZGVMaXN0Lm5vZGVzW2ldLmlzRXh0ZW5kc05vZGUpIHtcbiAgICAgIGV4dGVuZHNJRFggPSB0cnVlXG4gICAgICBicmVha1xuICAgIH1cblxuICAgIGlmKG5vZGVMaXN0Lm5vZGVzW2ldLmlzQmxvY2tOb2RlKSB7XG4gICAgICBibG9ja3Nbbm9kZUxpc3Qubm9kZXNbaV0ubmFtZV0gPSBub2RlTGlzdC5ub2Rlc1tpXVxuICAgIH1cbiAgfVxuXG4gIGlmKCFleHRlbmRzSURYKSB7XG4gICAgYmxvY2tDb250ZXh0LmFkZChibG9ja3MpXG4gIH1cblxuICBwcm9taXNlID0gbmV3IFByb21pc2VcblxuICBwYXJlbnQucmVuZGVyKGNvbnRleHQsIGZ1bmN0aW9uKGVyciwgZGF0YSkge1xuICAgIHByb21pc2UucmVzb2x2ZShkYXRhKVxuICB9KVxuXG4gIHJldHVybiBwcm9taXNlXG59XG5cbnByb3RvLmdldF90ZW1wbGF0ZSA9IGZ1bmN0aW9uKHBhcmVudCkge1xuICBpZih0eXBlb2YgcGFyZW50ICE9PSAnc3RyaW5nJykge1xuICAgIHJldHVybiBwYXJlbnRcbiAgfVxuXG4gIHJldHVybiB0aGlzLmxvYWRlcihwYXJlbnQpXG59XG5cbmNvbnMucGFyc2UgPSBmdW5jdGlvbihjb250ZW50cywgcGFyc2VyKSB7XG4gIHZhciBiaXRzID0gY29udGVudHMuc3BsaXQoJyAnKVxuICAgICwgcGFyZW50ID0gcGFyc2VyLmNvbXBpbGUoYml0cy5zbGljZSgxKS5qb2luKCcgJykpXG4gICAgLCBub2RlcyA9IHBhcnNlci5wYXJzZSgpXG4gICAgLCBsb2FkZXIgPSBwYXJzZXIucGx1Z2lucy5sb29rdXAoJ2xvYWRlcicpXG5cbiAgcmV0dXJuIG5ldyBjb25zKHBhcmVudCwgbm9kZXMsIGxvYWRlcilcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gRm9yTm9kZVxuXG52YXIgTm9kZUxpc3QgPSByZXF1aXJlKCcuLi9ub2RlX2xpc3QnKVxuICAsIFByb21pc2UgPSByZXF1aXJlKCcuLi9wcm9taXNlJylcblxuZnVuY3Rpb24gRm9yTm9kZSh0YXJnZXQsIHVucGFjaywgbG9vcCwgZW1wdHksIHJldmVyc2VkKSB7XG4gIHRoaXMudGFyZ2V0ID0gdGFyZ2V0XG4gIHRoaXMudW5wYWNrID0gdW5wYWNrXG4gIHRoaXMubG9vcCA9IGxvb3BcbiAgdGhpcy5lbXB0eSA9IGVtcHR5XG4gIHRoaXMucmV2ZXJzZWQgPSByZXZlcnNlZFxufVxuXG52YXIgY29ucyA9IEZvck5vZGVcbiAgLCBwcm90byA9IGNvbnMucHJvdG90eXBlXG5cbmZ1bmN0aW9uIGdldEluSW5kZXgoYml0cykge1xuICBmb3IodmFyIGkgPSAwLCBsZW4gPSBiaXRzLmxlbmd0aDsgaSA8IGxlbjsgKytpKVxuICAgIGlmKGJpdHNbaV0gPT09ICdpbicpXG4gICAgICByZXR1cm4gaVxuXG4gIHJldHVybiAtMSBcbn1cblxucHJvdG8ucmVuZGVyID0gZnVuY3Rpb24oY29udGV4dCwgdmFsdWUpIHtcbiAgdmFyIHNlbGYgPSB0aGlzXG4gICAgLCBhcnIgPSB2YWx1ZSB8fCBzZWxmLnRhcmdldC5yZXNvbHZlKGNvbnRleHQpXG4gICAgLCBwcm9taXNlXG5cblxuICBpZihhcnIgJiYgYXJyLmNvbnN0cnVjdG9yID09PSBQcm9taXNlKSB7XG4gICAgcHJvbWlzZSA9IG5ldyBQcm9taXNlXG4gICAgYXJyLm9uY2UoJ2RvbmUnLCBmdW5jdGlvbihkYXRhKSB7XG4gICAgICBwcm9taXNlLnJlc29sdmUoc2VsZi5yZW5kZXIoY29udGV4dCwgZGF0YSkpXG4gICAgfSlcblxuICAgIHJldHVybiBwcm9taXNlXG4gIH1cblxuICBpZihhcnIgPT09IHVuZGVmaW5lZCB8fCBhcnIgPT09IG51bGwpIHtcbiAgICBhcnIgPSBbXVxuICB9XG5cbiAgdmFyIGJpdHMgPSBbXVxuICAgICwgcHJvbWlzZXMgPSBbXVxuICAgICwgcGFyZW50ID0gY29udGV4dC5mb3Jsb29wXG4gICAgLCBsb29wID0ge31cbiAgICAsIHJlc3VsdFxuICAgICwgY3R4dFxuICAgICwgc3ViXG5cbiAgaWYoISgnbGVuZ3RoJyBpbiBhcnIpKSB7XG4gICAgZm9yKHZhciBrZXkgaW4gYXJyKSBpZihhcnIuaGFzT3duUHJvcGVydHkoa2V5KSkge1xuICAgICAgYml0cy5wdXNoKGtleSlcbiAgICB9XG5cbiAgICBhcnIgPSBiaXRzLnNsaWNlKClcbiAgICBiaXRzLmxlbmd0aCA9IDBcbiAgfVxuXG4gIGlmKCFhcnIubGVuZ3RoKSB7XG4gICAgcmV0dXJuIHNlbGYuZW1wdHkucmVuZGVyKGNvbnRleHQpXG4gIH1cblxuICBzdWIgPSBzZWxmLnJldmVyc2VkID8gYXJyLmxlbmd0aCAtIDEgOiAwXG5cbiAgZm9yKHZhciBpID0gMCwgbGVuID0gYXJyLmxlbmd0aCwgaWR4OyBpIDwgbGVuOyArK2kpIHtcbiAgICBjdHh0ID0gY29udGV4dC5jb3B5KClcbiAgICBpZHggPSBNYXRoLmFicyhzdWIgLSBpKVxuICAgIGxvb3AuY291bnRlciA9IGkgKyAxXG4gICAgbG9vcC5jb3VudGVyMCA9IGlcbiAgICBsb29wLnJldmNvdW50ZXIgPSBsZW4gLSBpXG4gICAgbG9vcC5yZXZjb3VudGVyMCA9IGxlbiAtIChpICsgMSlcbiAgICBsb29wLmZpcnN0ID0gaSA9PT0gMFxuICAgIGxvb3AubGFzdCA9IGkgPT09IGxlbiAtIDFcbiAgICBsb29wLnBhcmVudGxvb3AgPSBwYXJlbnQgXG4gICAgY3R4dC5mb3Jsb29wID0gbG9vcFxuXG4gICAgaWYoc2VsZi51bnBhY2subGVuZ3RoID09PSAxKVxuICAgICAgY3R4dFtzZWxmLnVucGFja1swXV0gPSBhcnJbaWR4XVxuICAgIGVsc2UgZm9yKHZhciB1ID0gMDsgdSA8IHNlbGYudW5wYWNrLmxlbmd0aDsgKyt1KVxuICAgICAgY3R4dFtzZWxmLnVucGFja1t1XV0gPSBhcnJbaWR4XVt1XVxuXG4gICAgcmVzdWx0ID0gc2VsZi5sb29wLnJlbmRlcihjdHh0KVxuICAgIGlmKHJlc3VsdC5jb25zdHJ1Y3RvciA9PT0gUHJvbWlzZSlcbiAgICAgIHByb21pc2VzLnB1c2gocmVzdWx0KVxuICAgICBcbiAgICBiaXRzLnB1c2gocmVzdWx0KSBcbiAgfVxuXG4gIGlmKHByb21pc2VzLmxlbmd0aCkge1xuICAgIHJldHVybiBzZWxmLmxvb3AucmVzb2x2ZVByb21pc2VzKGJpdHMsIHByb21pc2VzKVxuICB9XG5cbiAgcmV0dXJuIGJpdHMuam9pbignJylcbn1cblxuY29ucy5wYXJzZSA9IGZ1bmN0aW9uKGNvbnRlbnRzLCBwYXJzZXIpIHtcbiAgdmFyIGJpdHMgPSBjb250ZW50cy5zcGxpdCgvXFxzKy8pXG4gICAgLCByZXZlcnNlZCA9IGJpdHNbYml0cy5sZW5ndGgtMV0gPT09ICdyZXZlcnNlZCdcbiAgICAsIGlkeEluID0gZ2V0SW5JbmRleChiaXRzKVxuICAgICwgdmFyaWFibGVzID0gYml0cy5zbGljZSgxLCBpZHhJbilcbiAgICAsIHRhcmdldCA9IHBhcnNlci5jb21waWxlKGJpdHNbaWR4SW4rMV0pXG4gICAgLCBub2RlbGlzdCA9IHBhcnNlci5wYXJzZShbJ2VtcHR5JywgJ2VuZGZvciddKVxuICAgICwgdW5wYWNrID0gW11cbiAgICAsIGVtcHR5XG5cblxuICBpZihwYXJzZXIudG9rZW5zLnNoaWZ0KCkuaXMoWydlbXB0eSddKSkge1xuICAgIGVtcHR5ID0gcGFyc2VyLnBhcnNlKFsnZW5kZm9yJ10pXG4gICAgcGFyc2VyLnRva2Vucy5zaGlmdCgpXG4gIH0gZWxzZSB7XG4gICAgZW1wdHkgPSBuZXcgTm9kZUxpc3QoW10pXG4gIH1cblxuICB2YXJpYWJsZXMgPSB2YXJpYWJsZXMuam9pbignICcpLnNwbGl0KCcsJylcbiAgZm9yKHZhciBpID0gMCwgbGVuID0gdmFyaWFibGVzLmxlbmd0aDsgaSA8IGxlbjsgKytpKSB7XG4gICAgdmFyaWFibGVzW2ldID0gdmFyaWFibGVzW2ldLnJlcGxhY2UoLyheXFxzK3xcXHMrJCkvLCAnJylcbiAgICBpZih2YXJpYWJsZXNbaV0pXG4gICAgICB1bnBhY2sucHVzaCh2YXJpYWJsZXNbaV0pXG4gIH1cblxuICByZXR1cm4gbmV3IGNvbnModGFyZ2V0LCB1bnBhY2ssIG5vZGVsaXN0LCBlbXB0eSwgcmV2ZXJzZWQpO1xufVxuIiwibW9kdWxlLmV4cG9ydHMgPSBJbmNsdWRlTm9kZVxuXG52YXIgUHJvbWlzZSA9IHJlcXVpcmUoJy4uL3Byb21pc2UnKVxuXG5mdW5jdGlvbiBJbmNsdWRlTm9kZSh0YXJnZXRfdmFyLCBsb2FkZXIpIHtcbiAgdGhpcy50YXJnZXRfdmFyID0gdGFyZ2V0X3ZhclxuICB0aGlzLmxvYWRlciA9IGxvYWRlclxufVxuXG52YXIgY29ucyA9IEluY2x1ZGVOb2RlXG4gICwgcHJvdG8gPSBjb25zLnByb3RvdHlwZVxuXG5jb25zLnBhcnNlID0gZnVuY3Rpb24oY29udGVudHMsIHBhcnNlcikge1xuICB2YXIgYml0cyA9IGNvbnRlbnRzLnNwbGl0KCcgJylcbiAgICAsIHZhcm5hbWUgPSBwYXJzZXIuY29tcGlsZShiaXRzLnNsaWNlKDEpLmpvaW4oJyAnKSlcbiAgICAsIGxvYWRlciA9IHBhcnNlci5wbHVnaW5zLmxvb2t1cCgnbG9hZGVyJylcblxuICByZXR1cm4gbmV3IGNvbnModmFybmFtZSwgbG9hZGVyKSBcbn1cblxucHJvdG8ucmVuZGVyID0gZnVuY3Rpb24oY29udGV4dCwgdGFyZ2V0KSB7XG4gIHZhciBzZWxmID0gdGhpc1xuICAgICwgcHJvbWlzZVxuXG4gIHRhcmdldCA9IHRhcmdldCB8fCB0aGlzLnRhcmdldF92YXIucmVzb2x2ZShjb250ZXh0KVxuXG4gIGlmKHRhcmdldCAmJiB0YXJnZXQuY29uc3RydWN0b3IgPT09IFByb21pc2UpIHtcbiAgICBwcm9taXNlID0gbmV3IFByb21pc2VcblxuICAgIHRhcmdldC5vbmNlKCdkb25lJywgZnVuY3Rpb24oZGF0YSkge1xuICAgICAgcHJvbWlzZS5yZXNvbHZlKHNlbGYucmVuZGVyKGNvbnRleHQsIGRhdGEpKVxuICAgIH0pXG5cbiAgICByZXR1cm4gcHJvbWlzZVxuICB9XG5cbiAgdGFyZ2V0ID0gc2VsZi5nZXRfdGVtcGxhdGUodGFyZ2V0KVxuXG4gIGlmKHRhcmdldCAmJiB0YXJnZXQuY29uc3RydWN0b3IgPT09IFByb21pc2UpIHtcbiAgICBwcm9taXNlID0gbmV3IFByb21pc2VcblxuICAgIHRhcmdldC5vbmNlKCdkb25lJywgZnVuY3Rpb24oZGF0YSkge1xuICAgICAgcHJvbWlzZS5yZXNvbHZlKHNlbGYucmVuZGVyKGNvbnRleHQsIGRhdGEpKVxuICAgIH0pICBcblxuICAgIHJldHVybiBwcm9taXNlXG4gIH1cblxuICBwcm9taXNlID0gbmV3IFByb21pc2VcblxuICB0YXJnZXQucmVuZGVyKGNvbnRleHQuY29weSgpLCBmdW5jdGlvbihlcnIsIGRhdGEpIHtcbiAgICBwcm9taXNlLnJlc29sdmUoZGF0YSlcbiAgfSlcblxuICByZXR1cm4gcHJvbWlzZVxufVxuXG5wcm90by5nZXRfdGVtcGxhdGUgPSBmdW5jdGlvbih0YXJnZXQpIHtcbiAgaWYodHlwZW9mIHRhcmdldCA9PT0gJ3N0cmluZycpIHtcbiAgICByZXR1cm4gdGhpcy5sb2FkZXIodGFyZ2V0KVxuICB9XG5cbiAgLy8gb2theSwgaXQncyBwcm9iYWJseSBhIHRlbXBsYXRlIG9iamVjdFxuICByZXR1cm4gdGFyZ2V0XG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IE5vd05vZGVcblxudmFyIGZvcm1hdCA9IHJlcXVpcmUoJy4uL2RhdGUnKS5kYXRlXG5cbmZ1bmN0aW9uIE5vd05vZGUoZm9ybWF0U3RyaW5nKSB7XG4gIHRoaXMuZm9ybWF0ID0gZm9ybWF0U3RyaW5nXG59XG5cbnZhciBjb25zID0gTm93Tm9kZVxuICAsIHByb3RvID0gY29ucy5wcm90b3R5cGVcblxucHJvdG8ucmVuZGVyID0gZnVuY3Rpb24oY29udGV4dCkge1xuICByZXR1cm4gZm9ybWF0KG5ldyBEYXRlLCB0aGlzLmZvcm1hdClcbn1cblxuY29ucy5wYXJzZSA9IGZ1bmN0aW9uKGNvbnRlbnRzLCBwYXJzZXIpIHtcbiAgdmFyIGJpdHMgPSBjb250ZW50cy5zcGxpdCgnICcpXG4gICAgLCBmbXQgPSBiaXRzLnNsaWNlKDEpLmpvaW4oJyAnKVxuXG4gIGZtdCA9IGZtdFxuICAgIC5yZXBsYWNlKC9eXFxzKy8sICcnKVxuICAgIC5yZXBsYWNlKC9cXHMrJC8sICcnKVxuXG4gIGlmKC9bJ1wiXS8udGVzdChmbXQuY2hhckF0KDApKSkge1xuICAgIGZtdCA9IGZtdC5zbGljZSgxLCAtMSlcbiAgfVxuXG4gIHJldHVybiBuZXcgTm93Tm9kZShmbXQgfHwgJ04gaiwgWScpXG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IFdpdGhOb2RlXG5cbnZhciBQcm9taXNlID0gcmVxdWlyZSgnLi4vcHJvbWlzZScpXG5cbmZ1bmN0aW9uIFdpdGhOb2RlKHdpdGhfdmFyLCBhc192YXIsIG5vZGVzKSB7XG4gIHRoaXMud2l0aF92YXIgPSB3aXRoX3ZhclxuICB0aGlzLmFzX3ZhciA9IGFzX3ZhclxuICB0aGlzLm5vZGVzID0gbm9kZXNcbn1cblxudmFyIGNvbnMgPSBXaXRoTm9kZVxuICAsIHByb3RvID0gY29ucy5wcm90b3R5cGVcblxuY29ucy5wYXJzZSA9IGZ1bmN0aW9uKGNvbnRlbnRzLCBwYXJzZXIpIHtcbiAgdmFyIGJpdHMgPSBjb250ZW50cy5zcGxpdCgvXFxzKy9nKVxuICAgICwgd2l0aHZhciA9IHBhcnNlci5jb21waWxlKGJpdHNbMV0pXG4gICAgLCBhc3ZhciA9IGJpdHNbM11cbiAgICAsIG5vZGVsaXN0ID0gcGFyc2VyLnBhcnNlKFsnZW5kd2l0aCddKVxuXG4gIHBhcnNlci50b2tlbnMuc2hpZnQoKVxuICByZXR1cm4gbmV3IGNvbnMod2l0aHZhciwgYXN2YXIsIG5vZGVsaXN0KVxufVxuXG5wcm90by5yZW5kZXIgPSBmdW5jdGlvbihjb250ZXh0LCB2YWx1ZSkge1xuICB2YXIgc2VsZiA9IHRoaXMgXG4gICAgLCByZXN1bHRcbiAgICAsIHByb21pc2VcblxuICB2YWx1ZSA9IHZhbHVlIHx8IHNlbGYud2l0aF92YXIucmVzb2x2ZShjb250ZXh0KVxuXG4gIGlmKHZhbHVlLmNvbnN0cnVjdG9yID09PSBQcm9taXNlKSB7XG4gICAgcHJvbWlzZSA9IG5ldyBQcm9taXNlXG5cbiAgICB2YWx1ZS5vbmNlKCdkb25lJywgZnVuY3Rpb24oZGF0YSkge1xuICAgICAgcHJvbWlzZS5yZXNvbHZlKHNlbGYucmVuZGVyKGNvbnRleHQsIGRhdGEpKVxuICAgIH0pXG5cbiAgICByZXR1cm4gcHJvbWlzZVxuICB9XG5cbiAgY29udGV4dCA9IGNvbnRleHQuY29weSgpXG4gIGNvbnRleHRbc2VsZi5hc192YXJdID0gdmFsdWVcblxuICByZXN1bHQgPSBzZWxmLm5vZGVzLnJlbmRlcihjb250ZXh0KVxuXG4gIHJldHVybiByZXN1bHRcbn1cbiIsInZhciBmb3JtYXQgPSByZXF1aXJlKCcuLi9kYXRlJykuZGF0ZVxuICBcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oaW5wdXQsIHZhbHVlLCByZWFkeSkge1xuICBpZiAocmVhZHkgPT09IHVuZGVmaW5lZClcbiAgICB2YWx1ZSA9ICdOIGosIFknXG5cbiAgcmV0dXJuIGZvcm1hdChpbnB1dC5nZXRGdWxsWWVhciA/IGlucHV0IDogbmV3IERhdGUoaW5wdXQpLCB2YWx1ZSlcbn1cbiIsInZhciBkaWN0c29ydCA9IHJlcXVpcmUoJy4vZGljdHNvcnQnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihpbnB1dCwga2V5KSB7XG4gIHJldHVybiBkaWN0c29ydChpbnB1dCwga2V5KS5yZXZlcnNlKClcbn1cbiIsInZhciBGaWx0ZXJOb2RlID0gcmVxdWlyZSgnLi4vZmlsdGVyX25vZGUnKVxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGlucHV0KSB7XG4gIGlmKGlucHV0ICYmIGlucHV0LnNhZmUpIHtcbiAgICByZXR1cm4gaW5wdXRcbiAgfVxuXG4gIGlucHV0ID0gbmV3IFN0cmluZyhGaWx0ZXJOb2RlLmVzY2FwZShpbnB1dCkpXG4gIGlucHV0LnNhZmUgPSB0cnVlXG4gIHJldHVybiBpbnB1dFxufVxuIiwidmFyIEZpbHRlck5vZGUgPSByZXF1aXJlKCcuLi9maWx0ZXJfbm9kZScpXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oaW5wdXQpIHtcbiAgdmFyIHggPSBuZXcgU3RyaW5nKEZpbHRlck5vZGUuZXNjYXBlKGlucHV0KycnKSlcbiAgeC5zYWZlID0gdHJ1ZVxuICByZXR1cm4geFxufVxuIiwidmFyIHNhZmUgPSByZXF1aXJlKCcuL3NhZmUnKVxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGlucHV0KSB7XG4gIHZhciBzdHIgPSBpbnB1dC50b1N0cmluZygpXG4gICAgLCBwYXJhcyA9IHN0ci5zcGxpdCgnXFxuXFxuJylcbiAgICAsIG91dCA9IFtdXG5cbiAgd2hpbGUocGFyYXMubGVuZ3RoKSB7XG4gICAgb3V0LnVuc2hpZnQocGFyYXMucG9wKCkucmVwbGFjZSgvXFxuL2csICc8YnIgLz4nKSlcbiAgfVxuXG4gIHJldHVybiBzYWZlKCc8cD4nK291dC5qb2luKCc8L3A+PHA+JykrJzwvcD4nKVxufVxuIiwidmFyIHNhZmUgPSByZXF1aXJlKCcuL3NhZmUnKVxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGlucHV0KSB7XG4gIHZhciBzdHIgPSBpbnB1dC50b1N0cmluZygpXG4gIHJldHVybiBzYWZlKHN0ci5yZXBsYWNlKC9cXG4vZywgJzxiciAvPicpKVxufVxuIiwidmFyIEZpbHRlck5vZGUgPSByZXF1aXJlKCcuLi9maWx0ZXJfbm9kZScpXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oaW5wdXQpIHtcbiAgaW5wdXQgPSBuZXcgU3RyaW5nKGlucHV0KVxuICBpbnB1dC5zYWZlID0gdHJ1ZVxuICByZXR1cm4gaW5wdXRcbn1cbiIsInZhciB0aW1lc2luY2UgPSByZXF1aXJlKCcuL3RpbWVzaW5jZScpLnRpbWVzaW5jZVxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGlucHV0LCBuKSB7XG4gIHZhciBub3cgPSBuID8gbmV3IERhdGUobikgOiBuZXcgRGF0ZSgpXG4gIHJldHVybiB0aW1lc2luY2Uobm93LCBpbnB1dClcbn1cbiIsInZhciBzYWZlID0gcmVxdWlyZSgnLi9zYWZlJyk7XG5cbnZhciB1bHBhcnNlciA9IGZ1bmN0aW9uKGxpc3QpIHtcbiAgdmFyIG91dCA9IFtdXG4gICAgLCBsID0gbGlzdC5zbGljZSgpXG4gICAgLCBpdGVtXG5cbiAgd2hpbGUobC5sZW5ndGgpIHtcbiAgICBpdGVtID0gbC5wb3AoKVxuXG4gICAgaWYoaXRlbSBpbnN0YW5jZW9mIEFycmF5KVxuICAgICAgb3V0LnVuc2hpZnQoJzx1bD4nK3VscGFyc2VyKGl0ZW0pKyc8L3VsPicpXG4gICAgZWxzZVxuICAgICAgb3V0LnVuc2hpZnQoJzwvbGk+PGxpPicraXRlbSlcbiAgfVxuXG4gIC8vIGdldCByaWQgb2YgdGhlIGxlYWRpbmcgPC9saT4sIGlmIGFueS4gYWRkIHRyYWlsaW5nIDwvbGk+LlxuICByZXR1cm4gb3V0LmpvaW4oJycpLnJlcGxhY2UoL148XFwvbGk+LywgJycpICsgJzwvbGk+J1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGlucHV0KSB7XG4gIHJldHVybiBpbnB1dCBpbnN0YW5jZW9mIEFycmF5ID9cbiAgICBzYWZlKHVscGFyc2VyKGlucHV0KSkgOlxuICAgIGlucHV0XG59XG4iLCJ2YXIgc2FmZSA9IHJlcXVpcmUoJy4vc2FmZScpXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oaW5wdXQpIHtcbiAgdmFyIHN0ciA9IGlucHV0LnRvU3RyaW5nKClcbiAgcmV0dXJuIHNhZmUoc3RyLnJlcGxhY2UoLygoKGh0dHAocyk/OlxcL1xcLyl8KG1haWx0bzopKShbXFx3XFxkXFwtXFwuOkBcXC9dKSspL2csIGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiAnPGEgaHJlZj1cIicrYXJndW1lbnRzWzBdKydcIj4nK2FyZ3VtZW50c1swXSsnPC9hPic7IFxuICB9KSlcbn1cbiIsInZhciBzYWZlID0gcmVxdWlyZSgnLi9zYWZlJylcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihpbnB1dCwgbGVuKSB7XG4gIHZhciBzdHIgPSBpbnB1dC50b1N0cmluZygpXG4gIGxlbiA9IHBhcnNlSW50KGxlbiwgMTApIHx8IDEwMDBcbiAgcmV0dXJuIHNhZmUoc3RyLnJlcGxhY2UoLygoKGh0dHAocyk/OlxcL1xcLyl8KG1haWx0bzopKShbXFx3XFxkXFwtXFwuOkBdKSspL2csIGZ1bmN0aW9uKCkge1xuICAgIHZhciBsdHIgPSBhcmd1bWVudHNbMF0ubGVuZ3RoID4gbGVuID8gYXJndW1lbnRzWzBdLnNsaWNlKDAsIGxlbikgKyAnLi4uJyA6IGFyZ3VtZW50c1swXTtcbiAgICByZXR1cm4gJzxhIGhyZWY9XCInK2FyZ3VtZW50c1swXSsnXCI+JytsdHIrJzwvYT4nOyBcbiAgfSkpXG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IElmTm9kZVxuXG52YXIgUHJvbWlzZSA9IHJlcXVpcmUoJy4uLy4uL3Byb21pc2UnKVxuICAsIE5vZGVMaXN0ID0gcmVxdWlyZSgnLi4vLi4vbm9kZV9saXN0JylcbiAgLCBQYXJzZXIgPSByZXF1aXJlKCcuL3BhcnNlcicpXG5cbmZ1bmN0aW9uIElmTm9kZShwcmVkaWNhdGUsIHdoZW5fdHJ1ZSwgd2hlbl9mYWxzZSkge1xuICB0aGlzLnByZWRpY2F0ZSA9IHByZWRpY2F0ZVxuICB0aGlzLndoZW5fdHJ1ZSA9IHdoZW5fdHJ1ZVxuICB0aGlzLndoZW5fZmFsc2UgPSB3aGVuX2ZhbHNlXG59XG5cbnZhciBjb25zID0gSWZOb2RlXG4gICwgcHJvdG8gPSBjb25zLnByb3RvdHlwZVxuXG5wcm90by5yZW5kZXIgPSBmdW5jdGlvbihjb250ZXh0LCByZXN1bHQsIHRpbWVzKSB7XG4gIHZhciBzZWxmID0gdGhpc1xuICAgICwgcHJvbWlzZVxuXG4gIHJlc3VsdCA9IHRpbWVzID09PSAxID8gcmVzdWx0IDogdGhpcy5wcmVkaWNhdGUuZXZhbHVhdGUoY29udGV4dClcblxuICBpZihyZXN1bHQgJiYgcmVzdWx0LmNvbnN0cnVjdG9yID09PSBQcm9taXNlKSB7XG4gICAgcHJvbWlzZSA9IG5ldyBQcm9taXNlXG5cbiAgICByZXN1bHQub25jZSgnZG9uZScsIGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICBwcm9taXNlLnJlc29sdmUoc2VsZi5yZW5kZXIoY29udGV4dCwgdmFsdWUsIDEpKVxuICAgIH0pXG5cbiAgICByZXR1cm4gcHJvbWlzZVxuICB9XG5cbiAgaWYocmVzdWx0KSB7XG4gICAgcmV0dXJuIHRoaXMud2hlbl90cnVlLnJlbmRlcihjb250ZXh0KVxuICB9XG4gIHJldHVybiB0aGlzLndoZW5fZmFsc2UucmVuZGVyKGNvbnRleHQpXG59XG5cbmNvbnMucGFyc2UgPSBmdW5jdGlvbihjb250ZW50cywgcGFyc2VyKSB7XG4gIHZhciBiaXRzID0gY29udGVudHMuc3BsaXQoJyAnKS5zbGljZSgxKVxuICAgICwgaWZwID0gbmV3IFBhcnNlcihiaXRzLCBwYXJzZXIpXG4gICAgLCBwcmVkaWNhdGVcbiAgICAsIHdoZW5fdHJ1ZVxuICAgICwgd2hlbl9mYWxzZVxuICAgICwgbmV4dFxuXG4gIHByZWRpY2F0ZSA9IGlmcC5wYXJzZSgpXG5cbiAgd2hlbl90cnVlID0gcGFyc2VyLnBhcnNlKFsnZWxzZScsICdlbmRpZiddKVxuXG4gIG5leHQgPSBwYXJzZXIudG9rZW5zLnNoaWZ0KClcblxuICBpZighbmV4dC5pcyhbJ2Vsc2UnXSkpIHtcbiAgICB3aGVuX2ZhbHNlID0gbmV3IE5vZGVMaXN0KFtdKVxuICB9IGVsc2Uge1xuICAgIHdoZW5fZmFsc2UgPSBwYXJzZXIucGFyc2UoWydlbmRpZiddKVxuICAgIHBhcnNlci50b2tlbnMuc2hpZnQoKVxuICB9XG5cbiAgcmV0dXJuIG5ldyBjb25zKHByZWRpY2F0ZSwgd2hlbl90cnVlLCB3aGVuX2ZhbHNlKVxufVxuIiwibW9kdWxlLmV4cG9ydHMgPSBCbG9ja0NvbnRleHRcblxuZnVuY3Rpb24gQmxvY2tDb250ZXh0KCkge1xuICB0aGlzLmJsb2NrcyA9IHt9XG59XG5cbnZhciBjb25zID0gQmxvY2tDb250ZXh0XG4gICwgcHJvdG8gPSBjb25zLnByb3RvdHlwZVxuXG5jb25zLktFWSA9ICdfX0JMT0NLX0NPTlRFWFRfXydcblxuY29ucy5mcm9tID0gZnVuY3Rpb24oY29udGV4dCkge1xuICByZXR1cm4gY29udGV4dFt0aGlzLktFWV1cbn1cblxuY29ucy5pbnRvID0gZnVuY3Rpb24oY29udGV4dCkge1xuICByZXR1cm4gY29udGV4dFt0aGlzLktFWV0gPSBuZXcgdGhpcygpXG59XG5cbnByb3RvLmFkZCA9IGZ1bmN0aW9uKGJsb2Nrcykge1xuICBmb3IodmFyIG5hbWUgaW4gYmxvY2tzKSB7XG4gICAgKHRoaXMuYmxvY2tzW25hbWVdID0gdGhpcy5ibG9ja3NbbmFtZV0gfHwgW10pLnVuc2hpZnQoYmxvY2tzW25hbWVdKVxuICB9XG59XG5cbnByb3RvLmdldCA9IGZ1bmN0aW9uKG5hbWUpIHtcbiAgdmFyIGxpc3QgPSB0aGlzLmJsb2Nrc1tuYW1lXSB8fCBbXVxuXG4gIHJldHVybiBsaXN0W2xpc3QubGVuZ3RoIC0gMV1cbn1cblxucHJvdG8ucHVzaCA9IGZ1bmN0aW9uKG5hbWUsIGJsb2NrKSB7XG4gICh0aGlzLmJsb2Nrc1tuYW1lXSA9IHRoaXMuYmxvY2tzW25hbWVdIHx8IFtdKS5wdXNoKGJsb2NrKVxufVxuXG5wcm90by5wb3AgPSBmdW5jdGlvbihuYW1lKSB7XG4gIHJldHVybiAodGhpcy5ibG9ja3NbbmFtZV0gPSB0aGlzLmJsb2Nrc1tuYW1lXSB8fCBbXSkucG9wKClcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0ge1xuICBcIiswOTAwXCI6IFtcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIkFzaWFcIiwgXG4gICAgICBcImFiYnJcIjogXCJKU1RcIiwgXG4gICAgICBcIm5hbWVcIjogXCJKYXBhbiBTdGFuZGFyZCBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIkF1c3RyYWxpYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIldEVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIldlc3Rlcm4gRGF5bGlnaHQgVGltZVwiXG4gICAgfSBcbiAgXSwgXG4gIFwiKzEzNDVcIjogW1xuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiUGFjaWZpY1wiLCBcbiAgICAgIFwiYWJiclwiOiBcIkNIQURUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiQ2hhdGhhbSBJc2xhbmQgRGF5bGlnaHQgVGltZVwiXG4gICAgfVxuICBdLCBcbiAgXCIrMDUwMFwiOiBbXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJBc2lhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiUEtUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiUGFraXN0YW4gU3RhbmRhcmQgVGltZVwiXG4gICAgfSBcbiAgXSwgXG4gIFwiKzA0MzBcIjogW1xuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiQXNpYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIkFGVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIkFmZ2hhbmlzdGFuIFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiQXNpYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIklSRFRcIiwgXG4gICAgICBcIm5hbWVcIjogXCJJcmFuIERheWxpZ2h0IFRpbWVcIlxuICAgIH1cbiAgXSwgXG4gIFwiKzEyMDBcIjogW1xuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiQXNpYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIkFOQVNUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiQW5hZHlyIFN1bW1lciBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIkFzaWFcIiwgXG4gICAgICBcImFiYnJcIjogXCJBTkFUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiQW5hZHlyIFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiUGFjaWZpY1wiLCBcbiAgICAgIFwiYWJiclwiOiBcIkZKVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIkZpamkgVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJQYWNpZmljXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiR0lMVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIkdpbGJlcnQgSXNsYW5kIFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiQXNpYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIk1BR1NUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiTWFnYWRhbiBTdW1tZXIgVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJQYWNpZmljXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiTUhUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiTWFyc2hhbGwgSXNsYW5kcyBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIlBhY2lmaWNcIiwgXG4gICAgICBcImFiYnJcIjogXCJOWlNUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiTmV3IFplYWxhbmQgU3RhbmRhcmQgVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJBc2lhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiUEVUU1RcIiwgXG4gICAgICBcIm5hbWVcIjogXCJLYW1jaGF0a2EgU3VtbWVyIFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiQXNpYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIlBFVFRcIiwgXG4gICAgICBcIm5hbWVcIjogXCJLYW1jaGF0a2EgVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJQYWNpZmljXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiVFZUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiVHV2YWx1IFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiUGFjaWZpY1wiLCBcbiAgICAgIFwiYWJiclwiOiBcIldGVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIldhbGxpcyBhbmQgRnV0dW5hIFRpbWVcIlxuICAgIH1cbiAgXSwgXG4gIFwiLTExMDBcIjogW1xuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiUGFjaWZpY1wiLCBcbiAgICAgIFwiYWJiclwiOiBcIlNTVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIlNhbW9hIFN0YW5kYXJkIFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiUGFjaWZpY1wiLCBcbiAgICAgIFwiYWJiclwiOiBcIldTVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIldlc3QgU2Ftb2EgVGltZVwiXG4gICAgfSBcbiAgXSwgXG4gIFwiKzE0MDBcIjogW1xuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiUGFjaWZpY1wiLCBcbiAgICAgIFwiYWJiclwiOiBcIkxJTlRcIiwgXG4gICAgICBcIm5hbWVcIjogXCJMaW5lIElzbGFuZHMgVGltZVwiXG4gICAgfVxuICBdLCBcbiAgXCItMDIzMFwiOiBbXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJOb3J0aCBBbWVyaWNhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiSEFUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiSGV1cmUgQXZhbmNcXHUwMGU5ZSBkZSBUZXJyZS1OZXV2ZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJOb3J0aCBBbWVyaWNhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiTkRUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiTmV3Zm91bmRsYW5kIERheWxpZ2h0IFRpbWVcIlxuICAgIH1cbiAgXSwgXG4gIFwiLTAxMDBcIjogW1xuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiQWZyaWNhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiQ1ZUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiQ2FwZSBWZXJkZSBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIk5vcnRoIEFtZXJpY2FcIiwgXG4gICAgICBcImFiYnJcIjogXCJFR1RcIiwgXG4gICAgICBcIm5hbWVcIjogXCJFYXN0IEdyZWVubGFuZCBUaW1lXCJcbiAgICB9IFxuICBdLCBcbiAgXCItMTIwMFwiOiBbXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJNaWxpdGFyeVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIllcIiwgXG4gICAgICBcIm5hbWVcIjogXCJZYW5rZWUgVGltZSBab25lXCJcbiAgICB9XG4gIF0sIFxuICBcIiswODAwXCI6IFtcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIkFzaWFcIiwgXG4gICAgICBcImFiYnJcIjogXCJDU1RcIiwgXG4gICAgICBcIm5hbWVcIjogXCJDaGluYSBTdGFuZGFyZCBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIkFzaWFcIiwgXG4gICAgICBcImFiYnJcIjogXCJLUkFTVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIktyYXNub3lhcnNrIFN1bW1lciBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIkF1c3RyYWxpYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIldTVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIldlc3Rlcm4gU3RhbmRhcmQgVGltZVwiXG4gICAgfVxuICBdLCBcbiAgXCIrMDYzMFwiOiBbXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJBc2lhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiTU1UXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiTXlhbm1hciBUaW1lXCJcbiAgICB9LFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiSW5kaWFuIE9jZWFuXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiQ0NUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiQ29jb3MgSXNsYW5kcyBUaW1lXCJcbiAgICB9XG4gIF0sIFxuICBcIi0wNDMwXCI6IFtcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIlNvdXRoIEFtZXJpY2FcIiwgXG4gICAgICBcImFiYnJcIjogXCJITFZcIiwgXG4gICAgICBcIm5hbWVcIjogXCJIb3JhIExlZ2FsIGRlIFZlbmV6dWVsYVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJTb3V0aCBBbWVyaWNhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiVkVUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiVmVuZXp1ZWxhbiBTdGFuZGFyZCBUaW1lXCJcbiAgICB9XG4gIF0sIFxuICBcIi0wNzAwXCI6IFtcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIk5vcnRoIEFtZXJpY2FcIiwgXG4gICAgICBcImFiYnJcIjogXCJNU1RcIiwgXG4gICAgICBcIm5hbWVcIjogXCJNb3VudGFpbiBTdGFuZGFyZCBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIk5vcnRoIEFtZXJpY2FcIiwgXG4gICAgICBcImFiYnJcIjogXCJQRFRcIiwgXG4gICAgICBcIm5hbWVcIjogXCJQYWNpZmljIERheWxpZ2h0IFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiTm9ydGggQW1lcmljYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIkhBUFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIkhldXJlIEF2YW5jXFx1MDBlOWUgZHUgUGFjaWZpcXVlXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIk5vcnRoIEFtZXJpY2FcIiwgXG4gICAgICBcImFiYnJcIjogXCJITlJcIiwgXG4gICAgICBcIm5hbWVcIjogXCJIZXVyZSBOb3JtYWxlIGRlcyBSb2NoZXVzZXNcIlxuICAgIH0gXG4gIF0sIFxuICBcIi0wMjAwXCI6IFtcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIlNvdXRoIEFtZXJpY2FcIiwgXG4gICAgICBcImFiYnJcIjogXCJGTlRcIiwgXG4gICAgICBcIm5hbWVcIjogXCJGZXJuYW5kbyBkZSBOb3JvbmhhIFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiTm9ydGggQW1lcmljYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIldHU1RcIiwgXG4gICAgICBcIm5hbWVcIjogXCJXZXN0ZXJuIEdyZWVubGFuZCBTdW1tZXIgVGltZVwiXG4gICAgfSxcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIk5vcnRoIEFtZXJpY2FcIiwgXG4gICAgICBcImFiYnJcIjogXCJQTURUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiUGllcnJlICYgTWlxdWVsb24gRGF5bGlnaHQgVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJTb3V0aCBBbWVyaWNhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiVVlTVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIlVydWd1YXkgU3VtbWVyIFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiU291dGggQW1lcmljYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIkJSU1RcIiwgXG4gICAgICBcIm5hbWVcIjogXCJCcmFzaWxpYSBTdW1tZXIgVGltZVwiXG4gICAgfSBcbiAgXSwgXG4gIFwiKzEwMzBcIjogW1xuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiQXVzdHJhbGlhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiQ0RUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiQ2VudHJhbCBEYXlsaWdodCBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIkF1c3RyYWxpYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIkxIU1RcIiwgXG4gICAgICBcIm5hbWVcIjogXCJMb3JkIEhvd2UgU3RhbmRhcmQgVGltZVwiXG4gICAgfVxuICBdLCBcbiAgXCIrMDMwMFwiOiBbXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJFdXJvcGVcIiwgXG4gICAgICBcImFiYnJcIjogXCJNU0tcIiwgXG4gICAgICBcIm5hbWVcIjogXCJNb3Njb3cgU3RhbmRhcmQgVGltZVwiXG4gICAgfSxcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIkFzaWFcIiwgXG4gICAgICBcImFiYnJcIjogXCJJRFRcIiwgXG4gICAgICBcIm5hbWVcIjogXCJJc3JhZWwgRGF5bGlnaHQgVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJBc2lhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiQVNUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiQXJhYmlhIFN0YW5kYXJkIFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiSW5kaWFuIE9jZWFuXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiRUFUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiRWFzdCBBZnJpY2EgVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJFdXJvcGVcIiwgXG4gICAgICBcImFiYnJcIjogXCJFRVNUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiRWFzdGVybiBFdXJvcGVhbiBTdW1tZXIgVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJBZnJpY2FcIiwgXG4gICAgICBcImFiYnJcIjogXCJFQVRcIiwgXG4gICAgICBcIm5hbWVcIjogXCJFYXN0ZXJuIEFmcmljYSBUaW1lXCJcbiAgICB9IFxuICBdLCBcbiAgXCJVVENcIjogW1xuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiQXRsYW50aWNcIiwgXG4gICAgICBcImFiYnJcIjogXCJBWk9TVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIkF6b3JlcyBTdW1tZXIgVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJOb3J0aCBBbWVyaWNhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiRUdTVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIkVhc3Rlcm4gR3JlZW5sYW5kIFN1bW1lciBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIkFmcmljYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIkdNVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIkdyZWVud2ljaCBNZWFuIFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiRXVyb3BlXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiR01UXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiR3JlZW53aWNoIE1lYW4gVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJBZnJpY2FcIiwgXG4gICAgICBcImFiYnJcIjogXCJXRVRcIiwgXG4gICAgICBcIm5hbWVcIjogXCJXZXN0ZXJuIEV1cm9wZWFuIFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiRXVyb3BlXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiV0VUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiV2VzdGVybiBFdXJvcGVhbiBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIkFmcmljYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIldUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiV2VzdGVybiBTYWhhcmEgU3RhbmRhcmQgVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJNaWxpdGFyeVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIlpcIiwgXG4gICAgICBcIm5hbWVcIjogXCJadWx1IFRpbWUgWm9uZVwiXG4gICAgfVxuICBdLCBcbiAgXCIrMDQwMFwiOiBbXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJBc2lhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiQU1UXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiQXJtZW5pYSBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIkFzaWFcIiwgXG4gICAgICBcImFiYnJcIjogXCJBWlRcIiwgXG4gICAgICBcIm5hbWVcIjogXCJBemVyYmFpamFuIFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiTWlsaXRhcnlcIiwgXG4gICAgICBcImFiYnJcIjogXCJEXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiRGVsdGEgVGltZSBab25lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIkFzaWFcIiwgXG4gICAgICBcImFiYnJcIjogXCJHRVRcIiwgXG4gICAgICBcIm5hbWVcIjogXCJHZW9yZ2lhIFN0YW5kYXJkIFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiQXNpYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIkdTVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIkd1bGYgU3RhbmRhcmQgVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJFdXJvcGVcIiwgXG4gICAgICBcImFiYnJcIjogXCJLVVlUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiS3V5YnlzaGV2IFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiRXVyb3BlXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiTVNEXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiTW9zY293IERheWxpZ2h0IFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiQWZyaWNhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiTVVUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiTWF1cml0aXVzIFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiQWZyaWNhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiUkVUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiUmV1bmlvbiBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIkV1cm9wZVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIlNBTVRcIiwgXG4gICAgICBcIm5hbWVcIjogXCJTYW1hcmEgVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJBZnJpY2FcIiwgXG4gICAgICBcImFiYnJcIjogXCJTQ1RcIiwgXG4gICAgICBcIm5hbWVcIjogXCJTZXljaGVsbGVzIFRpbWVcIlxuICAgIH1cbiAgXSwgXG4gIFwiKzA3MDBcIjogW1xuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiQXVzdHJhbGlhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiQ1hUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiQ2hyaXN0bWFzIElzbGFuZCBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIkFudGFyY3RpY2FcIiwgXG4gICAgICBcImFiYnJcIjogXCJEQVZUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiRGF2aXMgVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJNaWxpdGFyeVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIkdcIiwgXG4gICAgICBcIm5hbWVcIjogXCJHb2xmIFRpbWUgWm9uZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJBc2lhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiSE9WVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIkhvdmQgVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJBc2lhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiSUNUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiSW5kb2NoaW5hIFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiQXNpYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIktSQVRcIiwgXG4gICAgICBcIm5hbWVcIjogXCJLcmFzbm95YXJzayBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIkFzaWFcIiwgXG4gICAgICBcImFiYnJcIjogXCJOT1ZTVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIk5vdm9zaWJpcnNrIFN1bW1lciBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIkFzaWFcIiwgXG4gICAgICBcImFiYnJcIjogXCJPTVNTVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIk9tc2sgU3VtbWVyIFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiQXNpYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIldJQlwiLCBcbiAgICAgIFwibmFtZVwiOiBcIldlc3Rlcm4gSW5kb25lc2lhbiBUaW1lXCJcbiAgICB9XG4gIF0sIFxuICBcIiswMjAwXCI6IFtcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIk1pbGl0YXJ5XCIsIFxuICAgICAgXCJhYmJyXCI6IFwiQlwiLCBcbiAgICAgIFwibmFtZVwiOiBcIkJyYXZvIFRpbWUgWm9uZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJBZnJpY2FcIiwgXG4gICAgICBcImFiYnJcIjogXCJDQVRcIiwgXG4gICAgICBcIm5hbWVcIjogXCJDZW50cmFsIEFmcmljYSBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIkV1cm9wZVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIkNFU1RcIiwgXG4gICAgICBcIm5hbWVcIjogXCJDZW50cmFsIEV1cm9wZWFuIFN1bW1lciBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIkFmcmljYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIkVFVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIkVhc3Rlcm4gRXVyb3BlYW4gVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJBc2lhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiRUVUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiRWFzdGVybiBFdXJvcGVhbiBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIkV1cm9wZVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIkVFVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIkVhc3Rlcm4gRXVyb3BlYW4gVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJBc2lhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiSVNUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiSXNyYWVsIFN0YW5kYXJkIFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiQWZyaWNhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiU0FTVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIlNvdXRoIEFmcmljYSBTdGFuZGFyZCBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIkFmcmljYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIldBU1RcIiwgXG4gICAgICBcIm5hbWVcIjogXCJXZXN0IEFmcmljYSBTdW1tZXIgVGltZVwiXG4gICAgfVxuICBdLCBcbiAgXCItMTAwMFwiOiBbXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJQYWNpZmljXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiQ0tUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiQ29vayBJc2xhbmQgVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJOb3J0aCBBbWVyaWNhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiSEFTVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIkhhd2FpaS1BbGV1dGlhbiBTdGFuZGFyZCBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIlBhY2lmaWNcIiwgXG4gICAgICBcImFiYnJcIjogXCJUQUhUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiVGFoaXRpIFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiUGFjaWZpY1wiLCBcbiAgICAgIFwiYWJiclwiOiBcIlRLVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIlRva2VsYXUgVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJNaWxpdGFyeVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIldcIiwgXG4gICAgICBcIm5hbWVcIjogXCJXaGlza2V5IFRpbWUgWm9uZVwiXG4gICAgfVxuICBdLCBcbiAgXCIrMDkzMFwiOiBbXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJBdXN0cmFsaWFcIiwgXG4gICAgICBcImFiYnJcIjogXCJDU1RcIiwgXG4gICAgICBcIm5hbWVcIjogXCJDZW50cmFsIFN0YW5kYXJkIFRpbWVcIlxuICAgIH1cbiAgXSwgXG4gIFwiKzA1MzBcIjogW1xuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiQXNpYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIklTVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIkluZGlhIFN0YW5kYXJkIFRpbWVcIlxuICAgIH1cbiAgXSwgXG4gIFwiKzEzMDBcIjogW1xuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiUGFjaWZpY1wiLCBcbiAgICAgIFwiYWJiclwiOiBcIkZKU1RcIiwgXG4gICAgICBcIm5hbWVcIjogXCJGaWppIFN1bW1lciBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIkFudGFyY3RpY2FcIiwgXG4gICAgICBcImFiYnJcIjogXCJOWkRUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiTmV3IFplYWxhbmQgRGF5bGlnaHQgVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJQYWNpZmljXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiTlpEVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIk5ldyBaZWFsYW5kIERheWxpZ2h0IFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiUGFjaWZpY1wiLCBcbiAgICAgIFwiYWJiclwiOiBcIlBIT1RcIiwgXG4gICAgICBcIm5hbWVcIjogXCJQaG9lbml4IElzbGFuZCBUaW1lXCJcbiAgICB9XG4gIF0sIFxuICBcIiswNTQ1XCI6IFtcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIkFzaWFcIiwgXG4gICAgICBcImFiYnJcIjogXCJOUFRcIiwgXG4gICAgICBcIm5hbWVcIjogXCJOZXBhbCBUaW1lXCJcbiAgICB9XG4gIF0sIFxuICBcIisxMDAwXCI6IFtcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIlBhY2lmaWNcIiwgXG4gICAgICBcImFiYnJcIjogXCJDaFNUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiQ2hhbW9ycm8gU3RhbmRhcmQgVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJBdXN0cmFsaWFcIiwgXG4gICAgICBcImFiYnJcIjogXCJFU1RcIiwgXG4gICAgICBcIm5hbWVcIjogXCJFYXN0ZXJuIFN0YW5kYXJkIFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiTWlsaXRhcnlcIiwgXG4gICAgICBcImFiYnJcIjogXCJLXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiS2lsbyBUaW1lIFpvbmVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiUGFjaWZpY1wiLCBcbiAgICAgIFwiYWJiclwiOiBcIlBHVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIlBhcHVhIE5ldyBHdWluZWEgVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJBc2lhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiVkxBVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIlZsYWRpdm9zdG9rIFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiQXNpYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIllBS1NUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiWWFrdXRzayBTdW1tZXIgVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJQYWNpZmljXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiWUFQVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIllhcCBUaW1lXCJcbiAgICB9XG4gIF0sIFxuICBcIi0wNjAwXCI6IFtcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIk5vcnRoIEFtZXJpY2FcIiwgXG4gICAgICBcImFiYnJcIjogXCJDU1RcIiwgXG4gICAgICBcIm5hbWVcIjogXCJDZW50cmFsIFN0YW5kYXJkIFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiTm9ydGggQW1lcmljYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIk1EVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIk1vdW50YWluIERheWxpZ2h0IFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiUGFjaWZpY1wiLCBcbiAgICAgIFwiYWJiclwiOiBcIkdBTFRcIiwgXG4gICAgICBcIm5hbWVcIjogXCJHYWxhcGFnb3MgVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJOb3J0aCBBbWVyaWNhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiSEFSXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiSGV1cmUgQXZhbmNcXHUwMGU5ZSBkZXMgUm9jaGV1c2VzXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIk5vcnRoIEFtZXJpY2FcIiwgXG4gICAgICBcImFiYnJcIjogXCJITkNcIiwgXG4gICAgICBcIm5hbWVcIjogXCJIZXVyZSBOb3JtYWxlIGR1IENlbnRyZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJDZW50cmFsIEFtZXJpY2FcIiwgXG4gICAgICBcImFiYnJcIjogXCJITkNcIiwgXG4gICAgICBcIm5hbWVcIjogXCJIZXVyZSBOb3JtYWxlIGR1IENlbnRyZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJDZW50cmFsIEFtZXJpY2FcIiwgXG4gICAgICBcImFiYnJcIjogXCJDU1RcIiwgXG4gICAgICBcIm5hbWVcIjogXCJDZW50cmFsIFN0YW5kYXJkIFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiUGFjaWZpY1wiLCBcbiAgICAgIFwiYWJiclwiOiBcIkVBU1RcIiwgXG4gICAgICBcIm5hbWVcIjogXCJFYXN0ZXIgSXNsYW5kIFN0YW5kYXJkIFRpbWVcIlxuICAgIH1cbiAgXSwgXG4gIFwiKzAxMDBcIjogW1xuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiRXVyb3BlXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiQ0VUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiQ2VudHJhbCBFdXJvcGVhbiBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIkV1cm9wZVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIkJTVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIkJyaXRpc2ggU3VtbWVyIFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiQWZyaWNhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiQ0VUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiQ2VudHJhbCBFdXJvcGVhbiBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIkFmcmljYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIldFU1RcIiwgXG4gICAgICBcIm5hbWVcIjogXCJXZXN0ZXJuIEV1cm9wZWFuIFN1bW1lciBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIkV1cm9wZVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIldFU1RcIiwgXG4gICAgICBcIm5hbWVcIjogXCJXZXN0ZXJuIEV1cm9wZWFuIFN1bW1lciBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIkFmcmljYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIldTVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIldlc3Rlcm4gU2FoYXJhIFN1bW1lciBUaW1lXCJcbiAgICB9LFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiQWZyaWNhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiV0FUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiV2VzdCBBZnJpY2EgVGltZVwiXG4gICAgfVxuICBdLCBcbiAgXCItMDQwMFwiOiBbXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJOb3J0aCBBbWVyaWNhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiQVNUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiQXRsYW50aWMgU3RhbmRhcmQgVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJOb3J0aCBBbWVyaWNhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiRURUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiRWFzdGVybiBEYXlsaWdodCBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIlNvdXRoIEFtZXJpY2FcIiwgXG4gICAgICBcImFiYnJcIjogXCJDTFRcIiwgXG4gICAgICBcIm5hbWVcIjogXCJDaGlsZSBTdGFuZGFyZCBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIlNvdXRoIEFtZXJpY2FcIiwgXG4gICAgICBcImFiYnJcIjogXCJGS1RcIiwgXG4gICAgICBcIm5hbWVcIjogXCJGYWxrbGFuZCBJc2xhbmQgVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJTb3V0aCBBbWVyaWNhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiR1lUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiR3V5YW5hIFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiU291dGggQW1lcmljYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIlBZVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIlBhcmFndWF5IFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiU291dGggQW1lcmljYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIkFNVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIkFtYXpvbiBUaW1lXCJcbiAgICB9IFxuICBdLCBcbiAgXCItMDMzMFwiOiBbXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJOb3J0aCBBbWVyaWNhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiTlNUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiTmV3Zm91bmRsYW5kIFN0YW5kYXJkIFRpbWVcIlxuICAgIH1cbiAgXSwgXG4gIFwiLTA1MDBcIjogW1xuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiTm9ydGggQW1lcmljYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIkVTVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIkVhc3Rlcm4gU3RhbmRhcmQgVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJOb3J0aCBBbWVyaWNhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiQ0RUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiQ2VudHJhbCBEYXlsaWdodCBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIlNvdXRoIEFtZXJpY2FcIiwgXG4gICAgICBcImFiYnJcIjogXCJDT1RcIiwgXG4gICAgICBcIm5hbWVcIjogXCJDb2xvbWJpYSBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIkNhcmliYmVhblwiLCBcbiAgICAgIFwiYWJiclwiOiBcIkNTVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIkN1YmEgU3RhbmRhcmQgVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJQYWNpZmljXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiRUFTU1RcIiwgXG4gICAgICBcIm5hbWVcIjogXCJFYXN0ZXIgSXNsYW5kIFN1bW1lciBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIlNvdXRoIEFtZXJpY2FcIiwgXG4gICAgICBcImFiYnJcIjogXCJFQ1RcIiwgXG4gICAgICBcIm5hbWVcIjogXCJFY3VhZG9yIFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiQ2VudHJhbCBBbWVyaWNhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiRVNUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiRWFzdGVybiBTdGFuZGFyZCBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIkNhcmliYmVhblwiLCBcbiAgICAgIFwiYWJiclwiOiBcIkVTVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIkVhc3Rlcm4gU3RhbmRhcmQgVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJDZW50cmFsIEFtZXJpY2FcIiwgXG4gICAgICBcImFiYnJcIjogXCJFVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIlRpZW1wbyBkZWwgRXN0ZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJDYXJpYmJlYW5cIiwgXG4gICAgICBcImFiYnJcIjogXCJFVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIlRpZW1wbyBkZWwgRXN0ZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJOb3J0aCBBbWVyaWNhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiRVRcIiwgXG4gICAgICBcIm5hbWVcIjogXCJUaWVtcG8gRGVsIEVzdGVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiTm9ydGggQW1lcmljYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIkhBQ1wiLCBcbiAgICAgIFwibmFtZVwiOiBcIkhldXJlIEF2YW5jXFx1MDBlOWUgZHUgQ2VudHJlXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIlNvdXRoIEFtZXJpY2FcIiwgXG4gICAgICBcImFiYnJcIjogXCJQRVRcIiwgXG4gICAgICBcIm5hbWVcIjogXCJQZXJ1IFRpbWVcIlxuICAgIH0gXG4gIF0sIFxuICBcIi0wOTAwXCI6IFtcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIk5vcnRoIEFtZXJpY2FcIiwgXG4gICAgICBcImFiYnJcIjogXCJBS1NUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiQWxhc2thIFN0YW5kYXJkIFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiTm9ydGggQW1lcmljYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIkhBRFRcIiwgXG4gICAgICBcIm5hbWVcIjogXCJIYXdhaWktQWxldXRpYW4gRGF5bGlnaHQgVGltZVwiXG4gICAgfSBcbiAgXSwgXG4gIFwiLTAzMDBcIjogW1xuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiTm9ydGggQW1lcmljYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIkFEVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIkF0bGFudGljIERheWxpZ2h0IFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiU291dGggQW1lcmljYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIkFNU1RcIiwgXG4gICAgICBcIm5hbWVcIjogXCJBbWF6b24gU3VtbWVyIFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiU291dGggQW1lcmljYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIkJSVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIkJyYXNcXHUwMGVkbGlhIHRpbWVcIlxuICAgIH0gXG4gIF0sIFxuICBcIisxMjQ1XCI6IFtcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIlBhY2lmaWNcIiwgXG4gICAgICBcImFiYnJcIjogXCJDSEFTVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIkNoYXRoYW0gSXNsYW5kIFN0YW5kYXJkIFRpbWVcIlxuICAgIH1cbiAgXSwgXG4gIFwiKzA2MDBcIjogW1xuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiQXNpYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIkJTVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIkJhbmdsYWRlc2ggU3RhbmRhcmQgVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJBc2lhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiWUVLU1RcIiwgXG4gICAgICBcIm5hbWVcIjogXCJZZWthdGVyaW5idXJnIFN1bW1lciBUaW1lXCJcbiAgICB9LFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiQXNpYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIkJTVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIkJhbmdsYWRlc2ggU3RhbmRhcmQgVGltZVwiXG4gICAgfSBcbiAgXSwgXG4gIFwiLTA5MzBcIjogW1xuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiUGFjaWZpY1wiLCBcbiAgICAgIFwiYWJiclwiOiBcIk1BUlRcIiwgXG4gICAgICBcIm5hbWVcIjogXCJNYXJxdWVzYXMgVGltZVwiXG4gICAgfVxuICBdLCBcbiAgXCIrMDMzMFwiOiBbXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJBc2lhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiSVJTVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIklyYW4gU3RhbmRhcmQgVGltZVwiXG4gICAgfVxuICBdLCBcbiAgXCIrMTEzMFwiOiBbXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJBdXN0cmFsaWFcIiwgXG4gICAgICBcImFiYnJcIjogXCJORlRcIiwgXG4gICAgICBcIm5hbWVcIjogXCJOb3Jmb2xrIFRpbWVcIlxuICAgIH1cbiAgXSwgXG4gIFwiKzExMDBcIjogW1xuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiQXNpYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIlZMQVNUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiVmxhZGl2b3N0b2sgU3VtbWVyIFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiQXVzdHJhbGlhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiRURUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiRWFzdGVybiBEYXlsaWdodCBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIlBhY2lmaWNcIiwgXG4gICAgICBcImFiYnJcIjogXCJOQ1RcIiwgXG4gICAgICBcIm5hbWVcIjogXCJOZXcgQ2FsZWRvbmlhIFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiUGFjaWZpY1wiLCBcbiAgICAgIFwiYWJiclwiOiBcIlBPTlRcIiwgXG4gICAgICBcIm5hbWVcIjogXCJQb2hucGVpIFN0YW5kYXJkIFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiUGFjaWZpY1wiLCBcbiAgICAgIFwiYWJiclwiOiBcIlNCVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIlNvbG9tb24gSXNsYW5kc1RpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiUGFjaWZpY1wiLCBcbiAgICAgIFwiYWJiclwiOiBcIlZVVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIlZhbnVhdHUgVGltZVwiXG4gICAgfVxuICBdLCBcbiAgXCItMDgwMFwiOiBbXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJOb3J0aCBBbWVyaWNhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiUFNUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiUGFjaWZpYyBTdGFuZGFyZCBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIk5vcnRoIEFtZXJpY2FcIiwgXG4gICAgICBcImFiYnJcIjogXCJBS0RUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiQWxhc2thIERheWxpZ2h0IFRpbWVcIlxuICAgIH0gXG4gIF1cbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gSWZQYXJzZXJcblxudmFyIExpdGVyYWxUb2tlbiA9IHJlcXVpcmUoJy4vbGl0ZXJhbCcpXG4gICwgRW5kVG9rZW4gPSByZXF1aXJlKCcuL2VuZCcpXG4gICwgb3BlcmF0b3JzID0gcmVxdWlyZSgnLi9vcGVyYXRvcnMnKVxuXG5mdW5jdGlvbiBJZlBhcnNlcih0b2tlbnMsIHBhcnNlcikge1xuICB0aGlzLmNyZWF0ZVZhcmlhYmxlID0gZnVuY3Rpb24odG9rZW4pIHtcbiAgICByZXR1cm4gbmV3IExpdGVyYWxUb2tlbihwYXJzZXIuY29tcGlsZSh0b2tlbiksIHRva2VuKVxuICB9XG5cbiAgdmFyIGxlbiA9IHRva2Vucy5sZW5ndGhcbiAgICAsIGkgPSAwXG4gICAgLCBtYXBwZWRUb2tlbnMgPSBbXVxuICAgICwgdG9rZW5cblxuICB3aGlsZShpIDwgbGVuKSB7XG4gICAgdG9rZW4gPSB0b2tlbnNbaV1cbiAgICBpZih0b2tlbiA9PSAnbm90JyAmJiB0b2tlbnNbaSsxXSA9PSAnaW4nKSB7XG4gICAgICArK2lcbiAgICAgIHRva2VuID0gJ25vdCBpbidcbiAgICB9XG4gICAgbWFwcGVkVG9rZW5zLnB1c2godGhpcy50cmFuc2xhdGVUb2tlbih0b2tlbikpXG4gICAgKytpXG4gIH1cblxuICB0aGlzLnBvcyA9IDBcbiAgdGhpcy50b2tlbnMgPSBtYXBwZWRUb2tlbnNcbiAgdGhpcy5jdXJyZW50VG9rZW4gPSB0aGlzLm5leHQoKVxufVxuXG52YXIgY29ucyA9IElmUGFyc2VyXG4gICwgcHJvdG8gPSBjb25zLnByb3RvdHlwZVxuXG5wcm90by50cmFuc2xhdGVUb2tlbiA9IGZ1bmN0aW9uKHRva2VuKSB7XG4gIHZhciBvcCA9IG9wZXJhdG9yc1t0b2tlbl1cblxuICBpZihvcCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgcmV0dXJuIHRoaXMuY3JlYXRlVmFyaWFibGUodG9rZW4pXG4gIH1cblxuICByZXR1cm4gb3AoKVxufVxuXG5wcm90by5uZXh0ID0gZnVuY3Rpb24oKSB7XG4gIGlmKHRoaXMucG9zID49IHRoaXMudG9rZW5zLmxlbmd0aCkge1xuICAgIHJldHVybiBuZXcgRW5kVG9rZW4oKVxuICB9XG4gIHJldHVybiB0aGlzLnRva2Vuc1t0aGlzLnBvcysrXVxufVxuXG5wcm90by5wYXJzZSA9IGZ1bmN0aW9uKCkge1xuICB2YXIgcmV0dmFsID0gdGhpcy5leHByZXNzaW9uKClcblxuICBpZighKHRoaXMuY3VycmVudFRva2VuLmNvbnN0cnVjdG9yID09PSBFbmRUb2tlbikpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJVbnVzZWQgXCIrdGhpcy5jdXJyZW50VG9rZW4rXCIgYXQgZW5kIG9mIGlmIGV4cHJlc3Npb24uXCIpXG4gIH1cblxuICByZXR1cm4gcmV0dmFsXG59XG5cbnByb3RvLmV4cHJlc3Npb24gPSBmdW5jdGlvbihyYnApIHtcbiAgcmJwID0gcmJwIHx8IDBcblxuICB2YXIgdCA9IHRoaXMuY3VycmVudFRva2VuXG4gICAgLCBsZWZ0XG5cbiAgdGhpcy5jdXJyZW50VG9rZW4gPSB0aGlzLm5leHQoKVxuXG4gIGxlZnQgPSB0Lm51ZCh0aGlzKVxuICB3aGlsZShyYnAgPCB0aGlzLmN1cnJlbnRUb2tlbi5sYnApIHtcbiAgICB0ID0gdGhpcy5jdXJyZW50VG9rZW5cblxuICAgIHRoaXMuY3VycmVudFRva2VuID0gdGhpcy5uZXh0KClcblxuICAgIGxlZnQgPSB0LmxlZChsZWZ0LCB0aGlzKVxuICB9XG5cbiAgcmV0dXJuIGxlZnRcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gTGl0ZXJhbFRva2VuXG5cbmZ1bmN0aW9uIExpdGVyYWxUb2tlbih2YWx1ZSwgb3JpZ2luYWwpIHtcbiAgdGhpcy5sYnAgPSAwXG4gIHRoaXMudmFsdWUgPSB2YWx1ZVxufVxuXG52YXIgY29ucyA9IExpdGVyYWxUb2tlblxuICAsIHByb3RvID0gY29ucy5wcm90b3R5cGVcblxucHJvdG8ubnVkID0gZnVuY3Rpb24ocGFyc2VyKSB7XG4gIHJldHVybiB0aGlzXG59XG5cbnByb3RvLmxlZCA9IGZ1bmN0aW9uKCkge1xuICB0aHJvdyBuZXcgRXJyb3IoKVxufVxuXG5wcm90by5ldmFsdWF0ZSA9IGZ1bmN0aW9uKGNvbnRleHQpIHtcbiAgaWYoIXRoaXMudmFsdWUpXG4gICAgcmV0dXJuIHRoaXMudmFsdWVcblxuICBpZighdGhpcy52YWx1ZS5yZXNvbHZlKVxuICAgIHJldHVybiB0aGlzLnZhbHVlXG5cbiAgcmV0dXJuIHRoaXMudmFsdWUucmVzb2x2ZShjb250ZXh0KVxufVxuIiwibW9kdWxlLmV4cG9ydHMgPSBFbmRUb2tlblxuXG5mdW5jdGlvbiBFbmRUb2tlbigpIHtcbiAgdGhpcy5sYnAgPSAwXG59XG4iLCJ2YXIgdHogPSByZXF1aXJlKCcuL3R6JylcbiAgLCBpc0RTVCA9IHJlcXVpcmUoJ2RzdCcpXG5cbm1vZHVsZS5leHBvcnRzID0gdHppbmZvXG5cbmZ1bmN0aW9uIGdldF9vZmZzZXRfZm10KHR6b2Zmcykge1xuICB2YXIgb2ZmcyA9IH5+KHR6b2ZmcyAvIDYwKVxuICAgICwgbWlucyA9ICgnMDAnICsgfn5NYXRoLmFicyh0em9mZnMgJSA2MCkpLnNsaWNlKC0yKVxuXG4gIG9mZnMgPSAoKHR6b2ZmcyA+IDApID8gJy0nIDogJysnKSArICgnMDAnICsgTWF0aC5hYnMob2ZmcykpLnNsaWNlKC0yKSArIG1pbnNcblxuICByZXR1cm4gb2Zmc1xufVxuXG5mdW5jdGlvbiB0emluZm8oZGF0ZSwgdHpfbGlzdCwgZGV0ZXJtaW5lX2RzdCwgVFopIHtcblxuICB2YXIgZm10ID0gZ2V0X29mZnNldF9mbXQoZGF0ZS5nZXRUaW1lem9uZU9mZnNldCgpKVxuXG4gIFRaID0gVFogfHwgdHpcbiAgdHpfbGlzdCA9IHR6X2xpc3QgfHwgVFpbZm10XVxuICBkZXRlcm1pbmVfZHN0ID0gZGV0ZXJtaW5lX2RzdCB8fCBpc0RTVFxuXG4gIHZhciBkYXRlX2lzX2RzdCA9IGRldGVybWluZV9kc3QoZGF0ZSlcbiAgICAsIGRhdGVfZHN0X3RocmVzaG9sZHMgPSBkZXRlcm1pbmVfZHN0LmZpbmRfdGhyZXNob2xkcygpXG4gICAgLCBoYXNfZHN0ID0gZGF0ZV9kc3RfdGhyZXNob2xkcy5zcHJpbmdfZm9yd2FyZCAhPT0gZGF0ZV9kc3RfdGhyZXNob2xkcy5mYWxsX2JhY2tcbiAgICAsIGlzX25vcnRoID0gaGFzX2RzdCAmJiBkYXRlX2RzdF90aHJlc2hvbGRzLnNwcmluZ19mb3J3YXJkIDwgZGF0ZV9kc3RfdGhyZXNob2xkcy5mYWxsX2JhY2sgXG4gICAgLCBsaXN0ID0gKHR6X2xpc3QgfHwgW10pLnNsaWNlKClcbiAgICAsIGZpbHRlcmVkID0gW11cblxuICBpZighaXNfbm9ydGgpXG4gICAgbGlzdCA9IGxpc3QucmV2ZXJzZSgpXG5cbiAgZm9yKHZhciBpID0gMCwgbGVuID0gbGlzdC5sZW5ndGg7IGkgPCBsZW47ICsraSkge1xuICAgIGlmKGRhdGVfaXNfZHN0ID09PSAvKFtEZF1heWxpZ2h0fFtTc111bW1lcikvLnRlc3QobGlzdFtpXS5uYW1lKSkge1xuICAgICAgZmlsdGVyZWQucHVzaChsaXN0W2ldKVxuICAgIH1cbiAgfVxuICBsaXN0ID0gZmlsdGVyZWRcbiAgaWYoIWxpc3QubGVuZ3RoKSByZXR1cm4ge31cblxuICByZXR1cm4ge1xuICAgICAgJ25hbWUnOiAgICAgbGlzdFswXS5uYW1lXG4gICAgLCAnbG9jJzogICAgICBsaXN0WzBdLmxvY1xuICAgICwgJ2FiYnInOiAgICAgbGlzdFswXS5hYmJyXG4gICAgLCAnb2Zmc2V0JzogICBmbXRcbiAgfVxufSBcblxudHppbmZvLmdldF9vZmZzZXRfZm9ybWF0ID0gZ2V0X29mZnNldF9mbXRcbnR6aW5mby50el9saXN0ID0gdHpcblxuRGF0ZS5wcm90b3R5cGUudHppbmZvID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiB0emluZm8odGhpcylcbn1cblxuRGF0ZS5wcm90b3R5cGUudHpvZmZzZXQgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuICdHTVQnK2dldF9vZmZzZXRfZm10KHRoaXMuZ2V0VGltZXpvbmVPZmZzZXQoKSlcbn1cbiIsInZhciBJbmZpeE9wZXJhdG9yID0gcmVxdWlyZSgnLi9pbmZpeCcpXG4gICwgUHJlZml4T3BlcmF0b3IgPSByZXF1aXJlKCcuL3ByZWZpeCcpXG5cbnZhciBrZXlzXG5cbmtleXMgPSBPYmplY3Qua2V5cyB8fCBrZXlzaGltXG5cbmZ1bmN0aW9uIGtleXNoaW0ob2JqKSB7XG4gIHZhciBhY2N1bSA9IFtdXG5cbiAgZm9yKHZhciBuIGluIG9iaikgaWYob2JqLmhhc093blByb3BlcnR5KG4pKSB7XG4gICAgYWNjdW0ucHVzaChuKVxuICB9XG5cbiAgcmV0dXJuIGFjY3VtXG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgICdvcic6IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIG5ldyBJbmZpeE9wZXJhdG9yKDYsIGZ1bmN0aW9uKHgsIHkpIHtcbiAgICAgICAgICByZXR1cm4geCB8fCB5XG4gICAgICB9KVxuICAgIH1cblxuICAsICdhbmQnOiBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBuZXcgSW5maXhPcGVyYXRvcig3LCBmdW5jdGlvbih4LCB5KSB7XG4gICAgICAgICAgcmV0dXJuIHggJiYgeVxuICAgICAgfSlcbiAgICB9XG5cbiAgLCAnbm90JzogZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gbmV3IFByZWZpeE9wZXJhdG9yKDgsIGZ1bmN0aW9uKHgpIHtcbiAgICAgICAgcmV0dXJuICF4XG4gICAgICB9KVxuICAgIH1cblxuICAsICdpbic6IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIG5ldyBJbmZpeE9wZXJhdG9yKDksIGluX29wZXJhdG9yKVxuICAgIH1cblxuICAsICdub3QgaW4nOiBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gbmV3IEluZml4T3BlcmF0b3IoOSwgZnVuY3Rpb24oeCwgeSkge1xuICAgICAgcmV0dXJuICFpbl9vcGVyYXRvcih4LHkpXG4gICAgfSlcbiAgfVxuXG4gICwgJz0nOiBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gbmV3IEluZml4T3BlcmF0b3IoMTAsIGZ1bmN0aW9uKHgsIHkpIHsgXG4gICAgICByZXR1cm4geCA9PSB5XG4gICAgfSlcbiAgfVxuXG4gICwgJz09JzogZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gbmV3IEluZml4T3BlcmF0b3IoMTAsIGZ1bmN0aW9uKHgsIHkpIHsgXG4gICAgICAgIHJldHVybiB4ID09IHlcbiAgICAgIH0pXG4gICAgfVxuXG4gICwgJyE9JzogZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gbmV3IEluZml4T3BlcmF0b3IoMTAsIGZ1bmN0aW9uKHgsIHkpIHsgXG4gICAgICAgIHJldHVybiB4ICE9PSB5XG4gICAgICB9KVxuICAgIH1cblxuICAsICc+JzogZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gbmV3IEluZml4T3BlcmF0b3IoMTAsIGZ1bmN0aW9uKHgsIHkpIHsgXG4gICAgICAgIHJldHVybiB4ID4geVxuICAgICAgfSlcbiAgICB9XG5cbiAgLCAnPj0nOiBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBuZXcgSW5maXhPcGVyYXRvcigxMCwgZnVuY3Rpb24oeCwgeSkgeyBcbiAgICAgICAgcmV0dXJuIHggPj0geVxuICAgICAgfSlcbiAgICB9XG5cbiAgLCAnPCc6IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIG5ldyBJbmZpeE9wZXJhdG9yKDEwLCBmdW5jdGlvbih4LCB5KSB7IFxuICAgICAgICByZXR1cm4geCA8IHlcbiAgICAgIH0pXG4gICAgfVxuXG4gICwgJzw9JzogZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gbmV3IEluZml4T3BlcmF0b3IoMTAsIGZ1bmN0aW9uKHgsIHkpIHsgXG4gICAgICAgIHJldHVybiB4IDw9IHlcbiAgICAgIH0pXG4gICAgfVxufVxuXG5mdW5jdGlvbiBpbl9vcGVyYXRvcih4LCB5KSB7XG4gIGlmKCEoeCBpbnN0YW5jZW9mIE9iamVjdCkgJiYgeSBpbnN0YW5jZW9mIE9iamVjdCkge1xuICAgIGlmKCEoeSAmJiAnbGVuZ3RoJyBpbiB5KSkge1xuICAgICAgeSA9IGtleXMoeSlcbiAgICB9XG4gIH1cblxuICBpZih0eXBlb2YoeCkgPT0gJ3N0cmluZycgJiYgdHlwZW9mKHkpID09J3N0cmluZycpIHtcbiAgICByZXR1cm4geS5pbmRleE9mKHgpICE9PSAtMVxuICB9XG5cbiAgaWYoeCA9PT0gdW5kZWZpbmVkIHx8IHggPT09IG51bGwpXG4gICAgcmV0dXJuIGZhbHNlXG5cbiAgaWYoeSA9PT0gdW5kZWZpbmVkIHx8IHkgPT09IG51bGwpXG4gICAgcmV0dXJuIGZhbHNlXG5cbiAgZm9yKHZhciBmb3VuZCA9IGZhbHNlLCBpID0gMCwgbGVuID0geS5sZW5ndGg7IGkgPCBsZW4gJiYgIWZvdW5kOyArK2kpIHtcbiAgICB2YXIgcmhzID0geVtpXVxuICAgIGlmKHggaW5zdGFuY2VvZiBBcnJheSkge1xuICAgICAgZm9yKHZhciBpZHggPSAwLFxuICAgICAgICBlcXVhbCA9IHgubGVuZ3RoID09IHJocy5sZW5ndGgsXG4gICAgICAgIHhsZW4gPSB4Lmxlbmd0aDtcbiAgICAgICAgaWR4IDwgeGxlbiAmJiBlcXVhbDsgKytpZHgpIHtcblxuICAgICAgICBlcXVhbCA9ICh4W2lkeF0gPT09IHJoc1tpZHhdKVxuICAgICAgfVxuICAgICAgZm91bmQgPSBlcXVhbFxuXG4gICAgfSBlbHNlIGlmKHggaW5zdGFuY2VvZiBPYmplY3QpIHtcbiAgICAgIGlmKHggPT09IHJocykge1xuICAgICAgICByZXR1cm4gdHJ1ZVxuICAgICAgfVxuICAgICAgdmFyIHhrZXlzID0ga2V5cyh4KSxcbiAgICAgICAgcmtleXMgPSBrZXlzKHJocylcblxuICAgICAgaWYoeGtleXMubGVuZ3RoID09PSBya2V5cy5sZW5ndGgpIHsgXG4gICAgICAgIGZvcih2YXIgaSA9IDAsIGxlbiA9IHhrZXlzLmxlbmd0aCwgZXF1YWwgPSB0cnVlO1xuICAgICAgICAgIGkgPCBsZW4gJiYgZXF1YWw7XG4gICAgICAgICAgKytpKSB7XG4gICAgICAgICAgZXF1YWwgPSB4a2V5c1tpXSA9PT0gcmtleXNbaV0gJiZcbiAgICAgICAgICAgICAgeFt4a2V5c1tpXV0gPT09IHJoc1tya2V5c1tpXV1cbiAgICAgICAgfVxuICAgICAgICBmb3VuZCA9IGVxdWFsXG4gICAgICB9IFxuICAgIH0gZWxzZSB7XG4gICAgICBmb3VuZCA9IHggPT0gcmhzXG4gICAgfVxuICB9XG4gIHJldHVybiBmb3VuZFxufVxuIiwibW9kdWxlLmV4cG9ydHMgPSBJbmZpeE9wZXJhdG9yXG5cbnZhciBQcm9taXNlID0gcmVxdWlyZSgnLi4vLi4vcHJvbWlzZScpXG5cbmZ1bmN0aW9uIEluZml4T3BlcmF0b3IoYnAsIGNtcCkge1xuICB0aGlzLmxicCA9IGJwXG4gIHRoaXMuY21wID0gY21wXG5cbiAgdGhpcy5maXJzdCA9IFxuICB0aGlzLnNlY29uZCA9IG51bGxcbn0gXG5cbnZhciBjb25zID0gSW5maXhPcGVyYXRvclxuICAsIHByb3RvID0gY29ucy5wcm90b3R5cGVcblxucHJvdG8ubnVkID0gZnVuY3Rpb24ocGFyc2VyKSB7XG4gIHRocm93IG5ldyBFcnJvcihcIlVuZXhwZWN0ZWQgdG9rZW5cIilcbn1cblxucHJvdG8ubGVkID0gZnVuY3Rpb24obGhzLCBwYXJzZXIpIHtcbiAgdGhpcy5maXJzdCA9IGxoc1xuICB0aGlzLnNlY29uZCA9IHBhcnNlci5leHByZXNzaW9uKHRoaXMubGJwKVxuICByZXR1cm4gdGhpc1xufVxuXG5wcm90by5ldmFsdWF0ZSA9IGZ1bmN0aW9uKGNvbnRleHQsIGZpcnN0LCBzZWNvbmQsIHNlbnRGaXJzdCwgc2VudFNlY29uZCkge1xuICB2YXIgc2VsZiA9IHRoaXNcbiAgICAsIHByb21pc2VcblxuICBmaXJzdCA9IHNlbnRGaXJzdCA/IGZpcnN0IDogc2VsZi5maXJzdC5ldmFsdWF0ZShjb250ZXh0KVxuXG4gIGlmKGZpcnN0ICYmIGZpcnN0LmNvbnN0cnVjdG9yID09PSBQcm9taXNlKSB7XG4gICAgcHJvbWlzZSA9IG5ldyBQcm9taXNlXG5cbiAgICBmaXJzdC5vbmNlKCdkb25lJywgZnVuY3Rpb24oZGF0YSkge1xuICAgICAgcHJvbWlzZS5yZXNvbHZlKHNlbGYuZXZhbHVhdGUoY29udGV4dCwgZGF0YSwgbnVsbCwgdHJ1ZSwgZmFsc2UpKVxuICAgIH0pXG5cbiAgICByZXR1cm4gcHJvbWlzZVxuICB9XG5cbiAgc2Vjb25kID0gc2VudFNlY29uZCA/IHNlY29uZCA6IHNlbGYuc2Vjb25kLmV2YWx1YXRlKGNvbnRleHQpXG5cbiAgaWYoc2Vjb25kICYmIHNlY29uZC5jb25zdHJ1Y3RvciA9PT0gUHJvbWlzZSkge1xuICAgIHByb21pc2UgPSBuZXcgUHJvbWlzZVxuXG4gICAgc2Vjb25kLm9uY2UoJ2RvbmUnLCBmdW5jdGlvbihkYXRhKSB7XG4gICAgICBwcm9taXNlLnJlc29sdmUoc2VsZi5ldmFsdWF0ZShjb250ZXh0LCBmaXJzdCwgZGF0YSwgdHJ1ZSwgdHJ1ZSkpXG4gICAgfSlcblxuICAgIHJldHVybiBwcm9taXNlXG4gIH1cblxuICByZXR1cm4gc2VsZi5jbXAoZmlyc3QsIHNlY29uZClcbn1cblxuIiwibW9kdWxlLmV4cG9ydHMgPSBQcmVmaXhPcGVyYXRvclxuXG52YXIgUHJvbWlzZSA9IHJlcXVpcmUoJy4uLy4uL3Byb21pc2UnKVxuXG5mdW5jdGlvbiBQcmVmaXhPcGVyYXRvcihicCwgY21wKSB7XG4gIHRoaXMubGJwID0gYnBcbiAgdGhpcy5jbXAgPSBjbXBcblxuICB0aGlzLmZpcnN0ID0gXG4gIHRoaXMuc2Vjb25kID0gbnVsbFxufVxuXG52YXIgY29ucyA9IFByZWZpeE9wZXJhdG9yXG4gICwgcHJvdG8gPSBjb25zLnByb3RvdHlwZVxuXG5wcm90by5udWQgPSBmdW5jdGlvbihwYXJzZXIpIHtcbiAgdGhpcy5maXJzdCA9IHBhcnNlci5leHByZXNzaW9uKHRoaXMubGJwKVxuICB0aGlzLnNlY29uZCA9IG51bGxcbiAgcmV0dXJuIHRoaXNcbn1cblxucHJvdG8ubGVkID0gZnVuY3Rpb24oZmlyc3QsIHBhcnNlcikge1xuICB0aHJvdyBuZXcgRXJyb3IoXCJVbmV4cGVjdGVkIHRva2VuXCIpXG59XG5cbnByb3RvLmV2YWx1YXRlID0gZnVuY3Rpb24oY29udGV4dCwgZmlyc3QsIHRpbWVzKSB7XG4gIHZhciBzZWxmID0gdGhpc1xuICAgICwgcHJvbWlzZVxuXG4gIGZpcnN0ID0gdGltZXMgPT09IDEgPyBmaXJzdCA6IHNlbGYuZmlyc3QuZXZhbHVhdGUoY29udGV4dClcblxuICBpZihmaXJzdCAmJiBmaXJzdC5jb25zdHJ1Y3RvciA9PT0gUHJvbWlzZSkge1xuICAgIHByb21pc2UgPSBuZXcgUHJvbWlzZVxuXG4gICAgZmlyc3Qub25jZSgnZG9uZScsIGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgIHByb21pc2UucmVzb2x2ZShzZWxmLmV2YWx1YXRlKGNvbnRleHQsIGRhdGEsIDEpKVxuICAgIH0pXG5cbiAgICByZXR1cm4gcHJvbWlzZVxuICB9XG5cbiAgcmV0dXJuIHNlbGYuY21wKGZpcnN0KVxufVxuIl19
;