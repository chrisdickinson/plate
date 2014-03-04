(function(e){if("function"==typeof bootstrap)bootstrap("plate",e);else if("object"==typeof exports)module.exports=e();else if("function"==typeof define&&define.amd)define(e);else if("undefined"!=typeof ses){if(!ses.ok())return;ses.makePlate=e}else"undefined"!=typeof window?window.plate=e():global.plate=e()})(function(){var define,ses,bootstrap,module,exports;
return (function(e,t,n){function i(n,s){if(!t[n]){if(!e[n]){var o=typeof require=="function"&&require;if(!s&&o)return o(n,!0);if(r)return r(n,!0);throw new Error("Cannot find module '"+n+"'")}var u=t[n]={exports:{}};e[n][0].call(u.exports,function(t){var r=e[n][1][t];return i(r?r:t)},u,u.exports)}return t[n].exports}var r=typeof require=="function"&&require;for(var s=0;s<n.length;s++)i(n[s]);return i})({1:[function(require,module,exports){
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

module.exports = plate

},{"./lib/date":5,"./lib/debug":6,"./lib/index":65,"./lib/libraries":66,"./lib/promise":71,"dst":91}],2:[function(require,module,exports){
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

},{}],3:[function(require,module,exports){
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


},{"./token":90}],4:[function(require,module,exports){
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

},{}],5:[function(require,module,exports){
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

},{"tz":92}],6:[function(require,module,exports){
module.exports = {
    log: function(value) { console.log(value) }
  , error: function(err) { console.error(err, err && err.stack) }
  , info: function(value) { } 
}

},{}],7:[function(require,module,exports){
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


},{"./filters/add":14,"./filters/addslashes":15,"./filters/capfirst":16,"./filters/center":17,"./filters/cut":18,"./filters/date":19,"./filters/default":20,"./filters/dictsort":21,"./filters/dictsortreversed":22,"./filters/divisibleby":23,"./filters/escape":24,"./filters/filesizeformat":25,"./filters/first":26,"./filters/floatformat":27,"./filters/force_escape":28,"./filters/get_digit":29,"./filters/index":30,"./filters/iriencode":31,"./filters/iteritems":32,"./filters/join":33,"./filters/last":34,"./filters/length":35,"./filters/length_is":36,"./filters/linebreaks":37,"./filters/linebreaksbr":38,"./filters/linenumbers":39,"./filters/ljust":40,"./filters/lower":41,"./filters/make_list":42,"./filters/phone2numeric":43,"./filters/pluralize":44,"./filters/random":45,"./filters/rjust":46,"./filters/safe":47,"./filters/slice":48,"./filters/slugify":49,"./filters/split":50,"./filters/striptags":51,"./filters/timesince":52,"./filters/timeuntil":53,"./filters/title":54,"./filters/truncatechars":55,"./filters/truncatewords":56,"./filters/unordered_list":57,"./filters/upper":58,"./filters/urlencode":59,"./filters/urlize":60,"./filters/urlizetrunc":61,"./filters/wordcount":62,"./filters/wordwrap":63,"./filters/yesno":64,"./library":67}],8:[function(require,module,exports){
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

},{"./library":67,"./tags/block":73,"./tags/comment":74,"./tags/debug":75,"./tags/extends":76,"./tags/for":77,"./tags/if/node":81,"./tags/include":85,"./tags/now":86,"./tags/with":87}],9:[function(require,module,exports){
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

},{"./promise":71}],10:[function(require,module,exports){
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


},{}],11:[function(require,module,exports){
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

},{"./promise":71}],12:[function(require,module,exports){
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

},{"./debug":6,"./promise":71}],13:[function(require,module,exports){
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


},{"./filter_node":12,"./token":90}],14:[function(require,module,exports){
module.exports = function(input, value) {
  return parseInt(input, 10) + parseInt(value, 10)
}

},{}],15:[function(require,module,exports){
module.exports = function(input) {
  return input.toString().replace(/'/g, "\\'")
}

},{}],16:[function(require,module,exports){
module.exports = function(input) {
  var str = input.toString();
  return [str.slice(0,1).toUpperCase(), str.slice(1)].join('')
}

},{}],17:[function(require,module,exports){
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

},{}],18:[function(require,module,exports){
module.exports = function(input, value) {
  var str = input.toString()
  return str.replace(new RegExp(value, "g"), '')
}

},{}],19:[function(require,module,exports){
var format = require('../date').date
  
module.exports = function(input, value, ready) {
  if (ready === undefined)
    value = 'N j, Y'

  return format(input.getFullYear ? input : new Date(input), value)
}

},{"../date":5}],20:[function(require,module,exports){
module.exports = function(input, def, ready) {
  return input ? input : def
}

},{}],21:[function(require,module,exports){
module.exports = function(input, key) {
  return input.sort(function(x, y) {
    if(x[key] > y[key]) return 1
    if(x[key] == y[key]) return 0
    if(x[key] < y[key]) return -1
  })
}

},{}],22:[function(require,module,exports){
var dictsort = require('./dictsort');

module.exports = function(input, key) {
  return dictsort(input, key).reverse()
}

},{"./dictsort":21}],23:[function(require,module,exports){
module.exports = function(input, num) {
  return input % parseInt(num, 10) == 0
}

},{}],24:[function(require,module,exports){
var FilterNode = require('../filter_node')

module.exports = function(input) {
  if(input && input.safe) {
    return input
  }

  input = new String(FilterNode.escape(input))
  input.safe = true
  return input
}

},{"../filter_node":12}],25:[function(require,module,exports){
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

},{}],26:[function(require,module,exports){
module.exports = function(input) {
  return input[0]
}

},{}],27:[function(require,module,exports){
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

},{}],28:[function(require,module,exports){
var FilterNode = require('../filter_node')

module.exports = function(input) {
  var x = new String(FilterNode.escape(input+''))
  x.safe = true
  return x
}

},{"../filter_node":12}],29:[function(require,module,exports){
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

},{}],30:[function(require,module,exports){

},{}],31:[function(require,module,exports){
module.exports = function(input) {
  return input
}

},{}],32:[function(require,module,exports){
module.exports = function(input) {
  var output = []
  for(var name in input) if(input.hasOwnProperty(name)) {
    output.push([name, input[name]])
  }
  return output
}

},{}],33:[function(require,module,exports){
module.exports = function(input, glue) {
  input = input instanceof Array ? input : input.toString().split('')
  return input.join(glue)
}

},{}],34:[function(require,module,exports){
module.exports = function(input) {
  var cb = input.charAt || function(ind) { return input[ind]; }

  return cb.call(input, input.length-1);
}

},{}],35:[function(require,module,exports){
module.exports = function(input, ready) {
  if(input && typeof input.length === 'function') {
    return input.length(ready)
  }
  return input.length
}

},{}],36:[function(require,module,exports){
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

},{}],37:[function(require,module,exports){
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

},{"./safe":47}],38:[function(require,module,exports){
var safe = require('./safe')

module.exports = function(input) {
  var str = input.toString()
  return safe(str.replace(/\n/g, '<br />'))
}

},{"./safe":47}],39:[function(require,module,exports){
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

},{}],40:[function(require,module,exports){
module.exports = function(input, num) {
  var bits = (input === null || input === undefined ? '' : input).toString().split('')
    , difference = num - bits.length

  // push returns new length of array.
  while(difference > 0) {
    difference = num - bits.push(' ')
  }

  return bits.join('')
}

},{}],41:[function(require,module,exports){
module.exports = function(input) {
  return input.toString().toLowerCase()
}

},{}],42:[function(require,module,exports){
module.exports = function(input) {
  input = input instanceof Array ? input : input.toString().split('')

  return input
}

},{}],43:[function(require,module,exports){

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

},{}],44:[function(require,module,exports){
module.exports = function(input, plural) {
  plural = (typeof plural === 'string' ? plural : 's').split(',')

  var val = Number(input)
    , suffix

  suffix = plural[plural.length-1];
  if(val === 1) {
    suffix = plural.length > 1 ? plural[0] : '';    
  }

  return suffix
}

},{}],45:[function(require,module,exports){
module.exports = function(input) {
  var cb = input.charAt || function(idx) {
    return this[idx];
  };

  return cb.call(input, Math.floor(Math.random() * input.length))
}

},{}],46:[function(require,module,exports){
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

},{}],47:[function(require,module,exports){
var FilterNode = require('../filter_node')

module.exports = function(input) {
  input = new String(input)
  input.safe = true
  return input
}

},{"../filter_node":12}],48:[function(require,module,exports){
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

},{}],49:[function(require,module,exports){
module.exports = function(input) {
  input = input.toString()
  return input
        .replace(/[^\w\s\d\-]/g, '')
        .replace(/^\s*/, '')
        .replace(/\s*$/, '')
        .replace(/[\-\s]+/g, '-')
        .toLowerCase()
}

},{}],50:[function(require,module,exports){
module.exports = function(input, by, ready) {
  by = arguments.length === 2 ? ',' : by
  input = ''+input
  return input.split(by)
}

},{}],51:[function(require,module,exports){
module.exports = function(input) {
  var str = input.toString()
  return str.replace(/<[^>]*?>/g, '')
}

},{}],52:[function(require,module,exports){
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

},{}],53:[function(require,module,exports){
var timesince = require('./timesince').timesince

module.exports = function(input, n) {
  var now = n ? new Date(n) : new Date()
  return timesince(now, input)
}

},{"./timesince":52}],54:[function(require,module,exports){
module.exports = function(input) {
  var str = input.toString()
    , bits = str.split(/\s{1}/g)
    , out = []
  
  while(bits.length) {
    var word = bits.shift()
    word = word.charAt(0).toUpperCase() + word.slice(1)
    out.push(word)
  }

  out = out.join(' ')
  return out.replace(/([a-z])'([A-Z])/g, function(a, m, x) { return x.toLowerCase() })
}

},{}],55:[function(require,module,exports){
module.exports = function(input, n) {
  var str = input.toString()
    , num = parseInt(n, 10)

  if(isNaN(num))
    return input

  if(input.length <= num)
    return input

  return input.slice(0, num)+'...'
}

},{}],56:[function(require,module,exports){
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

},{}],57:[function(require,module,exports){
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

},{"./safe":47}],58:[function(require,module,exports){
module.exports = function(input) {
  return input.toString().toUpperCase()
}

},{}],59:[function(require,module,exports){
module.exports = function(input) {
  return escape(input.toString())
}

},{}],60:[function(require,module,exports){
var safe = require('./safe')

module.exports = function(input) {
  var str = input.toString()
  return safe(str.replace(/(((http(s)?:\/\/)|(mailto:))([\w\d\-\.:@\/])+)/g, function() {
    return '<a href="'+arguments[0]+'">'+arguments[0]+'</a>'; 
  }))
}

},{"./safe":47}],61:[function(require,module,exports){
var safe = require('./safe')

module.exports = function(input, len) {
  var str = input.toString()
  len = parseInt(len, 10) || 1000
  return safe(str.replace(/(((http(s)?:\/\/)|(mailto:))([\w\d\-\.:@])+)/g, function() {
    var ltr = arguments[0].length > len ? arguments[0].slice(0, len) + '...' : arguments[0];
    return '<a href="'+arguments[0]+'">'+ltr+'</a>'; 
  }))
}

},{"./safe":47}],62:[function(require,module,exports){
module.exports = function(input) {
  var str = input.toString()
    , bits = str.split(/\s+/g)

  return bits.length
}

},{}],63:[function(require,module,exports){
module.exports = function(input, len) {
  var words = input.toString().split(/\s+/g)
    , out = []
    , len = parseInt(len, 10) || words.length

  while(words.length) {
    out.unshift(words.splice(0, len).join(' '))
  }

  return out.join('\n')
}

},{}],64:[function(require,module,exports){
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

},{}],65:[function(require,module,exports){
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

})(self)
},{"./comment_token":3,"./context":4,"./filter_token":13,"./libraries":66,"./meta":68,"./parser":70,"./promise":71,"./tag_token":72,"./text_token":89}],66:[function(require,module,exports){
module.exports = {
    Library: require('./library')
  , DefaultPluginLibrary: require('./library')
  , DefaultTagLibrary: require('./defaulttags')
  , DefaultFilterLibrary: require('./defaultfilters')
} 

},{"./defaultfilters":7,"./defaulttags":8,"./library":67}],67:[function(require,module,exports){
module.exports = Library

var Promise = require('./promise')

function Library(lib) {
  this.registry = lib || {}
}

var cons = Library
  , proto = cons.prototype

proto.lookup = errorOnNull(function(name) {
  var out = this.registry[name] || null

  if(typeof out === 'function' && out.length === 2 && name === 'loader') {
    out = Promise.toPromise(out)
  }

  return out
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


},{"./promise":71}],68:[function(require,module,exports){
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


},{"./libraries":66}],69:[function(require,module,exports){
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

},{"./promise":71}],70:[function(require,module,exports){
module.exports = Parser

var NodeList = require('./node_list')

var FilterApplication = require('./filter_application')
  , FilterLookup = require('./filter_lookup')
  , FilterChain = require('./filter_chain')
  , TagToken = require('./tag_token')

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
  var okay = !until
    , token = null
    , output = []
    , node

  while(this.tokens.length > 0) {
    token = this.tokens.shift()

    if(until && token.is(until) && token.constructor === TagToken) {
      this.tokens.unshift(token)
      okay = true

      break
    }

    if(node = token.node(this)) {
      output.push(node)
    }
  }

  if(!okay) {
    throw new Error('expected one of ' + until)
  }

  return new NodeList(output)
}

proto.compileNumber = function(content, idx, output) {
  var decimal = content.charAt(idx) === '.'
    , bits = decimal ? ['0.'] : []
    , parse
    , c

  do {
    c = content.charAt(idx)

    if(c === '.') {
      if(decimal) {
        break
      }

      decimal = true
      bits.push('.')
    } else if(/\d/.test(c)) {
      bits.push(c)
    }
  } while(++idx < content.length)

  parse = decimal ? parseFloat : parseInt
  output.push(parse(bits.join(''), 10))

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

    if(!escaped) {
      if(c === '\\') {
        escaped = true

        continue
      }

      if(c === type) {
        break
      }

      bits.push(c)
    } else {
      if(!/['"\\]/.test(c)) {
        bits.push('\\')
      }

      bits.push(c)
      escaped = false
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

    if(/[^\w\d\_]/.test(c)) {
      break
    }

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

    if(content.charAt(idx) !== '.') {
      break
    }
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

  while(/\s/.test(content.charAt(idx))) {
    ++idx
  }

  do {
    c = content.charAt(idx)

    if(/[,\s]/.test(c)) {
      break
    }

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

  if(this.cache[content]) {
    return this.cache[content]
  }

  this.compileFull(content, 0, output)

  output = this.cache[content] = new FilterChain(output, this)
  output.attach(this)

  return output
}

},{"./filter_application":9,"./filter_chain":10,"./filter_lookup":11,"./node_list":69,"./tag_token":72}],71:[function(require,module,exports){
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

cons.toPromise = function(fn) {
  return function promisified() {
    var args = [].slice.call(arguments)
      , promise = new cons
      , self = this

    args.push(onready)

    setTimeout(bang, 0)

    return promise

    function bang() {
      fn.apply(self, args)
    }

    function onready(err, data) {
      promise.resolve(data)
    }
  }
}

},{}],72:[function(require,module,exports){
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

},{"./token":90}],73:[function(require,module,exports){
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

},{"../block_context":2,"../promise":71}],74:[function(require,module,exports){
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

},{}],75:[function(require,module,exports){
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


},{"../context":4,"../debug":6,"../promise":71}],76:[function(require,module,exports){
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

},{"../block_context":2,"../promise":71}],77:[function(require,module,exports){
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

},{"../node_list":69,"../promise":71}],78:[function(require,module,exports){
module.exports = EndToken

function EndToken() {
  this.lbp = 0
}

},{}],79:[function(require,module,exports){
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


},{"../../promise":71}],80:[function(require,module,exports){
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

},{}],81:[function(require,module,exports){
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

  when_true = parser.parse(['else', 'elif', 'endif'])

  next = parser.tokens.shift()

  if(next.is(['endif'])) {
    when_false = new NodeList([])
  } else if(next.is(['elif'])) {
    when_false = cons.parse(next.content, parser)
  } else {
    when_false = parser.parse(['endif'])
    parser.tokens.shift()
  }

  return new cons(predicate, when_true, when_false)
}

},{"../../node_list":69,"../../promise":71,"./parser":83}],82:[function(require,module,exports){
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

},{"./infix":79,"./prefix":84}],83:[function(require,module,exports){
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

},{"./end":78,"./literal":80,"./operators":82}],84:[function(require,module,exports){
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

},{"../../promise":71}],85:[function(require,module,exports){
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

},{"../promise":71}],86:[function(require,module,exports){
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

},{"../date":5}],87:[function(require,module,exports){
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

  value = arguments.length === 2 ? value : self.with_var.resolve(context)

  if(value && value.constructor === Promise) {
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

},{"../promise":71}],88:[function(require,module,exports){
module.exports = TextNode

function TextNode(content) {
  this.content = content
}

var cons = TextNode
  , proto = cons.prototype

proto.render = function(context) {
  return this.content
}

},{}],89:[function(require,module,exports){
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

},{"./text_node":88,"./token":90}],90:[function(require,module,exports){
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

},{}],91:[function(require,module,exports){
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

},{}],92:[function(require,module,exports){
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

  var datestroffset = /\((.*?)\)/.exec('' + new Date())

  if(datestroffset) {
    datestroffset = datestroffset[1]

    for(var i = 0, len = list.length; i < len; ++i) {
      if(list[i].abbr === datestroffset) {
        return {
            'name': list[i].name
          , 'loc': list[i].loc
          , 'abbr': list[i].abbr
          , 'offset': fmt
        }
      }
    }
  }


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

},{"./tz":93,"dst":91}],93:[function(require,module,exports){
module.exports = {
  "+0900": [
    {
      "loc": "Asia", 
      "abbr": "JST", 
      "name": "Japan Standard Time"
    }, 
    {
      "loc": "Asia", 
      "abbr": "KST", 
      "name": "Korea Standard Time"
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
      "loc": "North America", 
      "abbr": "HST", 
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

},{}]},{},[1])
//@ sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvVXNlcnMvY2hyaXMvcGxhdGUvYnJvd3Nlci5qcyIsIi9Vc2Vycy9jaHJpcy9wbGF0ZS9saWIvYmxvY2tfY29udGV4dC5qcyIsIi9Vc2Vycy9jaHJpcy9wbGF0ZS9saWIvY29tbWVudF90b2tlbi5qcyIsIi9Vc2Vycy9jaHJpcy9wbGF0ZS9saWIvY29udGV4dC5qcyIsIi9Vc2Vycy9jaHJpcy9wbGF0ZS9saWIvZGF0ZS5qcyIsIi9Vc2Vycy9jaHJpcy9wbGF0ZS9saWIvZGVidWcuanMiLCIvVXNlcnMvY2hyaXMvcGxhdGUvbGliL2RlZmF1bHRmaWx0ZXJzLmpzIiwiL1VzZXJzL2NocmlzL3BsYXRlL2xpYi9kZWZhdWx0dGFncy5qcyIsIi9Vc2Vycy9jaHJpcy9wbGF0ZS9saWIvZmlsdGVyX2FwcGxpY2F0aW9uLmpzIiwiL1VzZXJzL2NocmlzL3BsYXRlL2xpYi9maWx0ZXJfY2hhaW4uanMiLCIvVXNlcnMvY2hyaXMvcGxhdGUvbGliL2ZpbHRlcl9sb29rdXAuanMiLCIvVXNlcnMvY2hyaXMvcGxhdGUvbGliL2ZpbHRlcl9ub2RlLmpzIiwiL1VzZXJzL2NocmlzL3BsYXRlL2xpYi9maWx0ZXJfdG9rZW4uanMiLCIvVXNlcnMvY2hyaXMvcGxhdGUvbGliL2ZpbHRlcnMvYWRkLmpzIiwiL1VzZXJzL2NocmlzL3BsYXRlL2xpYi9maWx0ZXJzL2FkZHNsYXNoZXMuanMiLCIvVXNlcnMvY2hyaXMvcGxhdGUvbGliL2ZpbHRlcnMvY2FwZmlyc3QuanMiLCIvVXNlcnMvY2hyaXMvcGxhdGUvbGliL2ZpbHRlcnMvY2VudGVyLmpzIiwiL1VzZXJzL2NocmlzL3BsYXRlL2xpYi9maWx0ZXJzL2N1dC5qcyIsIi9Vc2Vycy9jaHJpcy9wbGF0ZS9saWIvZmlsdGVycy9kYXRlLmpzIiwiL1VzZXJzL2NocmlzL3BsYXRlL2xpYi9maWx0ZXJzL2RlZmF1bHQuanMiLCIvVXNlcnMvY2hyaXMvcGxhdGUvbGliL2ZpbHRlcnMvZGljdHNvcnQuanMiLCIvVXNlcnMvY2hyaXMvcGxhdGUvbGliL2ZpbHRlcnMvZGljdHNvcnRyZXZlcnNlZC5qcyIsIi9Vc2Vycy9jaHJpcy9wbGF0ZS9saWIvZmlsdGVycy9kaXZpc2libGVieS5qcyIsIi9Vc2Vycy9jaHJpcy9wbGF0ZS9saWIvZmlsdGVycy9lc2NhcGUuanMiLCIvVXNlcnMvY2hyaXMvcGxhdGUvbGliL2ZpbHRlcnMvZmlsZXNpemVmb3JtYXQuanMiLCIvVXNlcnMvY2hyaXMvcGxhdGUvbGliL2ZpbHRlcnMvZmlyc3QuanMiLCIvVXNlcnMvY2hyaXMvcGxhdGUvbGliL2ZpbHRlcnMvZmxvYXRmb3JtYXQuanMiLCIvVXNlcnMvY2hyaXMvcGxhdGUvbGliL2ZpbHRlcnMvZm9yY2VfZXNjYXBlLmpzIiwiL1VzZXJzL2NocmlzL3BsYXRlL2xpYi9maWx0ZXJzL2dldF9kaWdpdC5qcyIsIi9Vc2Vycy9jaHJpcy9wbGF0ZS9saWIvZmlsdGVycy9pbmRleC5qcyIsIi9Vc2Vycy9jaHJpcy9wbGF0ZS9saWIvZmlsdGVycy9pcmllbmNvZGUuanMiLCIvVXNlcnMvY2hyaXMvcGxhdGUvbGliL2ZpbHRlcnMvaXRlcml0ZW1zLmpzIiwiL1VzZXJzL2NocmlzL3BsYXRlL2xpYi9maWx0ZXJzL2pvaW4uanMiLCIvVXNlcnMvY2hyaXMvcGxhdGUvbGliL2ZpbHRlcnMvbGFzdC5qcyIsIi9Vc2Vycy9jaHJpcy9wbGF0ZS9saWIvZmlsdGVycy9sZW5ndGguanMiLCIvVXNlcnMvY2hyaXMvcGxhdGUvbGliL2ZpbHRlcnMvbGVuZ3RoX2lzLmpzIiwiL1VzZXJzL2NocmlzL3BsYXRlL2xpYi9maWx0ZXJzL2xpbmVicmVha3MuanMiLCIvVXNlcnMvY2hyaXMvcGxhdGUvbGliL2ZpbHRlcnMvbGluZWJyZWFrc2JyLmpzIiwiL1VzZXJzL2NocmlzL3BsYXRlL2xpYi9maWx0ZXJzL2xpbmVudW1iZXJzLmpzIiwiL1VzZXJzL2NocmlzL3BsYXRlL2xpYi9maWx0ZXJzL2xqdXN0LmpzIiwiL1VzZXJzL2NocmlzL3BsYXRlL2xpYi9maWx0ZXJzL2xvd2VyLmpzIiwiL1VzZXJzL2NocmlzL3BsYXRlL2xpYi9maWx0ZXJzL21ha2VfbGlzdC5qcyIsIi9Vc2Vycy9jaHJpcy9wbGF0ZS9saWIvZmlsdGVycy9waG9uZTJudW1lcmljLmpzIiwiL1VzZXJzL2NocmlzL3BsYXRlL2xpYi9maWx0ZXJzL3BsdXJhbGl6ZS5qcyIsIi9Vc2Vycy9jaHJpcy9wbGF0ZS9saWIvZmlsdGVycy9yYW5kb20uanMiLCIvVXNlcnMvY2hyaXMvcGxhdGUvbGliL2ZpbHRlcnMvcmp1c3QuanMiLCIvVXNlcnMvY2hyaXMvcGxhdGUvbGliL2ZpbHRlcnMvc2FmZS5qcyIsIi9Vc2Vycy9jaHJpcy9wbGF0ZS9saWIvZmlsdGVycy9zbGljZS5qcyIsIi9Vc2Vycy9jaHJpcy9wbGF0ZS9saWIvZmlsdGVycy9zbHVnaWZ5LmpzIiwiL1VzZXJzL2NocmlzL3BsYXRlL2xpYi9maWx0ZXJzL3NwbGl0LmpzIiwiL1VzZXJzL2NocmlzL3BsYXRlL2xpYi9maWx0ZXJzL3N0cmlwdGFncy5qcyIsIi9Vc2Vycy9jaHJpcy9wbGF0ZS9saWIvZmlsdGVycy90aW1lc2luY2UuanMiLCIvVXNlcnMvY2hyaXMvcGxhdGUvbGliL2ZpbHRlcnMvdGltZXVudGlsLmpzIiwiL1VzZXJzL2NocmlzL3BsYXRlL2xpYi9maWx0ZXJzL3RpdGxlLmpzIiwiL1VzZXJzL2NocmlzL3BsYXRlL2xpYi9maWx0ZXJzL3RydW5jYXRlY2hhcnMuanMiLCIvVXNlcnMvY2hyaXMvcGxhdGUvbGliL2ZpbHRlcnMvdHJ1bmNhdGV3b3Jkcy5qcyIsIi9Vc2Vycy9jaHJpcy9wbGF0ZS9saWIvZmlsdGVycy91bm9yZGVyZWRfbGlzdC5qcyIsIi9Vc2Vycy9jaHJpcy9wbGF0ZS9saWIvZmlsdGVycy91cHBlci5qcyIsIi9Vc2Vycy9jaHJpcy9wbGF0ZS9saWIvZmlsdGVycy91cmxlbmNvZGUuanMiLCIvVXNlcnMvY2hyaXMvcGxhdGUvbGliL2ZpbHRlcnMvdXJsaXplLmpzIiwiL1VzZXJzL2NocmlzL3BsYXRlL2xpYi9maWx0ZXJzL3VybGl6ZXRydW5jLmpzIiwiL1VzZXJzL2NocmlzL3BsYXRlL2xpYi9maWx0ZXJzL3dvcmRjb3VudC5qcyIsIi9Vc2Vycy9jaHJpcy9wbGF0ZS9saWIvZmlsdGVycy93b3Jkd3JhcC5qcyIsIi9Vc2Vycy9jaHJpcy9wbGF0ZS9saWIvZmlsdGVycy95ZXNuby5qcyIsIi9Vc2Vycy9jaHJpcy9wbGF0ZS9saWIvaW5kZXguanMiLCIvVXNlcnMvY2hyaXMvcGxhdGUvbGliL2xpYnJhcmllcy5qcyIsIi9Vc2Vycy9jaHJpcy9wbGF0ZS9saWIvbGlicmFyeS5qcyIsIi9Vc2Vycy9jaHJpcy9wbGF0ZS9saWIvbWV0YS5qcyIsIi9Vc2Vycy9jaHJpcy9wbGF0ZS9saWIvbm9kZV9saXN0LmpzIiwiL1VzZXJzL2NocmlzL3BsYXRlL2xpYi9wYXJzZXIuanMiLCIvVXNlcnMvY2hyaXMvcGxhdGUvbGliL3Byb21pc2UuanMiLCIvVXNlcnMvY2hyaXMvcGxhdGUvbGliL3RhZ190b2tlbi5qcyIsIi9Vc2Vycy9jaHJpcy9wbGF0ZS9saWIvdGFncy9ibG9jay5qcyIsIi9Vc2Vycy9jaHJpcy9wbGF0ZS9saWIvdGFncy9jb21tZW50LmpzIiwiL1VzZXJzL2NocmlzL3BsYXRlL2xpYi90YWdzL2RlYnVnLmpzIiwiL1VzZXJzL2NocmlzL3BsYXRlL2xpYi90YWdzL2V4dGVuZHMuanMiLCIvVXNlcnMvY2hyaXMvcGxhdGUvbGliL3RhZ3MvZm9yLmpzIiwiL1VzZXJzL2NocmlzL3BsYXRlL2xpYi90YWdzL2lmL2VuZC5qcyIsIi9Vc2Vycy9jaHJpcy9wbGF0ZS9saWIvdGFncy9pZi9pbmZpeC5qcyIsIi9Vc2Vycy9jaHJpcy9wbGF0ZS9saWIvdGFncy9pZi9saXRlcmFsLmpzIiwiL1VzZXJzL2NocmlzL3BsYXRlL2xpYi90YWdzL2lmL25vZGUuanMiLCIvVXNlcnMvY2hyaXMvcGxhdGUvbGliL3RhZ3MvaWYvb3BlcmF0b3JzLmpzIiwiL1VzZXJzL2NocmlzL3BsYXRlL2xpYi90YWdzL2lmL3BhcnNlci5qcyIsIi9Vc2Vycy9jaHJpcy9wbGF0ZS9saWIvdGFncy9pZi9wcmVmaXguanMiLCIvVXNlcnMvY2hyaXMvcGxhdGUvbGliL3RhZ3MvaW5jbHVkZS5qcyIsIi9Vc2Vycy9jaHJpcy9wbGF0ZS9saWIvdGFncy9ub3cuanMiLCIvVXNlcnMvY2hyaXMvcGxhdGUvbGliL3RhZ3Mvd2l0aC5qcyIsIi9Vc2Vycy9jaHJpcy9wbGF0ZS9saWIvdGV4dF9ub2RlLmpzIiwiL1VzZXJzL2NocmlzL3BsYXRlL2xpYi90ZXh0X3Rva2VuLmpzIiwiL1VzZXJzL2NocmlzL3BsYXRlL2xpYi90b2tlbi5qcyIsIi9Vc2Vycy9jaHJpcy9wbGF0ZS9ub2RlX21vZHVsZXMvZHN0L2luZGV4LmpzIiwiL1VzZXJzL2NocmlzL3BsYXRlL25vZGVfbW9kdWxlcy90ei9pbmRleC5qcyIsIi9Vc2Vycy9jaHJpcy9wbGF0ZS9ub2RlX21vZHVsZXMvdHovdHouanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZaQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOURBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbEJBO0FBQ0E7QUFDQTtBQUNBOztBQ0hBO0FBQ0E7QUFDQTtBQUNBOztBQ0hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDUkE7QUFDQTtBQUNBO0FBQ0E7O0FDSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNQQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTEE7QUFDQTtBQUNBO0FBQ0E7O0FDSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDYkE7QUFDQTtBQUNBO0FBQ0E7O0FDSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNQQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNaQTs7QUNBQTtBQUNBO0FBQ0E7QUFDQTs7QUNIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1BBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ0xBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ05BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1pBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDYkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDWkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1hBO0FBQ0E7QUFDQTtBQUNBOztBQ0hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDYkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNQQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNaQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1BBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNUQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ05BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNkQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNaQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNmQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pCQTtBQUNBO0FBQ0E7QUFDQTs7QUNIQTtBQUNBO0FBQ0E7QUFDQTs7QUNIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDUkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNWQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNOQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDWEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ05BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25QQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOURBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1SUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9DQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNaQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsInNvdXJjZXNDb250ZW50IjpbInJlcXVpcmUoJ2RzdCcpXG5cbnZhciBwbGF0ZSA9IHJlcXVpcmUoJy4vbGliL2luZGV4JylcbmlmKHR5cGVvZiBkZWZpbmUgIT09ICd1bmRlZmluZWQnICYmIGRlZmluZS5hbWQpIHtcbiAgZGVmaW5lKCdwbGF0ZScsIFtdLCBmdW5jdGlvbigpIHsgcmV0dXJuIHBsYXRlIH0pXG59IGVsc2Uge1xuICB3aW5kb3cucGxhdGUgPSBwbGF0ZVxufVxuXG5wbGF0ZS5kZWJ1ZyA9IHJlcXVpcmUoJy4vbGliL2RlYnVnJylcbnBsYXRlLnV0aWxzID0gcGxhdGUuZGF0ZSA9IHJlcXVpcmUoJy4vbGliL2RhdGUnKVxucGxhdGUudXRpbHMuUHJvbWlzZSA9IHJlcXVpcmUoJy4vbGliL3Byb21pc2UnKVxucGxhdGUudXRpbHMuU2FmZVN0cmluZyA9IGZ1bmN0aW9uKHN0cikge1xuICBzdHIgPSBuZXcgU3RyaW5nKHN0cilcbiAgc3RyLnNhZmUgPSB0cnVlXG4gIHJldHVybiBzdHJcbn1cbnBsYXRlLmxpYnJhcmllcyA9IHJlcXVpcmUoJy4vbGliL2xpYnJhcmllcycpXG5cbm1vZHVsZS5leHBvcnRzID0gcGxhdGVcbiIsIm1vZHVsZS5leHBvcnRzID0gQmxvY2tDb250ZXh0XG5cbmZ1bmN0aW9uIEJsb2NrQ29udGV4dCgpIHtcbiAgdGhpcy5ibG9ja3MgPSB7fVxufVxuXG52YXIgY29ucyA9IEJsb2NrQ29udGV4dFxuICAsIHByb3RvID0gY29ucy5wcm90b3R5cGVcblxuY29ucy5LRVkgPSAnX19CTE9DS19DT05URVhUX18nXG5cbmNvbnMuZnJvbSA9IGZ1bmN0aW9uKGNvbnRleHQpIHtcbiAgcmV0dXJuIGNvbnRleHRbdGhpcy5LRVldXG59XG5cbmNvbnMuaW50byA9IGZ1bmN0aW9uKGNvbnRleHQpIHtcbiAgcmV0dXJuIGNvbnRleHRbdGhpcy5LRVldID0gbmV3IHRoaXMoKVxufVxuXG5wcm90by5hZGQgPSBmdW5jdGlvbihibG9ja3MpIHtcbiAgZm9yKHZhciBuYW1lIGluIGJsb2Nrcykge1xuICAgICh0aGlzLmJsb2Nrc1tuYW1lXSA9IHRoaXMuYmxvY2tzW25hbWVdIHx8IFtdKS51bnNoaWZ0KGJsb2Nrc1tuYW1lXSlcbiAgfVxufVxuXG5wcm90by5nZXQgPSBmdW5jdGlvbihuYW1lKSB7XG4gIHZhciBsaXN0ID0gdGhpcy5ibG9ja3NbbmFtZV0gfHwgW11cblxuICByZXR1cm4gbGlzdFtsaXN0Lmxlbmd0aCAtIDFdXG59XG5cbnByb3RvLnB1c2ggPSBmdW5jdGlvbihuYW1lLCBibG9jaykge1xuICAodGhpcy5ibG9ja3NbbmFtZV0gPSB0aGlzLmJsb2Nrc1tuYW1lXSB8fCBbXSkucHVzaChibG9jaylcbn1cblxucHJvdG8ucG9wID0gZnVuY3Rpb24obmFtZSkge1xuICByZXR1cm4gKHRoaXMuYmxvY2tzW25hbWVdID0gdGhpcy5ibG9ja3NbbmFtZV0gfHwgW10pLnBvcCgpXG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IENvbW1lbnRUb2tlblxuXG52YXIgVG9rZW4gPSByZXF1aXJlKCcuL3Rva2VuJylcblxuZnVuY3Rpb24gQ29tbWVudFRva2VuKGNvbnRlbnQsIGxpbmUpIHtcbiAgVG9rZW4uY2FsbCh0aGlzLCBjb250ZW50LCBsaW5lKVxufVxuXG52YXIgY29ucyA9IENvbW1lbnRUb2tlblxuICAsIHByb3RvID0gY29ucy5wcm90b3R5cGUgPSBuZXcgVG9rZW5cblxucHJvdG8uY29uc3RydWN0b3IgPSBjb25zXG5cbnByb3RvLm5vZGUgPSBmdW5jdGlvbihwYXJzZXIpIHtcbiAgLy8gbm8tb3BlcmF0aW9uXG4gIHJldHVybiBudWxsXG59XG5cbiIsIm1vZHVsZS5leHBvcnRzID0gQ29udGV4dFxuXG5mdW5jdGlvbiBDb250ZXh0KGZyb20pIHtcbiAgaWYoZnJvbSAmJiBmcm9tLmNvbnN0cnVjdG9yID09PSBDb250ZXh0KSB7XG4gICAgcmV0dXJuIGZyb21cbiAgfVxuXG4gIGZyb20gPSBmcm9tIHx8IHt9XG4gIGZvcih2YXIga2V5IGluIGZyb20pIGlmKGZyb20uaGFzT3duUHJvcGVydHkoa2V5KSkge1xuICAgIHRoaXNba2V5XSA9IGZyb21ba2V5XVxuICB9XG59XG5cbnZhciBjb25zID0gQ29udGV4dFxuICAsIHByb3RvID0gY29ucy5wcm90b3R5cGVcblxucHJvdG8uY29weSA9IGZ1bmN0aW9uKCkge1xuICB2YXIgRiA9IEZ1bmN0aW9uKClcbiAgRi5uYW1lID0gY29ucy5uYW1lXG4gIEYucHJvdG90eXBlID0gdGhpc1xuICByZXR1cm4gbmV3IEZcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0geyB0aW1lOiB0aW1lX2Zvcm1hdCwgZGF0ZTogZm9ybWF0LCBEYXRlRm9ybWF0OiBEYXRlRm9ybWF0IH1cblxudHJ5IHsgcmVxdWlyZSgndHonKSB9IGNhdGNoKGUpIHsgfVxuXG5mdW5jdGlvbiBjYXBmaXJzdCAoc3RyKSB7XG4gIHJldHVybiBzdHIucmVwbGFjZSgvXiguezF9KS8sIGZ1bmN0aW9uKGEsIG0pIHsgcmV0dXJuIG0udG9VcHBlckNhc2UoKSB9KVxufVxuXG5mdW5jdGlvbiBtYXAgKGFyciwgaXRlcikge1xuICB2YXIgb3V0ID0gW11cbiAgZm9yKHZhciBpID0gMCwgbGVuID0gYXJyLmxlbmd0aDsgaSA8IGxlbjsgKytpKVxuICAgIG91dC5wdXNoKGl0ZXIoYXJyW2ldLCBpLCBhcnIpKVxuICByZXR1cm4gb3V0XG59XG5cbmZ1bmN0aW9uIHJlZHVjZShhcnIsIGl0ZXIsIHN0YXJ0KSB7XG4gIGFyciA9IGFyci5zbGljZSgpXG4gIGlmKHN0YXJ0ICE9PSB1bmRlZmluZWQpXG4gICAgYXJyLnVuc2hpZnQoc3RhcnQpXG5cbiAgaWYoYXJyLmxlbmd0aCA9PT0gMClcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3JlZHVjZSBvZiBlbXB0eSBhcnJheScpXG5cbiAgaWYoYXJyLmxlbmd0aCA9PT0gMSlcbiAgICByZXR1cm4gYXJyWzBdXG5cbiAgdmFyIG91dCA9IGFyci5zbGljZSgpXG4gICAgLCBpdGVtID0gYXJyLnNoaWZ0KClcblxuICBkbyB7XG4gICAgaXRlbSA9IGl0ZXIoaXRlbSwgYXJyLnNoaWZ0KCkpXG4gIH0gd2hpbGUoYXJyLmxlbmd0aClcblxuICByZXR1cm4gaXRlbVxufVxuXG5mdW5jdGlvbiBzdHJ0b2FycmF5KHN0cikge1xuICB2YXIgYXJyID0gW11cbiAgZm9yKHZhciBpID0gMCwgbGVuID0gc3RyLmxlbmd0aDsgaSA8IGxlbjsgKytpKVxuICAgIGFyci5wdXNoKHN0ci5jaGFyQXQoaSkpXG4gIHJldHVybiBhcnJcbn1cblxudmFyIFdFRUtEQVlTID0gWyAnc3VuZGF5JywgJ21vbmRheScsICd0dWVzZGF5JywgJ3dlZG5lc2RheScsICd0aHVyc2RheScsICdmcmlkYXknLCAnc2F0dXJkYXknIF1cbiAgLCBXRUVLREFZU19BQkJSID0gbWFwKFdFRUtEQVlTLCBmdW5jdGlvbih4KSB7IHJldHVybiBzdHJ0b2FycmF5KHgpLnNsaWNlKDAsIDMpLmpvaW4oJycpIH0pXG4gICwgV0VFS0RBWVNfUkVWID0gcmVkdWNlKG1hcChXRUVLREFZUywgZnVuY3Rpb24oeCwgaSkgeyByZXR1cm4gW3gsIGldIH0pLCBmdW5jdGlvbihsaHMsIHJocykgeyBsaHNbcmhzWzBdXSA9IHJoc1sxXTsgcmV0dXJuIGxocyB9LCB7fSlcbiAgLCBNT05USFMgPSBbICdqYW51YXJ5JywgJ2ZlYnJ1YXJ5JywgJ21hcmNoJywgJ2FwcmlsJywgJ21heScsICdqdW5lJywgJ2p1bHknLCAnYXVndXN0JywgJ3NlcHRlbWJlcicsICdvY3RvYmVyJywgJ25vdmVtYmVyJywgJ2RlY2VtYmVyJyBdXG4gICwgTU9OVEhTXzMgPSBtYXAoTU9OVEhTLCBmdW5jdGlvbih4KSB7IHJldHVybiBzdHJ0b2FycmF5KHgpLnNsaWNlKDAsIDMpLmpvaW4oJycpIH0pXG4gICwgTU9OVEhTXzNfUkVWID0gcmVkdWNlKG1hcChNT05USFNfMywgZnVuY3Rpb24oeCwgaSkgeyByZXR1cm4gW3gsIGldIH0pLCBmdW5jdGlvbihsaHMsIHJocykgeyBsaHNbcmhzWzBdXSA9IHJoc1sxXTsgcmV0dXJuIGxocyB9LCB7fSlcbiAgLCBNT05USFNfQVAgPSBbXG4gICAgJ0phbi4nXG4gICwgJ0ZlYi4nXG4gICwgJ01hcmNoJ1xuICAsICdBcHJpbCdcbiAgLCAnTWF5J1xuICAsICdKdW5lJ1xuICAsICdKdWx5J1xuICAsICdBdWcuJ1xuICAsICdTZXB0LidcbiAgLCAnT2N0LidcbiAgLCAnTm92LidcbiAgLCAnRGVjLidcbiAgXVxuXG5cbnZhciBNT05USFNfQUxUID0ge1xuICAxOiAnSmFudWFyeScsXG4gIDI6ICdGZWJydWFyeScsXG4gIDM6ICdNYXJjaCcsXG4gIDQ6ICdBcHJpbCcsXG4gIDU6ICdNYXknLFxuICA2OiAnSnVuZScsXG4gIDc6ICdKdWx5JyxcbiAgODogJ0F1Z3VzdCcsXG4gIDk6ICdTZXB0ZW1iZXInLFxuICAxMDogJ09jdG9iZXInLFxuICAxMTogJ05vdmVtYmVyJyxcbiAgMTI6ICdEZWNlbWJlcidcbn1cblxuZnVuY3Rpb24gRm9ybWF0dGVyKHQpIHtcbiAgdGhpcy5kYXRhID0gdFxufVxuXG5Gb3JtYXR0ZXIucHJvdG90eXBlLmZvcm1hdCA9IGZ1bmN0aW9uKHN0cikge1xuICB2YXIgYml0cyA9IHN0cnRvYXJyYXkoc3RyKVxuICAsIGVzYyA9IGZhbHNlXG4gICwgb3V0ID0gW11cbiAgLCBiaXRcblxuICB3aGlsZShiaXRzLmxlbmd0aCkge1xuICAgIGJpdCA9IGJpdHMuc2hpZnQoKVxuXG4gICAgaWYoZXNjKSB7XG4gICAgICBvdXQucHVzaChiaXQpXG4gICAgICBlc2MgPSBmYWxzZVxuICAgIH0gZWxzZSBpZihiaXQgPT09ICdcXFxcJykge1xuICAgICAgZXNjID0gdHJ1ZVxuICAgIH0gZWxzZSBpZih0aGlzW2JpdF0pIHtcbiAgICAgIG91dC5wdXNoKHRoaXNbYml0XSgpKVxuICAgIH0gZWxzZSB7XG4gICAgICBvdXQucHVzaChiaXQpXG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIG91dC5qb2luKCcnKVxufVxuXG5mdW5jdGlvbiBUaW1lRm9ybWF0KHQpIHtcbiAgRm9ybWF0dGVyLmNhbGwodGhpcywgdClcbn1cblxudmFyIHByb3RvID0gVGltZUZvcm1hdC5wcm90b3R5cGUgPSBuZXcgRm9ybWF0dGVyKClcblxucHJvdG8uYSA9IGZ1bmN0aW9uKCkge1xuICAvLyAnYS5tLicgb3IgJ3AubS4nXG4gIGlmICh0aGlzLmRhdGEuZ2V0SG91cnMoKSA+IDExKVxuICAgIHJldHVybiAncC5tLidcbiAgcmV0dXJuICdhLm0uJ1xufVxuXG5wcm90by5BID0gZnVuY3Rpb24oKSB7XG4gIC8vICdBTScgb3IgJ1BNJ1xuICBpZiAodGhpcy5kYXRhLmdldEhvdXJzKCkgPiAxMSlcbiAgICByZXR1cm4gJ1BNJ1xuICByZXR1cm4gJ0FNJ1xufVxuXG5wcm90by5mID0gZnVuY3Rpb24oKSB7XG4gIC8qXG4gIFRpbWUsIGluIDEyLWhvdXIgaG91cnMgYW5kIG1pbnV0ZXMsIHdpdGggbWludXRlcyBsZWZ0IG9mZiBpZiB0aGV5J3JlXG4gIHplcm8uXG4gIEV4YW1wbGVzOiAnMScsICcxOjMwJywgJzI6MDUnLCAnMidcbiAgUHJvcHJpZXRhcnkgZXh0ZW5zaW9uLlxuICAqL1xuICBpZiAodGhpcy5kYXRhLmdldE1pbnV0ZXMoKSA9PSAwKVxuICAgIHJldHVybiB0aGlzLmcoKVxuICByZXR1cm4gdGhpcy5nKCkgKyBcIjpcIiArIHRoaXMuaSgpXG59XG5cbnByb3RvLmcgPSBmdW5jdGlvbigpIHtcbiAgLy8gSG91ciwgMTItaG91ciBmb3JtYXQgd2l0aG91dCBsZWFkaW5nIHplcm9zIGkuZS4gJzEnIHRvICcxMidcbiAgdmFyIGggPSB0aGlzLmRhdGEuZ2V0SG91cnMoKVxuXG4gIHJldHVybiB0aGlzLmRhdGEuZ2V0SG91cnMoKSAlIDEyIHx8IDEyXG59XG5cbnByb3RvLkcgPSBmdW5jdGlvbigpIHtcbiAgLy8gSG91ciwgMjQtaG91ciBmb3JtYXQgd2l0aG91dCBsZWFkaW5nIHplcm9zIGkuZS4gJzAnIHRvICcyMydcbiAgcmV0dXJuIHRoaXMuZGF0YS5nZXRIb3VycygpXG59XG5cbnByb3RvLmggPSBmdW5jdGlvbigpIHtcbiAgLy8gSG91ciwgMTItaG91ciBmb3JtYXQgaS5lLiAnMDEnIHRvICcxMidcbiAgcmV0dXJuICgnMCcrdGhpcy5nKCkpLnNsaWNlKC0yKVxufVxuXG5wcm90by5IID0gZnVuY3Rpb24oKSB7XG4gIC8vIEhvdXIsIDI0LWhvdXIgZm9ybWF0IGkuZS4gJzAwJyB0byAnMjMnXG4gIHJldHVybiAoJzAnK3RoaXMuRygpKS5zbGljZSgtMilcbn1cblxucHJvdG8uaSA9IGZ1bmN0aW9uKCkge1xuICAvLyBNaW51dGVzIGkuZS4gJzAwJyB0byAnNTknXG4gIHJldHVybiAoJzAnICsgdGhpcy5kYXRhLmdldE1pbnV0ZXMoKSkuc2xpY2UoLTIpXG59XG5cbnByb3RvLlAgPSBmdW5jdGlvbigpIHtcbiAgLypcbiAgVGltZSwgaW4gMTItaG91ciBob3VycywgbWludXRlcyBhbmQgJ2EubS4nLydwLm0uJywgd2l0aCBtaW51dGVzIGxlZnQgb2ZmXG4gIGlmIHRoZXkncmUgemVybyBhbmQgdGhlIHN0cmluZ3MgJ21pZG5pZ2h0JyBhbmQgJ25vb24nIGlmIGFwcHJvcHJpYXRlLlxuICBFeGFtcGxlczogJzEgYS5tLicsICcxOjMwIHAubS4nLCAnbWlkbmlnaHQnLCAnbm9vbicsICcxMjozMCBwLm0uJ1xuICBQcm9wcmlldGFyeSBleHRlbnNpb24uXG4gICovXG4gIHZhciBtID0gdGhpcy5kYXRhLmdldE1pbnV0ZXMoKVxuICAgICwgaCA9IHRoaXMuZGF0YS5nZXRIb3VycygpXG5cbiAgaWYgKG0gPT0gMCAmJiBoID09IDApXG4gICAgcmV0dXJuICdtaWRuaWdodCdcbiAgaWYgKG0gPT0gMCAmJiBoID09IDEyKVxuICAgIHJldHVybiAnbm9vbidcbiAgcmV0dXJuIHRoaXMuZigpICsgXCIgXCIgKyB0aGlzLmEoKVxufVxuXG5wcm90by5zID0gZnVuY3Rpb24oKSB7XG4gIC8vIFNlY29uZHMgaS5lLiAnMDAnIHRvICc1OSdcbiAgcmV0dXJuICgnMCcrdGhpcy5kYXRhLmdldFNlY29uZHMoKSkuc2xpY2UoLTIpXG59XG5cbnByb3RvLnUgPSBmdW5jdGlvbigpIHtcbiAgLy8gTWljcm9zZWNvbmRzXG4gIHJldHVybiB0aGlzLmRhdGEuZ2V0TWlsbGlzZWNvbmRzKClcbn1cblxuLy8gRGF0ZUZvcm1hdFxuXG5mdW5jdGlvbiBEYXRlRm9ybWF0KHQpIHtcbiAgdGhpcy5kYXRhID0gdFxuICB0aGlzLnllYXJfZGF5cyA9IFswLCAzMSwgNTksIDkwLCAxMjAsIDE1MSwgMTgxLCAyMTIsIDI0MywgMjczLCAzMDQsIDMzNF1cbn1cblxucHJvdG8gPSBEYXRlRm9ybWF0LnByb3RvdHlwZSA9IG5ldyBUaW1lRm9ybWF0KClcblxucHJvdG8uY29udHJ1Y3RvciA9IERhdGVGb3JtYXRcblxucHJvdG8uYiA9IGZ1bmN0aW9uKCkge1xuICAvLyBNb250aCwgdGV4dHVhbCwgMyBsZXR0ZXJzLCBsb3dlcmNhc2UgZS5nLiAnamFuJ1xuICByZXR1cm4gTU9OVEhTXzNbdGhpcy5kYXRhLmdldE1vbnRoKCldXG59XG5cbnByb3RvLmM9IGZ1bmN0aW9uKCkge1xuICAvKlxuICBJU08gODYwMSBGb3JtYXRcbiAgRXhhbXBsZSA6ICcyMDA4LTAxLTAyVDEwOjMwOjAwLjAwMDEyMydcbiAgKi9cbiAgcmV0dXJuIHRoaXMuZGF0YS50b0lTT1N0cmluZyA/IHRoaXMuZGF0YS50b0lTT1N0cmluZygpIDogJydcbn1cblxucHJvdG8uZCA9IGZ1bmN0aW9uKCkge1xuICAvLyBEYXkgb2YgdGhlIG1vbnRoLCAyIGRpZ2l0cyB3aXRoIGxlYWRpbmcgemVyb3MgaS5lLiAnMDEnIHRvICczMSdcbiAgcmV0dXJuICgnMCcrdGhpcy5kYXRhLmdldERhdGUoKSkuc2xpY2UoLTIpXG59XG5cbnByb3RvLkQgPSBmdW5jdGlvbigpIHtcbiAgLy8gRGF5IG9mIHRoZSB3ZWVrLCB0ZXh0dWFsLCAzIGxldHRlcnMgZS5nLiAnRnJpJ1xuICByZXR1cm4gY2FwZmlyc3QoV0VFS0RBWVNfQUJCUlt0aGlzLmRhdGEuZ2V0RGF5KCldKVxufVxuXG5wcm90by5FID0gZnVuY3Rpb24oKSB7XG4gIC8vIEFsdGVybmF0aXZlIG1vbnRoIG5hbWVzIGFzIHJlcXVpcmVkIGJ5IHNvbWUgbG9jYWxlcy4gUHJvcHJpZXRhcnkgZXh0ZW5zaW9uLlxuICByZXR1cm4gTU9OVEhTX0FMVFt0aGlzLmRhdGEuZ2V0TW9udGgoKSsxXVxufVxuXG5wcm90by5GPSBmdW5jdGlvbigpIHtcbiAgLy8gTW9udGgsIHRleHR1YWwsIGxvbmcgZS5nLiAnSmFudWFyeSdcbiAgcmV0dXJuIGNhcGZpcnN0KE1PTlRIU1t0aGlzLmRhdGEuZ2V0TW9udGgoKV0pXG59XG5cbnByb3RvLkkgPSBmdW5jdGlvbigpIHtcbiAgLy8gJzEnIGlmIERheWxpZ2h0IFNhdmluZ3MgVGltZSwgJzAnIG90aGVyd2lzZS5cbiAgcmV0dXJuIHRoaXMuZGF0YS5pc0RTVCgpID8gJzEnIDogJzAnXG59XG5cbnByb3RvLmogPSBmdW5jdGlvbigpIHtcbiAgLy8gRGF5IG9mIHRoZSBtb250aCB3aXRob3V0IGxlYWRpbmcgemVyb3MgaS5lLiAnMScgdG8gJzMxJ1xuICByZXR1cm4gdGhpcy5kYXRhLmdldERhdGUoKVxufVxuXG5wcm90by5sID0gZnVuY3Rpb24oKSB7XG4gIC8vIERheSBvZiB0aGUgd2VlaywgdGV4dHVhbCwgbG9uZyBlLmcuICdGcmlkYXknXG4gIHJldHVybiBjYXBmaXJzdChXRUVLREFZU1t0aGlzLmRhdGEuZ2V0RGF5KCldKVxufVxuXG5wcm90by5MID0gZnVuY3Rpb24oKSB7XG4gIC8vIEJvb2xlYW4gZm9yIHdoZXRoZXIgaXQgaXMgYSBsZWFwIHllYXIgaS5lLiBUcnVlIG9yIEZhbHNlXG4gIC8vIFNlbGVjdHMgdGhpcyB5ZWFyJ3MgRmVicnVhcnkgMjl0aCBhbmQgY2hlY2tzIGlmIHRoZSBtb250aFxuICAvLyBpcyBzdGlsbCBGZWJydWFyeS5cbiAgcmV0dXJuIChuZXcgRGF0ZSh0aGlzLmRhdGEuZ2V0RnVsbFllYXIoKSwgMSwgMjkpLmdldE1vbnRoKCkpID09PSAxXG59XG5cbnByb3RvLm0gPSBmdW5jdGlvbigpIHtcbiAgLy8gTW9udGggaS5lLiAnMDEnIHRvICcxMidcIlxuICByZXR1cm4gKCcwJysodGhpcy5kYXRhLmdldE1vbnRoKCkrMSkpLnNsaWNlKC0yKVxufVxuXG5wcm90by5NID0gZnVuY3Rpb24oKSB7XG4gIC8vIE1vbnRoLCB0ZXh0dWFsLCAzIGxldHRlcnMgZS5nLiAnSmFuJ1xuICByZXR1cm4gY2FwZmlyc3QoTU9OVEhTXzNbdGhpcy5kYXRhLmdldE1vbnRoKCldKVxufVxuXG5wcm90by5uID0gZnVuY3Rpb24oKSB7XG4gIC8vIE1vbnRoIHdpdGhvdXQgbGVhZGluZyB6ZXJvcyBpLmUuICcxJyB0byAnMTInXG4gIHJldHVybiB0aGlzLmRhdGEuZ2V0TW9udGgoKSArIDFcbn1cblxucHJvdG8uTiA9IGZ1bmN0aW9uKCkge1xuICAvLyBNb250aCBhYmJyZXZpYXRpb24gaW4gQXNzb2NpYXRlZCBQcmVzcyBzdHlsZS4gUHJvcHJpZXRhcnkgZXh0ZW5zaW9uLlxuICByZXR1cm4gTU9OVEhTX0FQW3RoaXMuZGF0YS5nZXRNb250aCgpXVxufVxuXG5wcm90by5PID0gZnVuY3Rpb24oKSB7XG4gIC8vIERpZmZlcmVuY2UgdG8gR3JlZW53aWNoIHRpbWUgaW4gaG91cnMgZS5nLiAnKzAyMDAnXG5cbiAgdmFyIHR6b2ZmcyA9IHRoaXMuZGF0YS5nZXRUaW1lem9uZU9mZnNldCgpXG4gICAgLCBvZmZzID0gfn4odHpvZmZzIC8gNjApXG4gICAgLCBtaW5zID0gKCcwMCcgKyB+fk1hdGguYWJzKHR6b2ZmcyAlIDYwKSkuc2xpY2UoLTIpXG4gIFxuICByZXR1cm4gKCh0em9mZnMgPiAwKSA/ICctJyA6ICcrJykgKyAoJzAwJyArIE1hdGguYWJzKG9mZnMpKS5zbGljZSgtMikgKyBtaW5zXG59XG5cbnByb3RvLnIgPSBmdW5jdGlvbigpIHtcbiAgLy8gUkZDIDI4MjIgZm9ybWF0dGVkIGRhdGUgZS5nLiAnVGh1LCAyMSBEZWMgMjAwMCAxNjowMTowNyArMDIwMCdcbiAgcmV0dXJuIHRoaXMuZm9ybWF0KCdELCBqIE0gWSBIOmk6cyBPJylcbn1cblxucHJvdG8uUyA9IGZ1bmN0aW9uKCkge1xuICAvKiBFbmdsaXNoIG9yZGluYWwgc3VmZml4IGZvciB0aGUgZGF5IG9mIHRoZSBtb250aCwgMiBjaGFyYWN0ZXJzIGkuZS4gJ3N0JywgJ25kJywgJ3JkJyBvciAndGgnICovXG4gIHZhciBkID0gdGhpcy5kYXRhLmdldERhdGUoKVxuXG4gIGlmIChkID49IDExICYmIGQgPD0gMTMpXG4gICAgcmV0dXJuICd0aCdcbiAgdmFyIGxhc3QgPSBkICUgMTBcblxuICBpZiAobGFzdCA9PSAxKVxuICAgIHJldHVybiAnc3QnXG4gIGlmIChsYXN0ID09IDIpXG4gICAgcmV0dXJuICduZCdcbiAgaWYgKGxhc3QgPT0gMylcbiAgICByZXR1cm4gJ3JkJ1xuICByZXR1cm4gJ3RoJ1xufVxuXG5wcm90by50ID0gZnVuY3Rpb24oKSB7XG4gIC8vIE51bWJlciBvZiBkYXlzIGluIHRoZSBnaXZlbiBtb250aCBpLmUuICcyOCcgdG8gJzMxJ1xuICAvLyBVc2UgYSBqYXZhc2NyaXB0IHRyaWNrIHRvIGRldGVybWluZSB0aGUgZGF5cyBpbiBhIG1vbnRoXG4gIHJldHVybiAzMiAtIG5ldyBEYXRlKHRoaXMuZGF0YS5nZXRGdWxsWWVhcigpLCB0aGlzLmRhdGEuZ2V0TW9udGgoKSwgMzIpLmdldERhdGUoKVxufVxuXG5wcm90by5UID0gZnVuY3Rpb24oKSB7XG4gIC8vIFRpbWUgem9uZSBvZiB0aGlzIG1hY2hpbmUgZS5nLiAnRVNUJyBvciAnTURUJ1xuICBpZih0aGlzLmRhdGEudHppbmZvKSB7XG4gICAgcmV0dXJuIHRoaXMuZGF0YS50emluZm8oKS5hYmJyIHx8ICc/Pz8nXG4gIH1cbiAgcmV0dXJuICc/Pz8nXG59XG5cbnByb3RvLlUgPSBmdW5jdGlvbigpIHtcbiAgLy8gU2Vjb25kcyBzaW5jZSB0aGUgVW5peCBlcG9jaCAoSmFudWFyeSAxIDE5NzAgMDA6MDA6MDAgR01UKVxuICAvLyBVVEMoKSByZXR1cm4gbWlsbGlzZWNvbmRzIGZybW8gdGhlIGVwb2NoXG4gIC8vIHJldHVybiBNYXRoLnJvdW5kKHRoaXMuZGF0YS5VVEMoKSAqIDEwMDApXG4gIHJldHVybiB+fih0aGlzLmRhdGEgLyAxMDAwKVxufVxuXG5wcm90by53ID0gZnVuY3Rpb24oKSB7XG4gIC8vIERheSBvZiB0aGUgd2VlaywgbnVtZXJpYywgaS5lLiAnMCcgKFN1bmRheSkgdG8gJzYnIChTYXR1cmRheSlcbiAgcmV0dXJuIHRoaXMuZGF0YS5nZXREYXkoKVxufVxuXG5wcm90by5XID0gZnVuY3Rpb24oKSB7XG4gIC8vIElTTy04NjAxIHdlZWsgbnVtYmVyIG9mIHllYXIsIHdlZWtzIHN0YXJ0aW5nIG9uIE1vbmRheVxuICAvLyBBbGdvcml0aG0gZnJvbSBodHRwOi8vd3d3LnBlcnNvbmFsLmVjdS5lZHUvbWNjYXJ0eXIvSVNPd2RBTEcudHh0XG4gIHZhciBqYW4xX3dlZWtkYXkgPSBuZXcgRGF0ZSh0aGlzLmRhdGEuZ2V0RnVsbFllYXIoKSwgMCwgMSkuZ2V0RGF5KCkgXG4gICAgLCB3ZWVrZGF5ID0gdGhpcy5kYXRhLmdldERheSgpXG4gICAgLCBkYXlfb2ZfeWVhciA9IHRoaXMueigpXG4gICAgLCB3ZWVrX251bWJlclxuICAgICwgaSA9IDM2NVxuXG4gIGlmKGRheV9vZl95ZWFyIDw9ICg4IC0gamFuMV93ZWVrZGF5KSAmJiBqYW4xX3dlZWtkYXkgPiA0KSB7XG4gICAgaWYoamFuMV93ZWVrZGF5ID09PSA1IHx8IChqYW4xX3dlZWtkYXkgPT09IDYgJiYgdGhpcy5MLmNhbGwoe2RhdGE6bmV3IERhdGUodGhpcy5kYXRhLmdldEZ1bGxZZWFyKCktMSwgMCwgMSl9KSkpIHtcbiAgICAgIHdlZWtfbnVtYmVyID0gNTNcbiAgICB9IGVsc2Uge1xuICAgICAgd2Vla19udW1iZXIgPSA1MlxuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBpZih0aGlzLkwoKSkge1xuICAgICAgaSA9IDM2NlxuICAgIH1cbiAgICBpZigoaSAtIGRheV9vZl95ZWFyKSA8ICg0IC0gd2Vla2RheSkpIHtcbiAgICAgIHdlZWtfbnVtYmVyID0gMVxuICAgIH0gZWxzZSB7XG4gICAgICB3ZWVrX251bWJlciA9IH5+KChkYXlfb2ZfeWVhciArICg3IC0gd2Vla2RheSkgKyAoamFuMV93ZWVrZGF5IC0gMSkpIC8gNylcbiAgICAgIGlmKGphbjFfd2Vla2RheSA+IDQpXG4gICAgICAgIHdlZWtfbnVtYmVyIC09IDFcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHdlZWtfbnVtYmVyXG59XG5cbnByb3RvLnkgPSBmdW5jdGlvbigpIHtcbiAgLy8gWWVhciwgMiBkaWdpdHMgZS5nLiAnOTknXG4gIHJldHVybiAoJycrdGhpcy5kYXRhLmdldEZ1bGxZZWFyKCkpLnNsaWNlKC0yKVxufVxuXG5wcm90by5ZID0gZnVuY3Rpb24oKSB7XG4gIC8vIFllYXIsIDQgZGlnaXRzIGUuZy4gJzE5OTknXG4gIHJldHVybiB0aGlzLmRhdGEuZ2V0RnVsbFllYXIoKVxufVxuXG5wcm90by56ID0gZnVuY3Rpb24oKSB7XG4gIC8vIERheSBvZiB0aGUgeWVhciBpLmUuICcwJyB0byAnMzY1J1xuXG4gIGRveSA9IHRoaXMueWVhcl9kYXlzW3RoaXMuZGF0YS5nZXRNb250aCgpXSArIHRoaXMuZGF0YS5nZXREYXRlKClcbiAgaWYgKHRoaXMuTCgpICYmIHRoaXMuZGF0YS5nZXRNb250aCgpID4gMSlcbiAgICBkb3kgKz0gMVxuICByZXR1cm4gZG95XG59XG5cbnByb3RvLlogPSBmdW5jdGlvbigpIHtcbiAgLypcbiAgVGltZSB6b25lIG9mZnNldCBpbiBzZWNvbmRzIChpLmUuICctNDMyMDAnIHRvICc0MzIwMCcpLiBUaGUgb2Zmc2V0IGZvclxuICB0aW1lem9uZXMgd2VzdCBvZiBVVEMgaXMgYWx3YXlzIG5lZ2F0aXZlLCBhbmQgZm9yIHRob3NlIGVhc3Qgb2YgVVRDIGlzXG4gIGFsd2F5cyBwb3NpdGl2ZS5cbiAgKi9cbiAgcmV0dXJuIHRoaXMuZGF0YS5nZXRUaW1lem9uZU9mZnNldCgpICogLTYwXG59XG5cblxuZnVuY3Rpb24gZm9ybWF0KHZhbHVlLCBmb3JtYXRfc3RyaW5nKSB7XG4gIHZhciBkZiA9IG5ldyBEYXRlRm9ybWF0KHZhbHVlKVxuICByZXR1cm4gZGYuZm9ybWF0KGZvcm1hdF9zdHJpbmcpXG59XG5cblxuZnVuY3Rpb24gdGltZV9mb3JtYXQodmFsdWUsIGZvcm1hdF9zdHJpbmcpIHtcbiAgdmFyIHRmID0gbmV3IFRpbWVGb3JtYXQodmFsdWUpXG4gIHJldHVybiB0Zi5mb3JtYXQoZm9ybWF0X3N0cmluZylcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGxvZzogZnVuY3Rpb24odmFsdWUpIHsgY29uc29sZS5sb2codmFsdWUpIH1cbiAgLCBlcnJvcjogZnVuY3Rpb24oZXJyKSB7IGNvbnNvbGUuZXJyb3IoZXJyLCBlcnIgJiYgZXJyLnN0YWNrKSB9XG4gICwgaW5mbzogZnVuY3Rpb24odmFsdWUpIHsgfSBcbn1cbiIsInZhciBMaWJyYXJ5ID0gcmVxdWlyZSgnLi9saWJyYXJ5JylcblxubW9kdWxlLmV4cG9ydHMgPSBEZWZhdWx0RmlsdGVyc1xuXG5mdW5jdGlvbiBEZWZhdWx0RmlsdGVycygpIHtcbiAgTGlicmFyeS5jYWxsKHRoaXMsIHRoaXMuYnVpbHRpbnMpXG59XG5cbnZhciBjb25zID0gRGVmYXVsdEZpbHRlcnNcbiAgLCBwcm90byA9IGNvbnMucHJvdG90eXBlID0gbmV3IExpYnJhcnlcblxucHJvdG8uY29uc3RydWN0b3IgPSBjb25zXG5cbnByb3RvLmJ1aWx0aW5zID0ge1xuICAgICdhZGQnOiByZXF1aXJlKCcuL2ZpbHRlcnMvYWRkJylcbiAgLCAnYWRkc2xhc2hlcyc6IHJlcXVpcmUoJy4vZmlsdGVycy9hZGRzbGFzaGVzJylcbiAgLCAnY2FwZmlyc3QnOiByZXF1aXJlKCcuL2ZpbHRlcnMvY2FwZmlyc3QnKVxuICAsICdjZW50ZXInOiByZXF1aXJlKCcuL2ZpbHRlcnMvY2VudGVyJylcbiAgLCAnY3V0JzogcmVxdWlyZSgnLi9maWx0ZXJzL2N1dCcpXG4gICwgJ2RhdGUnOiByZXF1aXJlKCcuL2ZpbHRlcnMvZGF0ZScpXG4gICwgJ2RlZmF1bHQnOiByZXF1aXJlKCcuL2ZpbHRlcnMvZGVmYXVsdCcpXG4gICwgJ2RpY3Rzb3J0JzogcmVxdWlyZSgnLi9maWx0ZXJzL2RpY3Rzb3J0JylcbiAgLCAnZGljdHNvcnRyZXZlcnNlZCc6IHJlcXVpcmUoJy4vZmlsdGVycy9kaWN0c29ydHJldmVyc2VkJylcbiAgLCAnZGl2aXNpYmxlYnknOiByZXF1aXJlKCcuL2ZpbHRlcnMvZGl2aXNpYmxlYnknKVxuICAsICdlc2NhcGUnOiByZXF1aXJlKCcuL2ZpbHRlcnMvZXNjYXBlJylcbiAgLCAnZmlsZXNpemVmb3JtYXQnOiByZXF1aXJlKCcuL2ZpbHRlcnMvZmlsZXNpemVmb3JtYXQnKVxuICAsICdmaXJzdCc6IHJlcXVpcmUoJy4vZmlsdGVycy9maXJzdCcpXG4gICwgJ2Zsb2F0Zm9ybWF0JzogcmVxdWlyZSgnLi9maWx0ZXJzL2Zsb2F0Zm9ybWF0JylcbiAgLCAnZm9yY2VfZXNjYXBlJzogcmVxdWlyZSgnLi9maWx0ZXJzL2ZvcmNlX2VzY2FwZScpXG4gICwgJ2dldF9kaWdpdCc6IHJlcXVpcmUoJy4vZmlsdGVycy9nZXRfZGlnaXQnKVxuICAsICdpbmRleCc6IHJlcXVpcmUoJy4vZmlsdGVycy9pbmRleCcpXG4gICwgJ2l0ZXJpdGVtcyc6IHJlcXVpcmUoJy4vZmlsdGVycy9pdGVyaXRlbXMnKVxuICAsICdpcmllbmNvZGUnOiByZXF1aXJlKCcuL2ZpbHRlcnMvaXJpZW5jb2RlJylcbiAgLCAnam9pbic6IHJlcXVpcmUoJy4vZmlsdGVycy9qb2luJylcbiAgLCAnbGFzdCc6IHJlcXVpcmUoJy4vZmlsdGVycy9sYXN0JylcbiAgLCAnbGVuZ3RoJzogcmVxdWlyZSgnLi9maWx0ZXJzL2xlbmd0aCcpXG4gICwgJ2xlbmd0aF9pcyc6IHJlcXVpcmUoJy4vZmlsdGVycy9sZW5ndGhfaXMnKVxuICAsICdsaW5lYnJlYWtzJzogcmVxdWlyZSgnLi9maWx0ZXJzL2xpbmVicmVha3MnKVxuICAsICdsaW5lYnJlYWtzYnInOiByZXF1aXJlKCcuL2ZpbHRlcnMvbGluZWJyZWFrc2JyJylcbiAgLCAnbGluZW51bWJlcnMnOiByZXF1aXJlKCcuL2ZpbHRlcnMvbGluZW51bWJlcnMnKVxuICAsICdsanVzdCc6IHJlcXVpcmUoJy4vZmlsdGVycy9sanVzdCcpXG4gICwgJ2xvd2VyJzogcmVxdWlyZSgnLi9maWx0ZXJzL2xvd2VyJylcbiAgLCAnbWFrZV9saXN0JzogcmVxdWlyZSgnLi9maWx0ZXJzL21ha2VfbGlzdCcpXG4gICwgJ3Bob25lMm51bWVyaWMnOiByZXF1aXJlKCcuL2ZpbHRlcnMvcGhvbmUybnVtZXJpYycpXG4gICwgJ3BsdXJhbGl6ZSc6IHJlcXVpcmUoJy4vZmlsdGVycy9wbHVyYWxpemUnKVxuICAsICdyYW5kb20nOiByZXF1aXJlKCcuL2ZpbHRlcnMvcmFuZG9tJylcbiAgLCAncmp1c3QnOiByZXF1aXJlKCcuL2ZpbHRlcnMvcmp1c3QnKVxuICAsICdzYWZlJzogcmVxdWlyZSgnLi9maWx0ZXJzL3NhZmUnKVxuICAsICdzbGljZSc6IHJlcXVpcmUoJy4vZmlsdGVycy9zbGljZScpXG4gICwgJ3NsdWdpZnknOiByZXF1aXJlKCcuL2ZpbHRlcnMvc2x1Z2lmeScpXG4gICwgJ3NwbGl0JzogcmVxdWlyZSgnLi9maWx0ZXJzL3NwbGl0JylcbiAgLCAnc3RyaXB0YWdzJzogcmVxdWlyZSgnLi9maWx0ZXJzL3N0cmlwdGFncycpXG4gICwgJ3RpbWVzaW5jZSc6IHJlcXVpcmUoJy4vZmlsdGVycy90aW1lc2luY2UnKVxuICAsICd0aW1ldW50aWwnOiByZXF1aXJlKCcuL2ZpbHRlcnMvdGltZXVudGlsJylcbiAgLCAndGl0bGUnOiByZXF1aXJlKCcuL2ZpbHRlcnMvdGl0bGUnKVxuICAsICd0cnVuY2F0ZWNoYXJzJzogcmVxdWlyZSgnLi9maWx0ZXJzL3RydW5jYXRlY2hhcnMnKVxuICAsICd0cnVuY2F0ZXdvcmRzJzogcmVxdWlyZSgnLi9maWx0ZXJzL3RydW5jYXRld29yZHMnKVxuICAsICd1bm9yZGVyZWRfbGlzdCc6IHJlcXVpcmUoJy4vZmlsdGVycy91bm9yZGVyZWRfbGlzdCcpXG4gICwgJ3VwcGVyJzogcmVxdWlyZSgnLi9maWx0ZXJzL3VwcGVyJylcbiAgLCAndXJsZW5jb2RlJzogcmVxdWlyZSgnLi9maWx0ZXJzL3VybGVuY29kZScpXG4gICwgJ3VybGl6ZSc6IHJlcXVpcmUoJy4vZmlsdGVycy91cmxpemUnKVxuICAsICd1cmxpemV0cnVuYyc6IHJlcXVpcmUoJy4vZmlsdGVycy91cmxpemV0cnVuYycpXG4gICwgJ3dvcmRjb3VudCc6IHJlcXVpcmUoJy4vZmlsdGVycy93b3JkY291bnQnKVxuICAsICd3b3Jkd3JhcCc6IHJlcXVpcmUoJy4vZmlsdGVycy93b3Jkd3JhcCcpXG4gICwgJ3llc25vJzogcmVxdWlyZSgnLi9maWx0ZXJzL3llc25vJylcbn1cblxuIiwidmFyIExpYnJhcnkgPSByZXF1aXJlKCcuL2xpYnJhcnknKVxuXG5tb2R1bGUuZXhwb3J0cyA9IERlZmF1bHRUYWdzXG5cbmZ1bmN0aW9uIERlZmF1bHRUYWdzKCkge1xuICBMaWJyYXJ5LmNhbGwodGhpcywgdGhpcy5idWlsdGlucylcbn1cblxudmFyIGNvbnMgPSBEZWZhdWx0VGFnc1xuICAsIHByb3RvID0gY29ucy5wcm90b3R5cGUgPSBuZXcgTGlicmFyeVxuXG5wcm90by5jb25zdHJ1Y3RvciA9IGNvbnNcblxucHJvdG8uYnVpbHRpbnMgPSB7XG4gICAgJ2Jsb2NrJzogcmVxdWlyZSgnLi90YWdzL2Jsb2NrJykucGFyc2VcbiAgLCAnY29tbWVudCc6IHJlcXVpcmUoJy4vdGFncy9jb21tZW50JykucGFyc2VcbiAgLCAnZGVidWcnOiByZXF1aXJlKCcuL3RhZ3MvZGVidWcnKS5wYXJzZVxuICAsICdleHRlbmRzJzogcmVxdWlyZSgnLi90YWdzL2V4dGVuZHMnKS5wYXJzZVxuICAsICdmb3InOiByZXF1aXJlKCcuL3RhZ3MvZm9yJykucGFyc2VcbiAgLCAnaWYnOiByZXF1aXJlKCcuL3RhZ3MvaWYvbm9kZScpLnBhcnNlXG4gICwgJ2luY2x1ZGUnOiByZXF1aXJlKCcuL3RhZ3MvaW5jbHVkZScpLnBhcnNlXG4gICwgJ25vdyc6IHJlcXVpcmUoJy4vdGFncy9ub3cnKS5wYXJzZVxuICAsICd3aXRoJzogcmVxdWlyZSgnLi90YWdzL3dpdGgnKS5wYXJzZVxufVxuIiwibW9kdWxlLmV4cG9ydHMgPSBGaWx0ZXJBcHBsaWNhdGlvblxuXG52YXIgUHJvbWlzZSA9IHJlcXVpcmUoJy4vcHJvbWlzZScpXG5cbmZ1bmN0aW9uIEZpbHRlckFwcGxpY2F0aW9uKG5hbWUsIGJpdHMpIHtcbiAgdGhpcy5uYW1lID0gbmFtZVxuICB0aGlzLmFyZ3MgPSBiaXRzXG4gIHRoaXMuZmlsdGVyID0gbnVsbFxufVxuXG52YXIgY29ucyA9IEZpbHRlckFwcGxpY2F0aW9uXG4gICwgcHJvdG8gPSBjb25zLnByb3RvdHlwZVxuXG5wcm90by5hdHRhY2ggPSBmdW5jdGlvbihwYXJzZXIpIHtcbiAgdGhpcy5maWx0ZXIgPSBwYXJzZXIuZmlsdGVycy5sb29rdXAodGhpcy5uYW1lKVxufVxuXG5wcm90by5yZXNvbHZlID0gZnVuY3Rpb24oY29udGV4dCwgdmFsdWUsIGZyb21JRFgsIGFyZ1ZhbHVlcykge1xuICB2YXIgc2VsZiA9IHRoaXNcbiAgICAsIHByb21pc2VcbiAgICAsIHN0YXJ0ID0gZnJvbUlEWCB8fCAwXG4gICAgLCByZXN1bHRcbiAgICAsIHRtcFxuXG4gIGFyZ1ZhbHVlcyA9IGFyZ1ZhbHVlcyB8fCBbXVxuXG4gIGlmKHZhbHVlID09PSB1bmRlZmluZWQpIHtcbiAgICByZXR1cm5cbiAgfVxuXG4gIGlmKHZhbHVlICYmIHZhbHVlLmNvbnN0cnVjdG9yID09PSBQcm9taXNlKSB7XG4gICAgcHJvbWlzZSA9IG5ldyBQcm9taXNlXG4gICAgdmFsdWUub25jZSgnZG9uZScsIGZ1bmN0aW9uKHZhbCkge1xuICAgICAgcHJvbWlzZS5yZXNvbHZlKHNlbGYucmVzb2x2ZShjb250ZXh0LCB2YWwpKVxuICAgIH0pXG5cbiAgICAvLyBzdGFydCBvdmVyIG9uY2Ugd2UndmUgcmVzb2x2ZWQgdGhlIGJhc2UgdmFsdWVcbiAgICByZXR1cm4gcHJvbWlzZVxuICB9XG5cbiAgZm9yKHZhciBpID0gc3RhcnQsIGxlbiA9IHNlbGYuYXJncy5sZW5ndGg7IGkgPCBsZW47ICsraSkge1xuICAgIHZhciBhcmdWYWx1ZSA9IHNlbGYuYXJnc1tpXS5yZXNvbHZlID8gXG4gICAgICAgIHNlbGYuYXJnc1tpXS5yZXNvbHZlKGNvbnRleHQpIDpcbiAgICAgICAgc2VsZi5hcmdzW2ldXG5cbiAgICBpZihhcmdWYWx1ZSA9PT0gdW5kZWZpbmVkIHx8IGFyZ1ZhbHVlID09PSBudWxsKSB7XG4gICAgICBhcmdWYWx1ZXNbaV0gPSBhcmdWYWx1ZVxuICAgICAgY29udGludWVcbiAgICB9XG5cbiAgICBpZihhcmdWYWx1ZS5jb25zdHJ1Y3RvciA9PT0gUHJvbWlzZSkge1xuICAgICAgcHJvbWlzZSA9IG5ldyBQcm9taXNlXG5cbiAgICAgIGFyZ1ZhbHVlLm9uY2UoJ2RvbmUnLCBmdW5jdGlvbih2YWwpIHtcbiAgICAgICAgYXJnVmFsdWVzW2ldID0gdmFsXG4gICAgICAgIHByb21pc2UucmVzb2x2ZShzZWxmLnJlc29sdmUoIFxuICAgICAgICAgICAgY29udGV4dFxuICAgICAgICAgICwgdmFsdWVcbiAgICAgICAgICAsIGlcbiAgICAgICAgICAsIGFyZ1ZhbHVlc1xuICAgICAgICApKVxuICAgICAgfSlcblxuICAgICAgcmV0dXJuIHByb21pc2VcbiAgICB9XG5cbiAgICBhcmdWYWx1ZXNbaV0gPSBhcmdWYWx1ZVxuICB9XG5cbiAgcHJvbWlzZSA9IG5ldyBQcm9taXNlXG4gIHRtcCA9IHNlbGYuZmlsdGVyLmFwcGx5KG51bGwsIFt2YWx1ZV0uY29uY2F0KGFyZ1ZhbHVlcykuY29uY2F0KFtyZWFkeV0pKVxuXG4gIGlmKHRtcCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgcmVzdWx0ID0gdG1wXG4gIH1cblxuICBpZihyZXN1bHQgPT09IHVuZGVmaW5lZCkge1xuICAgIHJldHVybiBwcm9taXNlXG4gIH1cblxuICByZXR1cm4gcmVzdWx0XG5cbiAgZnVuY3Rpb24gcmVhZHkoZXJyLCBkYXRhKSB7XG4gICAgaWYocHJvbWlzZS50cmlnZ2VyKSBcbiAgICAgIHJldHVybiBwcm9taXNlLnJlc29sdmUoZXJyID8gZXJyIDogZGF0YSlcblxuICAgIHJlc3VsdCA9IGRhdGFcbiAgfVxufVxuIiwibW9kdWxlLmV4cG9ydHMgPSBGaWx0ZXJDaGFpblxuXG5mdW5jdGlvbiBGaWx0ZXJDaGFpbihiaXRzKSB7XG4gIHRoaXMuYml0cyA9IGJpdHNcbn1cblxudmFyIGNvbnMgPSBGaWx0ZXJDaGFpblxuICAsIHByb3RvID0gY29ucy5wcm90b3R5cGVcblxucHJvdG8uYXR0YWNoID0gZnVuY3Rpb24ocGFyc2VyKSB7XG4gIGZvcih2YXIgaSA9IDAsIGxlbiA9IHRoaXMuYml0cy5sZW5ndGg7IGkgPCBsZW47ICsraSkge1xuICAgIGlmKHRoaXMuYml0c1tpXSAmJiB0aGlzLmJpdHNbaV0uYXR0YWNoKSB7IFxuICAgICAgdGhpcy5iaXRzW2ldLmF0dGFjaChwYXJzZXIpXG4gICAgfVxuICB9XG59XG5cbnByb3RvLnJlc29sdmUgPSBmdW5jdGlvbihjb250ZXh0KSB7XG4gIHZhciByZXN1bHQgPSB0aGlzLmJpdHNbMF0ucmVzb2x2ZSA/XG4gICAgICB0aGlzLmJpdHNbMF0ucmVzb2x2ZShjb250ZXh0KSA6XG4gICAgICB0aGlzLmJpdHNbMF1cblxuICBmb3IodmFyIGkgPSAxLCBsZW4gPSB0aGlzLmJpdHMubGVuZ3RoOyBpIDwgbGVuOyArK2kpIHtcbiAgICByZXN1bHQgPSB0aGlzLmJpdHNbaV0ucmVzb2x2ZShjb250ZXh0LCByZXN1bHQpXG4gIH1cblxuICByZXR1cm4gcmVzdWx0XG59XG5cbiIsIm1vZHVsZS5leHBvcnRzID0gRmlsdGVyTG9va3VwXG5cbnZhciBQcm9taXNlID0gcmVxdWlyZSgnLi9wcm9taXNlJylcblxuZnVuY3Rpb24gRmlsdGVyTG9va3VwKGJpdHMpIHtcbiAgdGhpcy5iaXRzID0gYml0c1xufVxuXG52YXIgY29ucyA9IEZpbHRlckxvb2t1cFxuICAsIHByb3RvID0gY29ucy5wcm90b3R5cGVcblxucHJvdG8ucmVzb2x2ZSA9IGZ1bmN0aW9uKGNvbnRleHQsIGZyb21JRFgpIHtcbiAgZnJvbUlEWCA9IGZyb21JRFggfHwgMFxuXG4gIHZhciBzZWxmID0gdGhpc1xuICAgICwgYml0cyA9IHNlbGYuYml0c1xuICAgICwgY3VycmVudCA9IGNvbnRleHRcbiAgICAsIHRlbXBvcmFyeSA9IG51bGxcbiAgICAsIHByb21pc2VcbiAgICAsIHJlc3VsdFxuICAgICwgbmV4dFxuXG4gIGZvcih2YXIgaSA9IGZyb21JRFgsIGxlbiA9IGJpdHMubGVuZ3RoOyBpIDwgbGVuOyArK2kpIHtcbiAgICBpZihjdXJyZW50ID09PSB1bmRlZmluZWQgfHwgY3VycmVudCA9PT0gbnVsbCkge1xuICAgICAgYnJlYWtcbiAgICB9XG5cbiAgICAvLyBmaXggZm9yIElFOlxuICAgIGlmKGJpdHNbaV0gPT09ICdzdXBlcicpIHtcbiAgICAgIGJpdHNbaV0gPSAnX3N1cGVyJ1xuICAgIH1cblxuICAgIG5leHQgPSBjdXJyZW50W2JpdHNbaV1dXG5cbiAgICAvLyBjb3VsZCBiZSBhc3luYywgY291bGQgYmUgc3luYy5cbiAgICBpZih0eXBlb2YgbmV4dCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgcHJvbWlzZSA9IG5ldyBQcm9taXNlXG5cbiAgICAgIHByb21pc2Uub25jZSgnZG9uZScsIGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgdGVtcG9yYXJ5ID0gZGF0YVxuICAgICAgfSlcblxuICAgICAgY3VycmVudCA9IG5leHQuY2FsbChjdXJyZW50LCBmdW5jdGlvbihlcnIsIGRhdGEpIHtcbiAgICAgICAgcHJvbWlzZS5yZXNvbHZlKGVyciA/IG51bGwgOiBzZWxmLnJlc29sdmUoZGF0YSwgaSsxKSlcbiAgICAgIH0pXG5cbiAgICAgIGlmKHRlbXBvcmFyeSAhPT0gbnVsbClcbiAgICAgICAgY3VycmVudCA9IHRlbXBvcmFyeVxuXG4gICAgICBwcm9taXNlLnRyaWdnZXIgPSB0ZW1wb3JhcnkgPSBudWxsXG5cbiAgICAgIGlmKGN1cnJlbnQgPT09IHVuZGVmaW5lZClcbiAgICAgICAgcmV0dXJuIHByb21pc2VcblxuICAgIH0gZWxzZSB7XG4gICAgICBjdXJyZW50ID0gbmV4dFxuICAgIH1cblxuICB9IFxuXG4gIHJldHVybiBjdXJyZW50XG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IEZpbHRlck5vZGVcblxudmFyIFByb21pc2UgPSByZXF1aXJlKCcuL3Byb21pc2UnKVxuICAsIGRlYnVnID0gcmVxdWlyZSgnLi9kZWJ1ZycpXG5cbmZ1bmN0aW9uIEZpbHRlck5vZGUoZmlsdGVyKSB7XG4gIHRoaXMuZmlsdGVyID0gZmlsdGVyXG59XG5cbnZhciBjb25zID0gRmlsdGVyTm9kZVxuICAsIHByb3RvID0gY29ucy5wcm90b3R5cGVcblxuY29ucy5lc2NhcGUgPSBlc2NhcGVIVE1MXG5cbnByb3RvLnJlbmRlciA9IHNhZmVseShmdW5jdGlvbihjb250ZXh0KSB7XG4gIHZhciBzZWxmID0gdGhpc1xuICAgICwgcmVzdWx0ID0gc2VsZi5maWx0ZXIucmVzb2x2ZShjb250ZXh0KVxuICAgICwgcHJvbWlzZVxuXG4gIGlmKHJlc3VsdCA9PT0gdW5kZWZpbmVkKVxuICAgIHJldHVybiAnJ1xuXG4gIGlmKHJlc3VsdCAmJiByZXN1bHQuY29uc3RydWN0b3IgPT09IFByb21pc2UpIHtcbiAgICBwcm9taXNlID0gbmV3IFByb21pc2VcblxuICAgIHJlc3VsdC5vbmNlKCdkb25lJywgZnVuY3Rpb24ocmVzdWx0KSB7XG4gICAgICBwcm9taXNlLnJlc29sdmUoc2VsZi5mb3JtYXQocmVzdWx0KSlcbiAgICB9KVxuXG4gICAgcmV0dXJuIHByb21pc2VcbiAgfVxuXG4gIHJldHVybiBzZWxmLmZvcm1hdChyZXN1bHQpXG59KVxuXG5wcm90by5mb3JtYXQgPSBmdW5jdGlvbihyZXN1bHQpIHtcbiAgaWYocmVzdWx0ICYmIHJlc3VsdC5zYWZlKSB7XG4gICAgcmV0dXJuIHJlc3VsdC50b1N0cmluZygpXG4gIH1cblxuICBpZihyZXN1bHQgPT09IG51bGwgfHwgcmVzdWx0ID09PSB1bmRlZmluZWQpXG4gICAgcmV0dXJuICcnXG5cbiAgcmV0dXJuIGVzY2FwZUhUTUwocmVzdWx0KycnKVxufVxuXG5mdW5jdGlvbiBzYWZlbHkoZm4pIHtcbiAgcmV0dXJuIGZ1bmN0aW9uKGNvbnRleHQpIHtcbiAgICB0cnkge1xuICAgICAgcmV0dXJuIGZuLmNhbGwodGhpcywgY29udGV4dClcbiAgICB9IGNhdGNoKGVycikge1xuICAgICAgZGVidWcuaW5mbyhlcnIpIFxuICAgICAgcmV0dXJuICcnXG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIGVzY2FwZUhUTUwoc3RyKSB7XG4gIHJldHVybiBzdHJcbiAgICAucmVwbGFjZSgvXFwmL2csICcmYW1wOycpXG4gICAgLnJlcGxhY2UoLzwvZywgJyZsdDsnKVxuICAgIC5yZXBsYWNlKC8+L2csICcmZ3Q7JylcbiAgICAucmVwbGFjZSgvXCIvZywgJyZxdW90OycpXG4gICAgLnJlcGxhY2UoLycvZywgJyYjMzk7Jylcbn1cbiIsInZhciBUb2tlbiA9IHJlcXVpcmUoJy4vdG9rZW4nKVxuICAsIEZpbHRlck5vZGUgPSByZXF1aXJlKCcuL2ZpbHRlcl9ub2RlJylcblxubW9kdWxlLmV4cG9ydHMgPSBGaWx0ZXJUb2tlblxuXG5mdW5jdGlvbiBGaWx0ZXJUb2tlbihjb250ZW50LCBsaW5lKSB7XG4gIFRva2VuLmNhbGwodGhpcywgY29udGVudCwgbGluZSlcbn1cblxudmFyIGNvbnMgPSBGaWx0ZXJUb2tlblxuICAsIHByb3RvID0gY29ucy5wcm90b3R5cGUgPSBuZXcgVG9rZW5cblxucHJvdG8uY29uc3RydWN0b3IgPSBjb25zXG5cbnByb3RvLm5vZGUgPSBmdW5jdGlvbihwYXJzZXIpIHtcbiAgcmV0dXJuIG5ldyBGaWx0ZXJOb2RlKHBhcnNlci5jb21waWxlKHRoaXMuY29udGVudCkpXG59XG5cbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oaW5wdXQsIHZhbHVlKSB7XG4gIHJldHVybiBwYXJzZUludChpbnB1dCwgMTApICsgcGFyc2VJbnQodmFsdWUsIDEwKVxufVxuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihpbnB1dCkge1xuICByZXR1cm4gaW5wdXQudG9TdHJpbmcoKS5yZXBsYWNlKC8nL2csIFwiXFxcXCdcIilcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oaW5wdXQpIHtcbiAgdmFyIHN0ciA9IGlucHV0LnRvU3RyaW5nKCk7XG4gIHJldHVybiBbc3RyLnNsaWNlKDAsMSkudG9VcHBlckNhc2UoKSwgc3RyLnNsaWNlKDEpXS5qb2luKCcnKVxufVxuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihpbnB1dCwgbGVuLCByZWFkeSkge1xuICBpZihyZWFkeSA9PT0gdW5kZWZpbmVkKVxuICAgIGxlbiA9IDBcblxuICB2YXIgc3RyID0gaW5wdXQudG9TdHJpbmcoKVxuICAgICwgdmFsdWUgPSAnICdcblxuICBsZW4gLT0gc3RyLmxlbmd0aFxuICBpZihsZW4gPCAwKSB7IFxuICAgIHJldHVybiBzdHJcbiAgfVxuXG4gIHZhciBsZW5faGFsZiA9IGxlbi8yLjBcbiAgICAsIGFyciA9IFtdXG4gICAgLCBpZHggPSBNYXRoLmZsb29yKGxlbl9oYWxmKVxuXG4gIHdoaWxlKGlkeC0tID4gMCkge1xuICAgIGFyci5wdXNoKHZhbHVlKVxuICB9XG5cbiAgYXJyID0gYXJyLmpvaW4oJycpXG4gIHN0ciA9IGFyciArIHN0ciArIGFyclxuICBpZigobGVuX2hhbGYgLSBNYXRoLmZsb29yKGxlbl9oYWxmKSkgPiAwKSB7XG4gICAgc3RyID0gaW5wdXQudG9TdHJpbmcoKS5sZW5ndGggJSAyID09IDAgPyB2YWx1ZSArIHN0ciA6IHN0ciArIHZhbHVlXG4gIH1cbiAgXG4gIHJldHVybiBzdHJcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oaW5wdXQsIHZhbHVlKSB7XG4gIHZhciBzdHIgPSBpbnB1dC50b1N0cmluZygpXG4gIHJldHVybiBzdHIucmVwbGFjZShuZXcgUmVnRXhwKHZhbHVlLCBcImdcIiksICcnKVxufVxuIiwidmFyIGZvcm1hdCA9IHJlcXVpcmUoJy4uL2RhdGUnKS5kYXRlXG4gIFxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihpbnB1dCwgdmFsdWUsIHJlYWR5KSB7XG4gIGlmIChyZWFkeSA9PT0gdW5kZWZpbmVkKVxuICAgIHZhbHVlID0gJ04gaiwgWSdcblxuICByZXR1cm4gZm9ybWF0KGlucHV0LmdldEZ1bGxZZWFyID8gaW5wdXQgOiBuZXcgRGF0ZShpbnB1dCksIHZhbHVlKVxufVxuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihpbnB1dCwgZGVmLCByZWFkeSkge1xuICByZXR1cm4gaW5wdXQgPyBpbnB1dCA6IGRlZlxufVxuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihpbnB1dCwga2V5KSB7XG4gIHJldHVybiBpbnB1dC5zb3J0KGZ1bmN0aW9uKHgsIHkpIHtcbiAgICBpZih4W2tleV0gPiB5W2tleV0pIHJldHVybiAxXG4gICAgaWYoeFtrZXldID09IHlba2V5XSkgcmV0dXJuIDBcbiAgICBpZih4W2tleV0gPCB5W2tleV0pIHJldHVybiAtMVxuICB9KVxufVxuIiwidmFyIGRpY3Rzb3J0ID0gcmVxdWlyZSgnLi9kaWN0c29ydCcpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGlucHV0LCBrZXkpIHtcbiAgcmV0dXJuIGRpY3Rzb3J0KGlucHV0LCBrZXkpLnJldmVyc2UoKVxufVxuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihpbnB1dCwgbnVtKSB7XG4gIHJldHVybiBpbnB1dCAlIHBhcnNlSW50KG51bSwgMTApID09IDBcbn1cbiIsInZhciBGaWx0ZXJOb2RlID0gcmVxdWlyZSgnLi4vZmlsdGVyX25vZGUnKVxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGlucHV0KSB7XG4gIGlmKGlucHV0ICYmIGlucHV0LnNhZmUpIHtcbiAgICByZXR1cm4gaW5wdXRcbiAgfVxuXG4gIGlucHV0ID0gbmV3IFN0cmluZyhGaWx0ZXJOb2RlLmVzY2FwZShpbnB1dCkpXG4gIGlucHV0LnNhZmUgPSB0cnVlXG4gIHJldHVybiBpbnB1dFxufVxuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihpbnB1dCkge1xuICB2YXIgbnVtID0gKG5ldyBOdW1iZXIoaW5wdXQpKS52YWx1ZU9mKClcbiAgICAsIHNpbmd1bGFyID0gbnVtID09IDEgPyAnJyA6ICdzJ1xuICAgICwgdmFsdWUgXG4gICAgXG4gIHZhbHVlID1cbiAgICBudW0gPCAxMDI0ID8gbnVtICsgJyBieXRlJytzaW5ndWxhciA6XG4gICAgbnVtIDwgKDEwMjQqMTAyNCkgPyAobnVtLzEwMjQpKycgS0InIDpcbiAgICBudW0gPCAoMTAyNCoxMDI0KjEwMjQpID8gKG51bSAvICgxMDI0KjEwMjQpKSArICcgTUInIDpcbiAgICBudW0gLyAoMTAyNCoxMDI0KjEwMjQpICsgJyBHQidcblxuICByZXR1cm4gdmFsdWVcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oaW5wdXQpIHtcbiAgcmV0dXJuIGlucHV0WzBdXG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGlucHV0LCB2YWwpIHtcbiAgdmFsID0gcGFyc2VJbnQodmFsLCAxMClcbiAgdmFsID0gaXNOYU4odmFsKSA/IC0xIDogdmFsXG5cbiAgdmFyIGlzUG9zaXRpdmUgPSB2YWwgPj0gMFxuICAgICwgYXNOdW1iZXIgPSBwYXJzZUZsb2F0KGlucHV0KVxuICAgICwgYWJzVmFsdWUgPSBNYXRoLmFicyh2YWwpXG4gICAgLCBwb3cgPSBNYXRoLnBvdygxMCwgYWJzVmFsdWUpXG4gICAgLCBwb3dfbWludXNfb25lID0gTWF0aC5wb3coMTAsIE1hdGgubWF4KGFic1ZhbHVlLTEsIDApKVxuICAgICwgYXNTdHJpbmdcblxuICBhc051bWJlciA9IE1hdGgucm91bmQoKHBvdyAqIGFzTnVtYmVyKSAvIHBvd19taW51c19vbmUpXG5cbiAgaWYodmFsICE9PSAwKVxuICAgIGFzTnVtYmVyIC89IDEwXG5cbiAgYXNTdHJpbmcgPSBhc051bWJlci50b1N0cmluZygpXG5cbiAgaWYoaXNQb3NpdGl2ZSkge1xuICAgIHZhciBzcGxpdCA9IGFzU3RyaW5nLnNwbGl0KCcuJylcbiAgICAgICwgZGVjaW1hbCA9IHNwbGl0Lmxlbmd0aCA+IDEgPyBzcGxpdFsxXSA6ICcnXG5cbiAgICB3aGlsZShkZWNpbWFsLmxlbmd0aCA8IHZhbCkge1xuICAgICAgZGVjaW1hbCArPSAnMCdcbiAgICB9XG5cbiAgICBhc1N0cmluZyA9IGRlY2ltYWwubGVuZ3RoID8gW3NwbGl0WzBdLCBkZWNpbWFsXS5qb2luKCcuJykgOiBzcGxpdFswXVxuICB9XG5cbiAgcmV0dXJuIGFzU3RyaW5nXG59XG4iLCJ2YXIgRmlsdGVyTm9kZSA9IHJlcXVpcmUoJy4uL2ZpbHRlcl9ub2RlJylcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihpbnB1dCkge1xuICB2YXIgeCA9IG5ldyBTdHJpbmcoRmlsdGVyTm9kZS5lc2NhcGUoaW5wdXQrJycpKVxuICB4LnNhZmUgPSB0cnVlXG4gIHJldHVybiB4XG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGlucHV0LCBkaWdpdCkge1xuICB2YXIgaXNOdW0gPSAhaXNOYU4ocGFyc2VJbnQoaW5wdXQsIDEwKSlcbiAgICAsIHN0ciA9IGlucHV0LnRvU3RyaW5nKClcbiAgICAsIGxlbiA9IHN0ci5zcGxpdCgnJykubGVuZ3RoXG5cbiAgZGlnaXQgPSBwYXJzZUludChkaWdpdCwgMTApXG4gIGlmKGlzTnVtICYmICFpc05hTihkaWdpdCkgJiYgZGlnaXQgPD0gbGVuKSB7XG4gICAgcmV0dXJuIHN0ci5jaGFyQXQobGVuIC0gZGlnaXQpXG4gIH1cblxuICByZXR1cm4gaW5wdXRcbn1cbiIsbnVsbCwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihpbnB1dCkge1xuICByZXR1cm4gaW5wdXRcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oaW5wdXQpIHtcbiAgdmFyIG91dHB1dCA9IFtdXG4gIGZvcih2YXIgbmFtZSBpbiBpbnB1dCkgaWYoaW5wdXQuaGFzT3duUHJvcGVydHkobmFtZSkpIHtcbiAgICBvdXRwdXQucHVzaChbbmFtZSwgaW5wdXRbbmFtZV1dKVxuICB9XG4gIHJldHVybiBvdXRwdXRcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oaW5wdXQsIGdsdWUpIHtcbiAgaW5wdXQgPSBpbnB1dCBpbnN0YW5jZW9mIEFycmF5ID8gaW5wdXQgOiBpbnB1dC50b1N0cmluZygpLnNwbGl0KCcnKVxuICByZXR1cm4gaW5wdXQuam9pbihnbHVlKVxufVxuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihpbnB1dCkge1xuICB2YXIgY2IgPSBpbnB1dC5jaGFyQXQgfHwgZnVuY3Rpb24oaW5kKSB7IHJldHVybiBpbnB1dFtpbmRdOyB9XG5cbiAgcmV0dXJuIGNiLmNhbGwoaW5wdXQsIGlucHV0Lmxlbmd0aC0xKTtcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oaW5wdXQsIHJlYWR5KSB7XG4gIGlmKGlucHV0ICYmIHR5cGVvZiBpbnB1dC5sZW5ndGggPT09ICdmdW5jdGlvbicpIHtcbiAgICByZXR1cm4gaW5wdXQubGVuZ3RoKHJlYWR5KVxuICB9XG4gIHJldHVybiBpbnB1dC5sZW5ndGhcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oaW5wdXQsIGV4cGVjdGVkLCByZWFkeSkge1xuICB2YXIgdG1wXG4gIGlmKGlucHV0ICYmIHR5cGVvZiBpbnB1dC5sZW5ndGggPT09ICdmdW5jdGlvbicpIHtcbiAgICB0bXAgPSBpbnB1dC5sZW5ndGgoZnVuY3Rpb24oZXJyLCBsZW4pIHtcbiAgICAgIHJlYWR5KGVyciwgZXJyID8gbnVsbCA6IGxlbiA9PT0gZXhwZWN0ZWQpXG4gICAgfSlcblxuICAgIHJldHVybiB0bXAgPT09IHVuZGVmaW5lZCA/IHVuZGVmaW5lZCA6IHRtcCA9PT0gZXhwZWN0ZWRcbiAgfVxuXG4gIHJldHVybiBpbnB1dC5sZW5ndGggPT09IGV4cGVjdGVkXG59XG4iLCJ2YXIgc2FmZSA9IHJlcXVpcmUoJy4vc2FmZScpXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oaW5wdXQpIHtcbiAgdmFyIHN0ciA9IGlucHV0LnRvU3RyaW5nKClcbiAgICAsIHBhcmFzID0gc3RyLnNwbGl0KCdcXG5cXG4nKVxuICAgICwgb3V0ID0gW11cblxuICB3aGlsZShwYXJhcy5sZW5ndGgpIHtcbiAgICBvdXQudW5zaGlmdChwYXJhcy5wb3AoKS5yZXBsYWNlKC9cXG4vZywgJzxiciAvPicpKVxuICB9XG5cbiAgcmV0dXJuIHNhZmUoJzxwPicrb3V0LmpvaW4oJzwvcD48cD4nKSsnPC9wPicpXG59XG4iLCJ2YXIgc2FmZSA9IHJlcXVpcmUoJy4vc2FmZScpXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oaW5wdXQpIHtcbiAgdmFyIHN0ciA9IGlucHV0LnRvU3RyaW5nKClcbiAgcmV0dXJuIHNhZmUoc3RyLnJlcGxhY2UoL1xcbi9nLCAnPGJyIC8+JykpXG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGlucHV0KSB7XG4gIHZhciBzdHIgPSBpbnB1dC50b1N0cmluZygpXG4gICAgLCBiaXRzID0gc3RyLnNwbGl0KCdcXG4nKVxuICAgICwgb3V0ID0gW11cbiAgICAsIGxlbiA9IGJpdHMubGVuZ3RoXG5cbiAgd2hpbGUoYml0cy5sZW5ndGgpIHtcbiAgICBvdXQudW5zaGlmdChsZW4gLSBvdXQubGVuZ3RoICsgJy4gJyArIGJpdHMucG9wKCkpXG4gIH1cblxuICByZXR1cm4gb3V0LmpvaW4oJ1xcbicpXG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGlucHV0LCBudW0pIHtcbiAgdmFyIGJpdHMgPSAoaW5wdXQgPT09IG51bGwgfHwgaW5wdXQgPT09IHVuZGVmaW5lZCA/ICcnIDogaW5wdXQpLnRvU3RyaW5nKCkuc3BsaXQoJycpXG4gICAgLCBkaWZmZXJlbmNlID0gbnVtIC0gYml0cy5sZW5ndGhcblxuICAvLyBwdXNoIHJldHVybnMgbmV3IGxlbmd0aCBvZiBhcnJheS5cbiAgd2hpbGUoZGlmZmVyZW5jZSA+IDApIHtcbiAgICBkaWZmZXJlbmNlID0gbnVtIC0gYml0cy5wdXNoKCcgJylcbiAgfVxuXG4gIHJldHVybiBiaXRzLmpvaW4oJycpXG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGlucHV0KSB7XG4gIHJldHVybiBpbnB1dC50b1N0cmluZygpLnRvTG93ZXJDYXNlKClcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oaW5wdXQpIHtcbiAgaW5wdXQgPSBpbnB1dCBpbnN0YW5jZW9mIEFycmF5ID8gaW5wdXQgOiBpbnB1dC50b1N0cmluZygpLnNwbGl0KCcnKVxuXG4gIHJldHVybiBpbnB1dFxufVxuIiwiXG52YXIgTEVUVEVSUyA9IHtcbidhJzogJzInLCAnYic6ICcyJywgJ2MnOiAnMicsICdkJzogJzMnLCAnZSc6ICczJyxcbidmJzogJzMnLCAnZyc6ICc0JywgJ2gnOiAnNCcsICdpJzogJzQnLCAnaic6ICc1JywgJ2snOiAnNScsICdsJzogJzUnLFxuJ20nOiAnNicsICduJzogJzYnLCAnbyc6ICc2JywgJ3AnOiAnNycsICdxJzogJzcnLCAncic6ICc3JywgJ3MnOiAnNycsXG4ndCc6ICc4JywgJ3UnOiAnOCcsICd2JzogJzgnLCAndyc6ICc5JywgJ3gnOiAnOScsICd5JzogJzknLCAneic6ICc5J1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihpbnB1dCkge1xuICB2YXIgc3RyID0gaW5wdXQudG9TdHJpbmcoKS50b0xvd2VyQ2FzZSgpLnNwbGl0KCcnKVxuICAgICwgb3V0ID0gW11cbiAgICAsIGx0clxuXG4gIHdoaWxlKHN0ci5sZW5ndGgpIHtcbiAgICBsdHIgPSBzdHIucG9wKClcbiAgICBvdXQudW5zaGlmdChMRVRURVJTW2x0cl0gPyBMRVRURVJTW2x0cl0gOiBsdHIpXG4gIH1cblxuICByZXR1cm4gb3V0LmpvaW4oJycpXG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGlucHV0LCBwbHVyYWwpIHtcbiAgcGx1cmFsID0gKHR5cGVvZiBwbHVyYWwgPT09ICdzdHJpbmcnID8gcGx1cmFsIDogJ3MnKS5zcGxpdCgnLCcpXG5cbiAgdmFyIHZhbCA9IE51bWJlcihpbnB1dClcbiAgICAsIHN1ZmZpeFxuXG4gIHN1ZmZpeCA9IHBsdXJhbFtwbHVyYWwubGVuZ3RoLTFdO1xuICBpZih2YWwgPT09IDEpIHtcbiAgICBzdWZmaXggPSBwbHVyYWwubGVuZ3RoID4gMSA/IHBsdXJhbFswXSA6ICcnOyAgICBcbiAgfVxuXG4gIHJldHVybiBzdWZmaXhcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oaW5wdXQpIHtcbiAgdmFyIGNiID0gaW5wdXQuY2hhckF0IHx8IGZ1bmN0aW9uKGlkeCkge1xuICAgIHJldHVybiB0aGlzW2lkeF07XG4gIH07XG5cbiAgcmV0dXJuIGNiLmNhbGwoaW5wdXQsIE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIGlucHV0Lmxlbmd0aCkpXG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGlucHV0LCBudW0pIHtcbiAgdmFyIGJpdHMgPSAoaW5wdXQgPT09IG51bGwgfHwgaW5wdXQgPT09IHVuZGVmaW5lZCA/ICcnIDogaW5wdXQpLnRvU3RyaW5nKCkuc3BsaXQoJycpXG4gICAgLCBkaWZmZXJlbmNlID0gbnVtIC0gYml0cy5sZW5ndGhcblxuICAvLyBwdXNoIHJldHVybnMgbmV3IGxlbmd0aCBvZiBhcnJheS5cbiAgLy8gTkI6IFtdLnVuc2hpZnQgcmV0dXJucyBgdW5kZWZpbmVkYCBpbiBJRTw5LlxuICB3aGlsZShkaWZmZXJlbmNlID4gMCkge1xuICAgIGRpZmZlcmVuY2UgPSAoYml0cy51bnNoaWZ0KCcgJyksIG51bSAtIGJpdHMubGVuZ3RoKVxuICB9XG5cbiAgcmV0dXJuIGJpdHMuam9pbignJylcbn1cbiIsInZhciBGaWx0ZXJOb2RlID0gcmVxdWlyZSgnLi4vZmlsdGVyX25vZGUnKVxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGlucHV0KSB7XG4gIGlucHV0ID0gbmV3IFN0cmluZyhpbnB1dClcbiAgaW5wdXQuc2FmZSA9IHRydWVcbiAgcmV0dXJuIGlucHV0XG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGlucHV0LCBieSkge1xuICBieSA9IGJ5LnRvU3RyaW5nKClcbiAgaWYoYnkuY2hhckF0KDApID09PSAnOicpIHtcbiAgICBieSA9ICcwJytieVxuICB9XG5cbiAgaWYoYnkuY2hhckF0KGJ5Lmxlbmd0aC0xKSA9PT0gJzonKSB7XG4gICAgYnkgPSBieS5zbGljZSgwLCAtMSlcbiAgfVxuXG4gIHZhciBzcGxpdEJ5ID0gYnkuc3BsaXQoJzonKVxuICAgICwgc2xpY2UgPSBpbnB1dC5zbGljZSB8fCAoZnVuY3Rpb24oKSB7XG4gICAgICAgIGlucHV0ID0gdGhpcy50b1N0cmluZygpXG4gICAgICAgIHJldHVybiBpbnB1dC5zbGljZVxuICAgICAgfSkoKVxuXG4gIHJldHVybiBzbGljZS5hcHBseShpbnB1dCwgc3BsaXRCeSlcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oaW5wdXQpIHtcbiAgaW5wdXQgPSBpbnB1dC50b1N0cmluZygpXG4gIHJldHVybiBpbnB1dFxuICAgICAgICAucmVwbGFjZSgvW15cXHdcXHNcXGRcXC1dL2csICcnKVxuICAgICAgICAucmVwbGFjZSgvXlxccyovLCAnJylcbiAgICAgICAgLnJlcGxhY2UoL1xccyokLywgJycpXG4gICAgICAgIC5yZXBsYWNlKC9bXFwtXFxzXSsvZywgJy0nKVxuICAgICAgICAudG9Mb3dlckNhc2UoKVxufVxuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihpbnB1dCwgYnksIHJlYWR5KSB7XG4gIGJ5ID0gYXJndW1lbnRzLmxlbmd0aCA9PT0gMiA/ICcsJyA6IGJ5XG4gIGlucHV0ID0gJycraW5wdXRcbiAgcmV0dXJuIGlucHV0LnNwbGl0KGJ5KVxufVxuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihpbnB1dCkge1xuICB2YXIgc3RyID0gaW5wdXQudG9TdHJpbmcoKVxuICByZXR1cm4gc3RyLnJlcGxhY2UoLzxbXj5dKj8+L2csICcnKVxufVxuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihpbnB1dCwgbiwgcmVhZHkpIHtcbiAgdmFyIGlucHV0ID0gbmV3IERhdGUoaW5wdXQpXG4gICAgLCBub3cgICA9IHJlYWR5ID09PSB1bmRlZmluZWQgPyBuZXcgRGF0ZSgpIDogbmV3IERhdGUobilcbiAgICAsIGRpZmYgID0gaW5wdXQgLSBub3dcbiAgICAsIHNpbmNlID0gTWF0aC5hYnMoZGlmZilcblxuICBpZihkaWZmID4gMClcbiAgICByZXR1cm4gJzAgbWludXRlcydcblxuICAvLyAzNjUuMjUgKiAyNCAqIDYwICogNjAgKiAxMDAwID09PSB5ZWFyc1xuICB2YXIgeWVhcnMgPSAgIH5+KHNpbmNlIC8gMzE1NTc2MDAwMDApXG4gICAgLCBtb250aHMgPSAgfn4oKHNpbmNlIC0gKHllYXJzKjMxNTU3NjAwMDAwKSkgLyAyNTkyMDAwMDAwKVxuICAgICwgZGF5cyA9ICAgIH5+KChzaW5jZSAtICh5ZWFycyAqIDMxNTU3NjAwMDAwICsgbW9udGhzICogMjU5MjAwMDAwMCkpIC8gODY0MDAwMDApXG4gICAgLCBob3VycyA9ICAgfn4oKHNpbmNlIC0gKHllYXJzICogMzE1NTc2MDAwMDAgKyBtb250aHMgKiAyNTkyMDAwMDAwICsgZGF5cyAqIDg2NDAwMDAwKSkgLyAzNjAwMDAwKVxuICAgICwgbWludXRlcyA9IH5+KChzaW5jZSAtICh5ZWFycyAqIDMxNTU3NjAwMDAwICsgbW9udGhzICogMjU5MjAwMDAwMCArIGRheXMgKiA4NjQwMDAwMCArIGhvdXJzICogMzYwMDAwMCkpIC8gNjAwMDApXG4gICAgLCByZXN1bHQgPSBbXG4gICAgICAgIHllYXJzICAgPyBwbHVyYWxpemUoeWVhcnMsICAgICd5ZWFyJykgOiBudWxsXG4gICAgICAsIG1vbnRocyAgPyBwbHVyYWxpemUobW9udGhzLCAgICdtb250aCcpIDogbnVsbFxuICAgICAgLCBkYXlzICAgID8gcGx1cmFsaXplKGRheXMsICAgICAnZGF5JykgOiBudWxsXG4gICAgICAsIGhvdXJzICAgPyBwbHVyYWxpemUoaG91cnMsICAgICdob3VyJykgOiBudWxsXG4gICAgICAsIG1pbnV0ZXMgPyBwbHVyYWxpemUobWludXRlcywgICdtaW51dGUnKSA6IG51bGxcbiAgICBdXG4gICAgLCBvdXQgPSBbXVxuXG4gIGZvcih2YXIgaSA9IDAsIGxlbiA9IHJlc3VsdC5sZW5ndGg7IGkgPCBsZW47ICsraSkge1xuICAgIHJlc3VsdFtpXSAhPT0gbnVsbCAmJiBvdXQucHVzaChyZXN1bHRbaV0pXG4gIH1cblxuICBpZighb3V0Lmxlbmd0aCkge1xuICAgIHJldHVybiAnMCBtaW51dGVzJ1xuICB9XG5cbiAgcmV0dXJuIG91dFswXSArIChvdXRbMV0gPyAnLCAnICsgb3V0WzFdIDogJycpXG5cbiAgZnVuY3Rpb24gcGx1cmFsaXplKHgsIHN0cikge1xuICAgIHJldHVybiB4ICsgJyAnICsgc3RyICsgKHggPT09IDEgPyAnJyA6ICdzJylcbiAgfVxufVxuIiwidmFyIHRpbWVzaW5jZSA9IHJlcXVpcmUoJy4vdGltZXNpbmNlJykudGltZXNpbmNlXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oaW5wdXQsIG4pIHtcbiAgdmFyIG5vdyA9IG4gPyBuZXcgRGF0ZShuKSA6IG5ldyBEYXRlKClcbiAgcmV0dXJuIHRpbWVzaW5jZShub3csIGlucHV0KVxufVxuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihpbnB1dCkge1xuICB2YXIgc3RyID0gaW5wdXQudG9TdHJpbmcoKVxuICAgICwgYml0cyA9IHN0ci5zcGxpdCgvXFxzezF9L2cpXG4gICAgLCBvdXQgPSBbXVxuICBcbiAgd2hpbGUoYml0cy5sZW5ndGgpIHtcbiAgICB2YXIgd29yZCA9IGJpdHMuc2hpZnQoKVxuICAgIHdvcmQgPSB3b3JkLmNoYXJBdCgwKS50b1VwcGVyQ2FzZSgpICsgd29yZC5zbGljZSgxKVxuICAgIG91dC5wdXNoKHdvcmQpXG4gIH1cblxuICBvdXQgPSBvdXQuam9pbignICcpXG4gIHJldHVybiBvdXQucmVwbGFjZSgvKFthLXpdKScoW0EtWl0pL2csIGZ1bmN0aW9uKGEsIG0sIHgpIHsgcmV0dXJuIHgudG9Mb3dlckNhc2UoKSB9KVxufVxuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihpbnB1dCwgbikge1xuICB2YXIgc3RyID0gaW5wdXQudG9TdHJpbmcoKVxuICAgICwgbnVtID0gcGFyc2VJbnQobiwgMTApXG5cbiAgaWYoaXNOYU4obnVtKSlcbiAgICByZXR1cm4gaW5wdXRcblxuICBpZihpbnB1dC5sZW5ndGggPD0gbnVtKVxuICAgIHJldHVybiBpbnB1dFxuXG4gIHJldHVybiBpbnB1dC5zbGljZSgwLCBudW0pKycuLi4nXG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGlucHV0LCBuKSB7XG4gIHZhciBzdHIgPSBpbnB1dC50b1N0cmluZygpXG4gICAgLCBudW0gPSBwYXJzZUludChuLCAxMClcbiAgICAsIHdvcmRzXG5cbiAgaWYoaXNOYU4obnVtKSlcbiAgICByZXR1cm4gaW5wdXRcblxuICB3b3JkcyA9IGlucHV0LnNwbGl0KC9cXHMrLylcblxuICBpZih3b3Jkcy5sZW5ndGggPD0gbnVtKVxuICAgIHJldHVybiBpbnB1dFxuXG4gIHJldHVybiB3b3Jkcy5zbGljZSgwLCBudW0pLmpvaW4oJyAnKSsnLi4uJ1xufVxuIiwidmFyIHNhZmUgPSByZXF1aXJlKCcuL3NhZmUnKTtcblxudmFyIHVscGFyc2VyID0gZnVuY3Rpb24obGlzdCkge1xuICB2YXIgb3V0ID0gW11cbiAgICAsIGwgPSBsaXN0LnNsaWNlKClcbiAgICAsIGl0ZW1cblxuICB3aGlsZShsLmxlbmd0aCkge1xuICAgIGl0ZW0gPSBsLnBvcCgpXG5cbiAgICBpZihpdGVtIGluc3RhbmNlb2YgQXJyYXkpXG4gICAgICBvdXQudW5zaGlmdCgnPHVsPicrdWxwYXJzZXIoaXRlbSkrJzwvdWw+JylcbiAgICBlbHNlXG4gICAgICBvdXQudW5zaGlmdCgnPC9saT48bGk+JytpdGVtKVxuICB9XG5cbiAgLy8gZ2V0IHJpZCBvZiB0aGUgbGVhZGluZyA8L2xpPiwgaWYgYW55LiBhZGQgdHJhaWxpbmcgPC9saT4uXG4gIHJldHVybiBvdXQuam9pbignJykucmVwbGFjZSgvXjxcXC9saT4vLCAnJykgKyAnPC9saT4nXG59XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oaW5wdXQpIHtcbiAgcmV0dXJuIGlucHV0IGluc3RhbmNlb2YgQXJyYXkgP1xuICAgIHNhZmUodWxwYXJzZXIoaW5wdXQpKSA6XG4gICAgaW5wdXRcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oaW5wdXQpIHtcbiAgcmV0dXJuIGlucHV0LnRvU3RyaW5nKCkudG9VcHBlckNhc2UoKVxufVxuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihpbnB1dCkge1xuICByZXR1cm4gZXNjYXBlKGlucHV0LnRvU3RyaW5nKCkpXG59XG4iLCJ2YXIgc2FmZSA9IHJlcXVpcmUoJy4vc2FmZScpXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oaW5wdXQpIHtcbiAgdmFyIHN0ciA9IGlucHV0LnRvU3RyaW5nKClcbiAgcmV0dXJuIHNhZmUoc3RyLnJlcGxhY2UoLygoKGh0dHAocyk/OlxcL1xcLyl8KG1haWx0bzopKShbXFx3XFxkXFwtXFwuOkBcXC9dKSspL2csIGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiAnPGEgaHJlZj1cIicrYXJndW1lbnRzWzBdKydcIj4nK2FyZ3VtZW50c1swXSsnPC9hPic7IFxuICB9KSlcbn1cbiIsInZhciBzYWZlID0gcmVxdWlyZSgnLi9zYWZlJylcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihpbnB1dCwgbGVuKSB7XG4gIHZhciBzdHIgPSBpbnB1dC50b1N0cmluZygpXG4gIGxlbiA9IHBhcnNlSW50KGxlbiwgMTApIHx8IDEwMDBcbiAgcmV0dXJuIHNhZmUoc3RyLnJlcGxhY2UoLygoKGh0dHAocyk/OlxcL1xcLyl8KG1haWx0bzopKShbXFx3XFxkXFwtXFwuOkBdKSspL2csIGZ1bmN0aW9uKCkge1xuICAgIHZhciBsdHIgPSBhcmd1bWVudHNbMF0ubGVuZ3RoID4gbGVuID8gYXJndW1lbnRzWzBdLnNsaWNlKDAsIGxlbikgKyAnLi4uJyA6IGFyZ3VtZW50c1swXTtcbiAgICByZXR1cm4gJzxhIGhyZWY9XCInK2FyZ3VtZW50c1swXSsnXCI+JytsdHIrJzwvYT4nOyBcbiAgfSkpXG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGlucHV0KSB7XG4gIHZhciBzdHIgPSBpbnB1dC50b1N0cmluZygpXG4gICAgLCBiaXRzID0gc3RyLnNwbGl0KC9cXHMrL2cpXG5cbiAgcmV0dXJuIGJpdHMubGVuZ3RoXG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGlucHV0LCBsZW4pIHtcbiAgdmFyIHdvcmRzID0gaW5wdXQudG9TdHJpbmcoKS5zcGxpdCgvXFxzKy9nKVxuICAgICwgb3V0ID0gW11cbiAgICAsIGxlbiA9IHBhcnNlSW50KGxlbiwgMTApIHx8IHdvcmRzLmxlbmd0aFxuXG4gIHdoaWxlKHdvcmRzLmxlbmd0aCkge1xuICAgIG91dC51bnNoaWZ0KHdvcmRzLnNwbGljZSgwLCBsZW4pLmpvaW4oJyAnKSlcbiAgfVxuXG4gIHJldHVybiBvdXQuam9pbignXFxuJylcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oaW5wdXQsIG1hcCkge1xuICB2YXIgb3VyTWFwID0gbWFwLnRvU3RyaW5nKCkuc3BsaXQoJywnKVxuICAgICwgdmFsdWVcblxuICBvdXJNYXAubGVuZ3RoIDwgMyAmJiBvdXJNYXAucHVzaChvdXJNYXBbMV0pXG5cbiAgdmFsdWUgPSBvdXJNYXBbXG4gICAgaW5wdXQgPyAwIDpcbiAgICBpbnB1dCA9PT0gZmFsc2UgPyAxIDpcbiAgICAyXG4gIF1cblxuICByZXR1cm4gdmFsdWVcbn1cbiIsIihmdW5jdGlvbihnbG9iYWwpe3ZhciBGaWx0ZXJUb2tlbiA9IHJlcXVpcmUoJy4vZmlsdGVyX3Rva2VuJylcbiAgLCBUYWdUb2tlbiA9IHJlcXVpcmUoJy4vdGFnX3Rva2VuJylcbiAgLCBDb21tZW50VG9rZW4gPSByZXF1aXJlKCcuL2NvbW1lbnRfdG9rZW4nKVxuICAsIFRleHRUb2tlbiA9IHJlcXVpcmUoJy4vdGV4dF90b2tlbicpIFxuICAsIGxpYnJhcmllcyA9IHJlcXVpcmUoJy4vbGlicmFyaWVzJylcbiAgLCBQYXJzZXIgPSByZXF1aXJlKCcuL3BhcnNlcicpXG4gICwgQ29udGV4dCA9IHJlcXVpcmUoJy4vY29udGV4dCcpXG4gICwgTWV0YSA9IHJlcXVpcmUoJy4vbWV0YScpXG4gICwgUHJvbWlzZSA9IHJlcXVpcmUoJy4vcHJvbWlzZScpXG5cbm1vZHVsZS5leHBvcnRzID0gVGVtcGxhdGVcblxuLy8gY2lyY3VsYXIgYWxpYXMgdG8gc3VwcG9ydCBvbGRcbi8vIHZlcnNpb25zIG9mIHBsYXRlLlxuVGVtcGxhdGUuVGVtcGxhdGUgPSBUZW1wbGF0ZVxuVGVtcGxhdGUuQ29udGV4dCA9IENvbnRleHRcblxudmFyIGxhdGVyID0gdHlwZW9mIGdsb2JhbCAhPT0gJ3VuZGVmaW5lZCcgPyBcbiAgICBmdW5jdGlvbihmbikgeyBnbG9iYWwuc2V0VGltZW91dChmbiwgMCkgfSA6XG4gICAgZnVuY3Rpb24oZm4pIHsgdGhpcy5zZXRUaW1lb3V0KGZuLCAwKSB9XG5cbmZ1bmN0aW9uIFRlbXBsYXRlKHJhdywgbGlicmFyaWVzLCBwYXJzZXIpIHtcbiAgaWYodHlwZW9mIHJhdyAhPT0gJ3N0cmluZycpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdpbnB1dCBzaG91bGQgYmUgYSBzdHJpbmcnKVxuICB9XG5cbiAgdGhpcy5yYXcgPSByYXdcblxuICBsaWJyYXJpZXMgPSBsaWJyYXJpZXMgfHwge31cblxuICB0aGlzLnRhZ0xpYnJhcnkgPVxuICAgIGxpYnJhcmllcy50YWdfbGlicmFyeSB8fCBUZW1wbGF0ZS5NZXRhLmNyZWF0ZVRhZ0xpYnJhcnkoKVxuXG4gIHRoaXMuZmlsdGVyTGlicmFyeSA9IFxuICAgIGxpYnJhcmllcy5maWx0ZXJfbGlicmFyeSB8fCBUZW1wbGF0ZS5NZXRhLmNyZWF0ZUZpbHRlckxpYnJhcnkoKVxuXG4gIHRoaXMucGx1Z2luTGlicmFyeSA9IFxuICAgIGxpYnJhcmllcy5wbHVnaW5fbGlicmFyeSB8fCBUZW1wbGF0ZS5NZXRhLmNyZWF0ZVBsdWdpbkxpYnJhcnkoKVxuXG4gIHRoaXMucGFyc2VyID0gcGFyc2VyIHx8IFBhcnNlclxuXG4gIHRoaXMudG9rZW5zID0gbnVsbFxufVxuXG52YXIgY29ucyA9IFRlbXBsYXRlXG4gICwgcHJvdG8gPSBjb25zLnByb3RvdHlwZVxuICAsIG1ldGEgPSBjb25zLk1ldGEgPSBuZXcgTWV0YVxuXG5jb25zLmNyZWF0ZVBsdWdpbkxpYnJhcnkgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIG5ldyBsaWJyYXJpZXMuRGVmYXVsdFBsdWdpbkxpYnJhcnkoKVxufVxuXG5wcm90by5nZXROb2RlTGlzdCA9IGZ1bmN0aW9uKCkge1xuICB0aGlzLm5vZGVsaXN0ID0gdGhpcy5ub2RlbGlzdCB8fCB0aGlzLnBhcnNlKClcblxuICByZXR1cm4gdGhpcy5ub2RlbGlzdFxufVxuXG5wcm90by5wYXJzZSA9IGZ1bmN0aW9uKCkge1xuICB2YXIgcGFyc2VyXG5cbiAgdGhpcy50b2tlbnMgPSB0aGlzLnRva2VucyB8fCBjb25zLnRva2VuaXplKHRoaXMucmF3KVxuXG4gIHBhcnNlciA9IG5ldyB0aGlzLnBhcnNlcihcbiAgICAgIHRoaXMudG9rZW5zXG4gICAgLCB0aGlzLnRhZ0xpYnJhcnlcbiAgICAsIHRoaXMuZmlsdGVyTGlicmFyeVxuICAgICwgdGhpcy5wbHVnaW5MaWJyYXJ5XG4gICAgLCB0aGlzXG4gIClcblxuICByZXR1cm4gcGFyc2VyLnBhcnNlKClcbn1cblxucHJvdG8ucmVuZGVyID0gcHJvdGVjdChmdW5jdGlvbihjb250ZXh0LCByZWFkeSkge1xuICBjb250ZXh0ID0gbmV3IENvbnRleHQoY29udGV4dClcblxuICB2YXIgcmVzdWx0XG5cbiAgcmVzdWx0ID0gXG4gIHRoaXNcbiAgICAuZ2V0Tm9kZUxpc3QoKVxuICAgIC5yZW5kZXIoY29udGV4dClcblxuICBpZihyZXN1bHQuY29uc3RydWN0b3IgPT09IFByb21pc2UpIHtcbiAgICByZXN1bHQub25jZSgnZG9uZScsIGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgIHJlYWR5KG51bGwsIGRhdGEpXG4gICAgfSlcbiAgfSBlbHNlIHtcbiAgICBsYXRlcihmdW5jdGlvbigpIHtcbiAgICAgIHJlYWR5KG51bGwsIHJlc3VsdClcbiAgICB9LCAwKVxuICB9XG5cbn0pXG5cbmZ1bmN0aW9uIHByb3RlY3QoZm4pIHtcbiAgcmV0dXJuIGZ1bmN0aW9uKGNvbnRleHQsIHJlYWR5KSB7XG4gICAgaWYoIWNvbnRleHQgfHwgIXJlYWR5KSB7XG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKClcbiAgICB9XG5cbiAgICB0cnkge1xuICAgICAgcmV0dXJuIGZuLmNhbGwodGhpcywgY29udGV4dCwgcmVhZHkpXG4gICAgfSBjYXRjaChlKSB7XG4gICAgICBsYXRlcihmdW5jdGlvbigpIHtcbiAgICAgICAgcmVhZHkoZSwgbnVsbClcbiAgICAgIH0sIDApXG4gICAgfVxuICB9XG59XG5cbmNvbnMuTUFUQ0hfUkUgPSAvXFx7WyUjXFx7XSguKj8pW1xcfSMlXVxcfS9cblxuY29ucy50b2tlbml6ZSA9IGZ1bmN0aW9uKGNvbnRlbnQpIHtcbiAgdmFyIG1hdGNoID0gbnVsbFxuICAgICwgdG9rZW5zID0gW11cbiAgICAsIGxpbmVObyA9IDFcbiAgICAsIGluY0xpbmVObyA9IGZ1bmN0aW9uKHN0cikgeyBsaW5lTm8gKz0gc3RyLnNwbGl0KCdcXG4nKS5sZW5ndGggfVxuICAgICwgbWFwID0ge1xuICAgICAgICAgICclJzogVGFnVG9rZW5cbiAgICAgICAgLCAnIyc6IENvbW1lbnRUb2tlblxuICAgICAgICAsICd7JzogRmlsdGVyVG9rZW5cbiAgICAgIH1cbiAgICAsIHJleCA9IHRoaXMuTUFUQ0hfUkVcbiAgICAsIGxpdGVyYWxcblxuICBkbyB7XG4gICAgbWF0Y2ggPSByZXguZXhlYyhjb250ZW50KVxuICAgIGlmKCFtYXRjaClcbiAgICAgIGNvbnRpbnVlXG5cbiAgICBsaXRlcmFsID0gY29udGVudC5zbGljZSgwLCBtYXRjaC5pbmRleClcbiAgICBpbmNMaW5lTm8obGl0ZXJhbClcbiAgICBpZihtYXRjaC5pbmRleClcbiAgICAgIHRva2Vucy5wdXNoKG5ldyBUZXh0VG9rZW4obGl0ZXJhbC5zbGljZSgwLCBtYXRjaC5pbmRleCwgbGluZU5vKSkpXG5cbiAgICBtYXRjaFsxXSA9IG1hdGNoWzFdXG4gICAgICAucmVwbGFjZSgvXlxccysvLCAnJylcbiAgICAgIC5yZXBsYWNlKC9cXHMrJC8sICcnKVxuXG4gICAgdG9rZW5zLnB1c2gobmV3IG1hcFttYXRjaFswXS5jaGFyQXQoMSldKG1hdGNoWzFdLCBsaW5lTm8pKVxuXG4gICAgY29udGVudCA9IGNvbnRlbnQuc2xpY2UobWF0Y2guaW5kZXggKyBtYXRjaFswXS5sZW5ndGgpXG4gIH0gd2hpbGUoY29udGVudC5sZW5ndGggJiYgbWF0Y2gpXG5cbiAgdG9rZW5zLnB1c2gobmV3IFRleHRUb2tlbihjb250ZW50KSlcblxuICByZXR1cm4gdG9rZW5zXG59XG5cbn0pKHNlbGYpIiwibW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgTGlicmFyeTogcmVxdWlyZSgnLi9saWJyYXJ5JylcbiAgLCBEZWZhdWx0UGx1Z2luTGlicmFyeTogcmVxdWlyZSgnLi9saWJyYXJ5JylcbiAgLCBEZWZhdWx0VGFnTGlicmFyeTogcmVxdWlyZSgnLi9kZWZhdWx0dGFncycpXG4gICwgRGVmYXVsdEZpbHRlckxpYnJhcnk6IHJlcXVpcmUoJy4vZGVmYXVsdGZpbHRlcnMnKVxufSBcbiIsIm1vZHVsZS5leHBvcnRzID0gTGlicmFyeVxuXG52YXIgUHJvbWlzZSA9IHJlcXVpcmUoJy4vcHJvbWlzZScpXG5cbmZ1bmN0aW9uIExpYnJhcnkobGliKSB7XG4gIHRoaXMucmVnaXN0cnkgPSBsaWIgfHwge31cbn1cblxudmFyIGNvbnMgPSBMaWJyYXJ5XG4gICwgcHJvdG8gPSBjb25zLnByb3RvdHlwZVxuXG5wcm90by5sb29rdXAgPSBlcnJvck9uTnVsbChmdW5jdGlvbihuYW1lKSB7XG4gIHZhciBvdXQgPSB0aGlzLnJlZ2lzdHJ5W25hbWVdIHx8IG51bGxcblxuICBpZih0eXBlb2Ygb3V0ID09PSAnZnVuY3Rpb24nICYmIG91dC5sZW5ndGggPT09IDIgJiYgbmFtZSA9PT0gJ2xvYWRlcicpIHtcbiAgICBvdXQgPSBQcm9taXNlLnRvUHJvbWlzZShvdXQpXG4gIH1cblxuICByZXR1cm4gb3V0XG59LCBcIkNvdWxkIG5vdCBmaW5kIHswfSFcIilcblxucHJvdG8ucmVnaXN0ZXIgPSBlcnJvck9uTnVsbChmdW5jdGlvbihuYW1lLCBpdGVtKSB7XG4gIGlmKHRoaXMucmVnaXN0cnlbbmFtZV0pXG4gICAgcmV0dXJuIG51bGxcblxuICB0aGlzLnJlZ2lzdHJ5W25hbWVdID0gaXRlbVxufSwgXCJ7MH0gaXMgYWxyZWFkeSByZWdpc3RlcmVkIVwiKVxuXG5cbmZ1bmN0aW9uIGVycm9yT25OdWxsKGZuLCBtc2cpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgIHZhciByZXN1bHQgPSBmbi5jYWxsKHRoaXMsIGFyZ3VtZW50c1swXSwgYXJndW1lbnRzWzFdKVxuICAgICAgLCBhcmdzID0gYXJndW1lbnRzXG5cbiAgICBpZihyZXN1bHQgPT09IG51bGwpXG4gICAgICB0aHJvdyBuZXcgRXJyb3IobXNnLnJlcGxhY2UoL1xceyhcXGQrPylcXH0vZywgZnVuY3Rpb24oYSwgbSkge1xuICAgICAgICByZXR1cm4gYXJnc1srbV1cbiAgICAgIH0pKVxuXG4gICAgcmV0dXJuIHJlc3VsdFxuICB9XG59XG5cbiIsInZhciBsaWJyYXJpZXMgPSByZXF1aXJlKCcuL2xpYnJhcmllcycpXG5cbm1vZHVsZS5leHBvcnRzID0gTWV0YVxuXG5mdW5jdGlvbiBNZXRhKCkge1xuICB0aGlzLl9hdXRvcmVnaXN0ZXIgPSB7XG4gICAgICBwbHVnaW46IHt9XG4gICAgLCB0YWc6IHt9XG4gICAgLCBmaWx0ZXI6IHt9XG4gIH1cblxuICB0aGlzLl9jYWNoZSA9IHt9XG5cbiAgdGhpcy5fY2xhc3NlcyA9IHtcbiAgICAgIGZpbHRlcjogbGlicmFyaWVzLkRlZmF1bHRGaWx0ZXJMaWJyYXJ5XG4gICAgLCBwbHVnaW46IGxpYnJhcmllcy5EZWZhdWx0UGx1Z2luTGlicmFyeVxuICAgICwgdGFnOiBsaWJyYXJpZXMuRGVmYXVsdFRhZ0xpYnJhcnlcbiAgfVxufVxuXG52YXIgY29ucyA9IE1ldGFcbiAgLCBwcm90byA9IGNvbnMucHJvdG90eXBlXG5cbnByb3RvLmNyZWF0ZVBsdWdpbkxpYnJhcnkgPSBjcmVhdGVMaWJyYXJ5KCdwbHVnaW4nKVxucHJvdG8uY3JlYXRlRmlsdGVyTGlicmFyeSA9IGNyZWF0ZUxpYnJhcnkoJ2ZpbHRlcicpXG5wcm90by5jcmVhdGVUYWdMaWJyYXJ5ID0gY3JlYXRlTGlicmFyeSgndGFnJylcblxucHJvdG8ucmVnaXN0ZXJQbHVnaW4gPSBjcmVhdGVBdXRvcmVnaXN0ZXIoJ3BsdWdpbicpXG5wcm90by5yZWdpc3RlckZpbHRlciA9IGNyZWF0ZUF1dG9yZWdpc3RlcignZmlsdGVyJylcbnByb3RvLnJlZ2lzdGVyVGFnID0gY3JlYXRlQXV0b3JlZ2lzdGVyKCd0YWcnKVxuXG5mdW5jdGlvbiBjcmVhdGVBdXRvcmVnaXN0ZXIobmFtZSkge1xuICByZXR1cm4gZnVuY3Rpb24oa2V5LCBpdGVtKSB7XG4gICAgaWYodGhpcy5fY2FjaGVbbmFtZV0pXG4gICAgICB0aGlzLl9jYWNoZVtuYW1lXS5yZWdpc3RlcihrZXksIGl0ZW0pO1xuICAgIGVsc2VcbiAgICAgIHRoaXMuX2F1dG9yZWdpc3RlcltuYW1lXVtrZXldID0gaXRlbTtcbiAgfVxufVxuXG5mdW5jdGlvbiBjcmVhdGVMaWJyYXJ5KG5hbWUpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgIGlmKHRoaXMuX2NhY2hlW25hbWVdKVxuICAgICAgcmV0dXJuIHRoaXMuX2NhY2hlW25hbWVdOyBcblxuICAgIHZhciBsaWIgPSBuZXcgdGhpcy5fY2xhc3Nlc1tuYW1lXVxuXG4gICAgZm9yKHZhciBrZXkgaW4gdGhpcy5fYXV0b3JlZ2lzdGVyW25hbWVdKSB7XG4gICAgICBsaWIucmVnaXN0ZXIoa2V5LCB0aGlzLl9hdXRvcmVnaXN0ZXJbbmFtZV1ba2V5XSlcbiAgICB9XG5cbiAgICB0aGlzLl9jYWNoZVtuYW1lXSA9IGxpYlxuICAgIHJldHVybiBsaWJcbiAgfVxufVxuXG4iLCJtb2R1bGUuZXhwb3J0cyA9IE5vZGVMaXN0XG5cbnZhciBQcm9taXNlID0gcmVxdWlyZSgnLi9wcm9taXNlJylcblxuZnVuY3Rpb24gTm9kZUxpc3Qobm9kZXMpIHtcbiAgdGhpcy5ub2RlcyA9IG5vZGVzXG59XG5cbnZhciBjb25zID0gTm9kZUxpc3RcbiAgLCBwcm90byA9IGNvbnMucHJvdG90eXBlXG5cbnByb3RvLnJlbmRlciA9IGZ1bmN0aW9uKGNvbnRleHQpIHtcbiAgdmFyIHByb21pc2VzID0gW11cbiAgICAsIHJlc3VsdHMgPSBbXVxuICAgICwgbm9kZXMgPSB0aGlzLm5vZGVzXG4gICAgLCByZXN1bHRcblxuICBmb3IodmFyIGkgPSAwLCBsZW4gPSBub2Rlcy5sZW5ndGg7IGkgPCBsZW47ICsraSkge1xuICAgIHJlc3VsdHNbaV0gPSByZXN1bHQgPSBub2Rlc1tpXS5yZW5kZXIoY29udGV4dClcblxuICAgIGlmKHJlc3VsdC5jb25zdHJ1Y3RvciA9PT0gUHJvbWlzZSkge1xuICAgICAgcHJvbWlzZXMucHVzaChyZXN1bHQpXG4gICAgfVxuICB9XG5cbiAgaWYocHJvbWlzZXMubGVuZ3RoKSB7XG4gICAgcmV0dXJuIHRoaXMucmVzb2x2ZVByb21pc2VzKHJlc3VsdHMsIHByb21pc2VzKSBcbiAgfVxuXG4gIHJldHVybiByZXN1bHRzLmpvaW4oJycpXG59XG5cbnByb3RvLnJlc29sdmVQcm9taXNlcyA9IGZ1bmN0aW9uKHJlc3VsdHMsIHByb21pc2VzKSB7XG4gIHZhciBzZWxmID0gdGhpc1xuICAgICwgcHJvbWlzZSA9IG5ldyBQcm9taXNlXG4gICAgLCB0b3RhbCA9IHByb21pc2VzLmxlbmd0aFxuXG4gIGZvcih2YXIgaSA9IDAsIHAgPSAwLCBsZW4gPSByZXN1bHRzLmxlbmd0aDsgaSA8IGxlbjsgKytpKSB7XG4gICAgaWYocmVzdWx0c1tpXS5jb25zdHJ1Y3RvciAhPT0gUHJvbWlzZSkgXG4gICAgICBjb250aW51ZVxuXG4gICAgcHJvbWlzZXNbcCsrXS5vbmNlKCdkb25lJywgYmluZChpLCBmdW5jdGlvbihpZHgsIHJlc3VsdCkge1xuICAgICAgcmVzdWx0c1tpZHhdID0gcmVzdWx0XG5cbiAgICAgIGlmKCEtLXRvdGFsKVxuICAgICAgICBwcm9taXNlLnJlc29sdmUocmVzdWx0cy5qb2luKCcnKSlcbiAgICB9KSlcbiAgfVxuXG4gIHJldHVybiBwcm9taXNlXG59XG5cbmZ1bmN0aW9uIGJpbmQobnVtLCBmbikge1xuICByZXR1cm4gZnVuY3Rpb24ocmVzdWx0KSB7XG4gICAgcmV0dXJuIGZuKG51bSwgcmVzdWx0KVxuICB9XG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IFBhcnNlclxuXG52YXIgTm9kZUxpc3QgPSByZXF1aXJlKCcuL25vZGVfbGlzdCcpXG5cbnZhciBGaWx0ZXJBcHBsaWNhdGlvbiA9IHJlcXVpcmUoJy4vZmlsdGVyX2FwcGxpY2F0aW9uJylcbiAgLCBGaWx0ZXJMb29rdXAgPSByZXF1aXJlKCcuL2ZpbHRlcl9sb29rdXAnKVxuICAsIEZpbHRlckNoYWluID0gcmVxdWlyZSgnLi9maWx0ZXJfY2hhaW4nKVxuICAsIFRhZ1Rva2VuID0gcmVxdWlyZSgnLi90YWdfdG9rZW4nKVxuXG5mdW5jdGlvbiBQYXJzZXIodG9rZW5zLCB0YWdzLCBmaWx0ZXJzLCBwbHVnaW5zKSB7XG4gIHRoaXMudG9rZW5zID0gdG9rZW5zXG4gIHRoaXMudGFncyA9IHRhZ3NcbiAgdGhpcy5maWx0ZXJzID0gZmlsdGVyc1xuICB0aGlzLnBsdWdpbnMgPSBwbHVnaW5zXG5cbiAgLy8gZm9yIHVzZSB3aXRoIGV4dGVuZHMgLyBibG9jayB0YWdzXG4gIHRoaXMubG9hZGVkQmxvY2tzID0gW11cbn1cblxudmFyIGNvbnMgPSBQYXJzZXJcbiAgLCBwcm90byA9IGNvbnMucHJvdG90eXBlXG5cbnByb3RvLmNhY2hlID0ge31cblxucHJvdG8ucGFyc2UgPSBmdW5jdGlvbih1bnRpbCkge1xuICB2YXIgb2theSA9ICF1bnRpbFxuICAgICwgdG9rZW4gPSBudWxsXG4gICAgLCBvdXRwdXQgPSBbXVxuICAgICwgbm9kZVxuXG4gIHdoaWxlKHRoaXMudG9rZW5zLmxlbmd0aCA+IDApIHtcbiAgICB0b2tlbiA9IHRoaXMudG9rZW5zLnNoaWZ0KClcblxuICAgIGlmKHVudGlsICYmIHRva2VuLmlzKHVudGlsKSAmJiB0b2tlbi5jb25zdHJ1Y3RvciA9PT0gVGFnVG9rZW4pIHtcbiAgICAgIHRoaXMudG9rZW5zLnVuc2hpZnQodG9rZW4pXG4gICAgICBva2F5ID0gdHJ1ZVxuXG4gICAgICBicmVha1xuICAgIH1cblxuICAgIGlmKG5vZGUgPSB0b2tlbi5ub2RlKHRoaXMpKSB7XG4gICAgICBvdXRwdXQucHVzaChub2RlKVxuICAgIH1cbiAgfVxuXG4gIGlmKCFva2F5KSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdleHBlY3RlZCBvbmUgb2YgJyArIHVudGlsKVxuICB9XG5cbiAgcmV0dXJuIG5ldyBOb2RlTGlzdChvdXRwdXQpXG59XG5cbnByb3RvLmNvbXBpbGVOdW1iZXIgPSBmdW5jdGlvbihjb250ZW50LCBpZHgsIG91dHB1dCkge1xuICB2YXIgZGVjaW1hbCA9IGNvbnRlbnQuY2hhckF0KGlkeCkgPT09ICcuJ1xuICAgICwgYml0cyA9IGRlY2ltYWwgPyBbJzAuJ10gOiBbXVxuICAgICwgcGFyc2VcbiAgICAsIGNcblxuICBkbyB7XG4gICAgYyA9IGNvbnRlbnQuY2hhckF0KGlkeClcblxuICAgIGlmKGMgPT09ICcuJykge1xuICAgICAgaWYoZGVjaW1hbCkge1xuICAgICAgICBicmVha1xuICAgICAgfVxuXG4gICAgICBkZWNpbWFsID0gdHJ1ZVxuICAgICAgYml0cy5wdXNoKCcuJylcbiAgICB9IGVsc2UgaWYoL1xcZC8udGVzdChjKSkge1xuICAgICAgYml0cy5wdXNoKGMpXG4gICAgfVxuICB9IHdoaWxlKCsraWR4IDwgY29udGVudC5sZW5ndGgpXG5cbiAgcGFyc2UgPSBkZWNpbWFsID8gcGFyc2VGbG9hdCA6IHBhcnNlSW50XG4gIG91dHB1dC5wdXNoKHBhcnNlKGJpdHMuam9pbignJyksIDEwKSlcblxuICByZXR1cm4gaWR4XG59XG5cbnByb3RvLmNvbXBpbGVTdHJpbmcgPSBmdW5jdGlvbihjb250ZW50LCBpZHgsIG91dHB1dCkge1xuICB2YXIgdHlwZSA9IGNvbnRlbnQuY2hhckF0KGlkeClcbiAgICAsIGVzY2FwZWQgPSBmYWxzZVxuICAgICwgYml0cyA9IFtdXG4gICAgLCBjXG5cbiAgKytpZHhcblxuICBkbyB7XG4gICAgYyA9IGNvbnRlbnQuY2hhckF0KGlkeClcblxuICAgIGlmKCFlc2NhcGVkKSB7XG4gICAgICBpZihjID09PSAnXFxcXCcpIHtcbiAgICAgICAgZXNjYXBlZCA9IHRydWVcblxuICAgICAgICBjb250aW51ZVxuICAgICAgfVxuXG4gICAgICBpZihjID09PSB0eXBlKSB7XG4gICAgICAgIGJyZWFrXG4gICAgICB9XG5cbiAgICAgIGJpdHMucHVzaChjKVxuICAgIH0gZWxzZSB7XG4gICAgICBpZighL1snXCJcXFxcXS8udGVzdChjKSkge1xuICAgICAgICBiaXRzLnB1c2goJ1xcXFwnKVxuICAgICAgfVxuXG4gICAgICBiaXRzLnB1c2goYylcbiAgICAgIGVzY2FwZWQgPSBmYWxzZVxuICAgIH1cblxuICB9IHdoaWxlKCsraWR4IDwgY29udGVudC5sZW5ndGgpXG5cbiAgb3V0cHV0LnB1c2goYml0cy5qb2luKCcnKSlcblxuICByZXR1cm4gaWR4XG59XG5cbnByb3RvLmNvbXBpbGVOYW1lID0gZnVuY3Rpb24oY29udGVudCwgaWR4LCBvdXRwdXQpIHtcbiAgdmFyIG91dCA9IFtdXG4gICAgLCBjXG5cbiAgZG8ge1xuICAgIGMgPSBjb250ZW50LmNoYXJBdChpZHgpXG5cbiAgICBpZigvW15cXHdcXGRcXF9dLy50ZXN0KGMpKSB7XG4gICAgICBicmVha1xuICAgIH1cblxuICAgIG91dC5wdXNoKGMpXG4gIH0gd2hpbGUoKytpZHggPCBjb250ZW50Lmxlbmd0aClcblxuICBvdXRwdXQucHVzaChvdXQuam9pbignJykpXG5cbiAgcmV0dXJuIGlkeFxufVxuXG5wcm90by5jb21waWxlRmlsdGVyID0gZnVuY3Rpb24oY29udGVudCwgaWR4LCBvdXRwdXQpIHtcbiAgdmFyIGZpbHRlck5hbWVcbiAgICAsIG9sZExlblxuICAgICwgYml0c1xuXG4gICsraWR4XG5cbiAgaWR4ID0gdGhpcy5jb21waWxlTmFtZShjb250ZW50LCBpZHgsIG91dHB1dClcbiAgZmlsdGVyTmFtZSA9IG91dHB1dC5wb3AoKVxuXG4gIGlmKGNvbnRlbnQuY2hhckF0KGlkeCkgIT09ICc6Jykge1xuICAgIG91dHB1dC5wdXNoKG5ldyBGaWx0ZXJBcHBsaWNhdGlvbihmaWx0ZXJOYW1lLCBbXSkpXG5cbiAgICByZXR1cm4gaWR4IC0gMVxuICB9XG5cbiAgKytpZHhcblxuICBvbGRMZW4gPSBvdXRwdXQubGVuZ3RoXG4gIGlkeCA9IHRoaXMuY29tcGlsZUZ1bGwoY29udGVudCwgaWR4LCBvdXRwdXQsIHRydWUpXG4gIGJpdHMgPSBvdXRwdXQuc3BsaWNlKG9sZExlbiwgb3V0cHV0Lmxlbmd0aCAtIG9sZExlbilcblxuICBvdXRwdXQucHVzaChuZXcgRmlsdGVyQXBwbGljYXRpb24oZmlsdGVyTmFtZSwgYml0cykpXG5cbiAgcmV0dXJuIGlkeFxufVxuXG5wcm90by5jb21waWxlTG9va3VwID0gZnVuY3Rpb24oY29udGVudCwgaWR4LCBvdXRwdXQpIHtcbiAgdmFyIGJpdHMgPSBbXVxuXG4gIGRvIHtcbiAgICBpZHggPSB0aGlzLmNvbXBpbGVOYW1lKGNvbnRlbnQsIGlkeCwgb3V0cHV0KVxuICAgIGJpdHMucHVzaChvdXRwdXQucG9wKCkpXG5cbiAgICBpZihjb250ZW50LmNoYXJBdChpZHgpICE9PSAnLicpIHtcbiAgICAgIGJyZWFrXG4gICAgfVxuICB9IHdoaWxlKCsraWR4IDwgY29udGVudC5sZW5ndGgpXG5cbiAgb3V0cHV0LnB1c2gobmV3IEZpbHRlckxvb2t1cChiaXRzKSlcblxuICByZXR1cm4gaWR4IC0gMVxufVxuXG5wcm90by5jb21waWxlRnVsbCA9IGZ1bmN0aW9uKGNvbnRlbnQsIGlkeCwgb3V0cHV0LCBvbWl0UGlwZSkge1xuICB2YXIgY1xuXG4gIG91dHB1dCA9IG91dHB1dCB8fCBbXVxuICBpZHggPSBpZHggfHwgMFxuICAvLyBzb21ldGhpbmd8ZmlsdGVybmFtZVs6YXJnLCBhcmddXG4gIC8vIFwicXVvdGVzXCJcbiAgLy8gMVxuICAvLyAxLjJcbiAgLy8gdHJ1ZSB8IGZhbHNlXG4gIC8vIHN3YWxsb3cgbGVhZGluZyB3aGl0ZXNwYWNlLlxuXG4gIHdoaWxlKC9cXHMvLnRlc3QoY29udGVudC5jaGFyQXQoaWR4KSkpIHtcbiAgICArK2lkeFxuICB9XG5cbiAgZG8ge1xuICAgIGMgPSBjb250ZW50LmNoYXJBdChpZHgpXG5cbiAgICBpZigvWyxcXHNdLy50ZXN0KGMpKSB7XG4gICAgICBicmVha1xuICAgIH1cblxuICAgIGlmKG9taXRQaXBlICYmIGMgPT09ICd8Jykge1xuICAgICAgLS1pZHhcblxuICAgICAgYnJlYWtcbiAgICB9XG5cbiAgICBzd2l0Y2godHJ1ZSkge1xuICAgICAgY2FzZSAvW1xcZFxcLl0vLnRlc3QoYyk6XG4gICAgICAgIGlkeCA9IHRoaXMuY29tcGlsZU51bWJlcihjb250ZW50LCBpZHgsIG91dHB1dClcbiAgICAgICAgYnJlYWtcbiAgICAgIGNhc2UgL1snXCJdLy50ZXN0KGMpOlxuICAgICAgICBpZHggPSB0aGlzLmNvbXBpbGVTdHJpbmcoY29udGVudCwgaWR4LCBvdXRwdXQpXG4gICAgICAgIGJyZWFrXG4gICAgICBjYXNlIGMgPT09ICd8JzpcbiAgICAgICAgaWR4ID0gdGhpcy5jb21waWxlRmlsdGVyKGNvbnRlbnQsIGlkeCwgb3V0cHV0KVxuICAgICAgICBicmVha1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgaWR4ID0gdGhpcy5jb21waWxlTG9va3VwKGNvbnRlbnQsIGlkeCwgb3V0cHV0KVxuICAgICAgICBicmVha1xuICAgIH1cbiAgfSB3aGlsZSgrK2lkeCA8IGNvbnRlbnQubGVuZ3RoKVxuXG4gIHJldHVybiBpZHhcbn1cblxucHJvdG8uY29tcGlsZSA9IGZ1bmN0aW9uKGNvbnRlbnQpIHtcbiAgdmFyIG91dHB1dCA9IFtdXG5cbiAgaWYodGhpcy5jYWNoZVtjb250ZW50XSkge1xuICAgIHJldHVybiB0aGlzLmNhY2hlW2NvbnRlbnRdXG4gIH1cblxuICB0aGlzLmNvbXBpbGVGdWxsKGNvbnRlbnQsIDAsIG91dHB1dClcblxuICBvdXRwdXQgPSB0aGlzLmNhY2hlW2NvbnRlbnRdID0gbmV3IEZpbHRlckNoYWluKG91dHB1dCwgdGhpcylcbiAgb3V0cHV0LmF0dGFjaCh0aGlzKVxuXG4gIHJldHVybiBvdXRwdXRcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gUHJvbWlzZVxuXG5mdW5jdGlvbiBQcm9taXNlKCkge1xuICB0aGlzLnRyaWdnZXIgPSBudWxsXG59XG5cbnZhciBjb25zID0gUHJvbWlzZVxuICAsIHByb3RvID0gY29ucy5wcm90b3R5cGVcblxucHJvdG8ucmVzb2x2ZSA9IGZ1bmN0aW9uKHZhbHVlKSB7XG4gIHZhciB0cmlnZ2VyID0gdGhpcy50cmlnZ2VyXG5cbiAgaWYoIXZhbHVlIHx8IHZhbHVlLmNvbnN0cnVjdG9yICE9PSBjb25zKSB7XG4gICAgcmV0dXJuIHRyaWdnZXIodmFsdWUpXG4gIH1cblxuICB2YWx1ZS5vbmNlKCdkb25lJywgdHJpZ2dlcilcbn1cblxucHJvdG8ub25jZSA9IGZ1bmN0aW9uKGV2LCBmbikge1xuICB0aGlzLnRyaWdnZXIgPSBmblxufVxuXG5jb25zLnRvUHJvbWlzZSA9IGZ1bmN0aW9uKGZuKSB7XG4gIHJldHVybiBmdW5jdGlvbiBwcm9taXNpZmllZCgpIHtcbiAgICB2YXIgYXJncyA9IFtdLnNsaWNlLmNhbGwoYXJndW1lbnRzKVxuICAgICAgLCBwcm9taXNlID0gbmV3IGNvbnNcbiAgICAgICwgc2VsZiA9IHRoaXNcblxuICAgIGFyZ3MucHVzaChvbnJlYWR5KVxuXG4gICAgc2V0VGltZW91dChiYW5nLCAwKVxuXG4gICAgcmV0dXJuIHByb21pc2VcblxuICAgIGZ1bmN0aW9uIGJhbmcoKSB7XG4gICAgICBmbi5hcHBseShzZWxmLCBhcmdzKVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIG9ucmVhZHkoZXJyLCBkYXRhKSB7XG4gICAgICBwcm9taXNlLnJlc29sdmUoZGF0YSlcbiAgICB9XG4gIH1cbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gVGFnVG9rZW5cblxudmFyIFRva2VuID0gcmVxdWlyZSgnLi90b2tlbicpXG5cbmZ1bmN0aW9uIFRhZ1Rva2VuKGNvbnRlbnQsIGxpbmUpIHtcbiAgVG9rZW4uY2FsbCh0aGlzLCBjb250ZW50LCBsaW5lKVxufVxuXG52YXIgY29ucyA9IFRhZ1Rva2VuXG4gICwgcHJvdG8gPSBjb25zLnByb3RvdHlwZSA9IG5ldyBUb2tlblxuXG5wcm90by5jb25zdHJ1Y3RvciA9IGNvbnNcblxucHJvdG8ubm9kZSA9IGZ1bmN0aW9uKHBhcnNlcikge1xuICB2YXIgdGFnID0gcGFyc2VyLnRhZ3MubG9va3VwKHRoaXMubmFtZSlcblxuICByZXR1cm4gdGFnKHRoaXMuY29udGVudCwgcGFyc2VyKVxufVxuIiwibW9kdWxlLmV4cG9ydHMgPSBCbG9ja05vZGVcblxudmFyIFByb21pc2UgPSByZXF1aXJlKCcuLi9wcm9taXNlJylcbiAgLCBCbG9ja0NvbnRleHQgPSByZXF1aXJlKCcuLi9ibG9ja19jb250ZXh0JylcblxuZnVuY3Rpb24gQmxvY2tOb2RlKG5hbWUsIG5vZGVzKSB7XG4gIHRoaXMubmFtZSA9IG5hbWVcbiAgdGhpcy5ub2RlcyA9IG5vZGVzXG5cbiAgdGhpcy5jb250ZXh0ID0gbnVsbFxufVxuXG52YXIgY29ucyA9IEJsb2NrTm9kZVxuICAsIHByb3RvID0gY29ucy5wcm90b3R5cGVcblxucHJvdG8ucmVuZGVyID0gZnVuY3Rpb24oY29udGV4dCkge1xuICB2YXIgc2VsZiA9IHRoaXNcbiAgICAsIGJsb2NrQ29udGV4dCA9IEJsb2NrQ29udGV4dC5mcm9tKGNvbnRleHQpXG4gICAgLCByZXN1bHRcbiAgICAsIGJsb2NrXG4gICAgLCBwdXNoXG5cbiAgaWYoIWJsb2NrQ29udGV4dCkge1xuICAgIGNvbnRleHQuYmxvY2sgPSBzZWxmXG4gICAgcmV0dXJuIHNlbGYubm9kZXMucmVuZGVyKGNvbnRleHQpXG4gIH1cblxuICBibG9jayA9IHB1c2ggPSBibG9ja0NvbnRleHQucG9wKHNlbGYubmFtZSlcblxuICBpZighYmxvY2spIHsgXG4gICAgYmxvY2sgPSBzZWxmXG4gIH0gXG5cbiAgYmxvY2sgPSBuZXcgQmxvY2tOb2RlKGJsb2NrLm5hbWUsIGJsb2NrLm5vZGVzKVxuXG4gIGJsb2NrLmNvbnRleHQgPSBjb250ZXh0XG4gIGJsb2NrLmNvbnRleHQuYmxvY2sgPSBibG9ja1xuICBjb250ZXh0LmJsb2NrID0gYmxvY2tcblxuICByZXN1bHQgPSBibG9jay5ub2Rlcy5yZW5kZXIoY29udGV4dClcblxuICBpZihwdXNoKSB7XG4gICAgYmxvY2tDb250ZXh0LnB1c2goc2VsZi5uYW1lLCBwdXNoKVxuICB9XG5cbiAgcmV0dXJuIHJlc3VsdFxuXG59XG5cbnByb3RvLmlzQmxvY2tOb2RlID0gdHJ1ZVxuXG5wcm90by5fc3VwZXIgPSBmdW5jdGlvbigpIHtcbiAgdmFyIGJsb2NrQ29udGV4dCA9IEJsb2NrQ29udGV4dC5mcm9tKHRoaXMuY29udGV4dClcbiAgICAsIGJsb2NrXG4gICAgLCBzdHJcblxuICBpZihibG9ja0NvbnRleHQgJiYgKGJsb2NrID0gYmxvY2tDb250ZXh0LmdldCh0aGlzLm5hbWUpKSkge1xuICAgIHN0ciA9IG5ldyBTdHJpbmcoYmxvY2sucmVuZGVyKHRoaXMuY29udGV4dCkpXG4gICAgc3RyLnNhZmUgPSB0cnVlXG4gICAgcmV0dXJuIHN0ciBcbiAgfVxuXG4gIHJldHVybiAnJ1xufVxuXG5jb25zLnBhcnNlID0gZnVuY3Rpb24oY29udGVudHMsIHBhcnNlcikge1xuICB2YXIgYml0cyA9IGNvbnRlbnRzLnNwbGl0KCcgJylcbiAgICAsIG5hbWUgPSBiaXRzWzFdXG4gICAgLCBsb2FkZWQgPSBwYXJzZXIubG9hZGVkQmxvY2tzXG4gICAgLCBub2Rlc1xuXG4gIGZvcih2YXIgaSA9IDAsIGxlbiA9IGxvYWRlZC5sZW5ndGg7IGkgPCBsZW47ICsraSlcbiAgICBpZihsb2FkZWRbaV0gPT09IG5hbWUpXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ2Jsb2NrIHRhZyB3aXRoIHRoZSBuYW1lIFwiJytuYW1lKydcIiBhcHBlYXJzIG1vcmUgdGhhbiBvbmNlJylcblxuICBsb2FkZWQucHVzaChuYW1lKVxuXG4gIG5vZGVzID0gcGFyc2VyLnBhcnNlKFsnZW5kYmxvY2snXSlcbiAgcGFyc2VyLnRva2Vucy5zaGlmdCgpXG5cbiAgcmV0dXJuIG5ldyBjb25zKG5hbWUsIG5vZGVzKSAgXG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IENvbW1lbnROb2RlXG5cbmZ1bmN0aW9uIENvbW1lbnROb2RlKCkge1xuICAvLyBuby1vcC5cbn1cblxudmFyIGNvbnMgPSBDb21tZW50Tm9kZVxuICAsIHByb3RvID0gY29ucy5wcm90b3R5cGVcblxucHJvdG8ucmVuZGVyID0gZnVuY3Rpb24oY29udGV4dCkge1xuICByZXR1cm4gJydcbn1cblxuY29ucy5wYXJzZSA9IGZ1bmN0aW9uKGNvbnRlbnRzLCBwYXJzZXIpIHtcbiAgbmwgPSBwYXJzZXIucGFyc2UoWydlbmRjb21tZW50J10pXG4gIHBhcnNlci50b2tlbnMuc2hpZnQoKVxuXG4gIHJldHVybiBuZXcgY29uc1xufVxuIiwibW9kdWxlLmV4cG9ydHMgPSBEZWJ1Z05vZGVcblxudmFyIFByb21pc2UgPSByZXF1aXJlKCcuLi9wcm9taXNlJylcbiAgLCBDb250ZXh0ID0gcmVxdWlyZSgnLi4vY29udGV4dCcpXG4gICwgZGVidWcgPSByZXF1aXJlKCcuLi9kZWJ1ZycpXG5cbmZ1bmN0aW9uIERlYnVnTm9kZSh2YXJuYW1lKSB7XG4gIHRoaXMudmFybmFtZSA9IHZhcm5hbWVcbn1cblxudmFyIGNvbnMgPSBEZWJ1Z05vZGVcbiAgLCBwcm90byA9IGNvbnMucHJvdG90eXBlXG5cbnByb3RvLnJlbmRlciA9IGZ1bmN0aW9uKGNvbnRleHQsIHZhbHVlKSB7XG4gIHZhciBzZWxmID0gdGhpc1xuICAgICwgdGFyZ2V0ID0gY29udGV4dFxuICAgICwgcHJvbWlzZVxuXG4gIGlmKHNlbGYudmFybmFtZSAhPT0gbnVsbCkge1xuICAgIHZhbHVlID0gYXJndW1lbnRzLmxlbmd0aCA9PT0gMiA/IHZhbHVlIDogc2VsZi52YXJuYW1lLnJlc29sdmUoY29udGV4dClcbiAgICBpZih2YWx1ZSAmJiB2YWx1ZS5jb25zdHJ1Y3RvciA9PT0gUHJvbWlzZSkge1xuICAgICAgcHJvbWlzZSA9IG5ldyBQcm9taXNlXG4gICAgICB2YWx1ZS5vbmNlKCdkb25lJywgZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICBwcm9taXNlLnJlc29sdmUoc2VsZi5yZW5kZXIoY29udGV4dCwgZGF0YSkpXG4gICAgICB9KVxuICAgICAgcmV0dXJuIHByb21pc2VcbiAgICB9XG4gICAgdGFyZ2V0ID0gdmFsdWVcbiAgfVxuXG4gIGlmKHRhcmdldCA9PT0gY29udGV4dCkge1xuICAgIHdoaWxlKHRhcmdldCAhPT0gQ29udGV4dC5wcm90b3R5cGUpIHtcbiAgICAgIGRlYnVnLmxvZyh0YXJnZXQpXG4gICAgICB0YXJnZXQgPSBPYmplY3QuZ2V0UHJvdG90eXBlT2YodGFyZ2V0KVxuICAgIH1cbiAgICByZXR1cm4gJydcbiAgfVxuICBkZWJ1Zy5sb2codGFyZ2V0KVxuICByZXR1cm4gJydcbn1cblxuY29ucy5wYXJzZSA9IGZ1bmN0aW9uKGNvbnRlbnRzLCBwYXJzZXIpIHtcbiAgdmFyIGJpdHMgPSBjb250ZW50cy5zcGxpdCgnICcpXG5cbiAgcmV0dXJuIG5ldyBEZWJ1Z05vZGUoYml0c1sxXSA/IHBhcnNlci5jb21waWxlKGJpdHNbMV0pIDogbnVsbClcbn1cblxuIiwibW9kdWxlLmV4cG9ydHMgPSBFeHRlbmRzTm9kZVxuXG52YXIgUHJvbWlzZSA9IHJlcXVpcmUoJy4uL3Byb21pc2UnKVxuICAsIEJsb2NrQ29udGV4dCA9IHJlcXVpcmUoJy4uL2Jsb2NrX2NvbnRleHQnKVxuXG5cbmZ1bmN0aW9uIEV4dGVuZHNOb2RlKHBhcmVudCwgbm9kZXMsIGxvYWRlcikge1xuICB0aGlzLnBhcmVudCA9IHBhcmVudFxuICB0aGlzLmxvYWRlciA9IGxvYWRlclxuXG4gIHRoaXMuYmxvY2tzID0ge31cblxuICBmb3IodmFyIGkgPSAwLCBsZW4gPSBub2Rlcy5ub2Rlcy5sZW5ndGg7IGkgPCBsZW47ICsraSkge1xuICAgIGlmKCFub2Rlcy5ub2Rlc1tpXS5pc0Jsb2NrTm9kZSlcbiAgICAgIGNvbnRpbnVlXG5cbiAgICB0aGlzLmJsb2Nrc1tub2Rlcy5ub2Rlc1tpXS5uYW1lXSA9IG5vZGVzLm5vZGVzW2ldXG4gIH1cbn1cblxudmFyIGNvbnMgPSBFeHRlbmRzTm9kZVxuICAsIHByb3RvID0gY29ucy5wcm90b3R5cGVcblxucHJvdG8uaXNFeHRlbmRzTm9kZSA9IHRydWVcblxucHJvdG8ucmVuZGVyID0gZnVuY3Rpb24oY29udGV4dCwgcGFyZW50KSB7XG4gIHZhciBzZWxmID0gdGhpc1xuICAgICwgcHJvbWlzZVxuXG4gIHBhcmVudCA9IHBhcmVudCB8fCB0aGlzLnBhcmVudC5yZXNvbHZlKGNvbnRleHQpXG5cbiAgaWYocGFyZW50LmNvbnN0cnVjdG9yID09PSBQcm9taXNlKSB7XG4gICAgcHJvbWlzZSA9IG5ldyBQcm9taXNlXG5cbiAgICBwYXJlbnQub25jZSgnZG9uZScsIGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgIHByb21pc2UucmVzb2x2ZShzZWxmLnJlbmRlcihjb250ZXh0LCBkYXRhKSlcbiAgICB9KVxuXG4gICAgcmV0dXJuIHByb21pc2VcbiAgfVxuXG4gIHBhcmVudCA9IHNlbGYuZ2V0X3RlbXBsYXRlKHBhcmVudClcblxuICBpZihwYXJlbnQuY29uc3RydWN0b3IgPT09IFByb21pc2UpIHtcbiAgICBwcm9taXNlID0gbmV3IFByb21pc2VcblxuICAgIHBhcmVudC5vbmNlKCdkb25lJywgZnVuY3Rpb24oZGF0YSkge1xuICAgICAgcHJvbWlzZS5yZXNvbHZlKHNlbGYucmVuZGVyKGNvbnRleHQsIGRhdGEpKVxuICAgIH0pICBcblxuICAgIHJldHVybiBwcm9taXNlXG4gIH1cblxuICB2YXIgYmxvY2tDb250ZXh0ID0gQmxvY2tDb250ZXh0LmZyb20oY29udGV4dCkgfHwgQmxvY2tDb250ZXh0LmludG8oY29udGV4dClcbiAgICAsIGJsb2NrcyA9IHt9XG4gICAgLCBub2RlTGlzdCA9IHBhcmVudC5nZXROb2RlTGlzdCgpXG4gICAgLCBleHRlbmRzSURYID0gZmFsc2VcblxuICBibG9ja0NvbnRleHQuYWRkKHNlbGYuYmxvY2tzKVxuXG4gIGZvcih2YXIgaSA9IDAsIGxlbiA9IG5vZGVMaXN0Lm5vZGVzLmxlbmd0aDsgaSA8IGxlbjsgKytpKSB7XG4gICAgaWYobm9kZUxpc3Qubm9kZXNbaV0uaXNFeHRlbmRzTm9kZSkge1xuICAgICAgZXh0ZW5kc0lEWCA9IHRydWVcbiAgICAgIGJyZWFrXG4gICAgfVxuXG4gICAgaWYobm9kZUxpc3Qubm9kZXNbaV0uaXNCbG9ja05vZGUpIHtcbiAgICAgIGJsb2Nrc1tub2RlTGlzdC5ub2Rlc1tpXS5uYW1lXSA9IG5vZGVMaXN0Lm5vZGVzW2ldXG4gICAgfVxuICB9XG5cbiAgaWYoIWV4dGVuZHNJRFgpIHtcbiAgICBibG9ja0NvbnRleHQuYWRkKGJsb2NrcylcbiAgfVxuXG4gIHByb21pc2UgPSBuZXcgUHJvbWlzZVxuXG4gIHBhcmVudC5yZW5kZXIoY29udGV4dCwgZnVuY3Rpb24oZXJyLCBkYXRhKSB7XG4gICAgcHJvbWlzZS5yZXNvbHZlKGRhdGEpXG4gIH0pXG5cbiAgcmV0dXJuIHByb21pc2Vcbn1cblxucHJvdG8uZ2V0X3RlbXBsYXRlID0gZnVuY3Rpb24ocGFyZW50KSB7XG4gIGlmKHR5cGVvZiBwYXJlbnQgIT09ICdzdHJpbmcnKSB7XG4gICAgcmV0dXJuIHBhcmVudFxuICB9XG5cbiAgcmV0dXJuIHRoaXMubG9hZGVyKHBhcmVudClcbn1cblxuY29ucy5wYXJzZSA9IGZ1bmN0aW9uKGNvbnRlbnRzLCBwYXJzZXIpIHtcbiAgdmFyIGJpdHMgPSBjb250ZW50cy5zcGxpdCgnICcpXG4gICAgLCBwYXJlbnQgPSBwYXJzZXIuY29tcGlsZShiaXRzLnNsaWNlKDEpLmpvaW4oJyAnKSlcbiAgICAsIG5vZGVzID0gcGFyc2VyLnBhcnNlKClcbiAgICAsIGxvYWRlciA9IHBhcnNlci5wbHVnaW5zLmxvb2t1cCgnbG9hZGVyJylcblxuICByZXR1cm4gbmV3IGNvbnMocGFyZW50LCBub2RlcywgbG9hZGVyKVxufVxuIiwibW9kdWxlLmV4cG9ydHMgPSBGb3JOb2RlXG5cbnZhciBOb2RlTGlzdCA9IHJlcXVpcmUoJy4uL25vZGVfbGlzdCcpXG4gICwgUHJvbWlzZSA9IHJlcXVpcmUoJy4uL3Byb21pc2UnKVxuXG5mdW5jdGlvbiBGb3JOb2RlKHRhcmdldCwgdW5wYWNrLCBsb29wLCBlbXB0eSwgcmV2ZXJzZWQpIHtcbiAgdGhpcy50YXJnZXQgPSB0YXJnZXRcbiAgdGhpcy51bnBhY2sgPSB1bnBhY2tcbiAgdGhpcy5sb29wID0gbG9vcFxuICB0aGlzLmVtcHR5ID0gZW1wdHlcbiAgdGhpcy5yZXZlcnNlZCA9IHJldmVyc2VkXG59XG5cbnZhciBjb25zID0gRm9yTm9kZVxuICAsIHByb3RvID0gY29ucy5wcm90b3R5cGVcblxuZnVuY3Rpb24gZ2V0SW5JbmRleChiaXRzKSB7XG4gIGZvcih2YXIgaSA9IDAsIGxlbiA9IGJpdHMubGVuZ3RoOyBpIDwgbGVuOyArK2kpXG4gICAgaWYoYml0c1tpXSA9PT0gJ2luJylcbiAgICAgIHJldHVybiBpXG5cbiAgcmV0dXJuIC0xIFxufVxuXG5wcm90by5yZW5kZXIgPSBmdW5jdGlvbihjb250ZXh0LCB2YWx1ZSkge1xuICB2YXIgc2VsZiA9IHRoaXNcbiAgICAsIGFyciA9IHZhbHVlIHx8IHNlbGYudGFyZ2V0LnJlc29sdmUoY29udGV4dClcbiAgICAsIHByb21pc2VcblxuXG4gIGlmKGFyciAmJiBhcnIuY29uc3RydWN0b3IgPT09IFByb21pc2UpIHtcbiAgICBwcm9taXNlID0gbmV3IFByb21pc2VcbiAgICBhcnIub25jZSgnZG9uZScsIGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgIHByb21pc2UucmVzb2x2ZShzZWxmLnJlbmRlcihjb250ZXh0LCBkYXRhKSlcbiAgICB9KVxuXG4gICAgcmV0dXJuIHByb21pc2VcbiAgfVxuXG4gIGlmKGFyciA9PT0gdW5kZWZpbmVkIHx8IGFyciA9PT0gbnVsbCkge1xuICAgIGFyciA9IFtdXG4gIH1cblxuICB2YXIgYml0cyA9IFtdXG4gICAgLCBwcm9taXNlcyA9IFtdXG4gICAgLCBwYXJlbnQgPSBjb250ZXh0LmZvcmxvb3BcbiAgICAsIGxvb3AgPSB7fVxuICAgICwgcmVzdWx0XG4gICAgLCBjdHh0XG4gICAgLCBzdWJcblxuICBpZighKCdsZW5ndGgnIGluIGFycikpIHtcbiAgICBmb3IodmFyIGtleSBpbiBhcnIpIGlmKGFyci5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG4gICAgICBiaXRzLnB1c2goa2V5KVxuICAgIH1cblxuICAgIGFyciA9IGJpdHMuc2xpY2UoKVxuICAgIGJpdHMubGVuZ3RoID0gMFxuICB9XG5cbiAgaWYoIWFyci5sZW5ndGgpIHtcbiAgICByZXR1cm4gc2VsZi5lbXB0eS5yZW5kZXIoY29udGV4dClcbiAgfVxuXG4gIHN1YiA9IHNlbGYucmV2ZXJzZWQgPyBhcnIubGVuZ3RoIC0gMSA6IDBcblxuICBmb3IodmFyIGkgPSAwLCBsZW4gPSBhcnIubGVuZ3RoLCBpZHg7IGkgPCBsZW47ICsraSkge1xuICAgIGN0eHQgPSBjb250ZXh0LmNvcHkoKVxuICAgIGlkeCA9IE1hdGguYWJzKHN1YiAtIGkpXG4gICAgbG9vcC5jb3VudGVyID0gaSArIDFcbiAgICBsb29wLmNvdW50ZXIwID0gaVxuICAgIGxvb3AucmV2Y291bnRlciA9IGxlbiAtIGlcbiAgICBsb29wLnJldmNvdW50ZXIwID0gbGVuIC0gKGkgKyAxKVxuICAgIGxvb3AuZmlyc3QgPSBpID09PSAwXG4gICAgbG9vcC5sYXN0ID0gaSA9PT0gbGVuIC0gMVxuICAgIGxvb3AucGFyZW50bG9vcCA9IHBhcmVudCBcbiAgICBjdHh0LmZvcmxvb3AgPSBsb29wXG5cbiAgICBpZihzZWxmLnVucGFjay5sZW5ndGggPT09IDEpXG4gICAgICBjdHh0W3NlbGYudW5wYWNrWzBdXSA9IGFycltpZHhdXG4gICAgZWxzZSBmb3IodmFyIHUgPSAwOyB1IDwgc2VsZi51bnBhY2subGVuZ3RoOyArK3UpXG4gICAgICBjdHh0W3NlbGYudW5wYWNrW3VdXSA9IGFycltpZHhdW3VdXG5cbiAgICByZXN1bHQgPSBzZWxmLmxvb3AucmVuZGVyKGN0eHQpXG4gICAgaWYocmVzdWx0LmNvbnN0cnVjdG9yID09PSBQcm9taXNlKVxuICAgICAgcHJvbWlzZXMucHVzaChyZXN1bHQpXG4gICAgIFxuICAgIGJpdHMucHVzaChyZXN1bHQpIFxuICB9XG5cbiAgaWYocHJvbWlzZXMubGVuZ3RoKSB7XG4gICAgcmV0dXJuIHNlbGYubG9vcC5yZXNvbHZlUHJvbWlzZXMoYml0cywgcHJvbWlzZXMpXG4gIH1cblxuICByZXR1cm4gYml0cy5qb2luKCcnKVxufVxuXG5jb25zLnBhcnNlID0gZnVuY3Rpb24oY29udGVudHMsIHBhcnNlcikge1xuICB2YXIgYml0cyA9IGNvbnRlbnRzLnNwbGl0KC9cXHMrLylcbiAgICAsIHJldmVyc2VkID0gYml0c1tiaXRzLmxlbmd0aC0xXSA9PT0gJ3JldmVyc2VkJ1xuICAgICwgaWR4SW4gPSBnZXRJbkluZGV4KGJpdHMpXG4gICAgLCB2YXJpYWJsZXMgPSBiaXRzLnNsaWNlKDEsIGlkeEluKVxuICAgICwgdGFyZ2V0ID0gcGFyc2VyLmNvbXBpbGUoYml0c1tpZHhJbisxXSlcbiAgICAsIG5vZGVsaXN0ID0gcGFyc2VyLnBhcnNlKFsnZW1wdHknLCAnZW5kZm9yJ10pXG4gICAgLCB1bnBhY2sgPSBbXVxuICAgICwgZW1wdHlcblxuXG4gIGlmKHBhcnNlci50b2tlbnMuc2hpZnQoKS5pcyhbJ2VtcHR5J10pKSB7XG4gICAgZW1wdHkgPSBwYXJzZXIucGFyc2UoWydlbmRmb3InXSlcbiAgICBwYXJzZXIudG9rZW5zLnNoaWZ0KClcbiAgfSBlbHNlIHtcbiAgICBlbXB0eSA9IG5ldyBOb2RlTGlzdChbXSlcbiAgfVxuXG4gIHZhcmlhYmxlcyA9IHZhcmlhYmxlcy5qb2luKCcgJykuc3BsaXQoJywnKVxuICBmb3IodmFyIGkgPSAwLCBsZW4gPSB2YXJpYWJsZXMubGVuZ3RoOyBpIDwgbGVuOyArK2kpIHtcbiAgICB2YXJpYWJsZXNbaV0gPSB2YXJpYWJsZXNbaV0ucmVwbGFjZSgvKF5cXHMrfFxccyskKS8sICcnKVxuICAgIGlmKHZhcmlhYmxlc1tpXSlcbiAgICAgIHVucGFjay5wdXNoKHZhcmlhYmxlc1tpXSlcbiAgfVxuXG4gIHJldHVybiBuZXcgY29ucyh0YXJnZXQsIHVucGFjaywgbm9kZWxpc3QsIGVtcHR5LCByZXZlcnNlZCk7XG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IEVuZFRva2VuXG5cbmZ1bmN0aW9uIEVuZFRva2VuKCkge1xuICB0aGlzLmxicCA9IDBcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gSW5maXhPcGVyYXRvclxuXG52YXIgUHJvbWlzZSA9IHJlcXVpcmUoJy4uLy4uL3Byb21pc2UnKVxuXG5mdW5jdGlvbiBJbmZpeE9wZXJhdG9yKGJwLCBjbXApIHtcbiAgdGhpcy5sYnAgPSBicFxuICB0aGlzLmNtcCA9IGNtcFxuXG4gIHRoaXMuZmlyc3QgPSBcbiAgdGhpcy5zZWNvbmQgPSBudWxsXG59IFxuXG52YXIgY29ucyA9IEluZml4T3BlcmF0b3JcbiAgLCBwcm90byA9IGNvbnMucHJvdG90eXBlXG5cbnByb3RvLm51ZCA9IGZ1bmN0aW9uKHBhcnNlcikge1xuICB0aHJvdyBuZXcgRXJyb3IoXCJVbmV4cGVjdGVkIHRva2VuXCIpXG59XG5cbnByb3RvLmxlZCA9IGZ1bmN0aW9uKGxocywgcGFyc2VyKSB7XG4gIHRoaXMuZmlyc3QgPSBsaHNcbiAgdGhpcy5zZWNvbmQgPSBwYXJzZXIuZXhwcmVzc2lvbih0aGlzLmxicClcbiAgcmV0dXJuIHRoaXNcbn1cblxucHJvdG8uZXZhbHVhdGUgPSBmdW5jdGlvbihjb250ZXh0LCBmaXJzdCwgc2Vjb25kLCBzZW50Rmlyc3QsIHNlbnRTZWNvbmQpIHtcbiAgdmFyIHNlbGYgPSB0aGlzXG4gICAgLCBwcm9taXNlXG5cbiAgZmlyc3QgPSBzZW50Rmlyc3QgPyBmaXJzdCA6IHNlbGYuZmlyc3QuZXZhbHVhdGUoY29udGV4dClcblxuICBpZihmaXJzdCAmJiBmaXJzdC5jb25zdHJ1Y3RvciA9PT0gUHJvbWlzZSkge1xuICAgIHByb21pc2UgPSBuZXcgUHJvbWlzZVxuXG4gICAgZmlyc3Qub25jZSgnZG9uZScsIGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgIHByb21pc2UucmVzb2x2ZShzZWxmLmV2YWx1YXRlKGNvbnRleHQsIGRhdGEsIG51bGwsIHRydWUsIGZhbHNlKSlcbiAgICB9KVxuXG4gICAgcmV0dXJuIHByb21pc2VcbiAgfVxuXG4gIHNlY29uZCA9IHNlbnRTZWNvbmQgPyBzZWNvbmQgOiBzZWxmLnNlY29uZC5ldmFsdWF0ZShjb250ZXh0KVxuXG4gIGlmKHNlY29uZCAmJiBzZWNvbmQuY29uc3RydWN0b3IgPT09IFByb21pc2UpIHtcbiAgICBwcm9taXNlID0gbmV3IFByb21pc2VcblxuICAgIHNlY29uZC5vbmNlKCdkb25lJywgZnVuY3Rpb24oZGF0YSkge1xuICAgICAgcHJvbWlzZS5yZXNvbHZlKHNlbGYuZXZhbHVhdGUoY29udGV4dCwgZmlyc3QsIGRhdGEsIHRydWUsIHRydWUpKVxuICAgIH0pXG5cbiAgICByZXR1cm4gcHJvbWlzZVxuICB9XG5cbiAgcmV0dXJuIHNlbGYuY21wKGZpcnN0LCBzZWNvbmQpXG59XG5cbiIsIm1vZHVsZS5leHBvcnRzID0gTGl0ZXJhbFRva2VuXG5cbmZ1bmN0aW9uIExpdGVyYWxUb2tlbih2YWx1ZSwgb3JpZ2luYWwpIHtcbiAgdGhpcy5sYnAgPSAwXG4gIHRoaXMudmFsdWUgPSB2YWx1ZVxufVxuXG52YXIgY29ucyA9IExpdGVyYWxUb2tlblxuICAsIHByb3RvID0gY29ucy5wcm90b3R5cGVcblxucHJvdG8ubnVkID0gZnVuY3Rpb24ocGFyc2VyKSB7XG4gIHJldHVybiB0aGlzXG59XG5cbnByb3RvLmxlZCA9IGZ1bmN0aW9uKCkge1xuICB0aHJvdyBuZXcgRXJyb3IoKVxufVxuXG5wcm90by5ldmFsdWF0ZSA9IGZ1bmN0aW9uKGNvbnRleHQpIHtcbiAgaWYoIXRoaXMudmFsdWUpXG4gICAgcmV0dXJuIHRoaXMudmFsdWVcblxuICBpZighdGhpcy52YWx1ZS5yZXNvbHZlKVxuICAgIHJldHVybiB0aGlzLnZhbHVlXG5cbiAgcmV0dXJuIHRoaXMudmFsdWUucmVzb2x2ZShjb250ZXh0KVxufVxuIiwibW9kdWxlLmV4cG9ydHMgPSBJZk5vZGVcblxudmFyIFByb21pc2UgPSByZXF1aXJlKCcuLi8uLi9wcm9taXNlJylcbiAgLCBOb2RlTGlzdCA9IHJlcXVpcmUoJy4uLy4uL25vZGVfbGlzdCcpXG4gICwgUGFyc2VyID0gcmVxdWlyZSgnLi9wYXJzZXInKVxuXG5mdW5jdGlvbiBJZk5vZGUocHJlZGljYXRlLCB3aGVuX3RydWUsIHdoZW5fZmFsc2UpIHtcbiAgdGhpcy5wcmVkaWNhdGUgPSBwcmVkaWNhdGVcbiAgdGhpcy53aGVuX3RydWUgPSB3aGVuX3RydWVcbiAgdGhpcy53aGVuX2ZhbHNlID0gd2hlbl9mYWxzZVxufVxuXG52YXIgY29ucyA9IElmTm9kZVxuICAsIHByb3RvID0gY29ucy5wcm90b3R5cGVcblxucHJvdG8ucmVuZGVyID0gZnVuY3Rpb24oY29udGV4dCwgcmVzdWx0LCB0aW1lcykge1xuICB2YXIgc2VsZiA9IHRoaXNcbiAgICAsIHByb21pc2VcblxuICByZXN1bHQgPSB0aW1lcyA9PT0gMSA/IHJlc3VsdCA6IHRoaXMucHJlZGljYXRlLmV2YWx1YXRlKGNvbnRleHQpXG5cbiAgaWYocmVzdWx0ICYmIHJlc3VsdC5jb25zdHJ1Y3RvciA9PT0gUHJvbWlzZSkge1xuICAgIHByb21pc2UgPSBuZXcgUHJvbWlzZVxuXG4gICAgcmVzdWx0Lm9uY2UoJ2RvbmUnLCBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgcHJvbWlzZS5yZXNvbHZlKHNlbGYucmVuZGVyKGNvbnRleHQsIHZhbHVlLCAxKSlcbiAgICB9KVxuXG4gICAgcmV0dXJuIHByb21pc2VcbiAgfVxuXG4gIGlmKHJlc3VsdCkge1xuICAgIHJldHVybiB0aGlzLndoZW5fdHJ1ZS5yZW5kZXIoY29udGV4dClcbiAgfVxuICByZXR1cm4gdGhpcy53aGVuX2ZhbHNlLnJlbmRlcihjb250ZXh0KVxufVxuXG5jb25zLnBhcnNlID0gZnVuY3Rpb24oY29udGVudHMsIHBhcnNlcikge1xuICB2YXIgYml0cyA9IGNvbnRlbnRzLnNwbGl0KCcgJykuc2xpY2UoMSlcbiAgICAsIGlmcCA9IG5ldyBQYXJzZXIoYml0cywgcGFyc2VyKVxuICAgICwgcHJlZGljYXRlXG4gICAgLCB3aGVuX3RydWVcbiAgICAsIHdoZW5fZmFsc2VcbiAgICAsIG5leHRcblxuICBwcmVkaWNhdGUgPSBpZnAucGFyc2UoKVxuXG4gIHdoZW5fdHJ1ZSA9IHBhcnNlci5wYXJzZShbJ2Vsc2UnLCAnZWxpZicsICdlbmRpZiddKVxuXG4gIG5leHQgPSBwYXJzZXIudG9rZW5zLnNoaWZ0KClcblxuICBpZihuZXh0LmlzKFsnZW5kaWYnXSkpIHtcbiAgICB3aGVuX2ZhbHNlID0gbmV3IE5vZGVMaXN0KFtdKVxuICB9IGVsc2UgaWYobmV4dC5pcyhbJ2VsaWYnXSkpIHtcbiAgICB3aGVuX2ZhbHNlID0gY29ucy5wYXJzZShuZXh0LmNvbnRlbnQsIHBhcnNlcilcbiAgfSBlbHNlIHtcbiAgICB3aGVuX2ZhbHNlID0gcGFyc2VyLnBhcnNlKFsnZW5kaWYnXSlcbiAgICBwYXJzZXIudG9rZW5zLnNoaWZ0KClcbiAgfVxuXG4gIHJldHVybiBuZXcgY29ucyhwcmVkaWNhdGUsIHdoZW5fdHJ1ZSwgd2hlbl9mYWxzZSlcbn1cbiIsInZhciBJbmZpeE9wZXJhdG9yID0gcmVxdWlyZSgnLi9pbmZpeCcpXG4gICwgUHJlZml4T3BlcmF0b3IgPSByZXF1aXJlKCcuL3ByZWZpeCcpXG5cbnZhciBrZXlzXG5cbmtleXMgPSBPYmplY3Qua2V5cyB8fCBrZXlzaGltXG5cbmZ1bmN0aW9uIGtleXNoaW0ob2JqKSB7XG4gIHZhciBhY2N1bSA9IFtdXG5cbiAgZm9yKHZhciBuIGluIG9iaikgaWYob2JqLmhhc093blByb3BlcnR5KG4pKSB7XG4gICAgYWNjdW0ucHVzaChuKVxuICB9XG5cbiAgcmV0dXJuIGFjY3VtXG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgICdvcic6IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIG5ldyBJbmZpeE9wZXJhdG9yKDYsIGZ1bmN0aW9uKHgsIHkpIHtcbiAgICAgICAgICByZXR1cm4geCB8fCB5XG4gICAgICB9KVxuICAgIH1cblxuICAsICdhbmQnOiBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBuZXcgSW5maXhPcGVyYXRvcig3LCBmdW5jdGlvbih4LCB5KSB7XG4gICAgICAgICAgcmV0dXJuIHggJiYgeVxuICAgICAgfSlcbiAgICB9XG5cbiAgLCAnbm90JzogZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gbmV3IFByZWZpeE9wZXJhdG9yKDgsIGZ1bmN0aW9uKHgpIHtcbiAgICAgICAgcmV0dXJuICF4XG4gICAgICB9KVxuICAgIH1cblxuICAsICdpbic6IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIG5ldyBJbmZpeE9wZXJhdG9yKDksIGluX29wZXJhdG9yKVxuICAgIH1cblxuICAsICdub3QgaW4nOiBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gbmV3IEluZml4T3BlcmF0b3IoOSwgZnVuY3Rpb24oeCwgeSkge1xuICAgICAgcmV0dXJuICFpbl9vcGVyYXRvcih4LHkpXG4gICAgfSlcbiAgfVxuXG4gICwgJz0nOiBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gbmV3IEluZml4T3BlcmF0b3IoMTAsIGZ1bmN0aW9uKHgsIHkpIHsgXG4gICAgICByZXR1cm4geCA9PSB5XG4gICAgfSlcbiAgfVxuXG4gICwgJz09JzogZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gbmV3IEluZml4T3BlcmF0b3IoMTAsIGZ1bmN0aW9uKHgsIHkpIHsgXG4gICAgICAgIHJldHVybiB4ID09IHlcbiAgICAgIH0pXG4gICAgfVxuXG4gICwgJyE9JzogZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gbmV3IEluZml4T3BlcmF0b3IoMTAsIGZ1bmN0aW9uKHgsIHkpIHsgXG4gICAgICAgIHJldHVybiB4ICE9PSB5XG4gICAgICB9KVxuICAgIH1cblxuICAsICc+JzogZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gbmV3IEluZml4T3BlcmF0b3IoMTAsIGZ1bmN0aW9uKHgsIHkpIHsgXG4gICAgICAgIHJldHVybiB4ID4geVxuICAgICAgfSlcbiAgICB9XG5cbiAgLCAnPj0nOiBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBuZXcgSW5maXhPcGVyYXRvcigxMCwgZnVuY3Rpb24oeCwgeSkgeyBcbiAgICAgICAgcmV0dXJuIHggPj0geVxuICAgICAgfSlcbiAgICB9XG5cbiAgLCAnPCc6IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIG5ldyBJbmZpeE9wZXJhdG9yKDEwLCBmdW5jdGlvbih4LCB5KSB7IFxuICAgICAgICByZXR1cm4geCA8IHlcbiAgICAgIH0pXG4gICAgfVxuXG4gICwgJzw9JzogZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gbmV3IEluZml4T3BlcmF0b3IoMTAsIGZ1bmN0aW9uKHgsIHkpIHsgXG4gICAgICAgIHJldHVybiB4IDw9IHlcbiAgICAgIH0pXG4gICAgfVxufVxuXG5mdW5jdGlvbiBpbl9vcGVyYXRvcih4LCB5KSB7XG4gIGlmKCEoeCBpbnN0YW5jZW9mIE9iamVjdCkgJiYgeSBpbnN0YW5jZW9mIE9iamVjdCkge1xuICAgIGlmKCEoeSAmJiAnbGVuZ3RoJyBpbiB5KSkge1xuICAgICAgeSA9IGtleXMoeSlcbiAgICB9XG4gIH1cblxuICBpZih0eXBlb2YoeCkgPT0gJ3N0cmluZycgJiYgdHlwZW9mKHkpID09J3N0cmluZycpIHtcbiAgICByZXR1cm4geS5pbmRleE9mKHgpICE9PSAtMVxuICB9XG5cbiAgaWYoeCA9PT0gdW5kZWZpbmVkIHx8IHggPT09IG51bGwpXG4gICAgcmV0dXJuIGZhbHNlXG5cbiAgaWYoeSA9PT0gdW5kZWZpbmVkIHx8IHkgPT09IG51bGwpXG4gICAgcmV0dXJuIGZhbHNlXG5cbiAgZm9yKHZhciBmb3VuZCA9IGZhbHNlLCBpID0gMCwgbGVuID0geS5sZW5ndGg7IGkgPCBsZW4gJiYgIWZvdW5kOyArK2kpIHtcbiAgICB2YXIgcmhzID0geVtpXVxuICAgIGlmKHggaW5zdGFuY2VvZiBBcnJheSkge1xuICAgICAgZm9yKHZhciBpZHggPSAwLFxuICAgICAgICBlcXVhbCA9IHgubGVuZ3RoID09IHJocy5sZW5ndGgsXG4gICAgICAgIHhsZW4gPSB4Lmxlbmd0aDtcbiAgICAgICAgaWR4IDwgeGxlbiAmJiBlcXVhbDsgKytpZHgpIHtcblxuICAgICAgICBlcXVhbCA9ICh4W2lkeF0gPT09IHJoc1tpZHhdKVxuICAgICAgfVxuICAgICAgZm91bmQgPSBlcXVhbFxuXG4gICAgfSBlbHNlIGlmKHggaW5zdGFuY2VvZiBPYmplY3QpIHtcbiAgICAgIGlmKHggPT09IHJocykge1xuICAgICAgICByZXR1cm4gdHJ1ZVxuICAgICAgfVxuICAgICAgdmFyIHhrZXlzID0ga2V5cyh4KSxcbiAgICAgICAgcmtleXMgPSBrZXlzKHJocylcblxuICAgICAgaWYoeGtleXMubGVuZ3RoID09PSBya2V5cy5sZW5ndGgpIHsgXG4gICAgICAgIGZvcih2YXIgaSA9IDAsIGxlbiA9IHhrZXlzLmxlbmd0aCwgZXF1YWwgPSB0cnVlO1xuICAgICAgICAgIGkgPCBsZW4gJiYgZXF1YWw7XG4gICAgICAgICAgKytpKSB7XG4gICAgICAgICAgZXF1YWwgPSB4a2V5c1tpXSA9PT0gcmtleXNbaV0gJiZcbiAgICAgICAgICAgICAgeFt4a2V5c1tpXV0gPT09IHJoc1tya2V5c1tpXV1cbiAgICAgICAgfVxuICAgICAgICBmb3VuZCA9IGVxdWFsXG4gICAgICB9IFxuICAgIH0gZWxzZSB7XG4gICAgICBmb3VuZCA9IHggPT0gcmhzXG4gICAgfVxuICB9XG4gIHJldHVybiBmb3VuZFxufVxuIiwibW9kdWxlLmV4cG9ydHMgPSBJZlBhcnNlclxuXG52YXIgTGl0ZXJhbFRva2VuID0gcmVxdWlyZSgnLi9saXRlcmFsJylcbiAgLCBFbmRUb2tlbiA9IHJlcXVpcmUoJy4vZW5kJylcbiAgLCBvcGVyYXRvcnMgPSByZXF1aXJlKCcuL29wZXJhdG9ycycpXG5cbmZ1bmN0aW9uIElmUGFyc2VyKHRva2VucywgcGFyc2VyKSB7XG4gIHRoaXMuY3JlYXRlVmFyaWFibGUgPSBmdW5jdGlvbih0b2tlbikge1xuICAgIHJldHVybiBuZXcgTGl0ZXJhbFRva2VuKHBhcnNlci5jb21waWxlKHRva2VuKSwgdG9rZW4pXG4gIH1cblxuICB2YXIgbGVuID0gdG9rZW5zLmxlbmd0aFxuICAgICwgaSA9IDBcbiAgICAsIG1hcHBlZFRva2VucyA9IFtdXG4gICAgLCB0b2tlblxuXG4gIHdoaWxlKGkgPCBsZW4pIHtcbiAgICB0b2tlbiA9IHRva2Vuc1tpXVxuICAgIGlmKHRva2VuID09ICdub3QnICYmIHRva2Vuc1tpKzFdID09ICdpbicpIHtcbiAgICAgICsraVxuICAgICAgdG9rZW4gPSAnbm90IGluJ1xuICAgIH1cbiAgICBtYXBwZWRUb2tlbnMucHVzaCh0aGlzLnRyYW5zbGF0ZVRva2VuKHRva2VuKSlcbiAgICArK2lcbiAgfVxuXG4gIHRoaXMucG9zID0gMFxuICB0aGlzLnRva2VucyA9IG1hcHBlZFRva2Vuc1xuICB0aGlzLmN1cnJlbnRUb2tlbiA9IHRoaXMubmV4dCgpXG59XG5cbnZhciBjb25zID0gSWZQYXJzZXJcbiAgLCBwcm90byA9IGNvbnMucHJvdG90eXBlXG5cbnByb3RvLnRyYW5zbGF0ZVRva2VuID0gZnVuY3Rpb24odG9rZW4pIHtcbiAgdmFyIG9wID0gb3BlcmF0b3JzW3Rva2VuXVxuXG4gIGlmKG9wID09PSB1bmRlZmluZWQpIHtcbiAgICByZXR1cm4gdGhpcy5jcmVhdGVWYXJpYWJsZSh0b2tlbilcbiAgfVxuXG4gIHJldHVybiBvcCgpXG59XG5cbnByb3RvLm5leHQgPSBmdW5jdGlvbigpIHtcbiAgaWYodGhpcy5wb3MgPj0gdGhpcy50b2tlbnMubGVuZ3RoKSB7XG4gICAgcmV0dXJuIG5ldyBFbmRUb2tlbigpXG4gIH1cbiAgcmV0dXJuIHRoaXMudG9rZW5zW3RoaXMucG9zKytdXG59XG5cbnByb3RvLnBhcnNlID0gZnVuY3Rpb24oKSB7XG4gIHZhciByZXR2YWwgPSB0aGlzLmV4cHJlc3Npb24oKVxuXG4gIGlmKCEodGhpcy5jdXJyZW50VG9rZW4uY29uc3RydWN0b3IgPT09IEVuZFRva2VuKSkge1xuICAgIHRocm93IG5ldyBFcnJvcihcIlVudXNlZCBcIit0aGlzLmN1cnJlbnRUb2tlbitcIiBhdCBlbmQgb2YgaWYgZXhwcmVzc2lvbi5cIilcbiAgfVxuXG4gIHJldHVybiByZXR2YWxcbn1cblxucHJvdG8uZXhwcmVzc2lvbiA9IGZ1bmN0aW9uKHJicCkge1xuICByYnAgPSByYnAgfHwgMFxuXG4gIHZhciB0ID0gdGhpcy5jdXJyZW50VG9rZW5cbiAgICAsIGxlZnRcblxuICB0aGlzLmN1cnJlbnRUb2tlbiA9IHRoaXMubmV4dCgpXG5cbiAgbGVmdCA9IHQubnVkKHRoaXMpXG4gIHdoaWxlKHJicCA8IHRoaXMuY3VycmVudFRva2VuLmxicCkge1xuICAgIHQgPSB0aGlzLmN1cnJlbnRUb2tlblxuXG4gICAgdGhpcy5jdXJyZW50VG9rZW4gPSB0aGlzLm5leHQoKVxuXG4gICAgbGVmdCA9IHQubGVkKGxlZnQsIHRoaXMpXG4gIH1cblxuICByZXR1cm4gbGVmdFxufVxuIiwibW9kdWxlLmV4cG9ydHMgPSBQcmVmaXhPcGVyYXRvclxuXG52YXIgUHJvbWlzZSA9IHJlcXVpcmUoJy4uLy4uL3Byb21pc2UnKVxuXG5mdW5jdGlvbiBQcmVmaXhPcGVyYXRvcihicCwgY21wKSB7XG4gIHRoaXMubGJwID0gYnBcbiAgdGhpcy5jbXAgPSBjbXBcblxuICB0aGlzLmZpcnN0ID0gXG4gIHRoaXMuc2Vjb25kID0gbnVsbFxufVxuXG52YXIgY29ucyA9IFByZWZpeE9wZXJhdG9yXG4gICwgcHJvdG8gPSBjb25zLnByb3RvdHlwZVxuXG5wcm90by5udWQgPSBmdW5jdGlvbihwYXJzZXIpIHtcbiAgdGhpcy5maXJzdCA9IHBhcnNlci5leHByZXNzaW9uKHRoaXMubGJwKVxuICB0aGlzLnNlY29uZCA9IG51bGxcbiAgcmV0dXJuIHRoaXNcbn1cblxucHJvdG8ubGVkID0gZnVuY3Rpb24oZmlyc3QsIHBhcnNlcikge1xuICB0aHJvdyBuZXcgRXJyb3IoXCJVbmV4cGVjdGVkIHRva2VuXCIpXG59XG5cbnByb3RvLmV2YWx1YXRlID0gZnVuY3Rpb24oY29udGV4dCwgZmlyc3QsIHRpbWVzKSB7XG4gIHZhciBzZWxmID0gdGhpc1xuICAgICwgcHJvbWlzZVxuXG4gIGZpcnN0ID0gdGltZXMgPT09IDEgPyBmaXJzdCA6IHNlbGYuZmlyc3QuZXZhbHVhdGUoY29udGV4dClcblxuICBpZihmaXJzdCAmJiBmaXJzdC5jb25zdHJ1Y3RvciA9PT0gUHJvbWlzZSkge1xuICAgIHByb21pc2UgPSBuZXcgUHJvbWlzZVxuXG4gICAgZmlyc3Qub25jZSgnZG9uZScsIGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgIHByb21pc2UucmVzb2x2ZShzZWxmLmV2YWx1YXRlKGNvbnRleHQsIGRhdGEsIDEpKVxuICAgIH0pXG5cbiAgICByZXR1cm4gcHJvbWlzZVxuICB9XG5cbiAgcmV0dXJuIHNlbGYuY21wKGZpcnN0KVxufVxuIiwibW9kdWxlLmV4cG9ydHMgPSBJbmNsdWRlTm9kZVxuXG52YXIgUHJvbWlzZSA9IHJlcXVpcmUoJy4uL3Byb21pc2UnKVxuXG5mdW5jdGlvbiBJbmNsdWRlTm9kZSh0YXJnZXRfdmFyLCBsb2FkZXIpIHtcbiAgdGhpcy50YXJnZXRfdmFyID0gdGFyZ2V0X3ZhclxuICB0aGlzLmxvYWRlciA9IGxvYWRlclxufVxuXG52YXIgY29ucyA9IEluY2x1ZGVOb2RlXG4gICwgcHJvdG8gPSBjb25zLnByb3RvdHlwZVxuXG5jb25zLnBhcnNlID0gZnVuY3Rpb24oY29udGVudHMsIHBhcnNlcikge1xuICB2YXIgYml0cyA9IGNvbnRlbnRzLnNwbGl0KCcgJylcbiAgICAsIHZhcm5hbWUgPSBwYXJzZXIuY29tcGlsZShiaXRzLnNsaWNlKDEpLmpvaW4oJyAnKSlcbiAgICAsIGxvYWRlciA9IHBhcnNlci5wbHVnaW5zLmxvb2t1cCgnbG9hZGVyJylcblxuICByZXR1cm4gbmV3IGNvbnModmFybmFtZSwgbG9hZGVyKSBcbn1cblxucHJvdG8ucmVuZGVyID0gZnVuY3Rpb24oY29udGV4dCwgdGFyZ2V0KSB7XG4gIHZhciBzZWxmID0gdGhpc1xuICAgICwgcHJvbWlzZVxuXG4gIHRhcmdldCA9IHRhcmdldCB8fCB0aGlzLnRhcmdldF92YXIucmVzb2x2ZShjb250ZXh0KVxuXG4gIGlmKHRhcmdldCAmJiB0YXJnZXQuY29uc3RydWN0b3IgPT09IFByb21pc2UpIHtcbiAgICBwcm9taXNlID0gbmV3IFByb21pc2VcblxuICAgIHRhcmdldC5vbmNlKCdkb25lJywgZnVuY3Rpb24oZGF0YSkge1xuICAgICAgcHJvbWlzZS5yZXNvbHZlKHNlbGYucmVuZGVyKGNvbnRleHQsIGRhdGEpKVxuICAgIH0pXG5cbiAgICByZXR1cm4gcHJvbWlzZVxuICB9XG5cbiAgdGFyZ2V0ID0gc2VsZi5nZXRfdGVtcGxhdGUodGFyZ2V0KVxuXG4gIGlmKHRhcmdldCAmJiB0YXJnZXQuY29uc3RydWN0b3IgPT09IFByb21pc2UpIHtcbiAgICBwcm9taXNlID0gbmV3IFByb21pc2VcblxuICAgIHRhcmdldC5vbmNlKCdkb25lJywgZnVuY3Rpb24oZGF0YSkge1xuICAgICAgcHJvbWlzZS5yZXNvbHZlKHNlbGYucmVuZGVyKGNvbnRleHQsIGRhdGEpKVxuICAgIH0pICBcblxuICAgIHJldHVybiBwcm9taXNlXG4gIH1cblxuICBwcm9taXNlID0gbmV3IFByb21pc2VcblxuICB0YXJnZXQucmVuZGVyKGNvbnRleHQuY29weSgpLCBmdW5jdGlvbihlcnIsIGRhdGEpIHtcbiAgICBwcm9taXNlLnJlc29sdmUoZGF0YSlcbiAgfSlcblxuICByZXR1cm4gcHJvbWlzZVxufVxuXG5wcm90by5nZXRfdGVtcGxhdGUgPSBmdW5jdGlvbih0YXJnZXQpIHtcbiAgaWYodHlwZW9mIHRhcmdldCA9PT0gJ3N0cmluZycpIHtcbiAgICByZXR1cm4gdGhpcy5sb2FkZXIodGFyZ2V0KVxuICB9XG5cbiAgLy8gb2theSwgaXQncyBwcm9iYWJseSBhIHRlbXBsYXRlIG9iamVjdFxuICByZXR1cm4gdGFyZ2V0XG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IE5vd05vZGVcblxudmFyIGZvcm1hdCA9IHJlcXVpcmUoJy4uL2RhdGUnKS5kYXRlXG5cbmZ1bmN0aW9uIE5vd05vZGUoZm9ybWF0U3RyaW5nKSB7XG4gIHRoaXMuZm9ybWF0ID0gZm9ybWF0U3RyaW5nXG59XG5cbnZhciBjb25zID0gTm93Tm9kZVxuICAsIHByb3RvID0gY29ucy5wcm90b3R5cGVcblxucHJvdG8ucmVuZGVyID0gZnVuY3Rpb24oY29udGV4dCkge1xuICByZXR1cm4gZm9ybWF0KG5ldyBEYXRlLCB0aGlzLmZvcm1hdClcbn1cblxuY29ucy5wYXJzZSA9IGZ1bmN0aW9uKGNvbnRlbnRzLCBwYXJzZXIpIHtcbiAgdmFyIGJpdHMgPSBjb250ZW50cy5zcGxpdCgnICcpXG4gICAgLCBmbXQgPSBiaXRzLnNsaWNlKDEpLmpvaW4oJyAnKVxuXG4gIGZtdCA9IGZtdFxuICAgIC5yZXBsYWNlKC9eXFxzKy8sICcnKVxuICAgIC5yZXBsYWNlKC9cXHMrJC8sICcnKVxuXG4gIGlmKC9bJ1wiXS8udGVzdChmbXQuY2hhckF0KDApKSkge1xuICAgIGZtdCA9IGZtdC5zbGljZSgxLCAtMSlcbiAgfVxuXG4gIHJldHVybiBuZXcgTm93Tm9kZShmbXQgfHwgJ04gaiwgWScpXG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IFdpdGhOb2RlXG5cbnZhciBQcm9taXNlID0gcmVxdWlyZSgnLi4vcHJvbWlzZScpXG5cbmZ1bmN0aW9uIFdpdGhOb2RlKHdpdGhfdmFyLCBhc192YXIsIG5vZGVzKSB7XG4gIHRoaXMud2l0aF92YXIgPSB3aXRoX3ZhclxuICB0aGlzLmFzX3ZhciA9IGFzX3ZhclxuICB0aGlzLm5vZGVzID0gbm9kZXNcbn1cblxudmFyIGNvbnMgPSBXaXRoTm9kZVxuICAsIHByb3RvID0gY29ucy5wcm90b3R5cGVcblxuY29ucy5wYXJzZSA9IGZ1bmN0aW9uKGNvbnRlbnRzLCBwYXJzZXIpIHtcbiAgdmFyIGJpdHMgPSBjb250ZW50cy5zcGxpdCgvXFxzKy9nKVxuICAgICwgd2l0aHZhciA9IHBhcnNlci5jb21waWxlKGJpdHNbMV0pXG4gICAgLCBhc3ZhciA9IGJpdHNbM11cbiAgICAsIG5vZGVsaXN0ID0gcGFyc2VyLnBhcnNlKFsnZW5kd2l0aCddKVxuXG4gIHBhcnNlci50b2tlbnMuc2hpZnQoKVxuICByZXR1cm4gbmV3IGNvbnMod2l0aHZhciwgYXN2YXIsIG5vZGVsaXN0KVxufVxuXG5wcm90by5yZW5kZXIgPSBmdW5jdGlvbihjb250ZXh0LCB2YWx1ZSkge1xuICB2YXIgc2VsZiA9IHRoaXMgXG4gICAgLCByZXN1bHRcbiAgICAsIHByb21pc2VcblxuICB2YWx1ZSA9IGFyZ3VtZW50cy5sZW5ndGggPT09IDIgPyB2YWx1ZSA6IHNlbGYud2l0aF92YXIucmVzb2x2ZShjb250ZXh0KVxuXG4gIGlmKHZhbHVlICYmIHZhbHVlLmNvbnN0cnVjdG9yID09PSBQcm9taXNlKSB7XG4gICAgcHJvbWlzZSA9IG5ldyBQcm9taXNlXG5cbiAgICB2YWx1ZS5vbmNlKCdkb25lJywgZnVuY3Rpb24oZGF0YSkge1xuICAgICAgcHJvbWlzZS5yZXNvbHZlKHNlbGYucmVuZGVyKGNvbnRleHQsIGRhdGEpKVxuICAgIH0pXG5cbiAgICByZXR1cm4gcHJvbWlzZVxuICB9XG5cbiAgY29udGV4dCA9IGNvbnRleHQuY29weSgpXG4gIGNvbnRleHRbc2VsZi5hc192YXJdID0gdmFsdWVcblxuICByZXN1bHQgPSBzZWxmLm5vZGVzLnJlbmRlcihjb250ZXh0KVxuXG4gIHJldHVybiByZXN1bHRcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gVGV4dE5vZGVcblxuZnVuY3Rpb24gVGV4dE5vZGUoY29udGVudCkge1xuICB0aGlzLmNvbnRlbnQgPSBjb250ZW50XG59XG5cbnZhciBjb25zID0gVGV4dE5vZGVcbiAgLCBwcm90byA9IGNvbnMucHJvdG90eXBlXG5cbnByb3RvLnJlbmRlciA9IGZ1bmN0aW9uKGNvbnRleHQpIHtcbiAgcmV0dXJuIHRoaXMuY29udGVudFxufVxuIiwibW9kdWxlLmV4cG9ydHMgPSBUZXh0VG9rZW5cblxudmFyIFRva2VuID0gcmVxdWlyZSgnLi90b2tlbicpXG4gICwgVGV4dE5vZGUgPSByZXF1aXJlKCcuL3RleHRfbm9kZScpXG5cbmZ1bmN0aW9uIFRleHRUb2tlbihjb250ZW50LCBsaW5lKSB7XG4gIFRva2VuLmNhbGwodGhpcywgY29udGVudCwgbGluZSlcbn1cblxudmFyIGNvbnMgPSBUZXh0VG9rZW5cbiAgLCBwcm90byA9IGNvbnMucHJvdG90eXBlID0gbmV3IFRva2VuXG5cbnByb3RvLmNvbnN0cnVjdG9yID0gY29uc1xuXG5wcm90by5ub2RlID0gZnVuY3Rpb24ocGFyc2VyKSB7XG4gIHJldHVybiBuZXcgVGV4dE5vZGUodGhpcy5jb250ZW50KVxufVxuIiwibW9kdWxlLmV4cG9ydHMgPSBUb2tlblxuXG5mdW5jdGlvbiBUb2tlbihjb250ZW50LCBsaW5lKSB7XG4gIHRoaXMuY29udGVudCA9IGNvbnRlbnRcbiAgdGhpcy5saW5lID0gbGluZVxuXG4gIHRoaXMubmFtZSA9IGNvbnRlbnQgJiYgY29udGVudC5zcGxpdCgnICcpWzBdXG59XG5cbnZhciBjb25zID0gVG9rZW5cbiAgLCBwcm90byA9IGNvbnMucHJvdG90eXBlXG5cbnByb3RvLnRvU3RyaW5nID0gZnVuY3Rpb24oKSB7XG4gIC8vIE5COiB0aGlzIHNob3VsZCBvbmx5IGJlXG4gIC8vIGRlYnVnIG91dHB1dCwgc28gaXQnc1xuICAvLyBwcm9iYWJseSBzYWZlIHRvIHVzZVxuICAvLyBKU09OLnN0cmluZ2lmeSBoZXJlLlxuICByZXR1cm4gJzwnK3RoaXMuY29uc3RydWN0b3IubmFtZSsnOiAnK0pTT04uc3RyaW5naWZ5KHRoaXMuY29udGVudCkrJz4nXG59XG5cbnByb3RvLmlzID0gZnVuY3Rpb24obmFtZXMpIHtcbiAgZm9yKHZhciBpID0gMCwgbGVuID0gbmFtZXMubGVuZ3RoOyBpIDwgbGVuOyArK2kpXG4gICAgaWYobmFtZXNbaV0gPT09IHRoaXMubmFtZSlcbiAgICAgIHJldHVybiB0cnVlXG4gIHJldHVybiBmYWxzZVxufVxuIiwiOyhmdW5jdGlvbigpIHtcblxuLy8gc28sIHRoZSBvbmx5IHdheSB3ZSAocmVsaWFibHkpIGdldCBhY2Nlc3MgdG8gRFNUIGluIGphdmFzY3JpcHRcbi8vIGlzIHZpYSBgRGF0ZSNnZXRUaW1lem9uZU9mZnNldGAuXG4vL1xuLy8gdGhpcyB2YWx1ZSB3aWxsIHN3aXRjaCBmb3IgYSBnaXZlbiBkYXRlIGJhc2VkIG9uIHRoZSBwcmVzZW5jZSBvciBhYnNlbmNlXG4vLyBvZiBEU1QgYXQgdGhhdCBkYXRlLlxuXG5mdW5jdGlvbiBmaW5kX2RzdF90aHJlc2hvbGQgKG5lYXIsIGZhcikge1xuICB2YXIgbmVhcl9kYXRlID0gbmV3IERhdGUobmVhcilcbiAgICAsIGZhcl9kYXRlID0gbmV3IERhdGUoZmFyKVxuICAgICwgbmVhcl9vZmZzID0gbmVhcl9kYXRlLmdldFRpbWV6b25lT2Zmc2V0KClcbiAgICAsIGZhcl9vZmZzID0gZmFyX2RhdGUuZ2V0VGltZXpvbmVPZmZzZXQoKVxuXG4gIGlmKG5lYXJfb2ZmcyA9PT0gZmFyX29mZnMpIHJldHVybiAwXG5cbiAgaWYoTWF0aC5hYnMobmVhcl9kYXRlIC0gZmFyX2RhdGUpIDwgMTAwMCkgcmV0dXJuIG5lYXJfZGF0ZVxuXG4gIHJldHVybiBmaW5kX2RzdF90aHJlc2hvbGQobmVhciwgbmVhcisoZmFyLW5lYXIpLzIpIHx8IGZpbmRfZHN0X3RocmVzaG9sZChuZWFyKyhmYXItbmVhcikvMiwgZmFyKVxufVxuXG5cbmZ1bmN0aW9uIGZpbmRfZHN0X3RocmVzaG9sZHMoKSB7XG4gIHZhciBkID0gbmV3IERhdGUoKVxuICAgICwgZCA9IG5ldyBEYXRlKGQuZ2V0RnVsbFllYXIoKSwgMCwgMSlcbiAgICAsIGYgPSBuZXcgRGF0ZShkLmdldEZ1bGxZZWFyKCksIDExLCAzMSlcbiAgICAsIHhcbiAgICAsIGZpcnN0XG4gICAgLCBzZWNvbmRcblxuICB4ID0gKGYgLSBkKSAvIC0yXG4gIGZpcnN0ID0gZmluZF9kc3RfdGhyZXNob2xkKCtkLCBkIC0geClcbiAgc2Vjb25kID0gZmluZF9kc3RfdGhyZXNob2xkKGQgLSB4LCArZilcblxuICByZXR1cm4ge1xuICAgIHNwcmluZ19mb3J3YXJkICA6IGZpcnN0ID8gKGZpcnN0LmdldFRpbWV6b25lT2Zmc2V0KCkgPCBzZWNvbmQuZ2V0VGltZXpvbmVPZmZzZXQoKSA/IHNlY29uZCA6IGZpcnN0KSAtIG5ldyBEYXRlKGQuZ2V0RnVsbFllYXIoKSwgMCwgMSwgMCwgMCkgOiAwXG4gICwgZmFsbF9iYWNrICAgICAgIDogZmlyc3QgPyAoZmlyc3QuZ2V0VGltZXpvbmVPZmZzZXQoKSA8IHNlY29uZC5nZXRUaW1lem9uZU9mZnNldCgpID8gZmlyc3QgOiBzZWNvbmQpIC0gbmV3IERhdGUoZC5nZXRGdWxsWWVhcigpLCAwLCAxLCAwLCAwKSA6IDBcbiAgfVxufVxuXG52YXIgVEhSRVNIT0xEUyA9IGZpbmRfZHN0X3RocmVzaG9sZHMoKVxuXG5mdW5jdGlvbiBpc19kc3QoZGF0ZXRpbWUsIHRocmVzaG9sZHMpIHtcblxuICB0aHJlc2hvbGRzID0gdGhyZXNob2xkcyB8fCBUSFJFU0hPTERTXG5cbiAgaWYodGhyZXNob2xkcy5zcHJpbmdfZm9yd2FyZCA9PT0gdGhyZXNob2xkcy5mYWxsX2JhY2spXG4gICAgcmV0dXJuIGZhbHNlXG5cbiAgdmFyIG9mZnNldCA9IGRhdGV0aW1lIC0gbmV3IERhdGUoZGF0ZXRpbWUuZ2V0RnVsbFllYXIoKSwgMCwgMSwgMCwgMClcbiAgICAsIGRzdF9pc19yZXZlcnNlZCA9IHRocmVzaG9sZHMuc3ByaW5nX2ZvcndhcmQgPiB0aHJlc2hvbGRzLmZhbGxfYmFja1xuICAgICwgbWF4ID0gTWF0aC5tYXgodGhyZXNob2xkcy5mYWxsX2JhY2ssIHRocmVzaG9sZHMuc3ByaW5nX2ZvcndhcmQpXG4gICAgLCBtaW4gPSBNYXRoLm1pbih0aHJlc2hvbGRzLmZhbGxfYmFjaywgdGhyZXNob2xkcy5zcHJpbmdfZm9yd2FyZClcblxuICBpZihtaW4gPCBvZmZzZXQgJiYgb2Zmc2V0IDwgbWF4KVxuICAgIHJldHVybiAhZHN0X2lzX3JldmVyc2VkXG4gIHJldHVybiBkc3RfaXNfcmV2ZXJzZWRcbn1cblxuRGF0ZS5wcm90b3R5cGUuaXNEU1QgPSBmdW5jdGlvbih0aHJlc2hvbGRzKSB7XG4gIHJldHVybiBpc19kc3QodGhpcywgdGhyZXNob2xkcykgXG59XG5cbmlzX2RzdC5maW5kX3RocmVzaG9sZHMgPSBmaW5kX2RzdF90aHJlc2hvbGRzXG5cbmlmKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnKSB7XG4gIG1vZHVsZS5leHBvcnRzID0gaXNfZHN0XG59IGVsc2Uge1xuICB3aW5kb3cuaXNfZHN0ID0gaXNfZHN0IFxufVxuXG59KSgpXG4iLCJ2YXIgdHogPSByZXF1aXJlKCcuL3R6JylcbiAgLCBpc0RTVCA9IHJlcXVpcmUoJ2RzdCcpXG5cbm1vZHVsZS5leHBvcnRzID0gdHppbmZvXG5cbmZ1bmN0aW9uIGdldF9vZmZzZXRfZm10KHR6b2Zmcykge1xuICB2YXIgb2ZmcyA9IH5+KHR6b2ZmcyAvIDYwKVxuICAgICwgbWlucyA9ICgnMDAnICsgfn5NYXRoLmFicyh0em9mZnMgJSA2MCkpLnNsaWNlKC0yKVxuXG4gIG9mZnMgPSAoKHR6b2ZmcyA+IDApID8gJy0nIDogJysnKSArICgnMDAnICsgTWF0aC5hYnMob2ZmcykpLnNsaWNlKC0yKSArIG1pbnNcblxuICByZXR1cm4gb2Zmc1xufVxuXG5mdW5jdGlvbiB0emluZm8oZGF0ZSwgdHpfbGlzdCwgZGV0ZXJtaW5lX2RzdCwgVFopIHtcblxuICB2YXIgZm10ID0gZ2V0X29mZnNldF9mbXQoZGF0ZS5nZXRUaW1lem9uZU9mZnNldCgpKVxuXG4gIFRaID0gVFogfHwgdHpcbiAgdHpfbGlzdCA9IHR6X2xpc3QgfHwgVFpbZm10XVxuICBkZXRlcm1pbmVfZHN0ID0gZGV0ZXJtaW5lX2RzdCB8fCBpc0RTVFxuXG4gIHZhciBkYXRlX2lzX2RzdCA9IGRldGVybWluZV9kc3QoZGF0ZSlcbiAgICAsIGRhdGVfZHN0X3RocmVzaG9sZHMgPSBkZXRlcm1pbmVfZHN0LmZpbmRfdGhyZXNob2xkcygpXG4gICAgLCBoYXNfZHN0ID0gZGF0ZV9kc3RfdGhyZXNob2xkcy5zcHJpbmdfZm9yd2FyZCAhPT0gZGF0ZV9kc3RfdGhyZXNob2xkcy5mYWxsX2JhY2tcbiAgICAsIGlzX25vcnRoID0gaGFzX2RzdCAmJiBkYXRlX2RzdF90aHJlc2hvbGRzLnNwcmluZ19mb3J3YXJkIDwgZGF0ZV9kc3RfdGhyZXNob2xkcy5mYWxsX2JhY2sgXG4gICAgLCBsaXN0ID0gKHR6X2xpc3QgfHwgW10pLnNsaWNlKClcbiAgICAsIGZpbHRlcmVkID0gW11cblxuICB2YXIgZGF0ZXN0cm9mZnNldCA9IC9cXCgoLio/KVxcKS8uZXhlYygnJyArIG5ldyBEYXRlKCkpXG5cbiAgaWYoZGF0ZXN0cm9mZnNldCkge1xuICAgIGRhdGVzdHJvZmZzZXQgPSBkYXRlc3Ryb2Zmc2V0WzFdXG5cbiAgICBmb3IodmFyIGkgPSAwLCBsZW4gPSBsaXN0Lmxlbmd0aDsgaSA8IGxlbjsgKytpKSB7XG4gICAgICBpZihsaXN0W2ldLmFiYnIgPT09IGRhdGVzdHJvZmZzZXQpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICduYW1lJzogbGlzdFtpXS5uYW1lXG4gICAgICAgICAgLCAnbG9jJzogbGlzdFtpXS5sb2NcbiAgICAgICAgICAsICdhYmJyJzogbGlzdFtpXS5hYmJyXG4gICAgICAgICAgLCAnb2Zmc2V0JzogZm10XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuXG4gIGlmKCFpc19ub3J0aClcbiAgICBsaXN0ID0gbGlzdC5yZXZlcnNlKClcblxuICBmb3IodmFyIGkgPSAwLCBsZW4gPSBsaXN0Lmxlbmd0aDsgaSA8IGxlbjsgKytpKSB7XG4gICAgaWYoZGF0ZV9pc19kc3QgPT09IC8oW0RkXWF5bGlnaHR8W1NzXXVtbWVyKS8udGVzdChsaXN0W2ldLm5hbWUpKSB7XG4gICAgICBmaWx0ZXJlZC5wdXNoKGxpc3RbaV0pXG4gICAgfVxuICB9XG4gIGxpc3QgPSBmaWx0ZXJlZFxuICBpZighbGlzdC5sZW5ndGgpIHJldHVybiB7fVxuXG4gIHJldHVybiB7XG4gICAgICAnbmFtZSc6ICAgICBsaXN0WzBdLm5hbWVcbiAgICAsICdsb2MnOiAgICAgIGxpc3RbMF0ubG9jXG4gICAgLCAnYWJicic6ICAgICBsaXN0WzBdLmFiYnJcbiAgICAsICdvZmZzZXQnOiAgIGZtdFxuICB9XG59IFxuXG50emluZm8uZ2V0X29mZnNldF9mb3JtYXQgPSBnZXRfb2Zmc2V0X2ZtdFxudHppbmZvLnR6X2xpc3QgPSB0elxuXG5EYXRlLnByb3RvdHlwZS50emluZm8gPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIHR6aW5mbyh0aGlzKVxufVxuXG5EYXRlLnByb3RvdHlwZS50em9mZnNldCA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gJ0dNVCcrZ2V0X29mZnNldF9mbXQodGhpcy5nZXRUaW1lem9uZU9mZnNldCgpKVxufVxuIiwibW9kdWxlLmV4cG9ydHMgPSB7XG4gIFwiKzA5MDBcIjogW1xuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiQXNpYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIkpTVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIkphcGFuIFN0YW5kYXJkIFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiQXNpYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIktTVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIktvcmVhIFN0YW5kYXJkIFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiQXVzdHJhbGlhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiV0RUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiV2VzdGVybiBEYXlsaWdodCBUaW1lXCJcbiAgICB9IFxuICBdLCBcbiAgXCIrMTM0NVwiOiBbXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJQYWNpZmljXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiQ0hBRFRcIiwgXG4gICAgICBcIm5hbWVcIjogXCJDaGF0aGFtIElzbGFuZCBEYXlsaWdodCBUaW1lXCJcbiAgICB9XG4gIF0sIFxuICBcIiswNTAwXCI6IFtcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIkFzaWFcIiwgXG4gICAgICBcImFiYnJcIjogXCJQS1RcIiwgXG4gICAgICBcIm5hbWVcIjogXCJQYWtpc3RhbiBTdGFuZGFyZCBUaW1lXCJcbiAgICB9IFxuICBdLCBcbiAgXCIrMDQzMFwiOiBbXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJBc2lhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiQUZUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiQWZnaGFuaXN0YW4gVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJBc2lhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiSVJEVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIklyYW4gRGF5bGlnaHQgVGltZVwiXG4gICAgfVxuICBdLCBcbiAgXCIrMTIwMFwiOiBbXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJBc2lhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiQU5BU1RcIiwgXG4gICAgICBcIm5hbWVcIjogXCJBbmFkeXIgU3VtbWVyIFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiQXNpYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIkFOQVRcIiwgXG4gICAgICBcIm5hbWVcIjogXCJBbmFkeXIgVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJQYWNpZmljXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiRkpUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiRmlqaSBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIlBhY2lmaWNcIiwgXG4gICAgICBcImFiYnJcIjogXCJHSUxUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiR2lsYmVydCBJc2xhbmQgVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJBc2lhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiTUFHU1RcIiwgXG4gICAgICBcIm5hbWVcIjogXCJNYWdhZGFuIFN1bW1lciBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIlBhY2lmaWNcIiwgXG4gICAgICBcImFiYnJcIjogXCJNSFRcIiwgXG4gICAgICBcIm5hbWVcIjogXCJNYXJzaGFsbCBJc2xhbmRzIFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiUGFjaWZpY1wiLCBcbiAgICAgIFwiYWJiclwiOiBcIk5aU1RcIiwgXG4gICAgICBcIm5hbWVcIjogXCJOZXcgWmVhbGFuZCBTdGFuZGFyZCBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIkFzaWFcIiwgXG4gICAgICBcImFiYnJcIjogXCJQRVRTVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIkthbWNoYXRrYSBTdW1tZXIgVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJBc2lhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiUEVUVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIkthbWNoYXRrYSBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIlBhY2lmaWNcIiwgXG4gICAgICBcImFiYnJcIjogXCJUVlRcIiwgXG4gICAgICBcIm5hbWVcIjogXCJUdXZhbHUgVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJQYWNpZmljXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiV0ZUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiV2FsbGlzIGFuZCBGdXR1bmEgVGltZVwiXG4gICAgfVxuICBdLCBcbiAgXCItMTEwMFwiOiBbXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJQYWNpZmljXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiU1NUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiU2Ftb2EgU3RhbmRhcmQgVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJQYWNpZmljXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiV1NUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiV2VzdCBTYW1vYSBUaW1lXCJcbiAgICB9IFxuICBdLCBcbiAgXCIrMTQwMFwiOiBbXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJQYWNpZmljXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiTElOVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIkxpbmUgSXNsYW5kcyBUaW1lXCJcbiAgICB9XG4gIF0sIFxuICBcIi0wMjMwXCI6IFtcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIk5vcnRoIEFtZXJpY2FcIiwgXG4gICAgICBcImFiYnJcIjogXCJIQVRcIiwgXG4gICAgICBcIm5hbWVcIjogXCJIZXVyZSBBdmFuY1xcdTAwZTllIGRlIFRlcnJlLU5ldXZlXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIk5vcnRoIEFtZXJpY2FcIiwgXG4gICAgICBcImFiYnJcIjogXCJORFRcIiwgXG4gICAgICBcIm5hbWVcIjogXCJOZXdmb3VuZGxhbmQgRGF5bGlnaHQgVGltZVwiXG4gICAgfVxuICBdLCBcbiAgXCItMDEwMFwiOiBbXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJBZnJpY2FcIiwgXG4gICAgICBcImFiYnJcIjogXCJDVlRcIiwgXG4gICAgICBcIm5hbWVcIjogXCJDYXBlIFZlcmRlIFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiTm9ydGggQW1lcmljYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIkVHVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIkVhc3QgR3JlZW5sYW5kIFRpbWVcIlxuICAgIH0gXG4gIF0sIFxuICBcIi0xMjAwXCI6IFtcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIk1pbGl0YXJ5XCIsIFxuICAgICAgXCJhYmJyXCI6IFwiWVwiLCBcbiAgICAgIFwibmFtZVwiOiBcIllhbmtlZSBUaW1lIFpvbmVcIlxuICAgIH1cbiAgXSwgXG4gIFwiKzA4MDBcIjogW1xuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiQXNpYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIkNTVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIkNoaW5hIFN0YW5kYXJkIFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiQXNpYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIktSQVNUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiS3Jhc25veWFyc2sgU3VtbWVyIFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiQXVzdHJhbGlhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiV1NUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiV2VzdGVybiBTdGFuZGFyZCBUaW1lXCJcbiAgICB9XG4gIF0sIFxuICBcIiswNjMwXCI6IFtcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIkFzaWFcIiwgXG4gICAgICBcImFiYnJcIjogXCJNTVRcIiwgXG4gICAgICBcIm5hbWVcIjogXCJNeWFubWFyIFRpbWVcIlxuICAgIH0sXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJJbmRpYW4gT2NlYW5cIiwgXG4gICAgICBcImFiYnJcIjogXCJDQ1RcIiwgXG4gICAgICBcIm5hbWVcIjogXCJDb2NvcyBJc2xhbmRzIFRpbWVcIlxuICAgIH1cbiAgXSwgXG4gIFwiLTA0MzBcIjogW1xuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiU291dGggQW1lcmljYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIkhMVlwiLCBcbiAgICAgIFwibmFtZVwiOiBcIkhvcmEgTGVnYWwgZGUgVmVuZXp1ZWxhXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIlNvdXRoIEFtZXJpY2FcIiwgXG4gICAgICBcImFiYnJcIjogXCJWRVRcIiwgXG4gICAgICBcIm5hbWVcIjogXCJWZW5lenVlbGFuIFN0YW5kYXJkIFRpbWVcIlxuICAgIH1cbiAgXSwgXG4gIFwiLTA3MDBcIjogW1xuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiTm9ydGggQW1lcmljYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIk1TVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIk1vdW50YWluIFN0YW5kYXJkIFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiTm9ydGggQW1lcmljYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIlBEVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIlBhY2lmaWMgRGF5bGlnaHQgVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJOb3J0aCBBbWVyaWNhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiSEFQXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiSGV1cmUgQXZhbmNcXHUwMGU5ZSBkdSBQYWNpZmlxdWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiTm9ydGggQW1lcmljYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIkhOUlwiLCBcbiAgICAgIFwibmFtZVwiOiBcIkhldXJlIE5vcm1hbGUgZGVzIFJvY2hldXNlc1wiXG4gICAgfSBcbiAgXSwgXG4gIFwiLTAyMDBcIjogW1xuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiU291dGggQW1lcmljYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIkZOVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIkZlcm5hbmRvIGRlIE5vcm9uaGEgVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJOb3J0aCBBbWVyaWNhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiV0dTVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIldlc3Rlcm4gR3JlZW5sYW5kIFN1bW1lciBUaW1lXCJcbiAgICB9LFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiTm9ydGggQW1lcmljYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIlBNRFRcIiwgXG4gICAgICBcIm5hbWVcIjogXCJQaWVycmUgJiBNaXF1ZWxvbiBEYXlsaWdodCBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIlNvdXRoIEFtZXJpY2FcIiwgXG4gICAgICBcImFiYnJcIjogXCJVWVNUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiVXJ1Z3VheSBTdW1tZXIgVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJTb3V0aCBBbWVyaWNhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiQlJTVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIkJyYXNpbGlhIFN1bW1lciBUaW1lXCJcbiAgICB9IFxuICBdLCBcbiAgXCIrMTAzMFwiOiBbXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJBdXN0cmFsaWFcIiwgXG4gICAgICBcImFiYnJcIjogXCJDRFRcIiwgXG4gICAgICBcIm5hbWVcIjogXCJDZW50cmFsIERheWxpZ2h0IFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiQXVzdHJhbGlhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiTEhTVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIkxvcmQgSG93ZSBTdGFuZGFyZCBUaW1lXCJcbiAgICB9XG4gIF0sIFxuICBcIiswMzAwXCI6IFtcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIkV1cm9wZVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIk1TS1wiLCBcbiAgICAgIFwibmFtZVwiOiBcIk1vc2NvdyBTdGFuZGFyZCBUaW1lXCJcbiAgICB9LFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiQXNpYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIklEVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIklzcmFlbCBEYXlsaWdodCBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIkFzaWFcIiwgXG4gICAgICBcImFiYnJcIjogXCJBU1RcIiwgXG4gICAgICBcIm5hbWVcIjogXCJBcmFiaWEgU3RhbmRhcmQgVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJJbmRpYW4gT2NlYW5cIiwgXG4gICAgICBcImFiYnJcIjogXCJFQVRcIiwgXG4gICAgICBcIm5hbWVcIjogXCJFYXN0IEFmcmljYSBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIkV1cm9wZVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIkVFU1RcIiwgXG4gICAgICBcIm5hbWVcIjogXCJFYXN0ZXJuIEV1cm9wZWFuIFN1bW1lciBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIkFmcmljYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIkVBVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIkVhc3Rlcm4gQWZyaWNhIFRpbWVcIlxuICAgIH0gXG4gIF0sIFxuICBcIlVUQ1wiOiBbXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJBdGxhbnRpY1wiLCBcbiAgICAgIFwiYWJiclwiOiBcIkFaT1NUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiQXpvcmVzIFN1bW1lciBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIk5vcnRoIEFtZXJpY2FcIiwgXG4gICAgICBcImFiYnJcIjogXCJFR1NUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiRWFzdGVybiBHcmVlbmxhbmQgU3VtbWVyIFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiQWZyaWNhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiR01UXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiR3JlZW53aWNoIE1lYW4gVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJFdXJvcGVcIiwgXG4gICAgICBcImFiYnJcIjogXCJHTVRcIiwgXG4gICAgICBcIm5hbWVcIjogXCJHcmVlbndpY2ggTWVhbiBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIkFmcmljYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIldFVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIldlc3Rlcm4gRXVyb3BlYW4gVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJFdXJvcGVcIiwgXG4gICAgICBcImFiYnJcIjogXCJXRVRcIiwgXG4gICAgICBcIm5hbWVcIjogXCJXZXN0ZXJuIEV1cm9wZWFuIFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiQWZyaWNhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiV1RcIiwgXG4gICAgICBcIm5hbWVcIjogXCJXZXN0ZXJuIFNhaGFyYSBTdGFuZGFyZCBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIk1pbGl0YXJ5XCIsIFxuICAgICAgXCJhYmJyXCI6IFwiWlwiLCBcbiAgICAgIFwibmFtZVwiOiBcIlp1bHUgVGltZSBab25lXCJcbiAgICB9XG4gIF0sIFxuICBcIiswNDAwXCI6IFtcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIkFzaWFcIiwgXG4gICAgICBcImFiYnJcIjogXCJBTVRcIiwgXG4gICAgICBcIm5hbWVcIjogXCJBcm1lbmlhIFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiQXNpYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIkFaVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIkF6ZXJiYWlqYW4gVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJNaWxpdGFyeVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIkRcIiwgXG4gICAgICBcIm5hbWVcIjogXCJEZWx0YSBUaW1lIFpvbmVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiQXNpYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIkdFVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIkdlb3JnaWEgU3RhbmRhcmQgVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJBc2lhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiR1NUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiR3VsZiBTdGFuZGFyZCBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIkV1cm9wZVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIktVWVRcIiwgXG4gICAgICBcIm5hbWVcIjogXCJLdXlieXNoZXYgVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJFdXJvcGVcIiwgXG4gICAgICBcImFiYnJcIjogXCJNU0RcIiwgXG4gICAgICBcIm5hbWVcIjogXCJNb3Njb3cgRGF5bGlnaHQgVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJBZnJpY2FcIiwgXG4gICAgICBcImFiYnJcIjogXCJNVVRcIiwgXG4gICAgICBcIm5hbWVcIjogXCJNYXVyaXRpdXMgVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJBZnJpY2FcIiwgXG4gICAgICBcImFiYnJcIjogXCJSRVRcIiwgXG4gICAgICBcIm5hbWVcIjogXCJSZXVuaW9uIFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiRXVyb3BlXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiU0FNVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIlNhbWFyYSBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIkFmcmljYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIlNDVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIlNleWNoZWxsZXMgVGltZVwiXG4gICAgfVxuICBdLCBcbiAgXCIrMDcwMFwiOiBbXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJBdXN0cmFsaWFcIiwgXG4gICAgICBcImFiYnJcIjogXCJDWFRcIiwgXG4gICAgICBcIm5hbWVcIjogXCJDaHJpc3RtYXMgSXNsYW5kIFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiQW50YXJjdGljYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIkRBVlRcIiwgXG4gICAgICBcIm5hbWVcIjogXCJEYXZpcyBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIk1pbGl0YXJ5XCIsIFxuICAgICAgXCJhYmJyXCI6IFwiR1wiLCBcbiAgICAgIFwibmFtZVwiOiBcIkdvbGYgVGltZSBab25lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIkFzaWFcIiwgXG4gICAgICBcImFiYnJcIjogXCJIT1ZUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiSG92ZCBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIkFzaWFcIiwgXG4gICAgICBcImFiYnJcIjogXCJJQ1RcIiwgXG4gICAgICBcIm5hbWVcIjogXCJJbmRvY2hpbmEgVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJBc2lhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiS1JBVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIktyYXNub3lhcnNrIFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiQXNpYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIk5PVlNUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiTm92b3NpYmlyc2sgU3VtbWVyIFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiQXNpYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIk9NU1NUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiT21zayBTdW1tZXIgVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJBc2lhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiV0lCXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiV2VzdGVybiBJbmRvbmVzaWFuIFRpbWVcIlxuICAgIH1cbiAgXSwgXG4gIFwiKzAyMDBcIjogW1xuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiTWlsaXRhcnlcIiwgXG4gICAgICBcImFiYnJcIjogXCJCXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiQnJhdm8gVGltZSBab25lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIkFmcmljYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIkNBVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIkNlbnRyYWwgQWZyaWNhIFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiRXVyb3BlXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiQ0VTVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIkNlbnRyYWwgRXVyb3BlYW4gU3VtbWVyIFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiQWZyaWNhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiRUVUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiRWFzdGVybiBFdXJvcGVhbiBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIkFzaWFcIiwgXG4gICAgICBcImFiYnJcIjogXCJFRVRcIiwgXG4gICAgICBcIm5hbWVcIjogXCJFYXN0ZXJuIEV1cm9wZWFuIFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiRXVyb3BlXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiRUVUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiRWFzdGVybiBFdXJvcGVhbiBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIkFzaWFcIiwgXG4gICAgICBcImFiYnJcIjogXCJJU1RcIiwgXG4gICAgICBcIm5hbWVcIjogXCJJc3JhZWwgU3RhbmRhcmQgVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJBZnJpY2FcIiwgXG4gICAgICBcImFiYnJcIjogXCJTQVNUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiU291dGggQWZyaWNhIFN0YW5kYXJkIFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiQWZyaWNhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiV0FTVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIldlc3QgQWZyaWNhIFN1bW1lciBUaW1lXCJcbiAgICB9XG4gIF0sIFxuICBcIi0xMDAwXCI6IFtcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIlBhY2lmaWNcIiwgXG4gICAgICBcImFiYnJcIjogXCJDS1RcIiwgXG4gICAgICBcIm5hbWVcIjogXCJDb29rIElzbGFuZCBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIk5vcnRoIEFtZXJpY2FcIiwgXG4gICAgICBcImFiYnJcIjogXCJIQVNUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiSGF3YWlpLUFsZXV0aWFuIFN0YW5kYXJkIFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiTm9ydGggQW1lcmljYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIkhTVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIkhhd2FpaS1BbGV1dGlhbiBTdGFuZGFyZCBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIlBhY2lmaWNcIiwgXG4gICAgICBcImFiYnJcIjogXCJUQUhUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiVGFoaXRpIFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiUGFjaWZpY1wiLCBcbiAgICAgIFwiYWJiclwiOiBcIlRLVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIlRva2VsYXUgVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJNaWxpdGFyeVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIldcIiwgXG4gICAgICBcIm5hbWVcIjogXCJXaGlza2V5IFRpbWUgWm9uZVwiXG4gICAgfVxuICBdLCBcbiAgXCIrMDkzMFwiOiBbXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJBdXN0cmFsaWFcIiwgXG4gICAgICBcImFiYnJcIjogXCJDU1RcIiwgXG4gICAgICBcIm5hbWVcIjogXCJDZW50cmFsIFN0YW5kYXJkIFRpbWVcIlxuICAgIH1cbiAgXSwgXG4gIFwiKzA1MzBcIjogW1xuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiQXNpYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIklTVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIkluZGlhIFN0YW5kYXJkIFRpbWVcIlxuICAgIH1cbiAgXSwgXG4gIFwiKzEzMDBcIjogW1xuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiUGFjaWZpY1wiLCBcbiAgICAgIFwiYWJiclwiOiBcIkZKU1RcIiwgXG4gICAgICBcIm5hbWVcIjogXCJGaWppIFN1bW1lciBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIkFudGFyY3RpY2FcIiwgXG4gICAgICBcImFiYnJcIjogXCJOWkRUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiTmV3IFplYWxhbmQgRGF5bGlnaHQgVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJQYWNpZmljXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiTlpEVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIk5ldyBaZWFsYW5kIERheWxpZ2h0IFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiUGFjaWZpY1wiLCBcbiAgICAgIFwiYWJiclwiOiBcIlBIT1RcIiwgXG4gICAgICBcIm5hbWVcIjogXCJQaG9lbml4IElzbGFuZCBUaW1lXCJcbiAgICB9XG4gIF0sIFxuICBcIiswNTQ1XCI6IFtcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIkFzaWFcIiwgXG4gICAgICBcImFiYnJcIjogXCJOUFRcIiwgXG4gICAgICBcIm5hbWVcIjogXCJOZXBhbCBUaW1lXCJcbiAgICB9XG4gIF0sIFxuICBcIisxMDAwXCI6IFtcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIlBhY2lmaWNcIiwgXG4gICAgICBcImFiYnJcIjogXCJDaFNUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiQ2hhbW9ycm8gU3RhbmRhcmQgVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJBdXN0cmFsaWFcIiwgXG4gICAgICBcImFiYnJcIjogXCJFU1RcIiwgXG4gICAgICBcIm5hbWVcIjogXCJFYXN0ZXJuIFN0YW5kYXJkIFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiTWlsaXRhcnlcIiwgXG4gICAgICBcImFiYnJcIjogXCJLXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiS2lsbyBUaW1lIFpvbmVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiUGFjaWZpY1wiLCBcbiAgICAgIFwiYWJiclwiOiBcIlBHVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIlBhcHVhIE5ldyBHdWluZWEgVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJBc2lhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiVkxBVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIlZsYWRpdm9zdG9rIFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiQXNpYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIllBS1NUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiWWFrdXRzayBTdW1tZXIgVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJQYWNpZmljXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiWUFQVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIllhcCBUaW1lXCJcbiAgICB9XG4gIF0sIFxuICBcIi0wNjAwXCI6IFtcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIk5vcnRoIEFtZXJpY2FcIiwgXG4gICAgICBcImFiYnJcIjogXCJDU1RcIiwgXG4gICAgICBcIm5hbWVcIjogXCJDZW50cmFsIFN0YW5kYXJkIFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiTm9ydGggQW1lcmljYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIk1EVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIk1vdW50YWluIERheWxpZ2h0IFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiUGFjaWZpY1wiLCBcbiAgICAgIFwiYWJiclwiOiBcIkdBTFRcIiwgXG4gICAgICBcIm5hbWVcIjogXCJHYWxhcGFnb3MgVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJOb3J0aCBBbWVyaWNhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiSEFSXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiSGV1cmUgQXZhbmNcXHUwMGU5ZSBkZXMgUm9jaGV1c2VzXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIk5vcnRoIEFtZXJpY2FcIiwgXG4gICAgICBcImFiYnJcIjogXCJITkNcIiwgXG4gICAgICBcIm5hbWVcIjogXCJIZXVyZSBOb3JtYWxlIGR1IENlbnRyZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJDZW50cmFsIEFtZXJpY2FcIiwgXG4gICAgICBcImFiYnJcIjogXCJITkNcIiwgXG4gICAgICBcIm5hbWVcIjogXCJIZXVyZSBOb3JtYWxlIGR1IENlbnRyZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJDZW50cmFsIEFtZXJpY2FcIiwgXG4gICAgICBcImFiYnJcIjogXCJDU1RcIiwgXG4gICAgICBcIm5hbWVcIjogXCJDZW50cmFsIFN0YW5kYXJkIFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiUGFjaWZpY1wiLCBcbiAgICAgIFwiYWJiclwiOiBcIkVBU1RcIiwgXG4gICAgICBcIm5hbWVcIjogXCJFYXN0ZXIgSXNsYW5kIFN0YW5kYXJkIFRpbWVcIlxuICAgIH1cbiAgXSwgXG4gIFwiKzAxMDBcIjogW1xuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiRXVyb3BlXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiQ0VUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiQ2VudHJhbCBFdXJvcGVhbiBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIkV1cm9wZVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIkJTVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIkJyaXRpc2ggU3VtbWVyIFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiQWZyaWNhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiQ0VUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiQ2VudHJhbCBFdXJvcGVhbiBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIkFmcmljYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIldFU1RcIiwgXG4gICAgICBcIm5hbWVcIjogXCJXZXN0ZXJuIEV1cm9wZWFuIFN1bW1lciBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIkV1cm9wZVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIldFU1RcIiwgXG4gICAgICBcIm5hbWVcIjogXCJXZXN0ZXJuIEV1cm9wZWFuIFN1bW1lciBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIkFmcmljYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIldTVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIldlc3Rlcm4gU2FoYXJhIFN1bW1lciBUaW1lXCJcbiAgICB9LFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiQWZyaWNhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiV0FUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiV2VzdCBBZnJpY2EgVGltZVwiXG4gICAgfVxuICBdLCBcbiAgXCItMDQwMFwiOiBbXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJOb3J0aCBBbWVyaWNhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiQVNUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiQXRsYW50aWMgU3RhbmRhcmQgVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJOb3J0aCBBbWVyaWNhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiRURUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiRWFzdGVybiBEYXlsaWdodCBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIlNvdXRoIEFtZXJpY2FcIiwgXG4gICAgICBcImFiYnJcIjogXCJDTFRcIiwgXG4gICAgICBcIm5hbWVcIjogXCJDaGlsZSBTdGFuZGFyZCBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIlNvdXRoIEFtZXJpY2FcIiwgXG4gICAgICBcImFiYnJcIjogXCJGS1RcIiwgXG4gICAgICBcIm5hbWVcIjogXCJGYWxrbGFuZCBJc2xhbmQgVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJTb3V0aCBBbWVyaWNhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiR1lUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiR3V5YW5hIFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiU291dGggQW1lcmljYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIlBZVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIlBhcmFndWF5IFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiU291dGggQW1lcmljYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIkFNVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIkFtYXpvbiBUaW1lXCJcbiAgICB9IFxuICBdLCBcbiAgXCItMDMzMFwiOiBbXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJOb3J0aCBBbWVyaWNhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiTlNUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiTmV3Zm91bmRsYW5kIFN0YW5kYXJkIFRpbWVcIlxuICAgIH1cbiAgXSwgXG4gIFwiLTA1MDBcIjogW1xuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiTm9ydGggQW1lcmljYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIkVTVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIkVhc3Rlcm4gU3RhbmRhcmQgVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJOb3J0aCBBbWVyaWNhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiQ0RUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiQ2VudHJhbCBEYXlsaWdodCBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIlNvdXRoIEFtZXJpY2FcIiwgXG4gICAgICBcImFiYnJcIjogXCJDT1RcIiwgXG4gICAgICBcIm5hbWVcIjogXCJDb2xvbWJpYSBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIkNhcmliYmVhblwiLCBcbiAgICAgIFwiYWJiclwiOiBcIkNTVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIkN1YmEgU3RhbmRhcmQgVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJQYWNpZmljXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiRUFTU1RcIiwgXG4gICAgICBcIm5hbWVcIjogXCJFYXN0ZXIgSXNsYW5kIFN1bW1lciBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIlNvdXRoIEFtZXJpY2FcIiwgXG4gICAgICBcImFiYnJcIjogXCJFQ1RcIiwgXG4gICAgICBcIm5hbWVcIjogXCJFY3VhZG9yIFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiQ2VudHJhbCBBbWVyaWNhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiRVNUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiRWFzdGVybiBTdGFuZGFyZCBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIkNhcmliYmVhblwiLCBcbiAgICAgIFwiYWJiclwiOiBcIkVTVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIkVhc3Rlcm4gU3RhbmRhcmQgVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJDZW50cmFsIEFtZXJpY2FcIiwgXG4gICAgICBcImFiYnJcIjogXCJFVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIlRpZW1wbyBkZWwgRXN0ZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJDYXJpYmJlYW5cIiwgXG4gICAgICBcImFiYnJcIjogXCJFVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIlRpZW1wbyBkZWwgRXN0ZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJOb3J0aCBBbWVyaWNhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiRVRcIiwgXG4gICAgICBcIm5hbWVcIjogXCJUaWVtcG8gRGVsIEVzdGVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiTm9ydGggQW1lcmljYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIkhBQ1wiLCBcbiAgICAgIFwibmFtZVwiOiBcIkhldXJlIEF2YW5jXFx1MDBlOWUgZHUgQ2VudHJlXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIlNvdXRoIEFtZXJpY2FcIiwgXG4gICAgICBcImFiYnJcIjogXCJQRVRcIiwgXG4gICAgICBcIm5hbWVcIjogXCJQZXJ1IFRpbWVcIlxuICAgIH0gXG4gIF0sIFxuICBcIi0wOTAwXCI6IFtcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIk5vcnRoIEFtZXJpY2FcIiwgXG4gICAgICBcImFiYnJcIjogXCJBS1NUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiQWxhc2thIFN0YW5kYXJkIFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiTm9ydGggQW1lcmljYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIkhBRFRcIiwgXG4gICAgICBcIm5hbWVcIjogXCJIYXdhaWktQWxldXRpYW4gRGF5bGlnaHQgVGltZVwiXG4gICAgfSBcbiAgXSwgXG4gIFwiLTAzMDBcIjogW1xuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiTm9ydGggQW1lcmljYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIkFEVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIkF0bGFudGljIERheWxpZ2h0IFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiU291dGggQW1lcmljYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIkFNU1RcIiwgXG4gICAgICBcIm5hbWVcIjogXCJBbWF6b24gU3VtbWVyIFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiU291dGggQW1lcmljYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIkJSVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIkJyYXNcXHUwMGVkbGlhIHRpbWVcIlxuICAgIH0gXG4gIF0sIFxuICBcIisxMjQ1XCI6IFtcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIlBhY2lmaWNcIiwgXG4gICAgICBcImFiYnJcIjogXCJDSEFTVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIkNoYXRoYW0gSXNsYW5kIFN0YW5kYXJkIFRpbWVcIlxuICAgIH1cbiAgXSwgXG4gIFwiKzA2MDBcIjogW1xuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiQXNpYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIkJTVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIkJhbmdsYWRlc2ggU3RhbmRhcmQgVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJBc2lhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiWUVLU1RcIiwgXG4gICAgICBcIm5hbWVcIjogXCJZZWthdGVyaW5idXJnIFN1bW1lciBUaW1lXCJcbiAgICB9LFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiQXNpYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIkJTVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIkJhbmdsYWRlc2ggU3RhbmRhcmQgVGltZVwiXG4gICAgfSBcbiAgXSwgXG4gIFwiLTA5MzBcIjogW1xuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiUGFjaWZpY1wiLCBcbiAgICAgIFwiYWJiclwiOiBcIk1BUlRcIiwgXG4gICAgICBcIm5hbWVcIjogXCJNYXJxdWVzYXMgVGltZVwiXG4gICAgfVxuICBdLCBcbiAgXCIrMDMzMFwiOiBbXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJBc2lhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiSVJTVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIklyYW4gU3RhbmRhcmQgVGltZVwiXG4gICAgfVxuICBdLCBcbiAgXCIrMTEzMFwiOiBbXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJBdXN0cmFsaWFcIiwgXG4gICAgICBcImFiYnJcIjogXCJORlRcIiwgXG4gICAgICBcIm5hbWVcIjogXCJOb3Jmb2xrIFRpbWVcIlxuICAgIH1cbiAgXSwgXG4gIFwiKzExMDBcIjogW1xuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiQXNpYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIlZMQVNUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiVmxhZGl2b3N0b2sgU3VtbWVyIFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiQXVzdHJhbGlhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiRURUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiRWFzdGVybiBEYXlsaWdodCBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIlBhY2lmaWNcIiwgXG4gICAgICBcImFiYnJcIjogXCJOQ1RcIiwgXG4gICAgICBcIm5hbWVcIjogXCJOZXcgQ2FsZWRvbmlhIFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiUGFjaWZpY1wiLCBcbiAgICAgIFwiYWJiclwiOiBcIlBPTlRcIiwgXG4gICAgICBcIm5hbWVcIjogXCJQb2hucGVpIFN0YW5kYXJkIFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiUGFjaWZpY1wiLCBcbiAgICAgIFwiYWJiclwiOiBcIlNCVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIlNvbG9tb24gSXNsYW5kc1RpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiUGFjaWZpY1wiLCBcbiAgICAgIFwiYWJiclwiOiBcIlZVVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIlZhbnVhdHUgVGltZVwiXG4gICAgfVxuICBdLCBcbiAgXCItMDgwMFwiOiBbXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJOb3J0aCBBbWVyaWNhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiUFNUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiUGFjaWZpYyBTdGFuZGFyZCBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIk5vcnRoIEFtZXJpY2FcIiwgXG4gICAgICBcImFiYnJcIjogXCJBS0RUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiQWxhc2thIERheWxpZ2h0IFRpbWVcIlxuICAgIH0gXG4gIF1cbn1cbiJdfQ==(1)
});
;