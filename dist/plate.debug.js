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

},{}]},{},[1])
//@ sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvVXNlcnMvY2hyaXMvcGxhdGUvYnJvd3Nlci5qcyIsIi9Vc2Vycy9jaHJpcy9wbGF0ZS9saWIvYmxvY2tfY29udGV4dC5qcyIsIi9Vc2Vycy9jaHJpcy9wbGF0ZS9saWIvY29tbWVudF90b2tlbi5qcyIsIi9Vc2Vycy9jaHJpcy9wbGF0ZS9saWIvY29udGV4dC5qcyIsIi9Vc2Vycy9jaHJpcy9wbGF0ZS9saWIvZGF0ZS5qcyIsIi9Vc2Vycy9jaHJpcy9wbGF0ZS9saWIvZGVidWcuanMiLCIvVXNlcnMvY2hyaXMvcGxhdGUvbGliL2RlZmF1bHRmaWx0ZXJzLmpzIiwiL1VzZXJzL2NocmlzL3BsYXRlL2xpYi9kZWZhdWx0dGFncy5qcyIsIi9Vc2Vycy9jaHJpcy9wbGF0ZS9saWIvZmlsdGVyX2FwcGxpY2F0aW9uLmpzIiwiL1VzZXJzL2NocmlzL3BsYXRlL2xpYi9maWx0ZXJfY2hhaW4uanMiLCIvVXNlcnMvY2hyaXMvcGxhdGUvbGliL2ZpbHRlcl9sb29rdXAuanMiLCIvVXNlcnMvY2hyaXMvcGxhdGUvbGliL2ZpbHRlcl9ub2RlLmpzIiwiL1VzZXJzL2NocmlzL3BsYXRlL2xpYi9maWx0ZXJfdG9rZW4uanMiLCIvVXNlcnMvY2hyaXMvcGxhdGUvbGliL2ZpbHRlcnMvYWRkLmpzIiwiL1VzZXJzL2NocmlzL3BsYXRlL2xpYi9maWx0ZXJzL2FkZHNsYXNoZXMuanMiLCIvVXNlcnMvY2hyaXMvcGxhdGUvbGliL2ZpbHRlcnMvY2FwZmlyc3QuanMiLCIvVXNlcnMvY2hyaXMvcGxhdGUvbGliL2ZpbHRlcnMvY2VudGVyLmpzIiwiL1VzZXJzL2NocmlzL3BsYXRlL2xpYi9maWx0ZXJzL2N1dC5qcyIsIi9Vc2Vycy9jaHJpcy9wbGF0ZS9saWIvZmlsdGVycy9kYXRlLmpzIiwiL1VzZXJzL2NocmlzL3BsYXRlL2xpYi9maWx0ZXJzL2RlZmF1bHQuanMiLCIvVXNlcnMvY2hyaXMvcGxhdGUvbGliL2ZpbHRlcnMvZGljdHNvcnQuanMiLCIvVXNlcnMvY2hyaXMvcGxhdGUvbGliL2ZpbHRlcnMvZGljdHNvcnRyZXZlcnNlZC5qcyIsIi9Vc2Vycy9jaHJpcy9wbGF0ZS9saWIvZmlsdGVycy9kaXZpc2libGVieS5qcyIsIi9Vc2Vycy9jaHJpcy9wbGF0ZS9saWIvZmlsdGVycy9lc2NhcGUuanMiLCIvVXNlcnMvY2hyaXMvcGxhdGUvbGliL2ZpbHRlcnMvZmlsZXNpemVmb3JtYXQuanMiLCIvVXNlcnMvY2hyaXMvcGxhdGUvbGliL2ZpbHRlcnMvZmlyc3QuanMiLCIvVXNlcnMvY2hyaXMvcGxhdGUvbGliL2ZpbHRlcnMvZmxvYXRmb3JtYXQuanMiLCIvVXNlcnMvY2hyaXMvcGxhdGUvbGliL2ZpbHRlcnMvZm9yY2VfZXNjYXBlLmpzIiwiL1VzZXJzL2NocmlzL3BsYXRlL2xpYi9maWx0ZXJzL2dldF9kaWdpdC5qcyIsIi9Vc2Vycy9jaHJpcy9wbGF0ZS9saWIvZmlsdGVycy9pbmRleC5qcyIsIi9Vc2Vycy9jaHJpcy9wbGF0ZS9saWIvZmlsdGVycy9pcmllbmNvZGUuanMiLCIvVXNlcnMvY2hyaXMvcGxhdGUvbGliL2ZpbHRlcnMvaXRlcml0ZW1zLmpzIiwiL1VzZXJzL2NocmlzL3BsYXRlL2xpYi9maWx0ZXJzL2pvaW4uanMiLCIvVXNlcnMvY2hyaXMvcGxhdGUvbGliL2ZpbHRlcnMvbGFzdC5qcyIsIi9Vc2Vycy9jaHJpcy9wbGF0ZS9saWIvZmlsdGVycy9sZW5ndGguanMiLCIvVXNlcnMvY2hyaXMvcGxhdGUvbGliL2ZpbHRlcnMvbGVuZ3RoX2lzLmpzIiwiL1VzZXJzL2NocmlzL3BsYXRlL2xpYi9maWx0ZXJzL2xpbmVicmVha3MuanMiLCIvVXNlcnMvY2hyaXMvcGxhdGUvbGliL2ZpbHRlcnMvbGluZWJyZWFrc2JyLmpzIiwiL1VzZXJzL2NocmlzL3BsYXRlL2xpYi9maWx0ZXJzL2xpbmVudW1iZXJzLmpzIiwiL1VzZXJzL2NocmlzL3BsYXRlL2xpYi9maWx0ZXJzL2xqdXN0LmpzIiwiL1VzZXJzL2NocmlzL3BsYXRlL2xpYi9maWx0ZXJzL2xvd2VyLmpzIiwiL1VzZXJzL2NocmlzL3BsYXRlL2xpYi9maWx0ZXJzL21ha2VfbGlzdC5qcyIsIi9Vc2Vycy9jaHJpcy9wbGF0ZS9saWIvZmlsdGVycy9waG9uZTJudW1lcmljLmpzIiwiL1VzZXJzL2NocmlzL3BsYXRlL2xpYi9maWx0ZXJzL3BsdXJhbGl6ZS5qcyIsIi9Vc2Vycy9jaHJpcy9wbGF0ZS9saWIvZmlsdGVycy9yYW5kb20uanMiLCIvVXNlcnMvY2hyaXMvcGxhdGUvbGliL2ZpbHRlcnMvcmp1c3QuanMiLCIvVXNlcnMvY2hyaXMvcGxhdGUvbGliL2ZpbHRlcnMvc2FmZS5qcyIsIi9Vc2Vycy9jaHJpcy9wbGF0ZS9saWIvZmlsdGVycy9zbGljZS5qcyIsIi9Vc2Vycy9jaHJpcy9wbGF0ZS9saWIvZmlsdGVycy9zbHVnaWZ5LmpzIiwiL1VzZXJzL2NocmlzL3BsYXRlL2xpYi9maWx0ZXJzL3NwbGl0LmpzIiwiL1VzZXJzL2NocmlzL3BsYXRlL2xpYi9maWx0ZXJzL3N0cmlwdGFncy5qcyIsIi9Vc2Vycy9jaHJpcy9wbGF0ZS9saWIvZmlsdGVycy90aW1lc2luY2UuanMiLCIvVXNlcnMvY2hyaXMvcGxhdGUvbGliL2ZpbHRlcnMvdGltZXVudGlsLmpzIiwiL1VzZXJzL2NocmlzL3BsYXRlL2xpYi9maWx0ZXJzL3RpdGxlLmpzIiwiL1VzZXJzL2NocmlzL3BsYXRlL2xpYi9maWx0ZXJzL3RydW5jYXRlY2hhcnMuanMiLCIvVXNlcnMvY2hyaXMvcGxhdGUvbGliL2ZpbHRlcnMvdHJ1bmNhdGV3b3Jkcy5qcyIsIi9Vc2Vycy9jaHJpcy9wbGF0ZS9saWIvZmlsdGVycy91bm9yZGVyZWRfbGlzdC5qcyIsIi9Vc2Vycy9jaHJpcy9wbGF0ZS9saWIvZmlsdGVycy91cHBlci5qcyIsIi9Vc2Vycy9jaHJpcy9wbGF0ZS9saWIvZmlsdGVycy91cmxlbmNvZGUuanMiLCIvVXNlcnMvY2hyaXMvcGxhdGUvbGliL2ZpbHRlcnMvdXJsaXplLmpzIiwiL1VzZXJzL2NocmlzL3BsYXRlL2xpYi9maWx0ZXJzL3VybGl6ZXRydW5jLmpzIiwiL1VzZXJzL2NocmlzL3BsYXRlL2xpYi9maWx0ZXJzL3dvcmRjb3VudC5qcyIsIi9Vc2Vycy9jaHJpcy9wbGF0ZS9saWIvZmlsdGVycy93b3Jkd3JhcC5qcyIsIi9Vc2Vycy9jaHJpcy9wbGF0ZS9saWIvZmlsdGVycy95ZXNuby5qcyIsIi9Vc2Vycy9jaHJpcy9wbGF0ZS9saWIvaW5kZXguanMiLCIvVXNlcnMvY2hyaXMvcGxhdGUvbGliL2xpYnJhcmllcy5qcyIsIi9Vc2Vycy9jaHJpcy9wbGF0ZS9saWIvbGlicmFyeS5qcyIsIi9Vc2Vycy9jaHJpcy9wbGF0ZS9saWIvbWV0YS5qcyIsIi9Vc2Vycy9jaHJpcy9wbGF0ZS9saWIvbm9kZV9saXN0LmpzIiwiL1VzZXJzL2NocmlzL3BsYXRlL2xpYi9wYXJzZXIuanMiLCIvVXNlcnMvY2hyaXMvcGxhdGUvbGliL3Byb21pc2UuanMiLCIvVXNlcnMvY2hyaXMvcGxhdGUvbGliL3RhZ190b2tlbi5qcyIsIi9Vc2Vycy9jaHJpcy9wbGF0ZS9saWIvdGFncy9ibG9jay5qcyIsIi9Vc2Vycy9jaHJpcy9wbGF0ZS9saWIvdGFncy9jb21tZW50LmpzIiwiL1VzZXJzL2NocmlzL3BsYXRlL2xpYi90YWdzL2RlYnVnLmpzIiwiL1VzZXJzL2NocmlzL3BsYXRlL2xpYi90YWdzL2V4dGVuZHMuanMiLCIvVXNlcnMvY2hyaXMvcGxhdGUvbGliL3RhZ3MvZm9yLmpzIiwiL1VzZXJzL2NocmlzL3BsYXRlL2xpYi90YWdzL2lmL2VuZC5qcyIsIi9Vc2Vycy9jaHJpcy9wbGF0ZS9saWIvdGFncy9pZi9pbmZpeC5qcyIsIi9Vc2Vycy9jaHJpcy9wbGF0ZS9saWIvdGFncy9pZi9saXRlcmFsLmpzIiwiL1VzZXJzL2NocmlzL3BsYXRlL2xpYi90YWdzL2lmL25vZGUuanMiLCIvVXNlcnMvY2hyaXMvcGxhdGUvbGliL3RhZ3MvaWYvb3BlcmF0b3JzLmpzIiwiL1VzZXJzL2NocmlzL3BsYXRlL2xpYi90YWdzL2lmL3BhcnNlci5qcyIsIi9Vc2Vycy9jaHJpcy9wbGF0ZS9saWIvdGFncy9pZi9wcmVmaXguanMiLCIvVXNlcnMvY2hyaXMvcGxhdGUvbGliL3RhZ3MvaW5jbHVkZS5qcyIsIi9Vc2Vycy9jaHJpcy9wbGF0ZS9saWIvdGFncy9ub3cuanMiLCIvVXNlcnMvY2hyaXMvcGxhdGUvbGliL3RhZ3Mvd2l0aC5qcyIsIi9Vc2Vycy9jaHJpcy9wbGF0ZS9saWIvdGV4dF9ub2RlLmpzIiwiL1VzZXJzL2NocmlzL3BsYXRlL2xpYi90ZXh0X3Rva2VuLmpzIiwiL1VzZXJzL2NocmlzL3BsYXRlL2xpYi90b2tlbi5qcyIsIi9Vc2Vycy9jaHJpcy9wbGF0ZS9ub2RlX21vZHVsZXMvZHN0L2luZGV4LmpzIiwiL1VzZXJzL2NocmlzL3BsYXRlL25vZGVfbW9kdWxlcy90ei9pbmRleC5qcyIsIi9Vc2Vycy9jaHJpcy9wbGF0ZS9ub2RlX21vZHVsZXMvdHovdHouanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZaQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOURBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbEJBO0FBQ0E7QUFDQTtBQUNBOztBQ0hBO0FBQ0E7QUFDQTtBQUNBOztBQ0hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDUkE7QUFDQTtBQUNBO0FBQ0E7O0FDSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNQQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTEE7QUFDQTtBQUNBO0FBQ0E7O0FDSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDYkE7QUFDQTtBQUNBO0FBQ0E7O0FDSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNQQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNaQTs7QUNBQTtBQUNBO0FBQ0E7QUFDQTs7QUNIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1BBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ0xBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ05BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1pBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDYkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDWkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1hBO0FBQ0E7QUFDQTtBQUNBOztBQ0hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDYkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNQQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNaQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1BBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNUQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ05BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNkQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNaQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNmQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pCQTtBQUNBO0FBQ0E7QUFDQTs7QUNIQTtBQUNBO0FBQ0E7QUFDQTs7QUNIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDUkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNWQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNOQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDWEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ05BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25QQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOURBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1SUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9DQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNaQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMURBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJzb3VyY2VzQ29udGVudCI6WyJyZXF1aXJlKCdkc3QnKVxuXG52YXIgcGxhdGUgPSByZXF1aXJlKCcuL2xpYi9pbmRleCcpXG5pZih0eXBlb2YgZGVmaW5lICE9PSAndW5kZWZpbmVkJyAmJiBkZWZpbmUuYW1kKSB7XG4gIGRlZmluZSgncGxhdGUnLCBbXSwgZnVuY3Rpb24oKSB7IHJldHVybiBwbGF0ZSB9KVxufSBlbHNlIHtcbiAgd2luZG93LnBsYXRlID0gcGxhdGVcbn1cblxucGxhdGUuZGVidWcgPSByZXF1aXJlKCcuL2xpYi9kZWJ1ZycpXG5wbGF0ZS51dGlscyA9IHBsYXRlLmRhdGUgPSByZXF1aXJlKCcuL2xpYi9kYXRlJylcbnBsYXRlLnV0aWxzLlByb21pc2UgPSByZXF1aXJlKCcuL2xpYi9wcm9taXNlJylcbnBsYXRlLnV0aWxzLlNhZmVTdHJpbmcgPSBmdW5jdGlvbihzdHIpIHtcbiAgc3RyID0gbmV3IFN0cmluZyhzdHIpXG4gIHN0ci5zYWZlID0gdHJ1ZVxuICByZXR1cm4gc3RyXG59XG5wbGF0ZS5saWJyYXJpZXMgPSByZXF1aXJlKCcuL2xpYi9saWJyYXJpZXMnKVxuXG5tb2R1bGUuZXhwb3J0cyA9IHBsYXRlXG4iLCJtb2R1bGUuZXhwb3J0cyA9IEJsb2NrQ29udGV4dFxuXG5mdW5jdGlvbiBCbG9ja0NvbnRleHQoKSB7XG4gIHRoaXMuYmxvY2tzID0ge31cbn1cblxudmFyIGNvbnMgPSBCbG9ja0NvbnRleHRcbiAgLCBwcm90byA9IGNvbnMucHJvdG90eXBlXG5cbmNvbnMuS0VZID0gJ19fQkxPQ0tfQ09OVEVYVF9fJ1xuXG5jb25zLmZyb20gPSBmdW5jdGlvbihjb250ZXh0KSB7XG4gIHJldHVybiBjb250ZXh0W3RoaXMuS0VZXVxufVxuXG5jb25zLmludG8gPSBmdW5jdGlvbihjb250ZXh0KSB7XG4gIHJldHVybiBjb250ZXh0W3RoaXMuS0VZXSA9IG5ldyB0aGlzKClcbn1cblxucHJvdG8uYWRkID0gZnVuY3Rpb24oYmxvY2tzKSB7XG4gIGZvcih2YXIgbmFtZSBpbiBibG9ja3MpIHtcbiAgICAodGhpcy5ibG9ja3NbbmFtZV0gPSB0aGlzLmJsb2Nrc1tuYW1lXSB8fCBbXSkudW5zaGlmdChibG9ja3NbbmFtZV0pXG4gIH1cbn1cblxucHJvdG8uZ2V0ID0gZnVuY3Rpb24obmFtZSkge1xuICB2YXIgbGlzdCA9IHRoaXMuYmxvY2tzW25hbWVdIHx8IFtdXG5cbiAgcmV0dXJuIGxpc3RbbGlzdC5sZW5ndGggLSAxXVxufVxuXG5wcm90by5wdXNoID0gZnVuY3Rpb24obmFtZSwgYmxvY2spIHtcbiAgKHRoaXMuYmxvY2tzW25hbWVdID0gdGhpcy5ibG9ja3NbbmFtZV0gfHwgW10pLnB1c2goYmxvY2spXG59XG5cbnByb3RvLnBvcCA9IGZ1bmN0aW9uKG5hbWUpIHtcbiAgcmV0dXJuICh0aGlzLmJsb2Nrc1tuYW1lXSA9IHRoaXMuYmxvY2tzW25hbWVdIHx8IFtdKS5wb3AoKVxufVxuIiwibW9kdWxlLmV4cG9ydHMgPSBDb21tZW50VG9rZW5cblxudmFyIFRva2VuID0gcmVxdWlyZSgnLi90b2tlbicpXG5cbmZ1bmN0aW9uIENvbW1lbnRUb2tlbihjb250ZW50LCBsaW5lKSB7XG4gIFRva2VuLmNhbGwodGhpcywgY29udGVudCwgbGluZSlcbn1cblxudmFyIGNvbnMgPSBDb21tZW50VG9rZW5cbiAgLCBwcm90byA9IGNvbnMucHJvdG90eXBlID0gbmV3IFRva2VuXG5cbnByb3RvLmNvbnN0cnVjdG9yID0gY29uc1xuXG5wcm90by5ub2RlID0gZnVuY3Rpb24ocGFyc2VyKSB7XG4gIC8vIG5vLW9wZXJhdGlvblxuICByZXR1cm4gbnVsbFxufVxuXG4iLCJtb2R1bGUuZXhwb3J0cyA9IENvbnRleHRcblxuZnVuY3Rpb24gQ29udGV4dChmcm9tKSB7XG4gIGlmKGZyb20gJiYgZnJvbS5jb25zdHJ1Y3RvciA9PT0gQ29udGV4dCkge1xuICAgIHJldHVybiBmcm9tXG4gIH1cblxuICBmcm9tID0gZnJvbSB8fCB7fVxuICBmb3IodmFyIGtleSBpbiBmcm9tKSBpZihmcm9tLmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICB0aGlzW2tleV0gPSBmcm9tW2tleV1cbiAgfVxufVxuXG52YXIgY29ucyA9IENvbnRleHRcbiAgLCBwcm90byA9IGNvbnMucHJvdG90eXBlXG5cbnByb3RvLmNvcHkgPSBmdW5jdGlvbigpIHtcbiAgdmFyIEYgPSBGdW5jdGlvbigpXG4gIEYubmFtZSA9IGNvbnMubmFtZVxuICBGLnByb3RvdHlwZSA9IHRoaXNcbiAgcmV0dXJuIG5ldyBGXG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IHsgdGltZTogdGltZV9mb3JtYXQsIGRhdGU6IGZvcm1hdCwgRGF0ZUZvcm1hdDogRGF0ZUZvcm1hdCB9XG5cbnRyeSB7IHJlcXVpcmUoJ3R6JykgfSBjYXRjaChlKSB7IH1cblxuZnVuY3Rpb24gY2FwZmlyc3QgKHN0cikge1xuICByZXR1cm4gc3RyLnJlcGxhY2UoL14oLnsxfSkvLCBmdW5jdGlvbihhLCBtKSB7IHJldHVybiBtLnRvVXBwZXJDYXNlKCkgfSlcbn1cblxuZnVuY3Rpb24gbWFwIChhcnIsIGl0ZXIpIHtcbiAgdmFyIG91dCA9IFtdXG4gIGZvcih2YXIgaSA9IDAsIGxlbiA9IGFyci5sZW5ndGg7IGkgPCBsZW47ICsraSlcbiAgICBvdXQucHVzaChpdGVyKGFycltpXSwgaSwgYXJyKSlcbiAgcmV0dXJuIG91dFxufVxuXG5mdW5jdGlvbiByZWR1Y2UoYXJyLCBpdGVyLCBzdGFydCkge1xuICBhcnIgPSBhcnIuc2xpY2UoKVxuICBpZihzdGFydCAhPT0gdW5kZWZpbmVkKVxuICAgIGFyci51bnNoaWZ0KHN0YXJ0KVxuXG4gIGlmKGFyci5sZW5ndGggPT09IDApXG4gICAgdGhyb3cgbmV3IEVycm9yKCdyZWR1Y2Ugb2YgZW1wdHkgYXJyYXknKVxuXG4gIGlmKGFyci5sZW5ndGggPT09IDEpXG4gICAgcmV0dXJuIGFyclswXVxuXG4gIHZhciBvdXQgPSBhcnIuc2xpY2UoKVxuICAgICwgaXRlbSA9IGFyci5zaGlmdCgpXG5cbiAgZG8ge1xuICAgIGl0ZW0gPSBpdGVyKGl0ZW0sIGFyci5zaGlmdCgpKVxuICB9IHdoaWxlKGFyci5sZW5ndGgpXG5cbiAgcmV0dXJuIGl0ZW1cbn1cblxuZnVuY3Rpb24gc3RydG9hcnJheShzdHIpIHtcbiAgdmFyIGFyciA9IFtdXG4gIGZvcih2YXIgaSA9IDAsIGxlbiA9IHN0ci5sZW5ndGg7IGkgPCBsZW47ICsraSlcbiAgICBhcnIucHVzaChzdHIuY2hhckF0KGkpKVxuICByZXR1cm4gYXJyXG59XG5cbnZhciBXRUVLREFZUyA9IFsgJ3N1bmRheScsICdtb25kYXknLCAndHVlc2RheScsICd3ZWRuZXNkYXknLCAndGh1cnNkYXknLCAnZnJpZGF5JywgJ3NhdHVyZGF5JyBdXG4gICwgV0VFS0RBWVNfQUJCUiA9IG1hcChXRUVLREFZUywgZnVuY3Rpb24oeCkgeyByZXR1cm4gc3RydG9hcnJheSh4KS5zbGljZSgwLCAzKS5qb2luKCcnKSB9KVxuICAsIFdFRUtEQVlTX1JFViA9IHJlZHVjZShtYXAoV0VFS0RBWVMsIGZ1bmN0aW9uKHgsIGkpIHsgcmV0dXJuIFt4LCBpXSB9KSwgZnVuY3Rpb24obGhzLCByaHMpIHsgbGhzW3Joc1swXV0gPSByaHNbMV07IHJldHVybiBsaHMgfSwge30pXG4gICwgTU9OVEhTID0gWyAnamFudWFyeScsICdmZWJydWFyeScsICdtYXJjaCcsICdhcHJpbCcsICdtYXknLCAnanVuZScsICdqdWx5JywgJ2F1Z3VzdCcsICdzZXB0ZW1iZXInLCAnb2N0b2JlcicsICdub3ZlbWJlcicsICdkZWNlbWJlcicgXVxuICAsIE1PTlRIU18zID0gbWFwKE1PTlRIUywgZnVuY3Rpb24oeCkgeyByZXR1cm4gc3RydG9hcnJheSh4KS5zbGljZSgwLCAzKS5qb2luKCcnKSB9KVxuICAsIE1PTlRIU18zX1JFViA9IHJlZHVjZShtYXAoTU9OVEhTXzMsIGZ1bmN0aW9uKHgsIGkpIHsgcmV0dXJuIFt4LCBpXSB9KSwgZnVuY3Rpb24obGhzLCByaHMpIHsgbGhzW3Joc1swXV0gPSByaHNbMV07IHJldHVybiBsaHMgfSwge30pXG4gICwgTU9OVEhTX0FQID0gW1xuICAgICdKYW4uJ1xuICAsICdGZWIuJ1xuICAsICdNYXJjaCdcbiAgLCAnQXByaWwnXG4gICwgJ01heSdcbiAgLCAnSnVuZSdcbiAgLCAnSnVseSdcbiAgLCAnQXVnLidcbiAgLCAnU2VwdC4nXG4gICwgJ09jdC4nXG4gICwgJ05vdi4nXG4gICwgJ0RlYy4nXG4gIF1cblxuXG52YXIgTU9OVEhTX0FMVCA9IHtcbiAgMTogJ0phbnVhcnknLFxuICAyOiAnRmVicnVhcnknLFxuICAzOiAnTWFyY2gnLFxuICA0OiAnQXByaWwnLFxuICA1OiAnTWF5JyxcbiAgNjogJ0p1bmUnLFxuICA3OiAnSnVseScsXG4gIDg6ICdBdWd1c3QnLFxuICA5OiAnU2VwdGVtYmVyJyxcbiAgMTA6ICdPY3RvYmVyJyxcbiAgMTE6ICdOb3ZlbWJlcicsXG4gIDEyOiAnRGVjZW1iZXInXG59XG5cbmZ1bmN0aW9uIEZvcm1hdHRlcih0KSB7XG4gIHRoaXMuZGF0YSA9IHRcbn1cblxuRm9ybWF0dGVyLnByb3RvdHlwZS5mb3JtYXQgPSBmdW5jdGlvbihzdHIpIHtcbiAgdmFyIGJpdHMgPSBzdHJ0b2FycmF5KHN0cilcbiAgLCBlc2MgPSBmYWxzZVxuICAsIG91dCA9IFtdXG4gICwgYml0XG5cbiAgd2hpbGUoYml0cy5sZW5ndGgpIHtcbiAgICBiaXQgPSBiaXRzLnNoaWZ0KClcblxuICAgIGlmKGVzYykge1xuICAgICAgb3V0LnB1c2goYml0KVxuICAgICAgZXNjID0gZmFsc2VcbiAgICB9IGVsc2UgaWYoYml0ID09PSAnXFxcXCcpIHtcbiAgICAgIGVzYyA9IHRydWVcbiAgICB9IGVsc2UgaWYodGhpc1tiaXRdKSB7XG4gICAgICBvdXQucHVzaCh0aGlzW2JpdF0oKSlcbiAgICB9IGVsc2Uge1xuICAgICAgb3V0LnB1c2goYml0KVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiBvdXQuam9pbignJylcbn1cblxuZnVuY3Rpb24gVGltZUZvcm1hdCh0KSB7XG4gIEZvcm1hdHRlci5jYWxsKHRoaXMsIHQpXG59XG5cbnZhciBwcm90byA9IFRpbWVGb3JtYXQucHJvdG90eXBlID0gbmV3IEZvcm1hdHRlcigpXG5cbnByb3RvLmEgPSBmdW5jdGlvbigpIHtcbiAgLy8gJ2EubS4nIG9yICdwLm0uJ1xuICBpZiAodGhpcy5kYXRhLmdldEhvdXJzKCkgPiAxMSlcbiAgICByZXR1cm4gJ3AubS4nXG4gIHJldHVybiAnYS5tLidcbn1cblxucHJvdG8uQSA9IGZ1bmN0aW9uKCkge1xuICAvLyAnQU0nIG9yICdQTSdcbiAgaWYgKHRoaXMuZGF0YS5nZXRIb3VycygpID4gMTEpXG4gICAgcmV0dXJuICdQTSdcbiAgcmV0dXJuICdBTSdcbn1cblxucHJvdG8uZiA9IGZ1bmN0aW9uKCkge1xuICAvKlxuICBUaW1lLCBpbiAxMi1ob3VyIGhvdXJzIGFuZCBtaW51dGVzLCB3aXRoIG1pbnV0ZXMgbGVmdCBvZmYgaWYgdGhleSdyZVxuICB6ZXJvLlxuICBFeGFtcGxlczogJzEnLCAnMTozMCcsICcyOjA1JywgJzInXG4gIFByb3ByaWV0YXJ5IGV4dGVuc2lvbi5cbiAgKi9cbiAgaWYgKHRoaXMuZGF0YS5nZXRNaW51dGVzKCkgPT0gMClcbiAgICByZXR1cm4gdGhpcy5nKClcbiAgcmV0dXJuIHRoaXMuZygpICsgXCI6XCIgKyB0aGlzLmkoKVxufVxuXG5wcm90by5nID0gZnVuY3Rpb24oKSB7XG4gIC8vIEhvdXIsIDEyLWhvdXIgZm9ybWF0IHdpdGhvdXQgbGVhZGluZyB6ZXJvcyBpLmUuICcxJyB0byAnMTInXG4gIHZhciBoID0gdGhpcy5kYXRhLmdldEhvdXJzKClcblxuICByZXR1cm4gdGhpcy5kYXRhLmdldEhvdXJzKCkgJSAxMiB8fCAxMlxufVxuXG5wcm90by5HID0gZnVuY3Rpb24oKSB7XG4gIC8vIEhvdXIsIDI0LWhvdXIgZm9ybWF0IHdpdGhvdXQgbGVhZGluZyB6ZXJvcyBpLmUuICcwJyB0byAnMjMnXG4gIHJldHVybiB0aGlzLmRhdGEuZ2V0SG91cnMoKVxufVxuXG5wcm90by5oID0gZnVuY3Rpb24oKSB7XG4gIC8vIEhvdXIsIDEyLWhvdXIgZm9ybWF0IGkuZS4gJzAxJyB0byAnMTInXG4gIHJldHVybiAoJzAnK3RoaXMuZygpKS5zbGljZSgtMilcbn1cblxucHJvdG8uSCA9IGZ1bmN0aW9uKCkge1xuICAvLyBIb3VyLCAyNC1ob3VyIGZvcm1hdCBpLmUuICcwMCcgdG8gJzIzJ1xuICByZXR1cm4gKCcwJyt0aGlzLkcoKSkuc2xpY2UoLTIpXG59XG5cbnByb3RvLmkgPSBmdW5jdGlvbigpIHtcbiAgLy8gTWludXRlcyBpLmUuICcwMCcgdG8gJzU5J1xuICByZXR1cm4gKCcwJyArIHRoaXMuZGF0YS5nZXRNaW51dGVzKCkpLnNsaWNlKC0yKVxufVxuXG5wcm90by5QID0gZnVuY3Rpb24oKSB7XG4gIC8qXG4gIFRpbWUsIGluIDEyLWhvdXIgaG91cnMsIG1pbnV0ZXMgYW5kICdhLm0uJy8ncC5tLicsIHdpdGggbWludXRlcyBsZWZ0IG9mZlxuICBpZiB0aGV5J3JlIHplcm8gYW5kIHRoZSBzdHJpbmdzICdtaWRuaWdodCcgYW5kICdub29uJyBpZiBhcHByb3ByaWF0ZS5cbiAgRXhhbXBsZXM6ICcxIGEubS4nLCAnMTozMCBwLm0uJywgJ21pZG5pZ2h0JywgJ25vb24nLCAnMTI6MzAgcC5tLidcbiAgUHJvcHJpZXRhcnkgZXh0ZW5zaW9uLlxuICAqL1xuICB2YXIgbSA9IHRoaXMuZGF0YS5nZXRNaW51dGVzKClcbiAgICAsIGggPSB0aGlzLmRhdGEuZ2V0SG91cnMoKVxuXG4gIGlmIChtID09IDAgJiYgaCA9PSAwKVxuICAgIHJldHVybiAnbWlkbmlnaHQnXG4gIGlmIChtID09IDAgJiYgaCA9PSAxMilcbiAgICByZXR1cm4gJ25vb24nXG4gIHJldHVybiB0aGlzLmYoKSArIFwiIFwiICsgdGhpcy5hKClcbn1cblxucHJvdG8ucyA9IGZ1bmN0aW9uKCkge1xuICAvLyBTZWNvbmRzIGkuZS4gJzAwJyB0byAnNTknXG4gIHJldHVybiAoJzAnK3RoaXMuZGF0YS5nZXRTZWNvbmRzKCkpLnNsaWNlKC0yKVxufVxuXG5wcm90by51ID0gZnVuY3Rpb24oKSB7XG4gIC8vIE1pY3Jvc2Vjb25kc1xuICByZXR1cm4gdGhpcy5kYXRhLmdldE1pbGxpc2Vjb25kcygpXG59XG5cbi8vIERhdGVGb3JtYXRcblxuZnVuY3Rpb24gRGF0ZUZvcm1hdCh0KSB7XG4gIHRoaXMuZGF0YSA9IHRcbiAgdGhpcy55ZWFyX2RheXMgPSBbMCwgMzEsIDU5LCA5MCwgMTIwLCAxNTEsIDE4MSwgMjEyLCAyNDMsIDI3MywgMzA0LCAzMzRdXG59XG5cbnByb3RvID0gRGF0ZUZvcm1hdC5wcm90b3R5cGUgPSBuZXcgVGltZUZvcm1hdCgpXG5cbnByb3RvLmNvbnRydWN0b3IgPSBEYXRlRm9ybWF0XG5cbnByb3RvLmIgPSBmdW5jdGlvbigpIHtcbiAgLy8gTW9udGgsIHRleHR1YWwsIDMgbGV0dGVycywgbG93ZXJjYXNlIGUuZy4gJ2phbidcbiAgcmV0dXJuIE1PTlRIU18zW3RoaXMuZGF0YS5nZXRNb250aCgpXVxufVxuXG5wcm90by5jPSBmdW5jdGlvbigpIHtcbiAgLypcbiAgSVNPIDg2MDEgRm9ybWF0XG4gIEV4YW1wbGUgOiAnMjAwOC0wMS0wMlQxMDozMDowMC4wMDAxMjMnXG4gICovXG4gIHJldHVybiB0aGlzLmRhdGEudG9JU09TdHJpbmcgPyB0aGlzLmRhdGEudG9JU09TdHJpbmcoKSA6ICcnXG59XG5cbnByb3RvLmQgPSBmdW5jdGlvbigpIHtcbiAgLy8gRGF5IG9mIHRoZSBtb250aCwgMiBkaWdpdHMgd2l0aCBsZWFkaW5nIHplcm9zIGkuZS4gJzAxJyB0byAnMzEnXG4gIHJldHVybiAoJzAnK3RoaXMuZGF0YS5nZXREYXRlKCkpLnNsaWNlKC0yKVxufVxuXG5wcm90by5EID0gZnVuY3Rpb24oKSB7XG4gIC8vIERheSBvZiB0aGUgd2VlaywgdGV4dHVhbCwgMyBsZXR0ZXJzIGUuZy4gJ0ZyaSdcbiAgcmV0dXJuIGNhcGZpcnN0KFdFRUtEQVlTX0FCQlJbdGhpcy5kYXRhLmdldERheSgpXSlcbn1cblxucHJvdG8uRSA9IGZ1bmN0aW9uKCkge1xuICAvLyBBbHRlcm5hdGl2ZSBtb250aCBuYW1lcyBhcyByZXF1aXJlZCBieSBzb21lIGxvY2FsZXMuIFByb3ByaWV0YXJ5IGV4dGVuc2lvbi5cbiAgcmV0dXJuIE1PTlRIU19BTFRbdGhpcy5kYXRhLmdldE1vbnRoKCkrMV1cbn1cblxucHJvdG8uRj0gZnVuY3Rpb24oKSB7XG4gIC8vIE1vbnRoLCB0ZXh0dWFsLCBsb25nIGUuZy4gJ0phbnVhcnknXG4gIHJldHVybiBjYXBmaXJzdChNT05USFNbdGhpcy5kYXRhLmdldE1vbnRoKCldKVxufVxuXG5wcm90by5JID0gZnVuY3Rpb24oKSB7XG4gIC8vICcxJyBpZiBEYXlsaWdodCBTYXZpbmdzIFRpbWUsICcwJyBvdGhlcndpc2UuXG4gIHJldHVybiB0aGlzLmRhdGEuaXNEU1QoKSA/ICcxJyA6ICcwJ1xufVxuXG5wcm90by5qID0gZnVuY3Rpb24oKSB7XG4gIC8vIERheSBvZiB0aGUgbW9udGggd2l0aG91dCBsZWFkaW5nIHplcm9zIGkuZS4gJzEnIHRvICczMSdcbiAgcmV0dXJuIHRoaXMuZGF0YS5nZXREYXRlKClcbn1cblxucHJvdG8ubCA9IGZ1bmN0aW9uKCkge1xuICAvLyBEYXkgb2YgdGhlIHdlZWssIHRleHR1YWwsIGxvbmcgZS5nLiAnRnJpZGF5J1xuICByZXR1cm4gY2FwZmlyc3QoV0VFS0RBWVNbdGhpcy5kYXRhLmdldERheSgpXSlcbn1cblxucHJvdG8uTCA9IGZ1bmN0aW9uKCkge1xuICAvLyBCb29sZWFuIGZvciB3aGV0aGVyIGl0IGlzIGEgbGVhcCB5ZWFyIGkuZS4gVHJ1ZSBvciBGYWxzZVxuICAvLyBTZWxlY3RzIHRoaXMgeWVhcidzIEZlYnJ1YXJ5IDI5dGggYW5kIGNoZWNrcyBpZiB0aGUgbW9udGhcbiAgLy8gaXMgc3RpbGwgRmVicnVhcnkuXG4gIHJldHVybiAobmV3IERhdGUodGhpcy5kYXRhLmdldEZ1bGxZZWFyKCksIDEsIDI5KS5nZXRNb250aCgpKSA9PT0gMVxufVxuXG5wcm90by5tID0gZnVuY3Rpb24oKSB7XG4gIC8vIE1vbnRoIGkuZS4gJzAxJyB0byAnMTInXCJcbiAgcmV0dXJuICgnMCcrKHRoaXMuZGF0YS5nZXRNb250aCgpKzEpKS5zbGljZSgtMilcbn1cblxucHJvdG8uTSA9IGZ1bmN0aW9uKCkge1xuICAvLyBNb250aCwgdGV4dHVhbCwgMyBsZXR0ZXJzIGUuZy4gJ0phbidcbiAgcmV0dXJuIGNhcGZpcnN0KE1PTlRIU18zW3RoaXMuZGF0YS5nZXRNb250aCgpXSlcbn1cblxucHJvdG8ubiA9IGZ1bmN0aW9uKCkge1xuICAvLyBNb250aCB3aXRob3V0IGxlYWRpbmcgemVyb3MgaS5lLiAnMScgdG8gJzEyJ1xuICByZXR1cm4gdGhpcy5kYXRhLmdldE1vbnRoKCkgKyAxXG59XG5cbnByb3RvLk4gPSBmdW5jdGlvbigpIHtcbiAgLy8gTW9udGggYWJicmV2aWF0aW9uIGluIEFzc29jaWF0ZWQgUHJlc3Mgc3R5bGUuIFByb3ByaWV0YXJ5IGV4dGVuc2lvbi5cbiAgcmV0dXJuIE1PTlRIU19BUFt0aGlzLmRhdGEuZ2V0TW9udGgoKV1cbn1cblxucHJvdG8uTyA9IGZ1bmN0aW9uKCkge1xuICAvLyBEaWZmZXJlbmNlIHRvIEdyZWVud2ljaCB0aW1lIGluIGhvdXJzIGUuZy4gJyswMjAwJ1xuXG4gIHZhciB0em9mZnMgPSB0aGlzLmRhdGEuZ2V0VGltZXpvbmVPZmZzZXQoKVxuICAgICwgb2ZmcyA9IH5+KHR6b2ZmcyAvIDYwKVxuICAgICwgbWlucyA9ICgnMDAnICsgfn5NYXRoLmFicyh0em9mZnMgJSA2MCkpLnNsaWNlKC0yKVxuICBcbiAgcmV0dXJuICgodHpvZmZzID4gMCkgPyAnLScgOiAnKycpICsgKCcwMCcgKyBNYXRoLmFicyhvZmZzKSkuc2xpY2UoLTIpICsgbWluc1xufVxuXG5wcm90by5yID0gZnVuY3Rpb24oKSB7XG4gIC8vIFJGQyAyODIyIGZvcm1hdHRlZCBkYXRlIGUuZy4gJ1RodSwgMjEgRGVjIDIwMDAgMTY6MDE6MDcgKzAyMDAnXG4gIHJldHVybiB0aGlzLmZvcm1hdCgnRCwgaiBNIFkgSDppOnMgTycpXG59XG5cbnByb3RvLlMgPSBmdW5jdGlvbigpIHtcbiAgLyogRW5nbGlzaCBvcmRpbmFsIHN1ZmZpeCBmb3IgdGhlIGRheSBvZiB0aGUgbW9udGgsIDIgY2hhcmFjdGVycyBpLmUuICdzdCcsICduZCcsICdyZCcgb3IgJ3RoJyAqL1xuICB2YXIgZCA9IHRoaXMuZGF0YS5nZXREYXRlKClcblxuICBpZiAoZCA+PSAxMSAmJiBkIDw9IDEzKVxuICAgIHJldHVybiAndGgnXG4gIHZhciBsYXN0ID0gZCAlIDEwXG5cbiAgaWYgKGxhc3QgPT0gMSlcbiAgICByZXR1cm4gJ3N0J1xuICBpZiAobGFzdCA9PSAyKVxuICAgIHJldHVybiAnbmQnXG4gIGlmIChsYXN0ID09IDMpXG4gICAgcmV0dXJuICdyZCdcbiAgcmV0dXJuICd0aCdcbn1cblxucHJvdG8udCA9IGZ1bmN0aW9uKCkge1xuICAvLyBOdW1iZXIgb2YgZGF5cyBpbiB0aGUgZ2l2ZW4gbW9udGggaS5lLiAnMjgnIHRvICczMSdcbiAgLy8gVXNlIGEgamF2YXNjcmlwdCB0cmljayB0byBkZXRlcm1pbmUgdGhlIGRheXMgaW4gYSBtb250aFxuICByZXR1cm4gMzIgLSBuZXcgRGF0ZSh0aGlzLmRhdGEuZ2V0RnVsbFllYXIoKSwgdGhpcy5kYXRhLmdldE1vbnRoKCksIDMyKS5nZXREYXRlKClcbn1cblxucHJvdG8uVCA9IGZ1bmN0aW9uKCkge1xuICAvLyBUaW1lIHpvbmUgb2YgdGhpcyBtYWNoaW5lIGUuZy4gJ0VTVCcgb3IgJ01EVCdcbiAgaWYodGhpcy5kYXRhLnR6aW5mbykge1xuICAgIHJldHVybiB0aGlzLmRhdGEudHppbmZvKCkuYWJiciB8fCAnPz8/J1xuICB9XG4gIHJldHVybiAnPz8/J1xufVxuXG5wcm90by5VID0gZnVuY3Rpb24oKSB7XG4gIC8vIFNlY29uZHMgc2luY2UgdGhlIFVuaXggZXBvY2ggKEphbnVhcnkgMSAxOTcwIDAwOjAwOjAwIEdNVClcbiAgLy8gVVRDKCkgcmV0dXJuIG1pbGxpc2Vjb25kcyBmcm1vIHRoZSBlcG9jaFxuICAvLyByZXR1cm4gTWF0aC5yb3VuZCh0aGlzLmRhdGEuVVRDKCkgKiAxMDAwKVxuICByZXR1cm4gfn4odGhpcy5kYXRhIC8gMTAwMClcbn1cblxucHJvdG8udyA9IGZ1bmN0aW9uKCkge1xuICAvLyBEYXkgb2YgdGhlIHdlZWssIG51bWVyaWMsIGkuZS4gJzAnIChTdW5kYXkpIHRvICc2JyAoU2F0dXJkYXkpXG4gIHJldHVybiB0aGlzLmRhdGEuZ2V0RGF5KClcbn1cblxucHJvdG8uVyA9IGZ1bmN0aW9uKCkge1xuICAvLyBJU08tODYwMSB3ZWVrIG51bWJlciBvZiB5ZWFyLCB3ZWVrcyBzdGFydGluZyBvbiBNb25kYXlcbiAgLy8gQWxnb3JpdGhtIGZyb20gaHR0cDovL3d3dy5wZXJzb25hbC5lY3UuZWR1L21jY2FydHlyL0lTT3dkQUxHLnR4dFxuICB2YXIgamFuMV93ZWVrZGF5ID0gbmV3IERhdGUodGhpcy5kYXRhLmdldEZ1bGxZZWFyKCksIDAsIDEpLmdldERheSgpIFxuICAgICwgd2Vla2RheSA9IHRoaXMuZGF0YS5nZXREYXkoKVxuICAgICwgZGF5X29mX3llYXIgPSB0aGlzLnooKVxuICAgICwgd2Vla19udW1iZXJcbiAgICAsIGkgPSAzNjVcblxuICBpZihkYXlfb2ZfeWVhciA8PSAoOCAtIGphbjFfd2Vla2RheSkgJiYgamFuMV93ZWVrZGF5ID4gNCkge1xuICAgIGlmKGphbjFfd2Vla2RheSA9PT0gNSB8fCAoamFuMV93ZWVrZGF5ID09PSA2ICYmIHRoaXMuTC5jYWxsKHtkYXRhOm5ldyBEYXRlKHRoaXMuZGF0YS5nZXRGdWxsWWVhcigpLTEsIDAsIDEpfSkpKSB7XG4gICAgICB3ZWVrX251bWJlciA9IDUzXG4gICAgfSBlbHNlIHtcbiAgICAgIHdlZWtfbnVtYmVyID0gNTJcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgaWYodGhpcy5MKCkpIHtcbiAgICAgIGkgPSAzNjZcbiAgICB9XG4gICAgaWYoKGkgLSBkYXlfb2ZfeWVhcikgPCAoNCAtIHdlZWtkYXkpKSB7XG4gICAgICB3ZWVrX251bWJlciA9IDFcbiAgICB9IGVsc2Uge1xuICAgICAgd2Vla19udW1iZXIgPSB+figoZGF5X29mX3llYXIgKyAoNyAtIHdlZWtkYXkpICsgKGphbjFfd2Vla2RheSAtIDEpKSAvIDcpXG4gICAgICBpZihqYW4xX3dlZWtkYXkgPiA0KVxuICAgICAgICB3ZWVrX251bWJlciAtPSAxXG4gICAgfVxuICB9XG4gIHJldHVybiB3ZWVrX251bWJlclxufVxuXG5wcm90by55ID0gZnVuY3Rpb24oKSB7XG4gIC8vIFllYXIsIDIgZGlnaXRzIGUuZy4gJzk5J1xuICByZXR1cm4gKCcnK3RoaXMuZGF0YS5nZXRGdWxsWWVhcigpKS5zbGljZSgtMilcbn1cblxucHJvdG8uWSA9IGZ1bmN0aW9uKCkge1xuICAvLyBZZWFyLCA0IGRpZ2l0cyBlLmcuICcxOTk5J1xuICByZXR1cm4gdGhpcy5kYXRhLmdldEZ1bGxZZWFyKClcbn1cblxucHJvdG8ueiA9IGZ1bmN0aW9uKCkge1xuICAvLyBEYXkgb2YgdGhlIHllYXIgaS5lLiAnMCcgdG8gJzM2NSdcblxuICBkb3kgPSB0aGlzLnllYXJfZGF5c1t0aGlzLmRhdGEuZ2V0TW9udGgoKV0gKyB0aGlzLmRhdGEuZ2V0RGF0ZSgpXG4gIGlmICh0aGlzLkwoKSAmJiB0aGlzLmRhdGEuZ2V0TW9udGgoKSA+IDEpXG4gICAgZG95ICs9IDFcbiAgcmV0dXJuIGRveVxufVxuXG5wcm90by5aID0gZnVuY3Rpb24oKSB7XG4gIC8qXG4gIFRpbWUgem9uZSBvZmZzZXQgaW4gc2Vjb25kcyAoaS5lLiAnLTQzMjAwJyB0byAnNDMyMDAnKS4gVGhlIG9mZnNldCBmb3JcbiAgdGltZXpvbmVzIHdlc3Qgb2YgVVRDIGlzIGFsd2F5cyBuZWdhdGl2ZSwgYW5kIGZvciB0aG9zZSBlYXN0IG9mIFVUQyBpc1xuICBhbHdheXMgcG9zaXRpdmUuXG4gICovXG4gIHJldHVybiB0aGlzLmRhdGEuZ2V0VGltZXpvbmVPZmZzZXQoKSAqIC02MFxufVxuXG5cbmZ1bmN0aW9uIGZvcm1hdCh2YWx1ZSwgZm9ybWF0X3N0cmluZykge1xuICB2YXIgZGYgPSBuZXcgRGF0ZUZvcm1hdCh2YWx1ZSlcbiAgcmV0dXJuIGRmLmZvcm1hdChmb3JtYXRfc3RyaW5nKVxufVxuXG5cbmZ1bmN0aW9uIHRpbWVfZm9ybWF0KHZhbHVlLCBmb3JtYXRfc3RyaW5nKSB7XG4gIHZhciB0ZiA9IG5ldyBUaW1lRm9ybWF0KHZhbHVlKVxuICByZXR1cm4gdGYuZm9ybWF0KGZvcm1hdF9zdHJpbmcpXG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBsb2c6IGZ1bmN0aW9uKHZhbHVlKSB7IGNvbnNvbGUubG9nKHZhbHVlKSB9XG4gICwgZXJyb3I6IGZ1bmN0aW9uKGVycikgeyBjb25zb2xlLmVycm9yKGVyciwgZXJyICYmIGVyci5zdGFjaykgfVxuICAsIGluZm86IGZ1bmN0aW9uKHZhbHVlKSB7IH0gXG59XG4iLCJ2YXIgTGlicmFyeSA9IHJlcXVpcmUoJy4vbGlicmFyeScpXG5cbm1vZHVsZS5leHBvcnRzID0gRGVmYXVsdEZpbHRlcnNcblxuZnVuY3Rpb24gRGVmYXVsdEZpbHRlcnMoKSB7XG4gIExpYnJhcnkuY2FsbCh0aGlzLCB0aGlzLmJ1aWx0aW5zKVxufVxuXG52YXIgY29ucyA9IERlZmF1bHRGaWx0ZXJzXG4gICwgcHJvdG8gPSBjb25zLnByb3RvdHlwZSA9IG5ldyBMaWJyYXJ5XG5cbnByb3RvLmNvbnN0cnVjdG9yID0gY29uc1xuXG5wcm90by5idWlsdGlucyA9IHtcbiAgICAnYWRkJzogcmVxdWlyZSgnLi9maWx0ZXJzL2FkZCcpXG4gICwgJ2FkZHNsYXNoZXMnOiByZXF1aXJlKCcuL2ZpbHRlcnMvYWRkc2xhc2hlcycpXG4gICwgJ2NhcGZpcnN0JzogcmVxdWlyZSgnLi9maWx0ZXJzL2NhcGZpcnN0JylcbiAgLCAnY2VudGVyJzogcmVxdWlyZSgnLi9maWx0ZXJzL2NlbnRlcicpXG4gICwgJ2N1dCc6IHJlcXVpcmUoJy4vZmlsdGVycy9jdXQnKVxuICAsICdkYXRlJzogcmVxdWlyZSgnLi9maWx0ZXJzL2RhdGUnKVxuICAsICdkZWZhdWx0JzogcmVxdWlyZSgnLi9maWx0ZXJzL2RlZmF1bHQnKVxuICAsICdkaWN0c29ydCc6IHJlcXVpcmUoJy4vZmlsdGVycy9kaWN0c29ydCcpXG4gICwgJ2RpY3Rzb3J0cmV2ZXJzZWQnOiByZXF1aXJlKCcuL2ZpbHRlcnMvZGljdHNvcnRyZXZlcnNlZCcpXG4gICwgJ2RpdmlzaWJsZWJ5JzogcmVxdWlyZSgnLi9maWx0ZXJzL2RpdmlzaWJsZWJ5JylcbiAgLCAnZXNjYXBlJzogcmVxdWlyZSgnLi9maWx0ZXJzL2VzY2FwZScpXG4gICwgJ2ZpbGVzaXplZm9ybWF0JzogcmVxdWlyZSgnLi9maWx0ZXJzL2ZpbGVzaXplZm9ybWF0JylcbiAgLCAnZmlyc3QnOiByZXF1aXJlKCcuL2ZpbHRlcnMvZmlyc3QnKVxuICAsICdmbG9hdGZvcm1hdCc6IHJlcXVpcmUoJy4vZmlsdGVycy9mbG9hdGZvcm1hdCcpXG4gICwgJ2ZvcmNlX2VzY2FwZSc6IHJlcXVpcmUoJy4vZmlsdGVycy9mb3JjZV9lc2NhcGUnKVxuICAsICdnZXRfZGlnaXQnOiByZXF1aXJlKCcuL2ZpbHRlcnMvZ2V0X2RpZ2l0JylcbiAgLCAnaW5kZXgnOiByZXF1aXJlKCcuL2ZpbHRlcnMvaW5kZXgnKVxuICAsICdpdGVyaXRlbXMnOiByZXF1aXJlKCcuL2ZpbHRlcnMvaXRlcml0ZW1zJylcbiAgLCAnaXJpZW5jb2RlJzogcmVxdWlyZSgnLi9maWx0ZXJzL2lyaWVuY29kZScpXG4gICwgJ2pvaW4nOiByZXF1aXJlKCcuL2ZpbHRlcnMvam9pbicpXG4gICwgJ2xhc3QnOiByZXF1aXJlKCcuL2ZpbHRlcnMvbGFzdCcpXG4gICwgJ2xlbmd0aCc6IHJlcXVpcmUoJy4vZmlsdGVycy9sZW5ndGgnKVxuICAsICdsZW5ndGhfaXMnOiByZXF1aXJlKCcuL2ZpbHRlcnMvbGVuZ3RoX2lzJylcbiAgLCAnbGluZWJyZWFrcyc6IHJlcXVpcmUoJy4vZmlsdGVycy9saW5lYnJlYWtzJylcbiAgLCAnbGluZWJyZWFrc2JyJzogcmVxdWlyZSgnLi9maWx0ZXJzL2xpbmVicmVha3NicicpXG4gICwgJ2xpbmVudW1iZXJzJzogcmVxdWlyZSgnLi9maWx0ZXJzL2xpbmVudW1iZXJzJylcbiAgLCAnbGp1c3QnOiByZXF1aXJlKCcuL2ZpbHRlcnMvbGp1c3QnKVxuICAsICdsb3dlcic6IHJlcXVpcmUoJy4vZmlsdGVycy9sb3dlcicpXG4gICwgJ21ha2VfbGlzdCc6IHJlcXVpcmUoJy4vZmlsdGVycy9tYWtlX2xpc3QnKVxuICAsICdwaG9uZTJudW1lcmljJzogcmVxdWlyZSgnLi9maWx0ZXJzL3Bob25lMm51bWVyaWMnKVxuICAsICdwbHVyYWxpemUnOiByZXF1aXJlKCcuL2ZpbHRlcnMvcGx1cmFsaXplJylcbiAgLCAncmFuZG9tJzogcmVxdWlyZSgnLi9maWx0ZXJzL3JhbmRvbScpXG4gICwgJ3JqdXN0JzogcmVxdWlyZSgnLi9maWx0ZXJzL3JqdXN0JylcbiAgLCAnc2FmZSc6IHJlcXVpcmUoJy4vZmlsdGVycy9zYWZlJylcbiAgLCAnc2xpY2UnOiByZXF1aXJlKCcuL2ZpbHRlcnMvc2xpY2UnKVxuICAsICdzbHVnaWZ5JzogcmVxdWlyZSgnLi9maWx0ZXJzL3NsdWdpZnknKVxuICAsICdzcGxpdCc6IHJlcXVpcmUoJy4vZmlsdGVycy9zcGxpdCcpXG4gICwgJ3N0cmlwdGFncyc6IHJlcXVpcmUoJy4vZmlsdGVycy9zdHJpcHRhZ3MnKVxuICAsICd0aW1lc2luY2UnOiByZXF1aXJlKCcuL2ZpbHRlcnMvdGltZXNpbmNlJylcbiAgLCAndGltZXVudGlsJzogcmVxdWlyZSgnLi9maWx0ZXJzL3RpbWV1bnRpbCcpXG4gICwgJ3RpdGxlJzogcmVxdWlyZSgnLi9maWx0ZXJzL3RpdGxlJylcbiAgLCAndHJ1bmNhdGVjaGFycyc6IHJlcXVpcmUoJy4vZmlsdGVycy90cnVuY2F0ZWNoYXJzJylcbiAgLCAndHJ1bmNhdGV3b3Jkcyc6IHJlcXVpcmUoJy4vZmlsdGVycy90cnVuY2F0ZXdvcmRzJylcbiAgLCAndW5vcmRlcmVkX2xpc3QnOiByZXF1aXJlKCcuL2ZpbHRlcnMvdW5vcmRlcmVkX2xpc3QnKVxuICAsICd1cHBlcic6IHJlcXVpcmUoJy4vZmlsdGVycy91cHBlcicpXG4gICwgJ3VybGVuY29kZSc6IHJlcXVpcmUoJy4vZmlsdGVycy91cmxlbmNvZGUnKVxuICAsICd1cmxpemUnOiByZXF1aXJlKCcuL2ZpbHRlcnMvdXJsaXplJylcbiAgLCAndXJsaXpldHJ1bmMnOiByZXF1aXJlKCcuL2ZpbHRlcnMvdXJsaXpldHJ1bmMnKVxuICAsICd3b3JkY291bnQnOiByZXF1aXJlKCcuL2ZpbHRlcnMvd29yZGNvdW50JylcbiAgLCAnd29yZHdyYXAnOiByZXF1aXJlKCcuL2ZpbHRlcnMvd29yZHdyYXAnKVxuICAsICd5ZXNubyc6IHJlcXVpcmUoJy4vZmlsdGVycy95ZXNubycpXG59XG5cbiIsInZhciBMaWJyYXJ5ID0gcmVxdWlyZSgnLi9saWJyYXJ5JylcblxubW9kdWxlLmV4cG9ydHMgPSBEZWZhdWx0VGFnc1xuXG5mdW5jdGlvbiBEZWZhdWx0VGFncygpIHtcbiAgTGlicmFyeS5jYWxsKHRoaXMsIHRoaXMuYnVpbHRpbnMpXG59XG5cbnZhciBjb25zID0gRGVmYXVsdFRhZ3NcbiAgLCBwcm90byA9IGNvbnMucHJvdG90eXBlID0gbmV3IExpYnJhcnlcblxucHJvdG8uY29uc3RydWN0b3IgPSBjb25zXG5cbnByb3RvLmJ1aWx0aW5zID0ge1xuICAgICdibG9jayc6IHJlcXVpcmUoJy4vdGFncy9ibG9jaycpLnBhcnNlXG4gICwgJ2NvbW1lbnQnOiByZXF1aXJlKCcuL3RhZ3MvY29tbWVudCcpLnBhcnNlXG4gICwgJ2RlYnVnJzogcmVxdWlyZSgnLi90YWdzL2RlYnVnJykucGFyc2VcbiAgLCAnZXh0ZW5kcyc6IHJlcXVpcmUoJy4vdGFncy9leHRlbmRzJykucGFyc2VcbiAgLCAnZm9yJzogcmVxdWlyZSgnLi90YWdzL2ZvcicpLnBhcnNlXG4gICwgJ2lmJzogcmVxdWlyZSgnLi90YWdzL2lmL25vZGUnKS5wYXJzZVxuICAsICdpbmNsdWRlJzogcmVxdWlyZSgnLi90YWdzL2luY2x1ZGUnKS5wYXJzZVxuICAsICdub3cnOiByZXF1aXJlKCcuL3RhZ3Mvbm93JykucGFyc2VcbiAgLCAnd2l0aCc6IHJlcXVpcmUoJy4vdGFncy93aXRoJykucGFyc2Vcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gRmlsdGVyQXBwbGljYXRpb25cblxudmFyIFByb21pc2UgPSByZXF1aXJlKCcuL3Byb21pc2UnKVxuXG5mdW5jdGlvbiBGaWx0ZXJBcHBsaWNhdGlvbihuYW1lLCBiaXRzKSB7XG4gIHRoaXMubmFtZSA9IG5hbWVcbiAgdGhpcy5hcmdzID0gYml0c1xuICB0aGlzLmZpbHRlciA9IG51bGxcbn1cblxudmFyIGNvbnMgPSBGaWx0ZXJBcHBsaWNhdGlvblxuICAsIHByb3RvID0gY29ucy5wcm90b3R5cGVcblxucHJvdG8uYXR0YWNoID0gZnVuY3Rpb24ocGFyc2VyKSB7XG4gIHRoaXMuZmlsdGVyID0gcGFyc2VyLmZpbHRlcnMubG9va3VwKHRoaXMubmFtZSlcbn1cblxucHJvdG8ucmVzb2x2ZSA9IGZ1bmN0aW9uKGNvbnRleHQsIHZhbHVlLCBmcm9tSURYLCBhcmdWYWx1ZXMpIHtcbiAgdmFyIHNlbGYgPSB0aGlzXG4gICAgLCBwcm9taXNlXG4gICAgLCBzdGFydCA9IGZyb21JRFggfHwgMFxuICAgICwgcmVzdWx0XG4gICAgLCB0bXBcblxuICBhcmdWYWx1ZXMgPSBhcmdWYWx1ZXMgfHwgW11cblxuICBpZih2YWx1ZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgcmV0dXJuXG4gIH1cblxuICBpZih2YWx1ZSAmJiB2YWx1ZS5jb25zdHJ1Y3RvciA9PT0gUHJvbWlzZSkge1xuICAgIHByb21pc2UgPSBuZXcgUHJvbWlzZVxuICAgIHZhbHVlLm9uY2UoJ2RvbmUnLCBmdW5jdGlvbih2YWwpIHtcbiAgICAgIHByb21pc2UucmVzb2x2ZShzZWxmLnJlc29sdmUoY29udGV4dCwgdmFsKSlcbiAgICB9KVxuXG4gICAgLy8gc3RhcnQgb3ZlciBvbmNlIHdlJ3ZlIHJlc29sdmVkIHRoZSBiYXNlIHZhbHVlXG4gICAgcmV0dXJuIHByb21pc2VcbiAgfVxuXG4gIGZvcih2YXIgaSA9IHN0YXJ0LCBsZW4gPSBzZWxmLmFyZ3MubGVuZ3RoOyBpIDwgbGVuOyArK2kpIHtcbiAgICB2YXIgYXJnVmFsdWUgPSBzZWxmLmFyZ3NbaV0ucmVzb2x2ZSA/IFxuICAgICAgICBzZWxmLmFyZ3NbaV0ucmVzb2x2ZShjb250ZXh0KSA6XG4gICAgICAgIHNlbGYuYXJnc1tpXVxuXG4gICAgaWYoYXJnVmFsdWUgPT09IHVuZGVmaW5lZCB8fCBhcmdWYWx1ZSA9PT0gbnVsbCkge1xuICAgICAgYXJnVmFsdWVzW2ldID0gYXJnVmFsdWVcbiAgICAgIGNvbnRpbnVlXG4gICAgfVxuXG4gICAgaWYoYXJnVmFsdWUuY29uc3RydWN0b3IgPT09IFByb21pc2UpIHtcbiAgICAgIHByb21pc2UgPSBuZXcgUHJvbWlzZVxuXG4gICAgICBhcmdWYWx1ZS5vbmNlKCdkb25lJywgZnVuY3Rpb24odmFsKSB7XG4gICAgICAgIGFyZ1ZhbHVlc1tpXSA9IHZhbFxuICAgICAgICBwcm9taXNlLnJlc29sdmUoc2VsZi5yZXNvbHZlKCBcbiAgICAgICAgICAgIGNvbnRleHRcbiAgICAgICAgICAsIHZhbHVlXG4gICAgICAgICAgLCBpXG4gICAgICAgICAgLCBhcmdWYWx1ZXNcbiAgICAgICAgKSlcbiAgICAgIH0pXG5cbiAgICAgIHJldHVybiBwcm9taXNlXG4gICAgfVxuXG4gICAgYXJnVmFsdWVzW2ldID0gYXJnVmFsdWVcbiAgfVxuXG4gIHByb21pc2UgPSBuZXcgUHJvbWlzZVxuICB0bXAgPSBzZWxmLmZpbHRlci5hcHBseShudWxsLCBbdmFsdWVdLmNvbmNhdChhcmdWYWx1ZXMpLmNvbmNhdChbcmVhZHldKSlcblxuICBpZih0bXAgIT09IHVuZGVmaW5lZCkge1xuICAgIHJlc3VsdCA9IHRtcFxuICB9XG5cbiAgaWYocmVzdWx0ID09PSB1bmRlZmluZWQpIHtcbiAgICByZXR1cm4gcHJvbWlzZVxuICB9XG5cbiAgcmV0dXJuIHJlc3VsdFxuXG4gIGZ1bmN0aW9uIHJlYWR5KGVyciwgZGF0YSkge1xuICAgIGlmKHByb21pc2UudHJpZ2dlcikgXG4gICAgICByZXR1cm4gcHJvbWlzZS5yZXNvbHZlKGVyciA/IGVyciA6IGRhdGEpXG5cbiAgICByZXN1bHQgPSBkYXRhXG4gIH1cbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gRmlsdGVyQ2hhaW5cblxuZnVuY3Rpb24gRmlsdGVyQ2hhaW4oYml0cykge1xuICB0aGlzLmJpdHMgPSBiaXRzXG59XG5cbnZhciBjb25zID0gRmlsdGVyQ2hhaW5cbiAgLCBwcm90byA9IGNvbnMucHJvdG90eXBlXG5cbnByb3RvLmF0dGFjaCA9IGZ1bmN0aW9uKHBhcnNlcikge1xuICBmb3IodmFyIGkgPSAwLCBsZW4gPSB0aGlzLmJpdHMubGVuZ3RoOyBpIDwgbGVuOyArK2kpIHtcbiAgICBpZih0aGlzLmJpdHNbaV0gJiYgdGhpcy5iaXRzW2ldLmF0dGFjaCkgeyBcbiAgICAgIHRoaXMuYml0c1tpXS5hdHRhY2gocGFyc2VyKVxuICAgIH1cbiAgfVxufVxuXG5wcm90by5yZXNvbHZlID0gZnVuY3Rpb24oY29udGV4dCkge1xuICB2YXIgcmVzdWx0ID0gdGhpcy5iaXRzWzBdLnJlc29sdmUgP1xuICAgICAgdGhpcy5iaXRzWzBdLnJlc29sdmUoY29udGV4dCkgOlxuICAgICAgdGhpcy5iaXRzWzBdXG5cbiAgZm9yKHZhciBpID0gMSwgbGVuID0gdGhpcy5iaXRzLmxlbmd0aDsgaSA8IGxlbjsgKytpKSB7XG4gICAgcmVzdWx0ID0gdGhpcy5iaXRzW2ldLnJlc29sdmUoY29udGV4dCwgcmVzdWx0KVxuICB9XG5cbiAgcmV0dXJuIHJlc3VsdFxufVxuXG4iLCJtb2R1bGUuZXhwb3J0cyA9IEZpbHRlckxvb2t1cFxuXG52YXIgUHJvbWlzZSA9IHJlcXVpcmUoJy4vcHJvbWlzZScpXG5cbmZ1bmN0aW9uIEZpbHRlckxvb2t1cChiaXRzKSB7XG4gIHRoaXMuYml0cyA9IGJpdHNcbn1cblxudmFyIGNvbnMgPSBGaWx0ZXJMb29rdXBcbiAgLCBwcm90byA9IGNvbnMucHJvdG90eXBlXG5cbnByb3RvLnJlc29sdmUgPSBmdW5jdGlvbihjb250ZXh0LCBmcm9tSURYKSB7XG4gIGZyb21JRFggPSBmcm9tSURYIHx8IDBcblxuICB2YXIgc2VsZiA9IHRoaXNcbiAgICAsIGJpdHMgPSBzZWxmLmJpdHNcbiAgICAsIGN1cnJlbnQgPSBjb250ZXh0XG4gICAgLCB0ZW1wb3JhcnkgPSBudWxsXG4gICAgLCBwcm9taXNlXG4gICAgLCByZXN1bHRcbiAgICAsIG5leHRcblxuICBmb3IodmFyIGkgPSBmcm9tSURYLCBsZW4gPSBiaXRzLmxlbmd0aDsgaSA8IGxlbjsgKytpKSB7XG4gICAgaWYoY3VycmVudCA9PT0gdW5kZWZpbmVkIHx8IGN1cnJlbnQgPT09IG51bGwpIHtcbiAgICAgIGJyZWFrXG4gICAgfVxuXG4gICAgLy8gZml4IGZvciBJRTpcbiAgICBpZihiaXRzW2ldID09PSAnc3VwZXInKSB7XG4gICAgICBiaXRzW2ldID0gJ19zdXBlcidcbiAgICB9XG5cbiAgICBuZXh0ID0gY3VycmVudFtiaXRzW2ldXVxuXG4gICAgLy8gY291bGQgYmUgYXN5bmMsIGNvdWxkIGJlIHN5bmMuXG4gICAgaWYodHlwZW9mIG5leHQgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIHByb21pc2UgPSBuZXcgUHJvbWlzZVxuXG4gICAgICBwcm9taXNlLm9uY2UoJ2RvbmUnLCBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgIHRlbXBvcmFyeSA9IGRhdGFcbiAgICAgIH0pXG5cbiAgICAgIGN1cnJlbnQgPSBuZXh0LmNhbGwoY3VycmVudCwgZnVuY3Rpb24oZXJyLCBkYXRhKSB7XG4gICAgICAgIHByb21pc2UucmVzb2x2ZShlcnIgPyBudWxsIDogc2VsZi5yZXNvbHZlKGRhdGEsIGkrMSkpXG4gICAgICB9KVxuXG4gICAgICBpZih0ZW1wb3JhcnkgIT09IG51bGwpXG4gICAgICAgIGN1cnJlbnQgPSB0ZW1wb3JhcnlcblxuICAgICAgcHJvbWlzZS50cmlnZ2VyID0gdGVtcG9yYXJ5ID0gbnVsbFxuXG4gICAgICBpZihjdXJyZW50ID09PSB1bmRlZmluZWQpXG4gICAgICAgIHJldHVybiBwcm9taXNlXG5cbiAgICB9IGVsc2Uge1xuICAgICAgY3VycmVudCA9IG5leHRcbiAgICB9XG5cbiAgfSBcblxuICByZXR1cm4gY3VycmVudFxufVxuIiwibW9kdWxlLmV4cG9ydHMgPSBGaWx0ZXJOb2RlXG5cbnZhciBQcm9taXNlID0gcmVxdWlyZSgnLi9wcm9taXNlJylcbiAgLCBkZWJ1ZyA9IHJlcXVpcmUoJy4vZGVidWcnKVxuXG5mdW5jdGlvbiBGaWx0ZXJOb2RlKGZpbHRlcikge1xuICB0aGlzLmZpbHRlciA9IGZpbHRlclxufVxuXG52YXIgY29ucyA9IEZpbHRlck5vZGVcbiAgLCBwcm90byA9IGNvbnMucHJvdG90eXBlXG5cbmNvbnMuZXNjYXBlID0gZXNjYXBlSFRNTFxuXG5wcm90by5yZW5kZXIgPSBzYWZlbHkoZnVuY3Rpb24oY29udGV4dCkge1xuICB2YXIgc2VsZiA9IHRoaXNcbiAgICAsIHJlc3VsdCA9IHNlbGYuZmlsdGVyLnJlc29sdmUoY29udGV4dClcbiAgICAsIHByb21pc2VcblxuICBpZihyZXN1bHQgPT09IHVuZGVmaW5lZClcbiAgICByZXR1cm4gJydcblxuICBpZihyZXN1bHQgJiYgcmVzdWx0LmNvbnN0cnVjdG9yID09PSBQcm9taXNlKSB7XG4gICAgcHJvbWlzZSA9IG5ldyBQcm9taXNlXG5cbiAgICByZXN1bHQub25jZSgnZG9uZScsIGZ1bmN0aW9uKHJlc3VsdCkge1xuICAgICAgcHJvbWlzZS5yZXNvbHZlKHNlbGYuZm9ybWF0KHJlc3VsdCkpXG4gICAgfSlcblxuICAgIHJldHVybiBwcm9taXNlXG4gIH1cblxuICByZXR1cm4gc2VsZi5mb3JtYXQocmVzdWx0KVxufSlcblxucHJvdG8uZm9ybWF0ID0gZnVuY3Rpb24ocmVzdWx0KSB7XG4gIGlmKHJlc3VsdCAmJiByZXN1bHQuc2FmZSkge1xuICAgIHJldHVybiByZXN1bHQudG9TdHJpbmcoKVxuICB9XG5cbiAgaWYocmVzdWx0ID09PSBudWxsIHx8IHJlc3VsdCA9PT0gdW5kZWZpbmVkKVxuICAgIHJldHVybiAnJ1xuXG4gIHJldHVybiBlc2NhcGVIVE1MKHJlc3VsdCsnJylcbn1cblxuZnVuY3Rpb24gc2FmZWx5KGZuKSB7XG4gIHJldHVybiBmdW5jdGlvbihjb250ZXh0KSB7XG4gICAgdHJ5IHtcbiAgICAgIHJldHVybiBmbi5jYWxsKHRoaXMsIGNvbnRleHQpXG4gICAgfSBjYXRjaChlcnIpIHtcbiAgICAgIGRlYnVnLmluZm8oZXJyKSBcbiAgICAgIHJldHVybiAnJ1xuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiBlc2NhcGVIVE1MKHN0cikge1xuICByZXR1cm4gc3RyXG4gICAgLnJlcGxhY2UoL1xcJi9nLCAnJmFtcDsnKVxuICAgIC5yZXBsYWNlKC88L2csICcmbHQ7JylcbiAgICAucmVwbGFjZSgvPi9nLCAnJmd0OycpXG4gICAgLnJlcGxhY2UoL1wiL2csICcmcXVvdDsnKVxuICAgIC5yZXBsYWNlKC8nL2csICcmIzM5OycpXG59XG4iLCJ2YXIgVG9rZW4gPSByZXF1aXJlKCcuL3Rva2VuJylcbiAgLCBGaWx0ZXJOb2RlID0gcmVxdWlyZSgnLi9maWx0ZXJfbm9kZScpXG5cbm1vZHVsZS5leHBvcnRzID0gRmlsdGVyVG9rZW5cblxuZnVuY3Rpb24gRmlsdGVyVG9rZW4oY29udGVudCwgbGluZSkge1xuICBUb2tlbi5jYWxsKHRoaXMsIGNvbnRlbnQsIGxpbmUpXG59XG5cbnZhciBjb25zID0gRmlsdGVyVG9rZW5cbiAgLCBwcm90byA9IGNvbnMucHJvdG90eXBlID0gbmV3IFRva2VuXG5cbnByb3RvLmNvbnN0cnVjdG9yID0gY29uc1xuXG5wcm90by5ub2RlID0gZnVuY3Rpb24ocGFyc2VyKSB7XG4gIHJldHVybiBuZXcgRmlsdGVyTm9kZShwYXJzZXIuY29tcGlsZSh0aGlzLmNvbnRlbnQpKVxufVxuXG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGlucHV0LCB2YWx1ZSkge1xuICByZXR1cm4gcGFyc2VJbnQoaW5wdXQsIDEwKSArIHBhcnNlSW50KHZhbHVlLCAxMClcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oaW5wdXQpIHtcbiAgcmV0dXJuIGlucHV0LnRvU3RyaW5nKCkucmVwbGFjZSgvJy9nLCBcIlxcXFwnXCIpXG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGlucHV0KSB7XG4gIHZhciBzdHIgPSBpbnB1dC50b1N0cmluZygpO1xuICByZXR1cm4gW3N0ci5zbGljZSgwLDEpLnRvVXBwZXJDYXNlKCksIHN0ci5zbGljZSgxKV0uam9pbignJylcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oaW5wdXQsIGxlbiwgcmVhZHkpIHtcbiAgaWYocmVhZHkgPT09IHVuZGVmaW5lZClcbiAgICBsZW4gPSAwXG5cbiAgdmFyIHN0ciA9IGlucHV0LnRvU3RyaW5nKClcbiAgICAsIHZhbHVlID0gJyAnXG5cbiAgbGVuIC09IHN0ci5sZW5ndGhcbiAgaWYobGVuIDwgMCkgeyBcbiAgICByZXR1cm4gc3RyXG4gIH1cblxuICB2YXIgbGVuX2hhbGYgPSBsZW4vMi4wXG4gICAgLCBhcnIgPSBbXVxuICAgICwgaWR4ID0gTWF0aC5mbG9vcihsZW5faGFsZilcblxuICB3aGlsZShpZHgtLSA+IDApIHtcbiAgICBhcnIucHVzaCh2YWx1ZSlcbiAgfVxuXG4gIGFyciA9IGFyci5qb2luKCcnKVxuICBzdHIgPSBhcnIgKyBzdHIgKyBhcnJcbiAgaWYoKGxlbl9oYWxmIC0gTWF0aC5mbG9vcihsZW5faGFsZikpID4gMCkge1xuICAgIHN0ciA9IGlucHV0LnRvU3RyaW5nKCkubGVuZ3RoICUgMiA9PSAwID8gdmFsdWUgKyBzdHIgOiBzdHIgKyB2YWx1ZVxuICB9XG4gIFxuICByZXR1cm4gc3RyXG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGlucHV0LCB2YWx1ZSkge1xuICB2YXIgc3RyID0gaW5wdXQudG9TdHJpbmcoKVxuICByZXR1cm4gc3RyLnJlcGxhY2UobmV3IFJlZ0V4cCh2YWx1ZSwgXCJnXCIpLCAnJylcbn1cbiIsInZhciBmb3JtYXQgPSByZXF1aXJlKCcuLi9kYXRlJykuZGF0ZVxuICBcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oaW5wdXQsIHZhbHVlLCByZWFkeSkge1xuICBpZiAocmVhZHkgPT09IHVuZGVmaW5lZClcbiAgICB2YWx1ZSA9ICdOIGosIFknXG5cbiAgcmV0dXJuIGZvcm1hdChpbnB1dC5nZXRGdWxsWWVhciA/IGlucHV0IDogbmV3IERhdGUoaW5wdXQpLCB2YWx1ZSlcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oaW5wdXQsIGRlZiwgcmVhZHkpIHtcbiAgcmV0dXJuIGlucHV0ID8gaW5wdXQgOiBkZWZcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oaW5wdXQsIGtleSkge1xuICByZXR1cm4gaW5wdXQuc29ydChmdW5jdGlvbih4LCB5KSB7XG4gICAgaWYoeFtrZXldID4geVtrZXldKSByZXR1cm4gMVxuICAgIGlmKHhba2V5XSA9PSB5W2tleV0pIHJldHVybiAwXG4gICAgaWYoeFtrZXldIDwgeVtrZXldKSByZXR1cm4gLTFcbiAgfSlcbn1cbiIsInZhciBkaWN0c29ydCA9IHJlcXVpcmUoJy4vZGljdHNvcnQnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihpbnB1dCwga2V5KSB7XG4gIHJldHVybiBkaWN0c29ydChpbnB1dCwga2V5KS5yZXZlcnNlKClcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oaW5wdXQsIG51bSkge1xuICByZXR1cm4gaW5wdXQgJSBwYXJzZUludChudW0sIDEwKSA9PSAwXG59XG4iLCJ2YXIgRmlsdGVyTm9kZSA9IHJlcXVpcmUoJy4uL2ZpbHRlcl9ub2RlJylcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihpbnB1dCkge1xuICBpZihpbnB1dCAmJiBpbnB1dC5zYWZlKSB7XG4gICAgcmV0dXJuIGlucHV0XG4gIH1cblxuICBpbnB1dCA9IG5ldyBTdHJpbmcoRmlsdGVyTm9kZS5lc2NhcGUoaW5wdXQpKVxuICBpbnB1dC5zYWZlID0gdHJ1ZVxuICByZXR1cm4gaW5wdXRcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oaW5wdXQpIHtcbiAgdmFyIG51bSA9IChuZXcgTnVtYmVyKGlucHV0KSkudmFsdWVPZigpXG4gICAgLCBzaW5ndWxhciA9IG51bSA9PSAxID8gJycgOiAncydcbiAgICAsIHZhbHVlIFxuICAgIFxuICB2YWx1ZSA9XG4gICAgbnVtIDwgMTAyNCA/IG51bSArICcgYnl0ZScrc2luZ3VsYXIgOlxuICAgIG51bSA8ICgxMDI0KjEwMjQpID8gKG51bS8xMDI0KSsnIEtCJyA6XG4gICAgbnVtIDwgKDEwMjQqMTAyNCoxMDI0KSA/IChudW0gLyAoMTAyNCoxMDI0KSkgKyAnIE1CJyA6XG4gICAgbnVtIC8gKDEwMjQqMTAyNCoxMDI0KSArICcgR0InXG5cbiAgcmV0dXJuIHZhbHVlXG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGlucHV0KSB7XG4gIHJldHVybiBpbnB1dFswXVxufVxuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihpbnB1dCwgdmFsKSB7XG4gIHZhbCA9IHBhcnNlSW50KHZhbCwgMTApXG4gIHZhbCA9IGlzTmFOKHZhbCkgPyAtMSA6IHZhbFxuXG4gIHZhciBpc1Bvc2l0aXZlID0gdmFsID49IDBcbiAgICAsIGFzTnVtYmVyID0gcGFyc2VGbG9hdChpbnB1dClcbiAgICAsIGFic1ZhbHVlID0gTWF0aC5hYnModmFsKVxuICAgICwgcG93ID0gTWF0aC5wb3coMTAsIGFic1ZhbHVlKVxuICAgICwgcG93X21pbnVzX29uZSA9IE1hdGgucG93KDEwLCBNYXRoLm1heChhYnNWYWx1ZS0xLCAwKSlcbiAgICAsIGFzU3RyaW5nXG5cbiAgYXNOdW1iZXIgPSBNYXRoLnJvdW5kKChwb3cgKiBhc051bWJlcikgLyBwb3dfbWludXNfb25lKVxuXG4gIGlmKHZhbCAhPT0gMClcbiAgICBhc051bWJlciAvPSAxMFxuXG4gIGFzU3RyaW5nID0gYXNOdW1iZXIudG9TdHJpbmcoKVxuXG4gIGlmKGlzUG9zaXRpdmUpIHtcbiAgICB2YXIgc3BsaXQgPSBhc1N0cmluZy5zcGxpdCgnLicpXG4gICAgICAsIGRlY2ltYWwgPSBzcGxpdC5sZW5ndGggPiAxID8gc3BsaXRbMV0gOiAnJ1xuXG4gICAgd2hpbGUoZGVjaW1hbC5sZW5ndGggPCB2YWwpIHtcbiAgICAgIGRlY2ltYWwgKz0gJzAnXG4gICAgfVxuXG4gICAgYXNTdHJpbmcgPSBkZWNpbWFsLmxlbmd0aCA/IFtzcGxpdFswXSwgZGVjaW1hbF0uam9pbignLicpIDogc3BsaXRbMF1cbiAgfVxuXG4gIHJldHVybiBhc1N0cmluZ1xufVxuIiwidmFyIEZpbHRlck5vZGUgPSByZXF1aXJlKCcuLi9maWx0ZXJfbm9kZScpXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oaW5wdXQpIHtcbiAgdmFyIHggPSBuZXcgU3RyaW5nKEZpbHRlck5vZGUuZXNjYXBlKGlucHV0KycnKSlcbiAgeC5zYWZlID0gdHJ1ZVxuICByZXR1cm4geFxufVxuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihpbnB1dCwgZGlnaXQpIHtcbiAgdmFyIGlzTnVtID0gIWlzTmFOKHBhcnNlSW50KGlucHV0LCAxMCkpXG4gICAgLCBzdHIgPSBpbnB1dC50b1N0cmluZygpXG4gICAgLCBsZW4gPSBzdHIuc3BsaXQoJycpLmxlbmd0aFxuXG4gIGRpZ2l0ID0gcGFyc2VJbnQoZGlnaXQsIDEwKVxuICBpZihpc051bSAmJiAhaXNOYU4oZGlnaXQpICYmIGRpZ2l0IDw9IGxlbikge1xuICAgIHJldHVybiBzdHIuY2hhckF0KGxlbiAtIGRpZ2l0KVxuICB9XG5cbiAgcmV0dXJuIGlucHV0XG59XG4iLG51bGwsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oaW5wdXQpIHtcbiAgcmV0dXJuIGlucHV0XG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGlucHV0KSB7XG4gIHZhciBvdXRwdXQgPSBbXVxuICBmb3IodmFyIG5hbWUgaW4gaW5wdXQpIGlmKGlucHV0Lmhhc093blByb3BlcnR5KG5hbWUpKSB7XG4gICAgb3V0cHV0LnB1c2goW25hbWUsIGlucHV0W25hbWVdXSlcbiAgfVxuICByZXR1cm4gb3V0cHV0XG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGlucHV0LCBnbHVlKSB7XG4gIGlucHV0ID0gaW5wdXQgaW5zdGFuY2VvZiBBcnJheSA/IGlucHV0IDogaW5wdXQudG9TdHJpbmcoKS5zcGxpdCgnJylcbiAgcmV0dXJuIGlucHV0LmpvaW4oZ2x1ZSlcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oaW5wdXQpIHtcbiAgdmFyIGNiID0gaW5wdXQuY2hhckF0IHx8IGZ1bmN0aW9uKGluZCkgeyByZXR1cm4gaW5wdXRbaW5kXTsgfVxuXG4gIHJldHVybiBjYi5jYWxsKGlucHV0LCBpbnB1dC5sZW5ndGgtMSk7XG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGlucHV0LCByZWFkeSkge1xuICBpZihpbnB1dCAmJiB0eXBlb2YgaW5wdXQubGVuZ3RoID09PSAnZnVuY3Rpb24nKSB7XG4gICAgcmV0dXJuIGlucHV0Lmxlbmd0aChyZWFkeSlcbiAgfVxuICByZXR1cm4gaW5wdXQubGVuZ3RoXG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGlucHV0LCBleHBlY3RlZCwgcmVhZHkpIHtcbiAgdmFyIHRtcFxuICBpZihpbnB1dCAmJiB0eXBlb2YgaW5wdXQubGVuZ3RoID09PSAnZnVuY3Rpb24nKSB7XG4gICAgdG1wID0gaW5wdXQubGVuZ3RoKGZ1bmN0aW9uKGVyciwgbGVuKSB7XG4gICAgICByZWFkeShlcnIsIGVyciA/IG51bGwgOiBsZW4gPT09IGV4cGVjdGVkKVxuICAgIH0pXG5cbiAgICByZXR1cm4gdG1wID09PSB1bmRlZmluZWQgPyB1bmRlZmluZWQgOiB0bXAgPT09IGV4cGVjdGVkXG4gIH1cblxuICByZXR1cm4gaW5wdXQubGVuZ3RoID09PSBleHBlY3RlZFxufVxuIiwidmFyIHNhZmUgPSByZXF1aXJlKCcuL3NhZmUnKVxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGlucHV0KSB7XG4gIHZhciBzdHIgPSBpbnB1dC50b1N0cmluZygpXG4gICAgLCBwYXJhcyA9IHN0ci5zcGxpdCgnXFxuXFxuJylcbiAgICAsIG91dCA9IFtdXG5cbiAgd2hpbGUocGFyYXMubGVuZ3RoKSB7XG4gICAgb3V0LnVuc2hpZnQocGFyYXMucG9wKCkucmVwbGFjZSgvXFxuL2csICc8YnIgLz4nKSlcbiAgfVxuXG4gIHJldHVybiBzYWZlKCc8cD4nK291dC5qb2luKCc8L3A+PHA+JykrJzwvcD4nKVxufVxuIiwidmFyIHNhZmUgPSByZXF1aXJlKCcuL3NhZmUnKVxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGlucHV0KSB7XG4gIHZhciBzdHIgPSBpbnB1dC50b1N0cmluZygpXG4gIHJldHVybiBzYWZlKHN0ci5yZXBsYWNlKC9cXG4vZywgJzxiciAvPicpKVxufVxuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihpbnB1dCkge1xuICB2YXIgc3RyID0gaW5wdXQudG9TdHJpbmcoKVxuICAgICwgYml0cyA9IHN0ci5zcGxpdCgnXFxuJylcbiAgICAsIG91dCA9IFtdXG4gICAgLCBsZW4gPSBiaXRzLmxlbmd0aFxuXG4gIHdoaWxlKGJpdHMubGVuZ3RoKSB7XG4gICAgb3V0LnVuc2hpZnQobGVuIC0gb3V0Lmxlbmd0aCArICcuICcgKyBiaXRzLnBvcCgpKVxuICB9XG5cbiAgcmV0dXJuIG91dC5qb2luKCdcXG4nKVxufVxuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihpbnB1dCwgbnVtKSB7XG4gIHZhciBiaXRzID0gKGlucHV0ID09PSBudWxsIHx8IGlucHV0ID09PSB1bmRlZmluZWQgPyAnJyA6IGlucHV0KS50b1N0cmluZygpLnNwbGl0KCcnKVxuICAgICwgZGlmZmVyZW5jZSA9IG51bSAtIGJpdHMubGVuZ3RoXG5cbiAgLy8gcHVzaCByZXR1cm5zIG5ldyBsZW5ndGggb2YgYXJyYXkuXG4gIHdoaWxlKGRpZmZlcmVuY2UgPiAwKSB7XG4gICAgZGlmZmVyZW5jZSA9IG51bSAtIGJpdHMucHVzaCgnICcpXG4gIH1cblxuICByZXR1cm4gYml0cy5qb2luKCcnKVxufVxuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihpbnB1dCkge1xuICByZXR1cm4gaW5wdXQudG9TdHJpbmcoKS50b0xvd2VyQ2FzZSgpXG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGlucHV0KSB7XG4gIGlucHV0ID0gaW5wdXQgaW5zdGFuY2VvZiBBcnJheSA/IGlucHV0IDogaW5wdXQudG9TdHJpbmcoKS5zcGxpdCgnJylcblxuICByZXR1cm4gaW5wdXRcbn1cbiIsIlxudmFyIExFVFRFUlMgPSB7XG4nYSc6ICcyJywgJ2InOiAnMicsICdjJzogJzInLCAnZCc6ICczJywgJ2UnOiAnMycsXG4nZic6ICczJywgJ2cnOiAnNCcsICdoJzogJzQnLCAnaSc6ICc0JywgJ2onOiAnNScsICdrJzogJzUnLCAnbCc6ICc1JyxcbidtJzogJzYnLCAnbic6ICc2JywgJ28nOiAnNicsICdwJzogJzcnLCAncSc6ICc3JywgJ3InOiAnNycsICdzJzogJzcnLFxuJ3QnOiAnOCcsICd1JzogJzgnLCAndic6ICc4JywgJ3cnOiAnOScsICd4JzogJzknLCAneSc6ICc5JywgJ3onOiAnOSdcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oaW5wdXQpIHtcbiAgdmFyIHN0ciA9IGlucHV0LnRvU3RyaW5nKCkudG9Mb3dlckNhc2UoKS5zcGxpdCgnJylcbiAgICAsIG91dCA9IFtdXG4gICAgLCBsdHJcblxuICB3aGlsZShzdHIubGVuZ3RoKSB7XG4gICAgbHRyID0gc3RyLnBvcCgpXG4gICAgb3V0LnVuc2hpZnQoTEVUVEVSU1tsdHJdID8gTEVUVEVSU1tsdHJdIDogbHRyKVxuICB9XG5cbiAgcmV0dXJuIG91dC5qb2luKCcnKVxufVxuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihpbnB1dCwgcGx1cmFsKSB7XG4gIHBsdXJhbCA9ICh0eXBlb2YgcGx1cmFsID09PSAnc3RyaW5nJyA/IHBsdXJhbCA6ICdzJykuc3BsaXQoJywnKVxuXG4gIHZhciB2YWwgPSBOdW1iZXIoaW5wdXQpXG4gICAgLCBzdWZmaXhcblxuICBzdWZmaXggPSBwbHVyYWxbcGx1cmFsLmxlbmd0aC0xXTtcbiAgaWYodmFsID09PSAxKSB7XG4gICAgc3VmZml4ID0gcGx1cmFsLmxlbmd0aCA+IDEgPyBwbHVyYWxbMF0gOiAnJzsgICAgXG4gIH1cblxuICByZXR1cm4gc3VmZml4XG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGlucHV0KSB7XG4gIHZhciBjYiA9IGlucHV0LmNoYXJBdCB8fCBmdW5jdGlvbihpZHgpIHtcbiAgICByZXR1cm4gdGhpc1tpZHhdO1xuICB9O1xuXG4gIHJldHVybiBjYi5jYWxsKGlucHV0LCBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBpbnB1dC5sZW5ndGgpKVxufVxuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihpbnB1dCwgbnVtKSB7XG4gIHZhciBiaXRzID0gKGlucHV0ID09PSBudWxsIHx8IGlucHV0ID09PSB1bmRlZmluZWQgPyAnJyA6IGlucHV0KS50b1N0cmluZygpLnNwbGl0KCcnKVxuICAgICwgZGlmZmVyZW5jZSA9IG51bSAtIGJpdHMubGVuZ3RoXG5cbiAgLy8gcHVzaCByZXR1cm5zIG5ldyBsZW5ndGggb2YgYXJyYXkuXG4gIC8vIE5COiBbXS51bnNoaWZ0IHJldHVybnMgYHVuZGVmaW5lZGAgaW4gSUU8OS5cbiAgd2hpbGUoZGlmZmVyZW5jZSA+IDApIHtcbiAgICBkaWZmZXJlbmNlID0gKGJpdHMudW5zaGlmdCgnICcpLCBudW0gLSBiaXRzLmxlbmd0aClcbiAgfVxuXG4gIHJldHVybiBiaXRzLmpvaW4oJycpXG59XG4iLCJ2YXIgRmlsdGVyTm9kZSA9IHJlcXVpcmUoJy4uL2ZpbHRlcl9ub2RlJylcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihpbnB1dCkge1xuICBpbnB1dCA9IG5ldyBTdHJpbmcoaW5wdXQpXG4gIGlucHV0LnNhZmUgPSB0cnVlXG4gIHJldHVybiBpbnB1dFxufVxuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihpbnB1dCwgYnkpIHtcbiAgYnkgPSBieS50b1N0cmluZygpXG4gIGlmKGJ5LmNoYXJBdCgwKSA9PT0gJzonKSB7XG4gICAgYnkgPSAnMCcrYnlcbiAgfVxuXG4gIGlmKGJ5LmNoYXJBdChieS5sZW5ndGgtMSkgPT09ICc6Jykge1xuICAgIGJ5ID0gYnkuc2xpY2UoMCwgLTEpXG4gIH1cblxuICB2YXIgc3BsaXRCeSA9IGJ5LnNwbGl0KCc6JylcbiAgICAsIHNsaWNlID0gaW5wdXQuc2xpY2UgfHwgKGZ1bmN0aW9uKCkge1xuICAgICAgICBpbnB1dCA9IHRoaXMudG9TdHJpbmcoKVxuICAgICAgICByZXR1cm4gaW5wdXQuc2xpY2VcbiAgICAgIH0pKClcblxuICByZXR1cm4gc2xpY2UuYXBwbHkoaW5wdXQsIHNwbGl0QnkpXG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGlucHV0KSB7XG4gIGlucHV0ID0gaW5wdXQudG9TdHJpbmcoKVxuICByZXR1cm4gaW5wdXRcbiAgICAgICAgLnJlcGxhY2UoL1teXFx3XFxzXFxkXFwtXS9nLCAnJylcbiAgICAgICAgLnJlcGxhY2UoL15cXHMqLywgJycpXG4gICAgICAgIC5yZXBsYWNlKC9cXHMqJC8sICcnKVxuICAgICAgICAucmVwbGFjZSgvW1xcLVxcc10rL2csICctJylcbiAgICAgICAgLnRvTG93ZXJDYXNlKClcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oaW5wdXQsIGJ5LCByZWFkeSkge1xuICBieSA9IGFyZ3VtZW50cy5sZW5ndGggPT09IDIgPyAnLCcgOiBieVxuICBpbnB1dCA9ICcnK2lucHV0XG4gIHJldHVybiBpbnB1dC5zcGxpdChieSlcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oaW5wdXQpIHtcbiAgdmFyIHN0ciA9IGlucHV0LnRvU3RyaW5nKClcbiAgcmV0dXJuIHN0ci5yZXBsYWNlKC88W14+XSo/Pi9nLCAnJylcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oaW5wdXQsIG4sIHJlYWR5KSB7XG4gIHZhciBpbnB1dCA9IG5ldyBEYXRlKGlucHV0KVxuICAgICwgbm93ICAgPSByZWFkeSA9PT0gdW5kZWZpbmVkID8gbmV3IERhdGUoKSA6IG5ldyBEYXRlKG4pXG4gICAgLCBkaWZmICA9IGlucHV0IC0gbm93XG4gICAgLCBzaW5jZSA9IE1hdGguYWJzKGRpZmYpXG5cbiAgaWYoZGlmZiA+IDApXG4gICAgcmV0dXJuICcwIG1pbnV0ZXMnXG5cbiAgLy8gMzY1LjI1ICogMjQgKiA2MCAqIDYwICogMTAwMCA9PT0geWVhcnNcbiAgdmFyIHllYXJzID0gICB+fihzaW5jZSAvIDMxNTU3NjAwMDAwKVxuICAgICwgbW9udGhzID0gIH5+KChzaW5jZSAtICh5ZWFycyozMTU1NzYwMDAwMCkpIC8gMjU5MjAwMDAwMClcbiAgICAsIGRheXMgPSAgICB+figoc2luY2UgLSAoeWVhcnMgKiAzMTU1NzYwMDAwMCArIG1vbnRocyAqIDI1OTIwMDAwMDApKSAvIDg2NDAwMDAwKVxuICAgICwgaG91cnMgPSAgIH5+KChzaW5jZSAtICh5ZWFycyAqIDMxNTU3NjAwMDAwICsgbW9udGhzICogMjU5MjAwMDAwMCArIGRheXMgKiA4NjQwMDAwMCkpIC8gMzYwMDAwMClcbiAgICAsIG1pbnV0ZXMgPSB+figoc2luY2UgLSAoeWVhcnMgKiAzMTU1NzYwMDAwMCArIG1vbnRocyAqIDI1OTIwMDAwMDAgKyBkYXlzICogODY0MDAwMDAgKyBob3VycyAqIDM2MDAwMDApKSAvIDYwMDAwKVxuICAgICwgcmVzdWx0ID0gW1xuICAgICAgICB5ZWFycyAgID8gcGx1cmFsaXplKHllYXJzLCAgICAneWVhcicpIDogbnVsbFxuICAgICAgLCBtb250aHMgID8gcGx1cmFsaXplKG1vbnRocywgICAnbW9udGgnKSA6IG51bGxcbiAgICAgICwgZGF5cyAgICA/IHBsdXJhbGl6ZShkYXlzLCAgICAgJ2RheScpIDogbnVsbFxuICAgICAgLCBob3VycyAgID8gcGx1cmFsaXplKGhvdXJzLCAgICAnaG91cicpIDogbnVsbFxuICAgICAgLCBtaW51dGVzID8gcGx1cmFsaXplKG1pbnV0ZXMsICAnbWludXRlJykgOiBudWxsXG4gICAgXVxuICAgICwgb3V0ID0gW11cblxuICBmb3IodmFyIGkgPSAwLCBsZW4gPSByZXN1bHQubGVuZ3RoOyBpIDwgbGVuOyArK2kpIHtcbiAgICByZXN1bHRbaV0gIT09IG51bGwgJiYgb3V0LnB1c2gocmVzdWx0W2ldKVxuICB9XG5cbiAgaWYoIW91dC5sZW5ndGgpIHtcbiAgICByZXR1cm4gJzAgbWludXRlcydcbiAgfVxuXG4gIHJldHVybiBvdXRbMF0gKyAob3V0WzFdID8gJywgJyArIG91dFsxXSA6ICcnKVxuXG4gIGZ1bmN0aW9uIHBsdXJhbGl6ZSh4LCBzdHIpIHtcbiAgICByZXR1cm4geCArICcgJyArIHN0ciArICh4ID09PSAxID8gJycgOiAncycpXG4gIH1cbn1cbiIsInZhciB0aW1lc2luY2UgPSByZXF1aXJlKCcuL3RpbWVzaW5jZScpLnRpbWVzaW5jZVxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGlucHV0LCBuKSB7XG4gIHZhciBub3cgPSBuID8gbmV3IERhdGUobikgOiBuZXcgRGF0ZSgpXG4gIHJldHVybiB0aW1lc2luY2Uobm93LCBpbnB1dClcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oaW5wdXQpIHtcbiAgdmFyIHN0ciA9IGlucHV0LnRvU3RyaW5nKClcbiAgICAsIGJpdHMgPSBzdHIuc3BsaXQoL1xcc3sxfS9nKVxuICAgICwgb3V0ID0gW11cbiAgXG4gIHdoaWxlKGJpdHMubGVuZ3RoKSB7XG4gICAgdmFyIHdvcmQgPSBiaXRzLnNoaWZ0KClcbiAgICB3b3JkID0gd29yZC5jaGFyQXQoMCkudG9VcHBlckNhc2UoKSArIHdvcmQuc2xpY2UoMSlcbiAgICBvdXQucHVzaCh3b3JkKVxuICB9XG5cbiAgb3V0ID0gb3V0LmpvaW4oJyAnKVxuICByZXR1cm4gb3V0LnJlcGxhY2UoLyhbYS16XSknKFtBLVpdKS9nLCBmdW5jdGlvbihhLCBtLCB4KSB7IHJldHVybiB4LnRvTG93ZXJDYXNlKCkgfSlcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oaW5wdXQsIG4pIHtcbiAgdmFyIHN0ciA9IGlucHV0LnRvU3RyaW5nKClcbiAgICAsIG51bSA9IHBhcnNlSW50KG4sIDEwKVxuXG4gIGlmKGlzTmFOKG51bSkpXG4gICAgcmV0dXJuIGlucHV0XG5cbiAgaWYoaW5wdXQubGVuZ3RoIDw9IG51bSlcbiAgICByZXR1cm4gaW5wdXRcblxuICByZXR1cm4gaW5wdXQuc2xpY2UoMCwgbnVtKSsnLi4uJ1xufVxuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihpbnB1dCwgbikge1xuICB2YXIgc3RyID0gaW5wdXQudG9TdHJpbmcoKVxuICAgICwgbnVtID0gcGFyc2VJbnQobiwgMTApXG4gICAgLCB3b3Jkc1xuXG4gIGlmKGlzTmFOKG51bSkpXG4gICAgcmV0dXJuIGlucHV0XG5cbiAgd29yZHMgPSBpbnB1dC5zcGxpdCgvXFxzKy8pXG5cbiAgaWYod29yZHMubGVuZ3RoIDw9IG51bSlcbiAgICByZXR1cm4gaW5wdXRcblxuICByZXR1cm4gd29yZHMuc2xpY2UoMCwgbnVtKS5qb2luKCcgJykrJy4uLidcbn1cbiIsInZhciBzYWZlID0gcmVxdWlyZSgnLi9zYWZlJyk7XG5cbnZhciB1bHBhcnNlciA9IGZ1bmN0aW9uKGxpc3QpIHtcbiAgdmFyIG91dCA9IFtdXG4gICAgLCBsID0gbGlzdC5zbGljZSgpXG4gICAgLCBpdGVtXG5cbiAgd2hpbGUobC5sZW5ndGgpIHtcbiAgICBpdGVtID0gbC5wb3AoKVxuXG4gICAgaWYoaXRlbSBpbnN0YW5jZW9mIEFycmF5KVxuICAgICAgb3V0LnVuc2hpZnQoJzx1bD4nK3VscGFyc2VyKGl0ZW0pKyc8L3VsPicpXG4gICAgZWxzZVxuICAgICAgb3V0LnVuc2hpZnQoJzwvbGk+PGxpPicraXRlbSlcbiAgfVxuXG4gIC8vIGdldCByaWQgb2YgdGhlIGxlYWRpbmcgPC9saT4sIGlmIGFueS4gYWRkIHRyYWlsaW5nIDwvbGk+LlxuICByZXR1cm4gb3V0LmpvaW4oJycpLnJlcGxhY2UoL148XFwvbGk+LywgJycpICsgJzwvbGk+J1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGlucHV0KSB7XG4gIHJldHVybiBpbnB1dCBpbnN0YW5jZW9mIEFycmF5ID9cbiAgICBzYWZlKHVscGFyc2VyKGlucHV0KSkgOlxuICAgIGlucHV0XG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGlucHV0KSB7XG4gIHJldHVybiBpbnB1dC50b1N0cmluZygpLnRvVXBwZXJDYXNlKClcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oaW5wdXQpIHtcbiAgcmV0dXJuIGVzY2FwZShpbnB1dC50b1N0cmluZygpKVxufVxuIiwidmFyIHNhZmUgPSByZXF1aXJlKCcuL3NhZmUnKVxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGlucHV0KSB7XG4gIHZhciBzdHIgPSBpbnB1dC50b1N0cmluZygpXG4gIHJldHVybiBzYWZlKHN0ci5yZXBsYWNlKC8oKChodHRwKHMpPzpcXC9cXC8pfChtYWlsdG86KSkoW1xcd1xcZFxcLVxcLjpAXFwvXSkrKS9nLCBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gJzxhIGhyZWY9XCInK2FyZ3VtZW50c1swXSsnXCI+Jythcmd1bWVudHNbMF0rJzwvYT4nOyBcbiAgfSkpXG59XG4iLCJ2YXIgc2FmZSA9IHJlcXVpcmUoJy4vc2FmZScpXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oaW5wdXQsIGxlbikge1xuICB2YXIgc3RyID0gaW5wdXQudG9TdHJpbmcoKVxuICBsZW4gPSBwYXJzZUludChsZW4sIDEwKSB8fCAxMDAwXG4gIHJldHVybiBzYWZlKHN0ci5yZXBsYWNlKC8oKChodHRwKHMpPzpcXC9cXC8pfChtYWlsdG86KSkoW1xcd1xcZFxcLVxcLjpAXSkrKS9nLCBmdW5jdGlvbigpIHtcbiAgICB2YXIgbHRyID0gYXJndW1lbnRzWzBdLmxlbmd0aCA+IGxlbiA/IGFyZ3VtZW50c1swXS5zbGljZSgwLCBsZW4pICsgJy4uLicgOiBhcmd1bWVudHNbMF07XG4gICAgcmV0dXJuICc8YSBocmVmPVwiJythcmd1bWVudHNbMF0rJ1wiPicrbHRyKyc8L2E+JzsgXG4gIH0pKVxufVxuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihpbnB1dCkge1xuICB2YXIgc3RyID0gaW5wdXQudG9TdHJpbmcoKVxuICAgICwgYml0cyA9IHN0ci5zcGxpdCgvXFxzKy9nKVxuXG4gIHJldHVybiBiaXRzLmxlbmd0aFxufVxuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihpbnB1dCwgbGVuKSB7XG4gIHZhciB3b3JkcyA9IGlucHV0LnRvU3RyaW5nKCkuc3BsaXQoL1xccysvZylcbiAgICAsIG91dCA9IFtdXG4gICAgLCBsZW4gPSBwYXJzZUludChsZW4sIDEwKSB8fCB3b3Jkcy5sZW5ndGhcblxuICB3aGlsZSh3b3Jkcy5sZW5ndGgpIHtcbiAgICBvdXQudW5zaGlmdCh3b3Jkcy5zcGxpY2UoMCwgbGVuKS5qb2luKCcgJykpXG4gIH1cblxuICByZXR1cm4gb3V0LmpvaW4oJ1xcbicpXG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGlucHV0LCBtYXApIHtcbiAgdmFyIG91ck1hcCA9IG1hcC50b1N0cmluZygpLnNwbGl0KCcsJylcbiAgICAsIHZhbHVlXG5cbiAgb3VyTWFwLmxlbmd0aCA8IDMgJiYgb3VyTWFwLnB1c2gob3VyTWFwWzFdKVxuXG4gIHZhbHVlID0gb3VyTWFwW1xuICAgIGlucHV0ID8gMCA6XG4gICAgaW5wdXQgPT09IGZhbHNlID8gMSA6XG4gICAgMlxuICBdXG5cbiAgcmV0dXJuIHZhbHVlXG59XG4iLCIoZnVuY3Rpb24oZ2xvYmFsKXt2YXIgRmlsdGVyVG9rZW4gPSByZXF1aXJlKCcuL2ZpbHRlcl90b2tlbicpXG4gICwgVGFnVG9rZW4gPSByZXF1aXJlKCcuL3RhZ190b2tlbicpXG4gICwgQ29tbWVudFRva2VuID0gcmVxdWlyZSgnLi9jb21tZW50X3Rva2VuJylcbiAgLCBUZXh0VG9rZW4gPSByZXF1aXJlKCcuL3RleHRfdG9rZW4nKSBcbiAgLCBsaWJyYXJpZXMgPSByZXF1aXJlKCcuL2xpYnJhcmllcycpXG4gICwgUGFyc2VyID0gcmVxdWlyZSgnLi9wYXJzZXInKVxuICAsIENvbnRleHQgPSByZXF1aXJlKCcuL2NvbnRleHQnKVxuICAsIE1ldGEgPSByZXF1aXJlKCcuL21ldGEnKVxuICAsIFByb21pc2UgPSByZXF1aXJlKCcuL3Byb21pc2UnKVxuXG5tb2R1bGUuZXhwb3J0cyA9IFRlbXBsYXRlXG5cbi8vIGNpcmN1bGFyIGFsaWFzIHRvIHN1cHBvcnQgb2xkXG4vLyB2ZXJzaW9ucyBvZiBwbGF0ZS5cblRlbXBsYXRlLlRlbXBsYXRlID0gVGVtcGxhdGVcblRlbXBsYXRlLkNvbnRleHQgPSBDb250ZXh0XG5cbnZhciBsYXRlciA9IHR5cGVvZiBnbG9iYWwgIT09ICd1bmRlZmluZWQnID8gXG4gICAgZnVuY3Rpb24oZm4pIHsgZ2xvYmFsLnNldFRpbWVvdXQoZm4sIDApIH0gOlxuICAgIGZ1bmN0aW9uKGZuKSB7IHRoaXMuc2V0VGltZW91dChmbiwgMCkgfVxuXG5mdW5jdGlvbiBUZW1wbGF0ZShyYXcsIGxpYnJhcmllcywgcGFyc2VyKSB7XG4gIGlmKHR5cGVvZiByYXcgIT09ICdzdHJpbmcnKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcignaW5wdXQgc2hvdWxkIGJlIGEgc3RyaW5nJylcbiAgfVxuXG4gIHRoaXMucmF3ID0gcmF3XG5cbiAgbGlicmFyaWVzID0gbGlicmFyaWVzIHx8IHt9XG5cbiAgdGhpcy50YWdMaWJyYXJ5ID1cbiAgICBsaWJyYXJpZXMudGFnX2xpYnJhcnkgfHwgVGVtcGxhdGUuTWV0YS5jcmVhdGVUYWdMaWJyYXJ5KClcblxuICB0aGlzLmZpbHRlckxpYnJhcnkgPSBcbiAgICBsaWJyYXJpZXMuZmlsdGVyX2xpYnJhcnkgfHwgVGVtcGxhdGUuTWV0YS5jcmVhdGVGaWx0ZXJMaWJyYXJ5KClcblxuICB0aGlzLnBsdWdpbkxpYnJhcnkgPSBcbiAgICBsaWJyYXJpZXMucGx1Z2luX2xpYnJhcnkgfHwgVGVtcGxhdGUuTWV0YS5jcmVhdGVQbHVnaW5MaWJyYXJ5KClcblxuICB0aGlzLnBhcnNlciA9IHBhcnNlciB8fCBQYXJzZXJcblxuICB0aGlzLnRva2VucyA9IG51bGxcbn1cblxudmFyIGNvbnMgPSBUZW1wbGF0ZVxuICAsIHByb3RvID0gY29ucy5wcm90b3R5cGVcbiAgLCBtZXRhID0gY29ucy5NZXRhID0gbmV3IE1ldGFcblxuY29ucy5jcmVhdGVQbHVnaW5MaWJyYXJ5ID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiBuZXcgbGlicmFyaWVzLkRlZmF1bHRQbHVnaW5MaWJyYXJ5KClcbn1cblxucHJvdG8uZ2V0Tm9kZUxpc3QgPSBmdW5jdGlvbigpIHtcbiAgdGhpcy5ub2RlbGlzdCA9IHRoaXMubm9kZWxpc3QgfHwgdGhpcy5wYXJzZSgpXG5cbiAgcmV0dXJuIHRoaXMubm9kZWxpc3Rcbn1cblxucHJvdG8ucGFyc2UgPSBmdW5jdGlvbigpIHtcbiAgdmFyIHBhcnNlclxuXG4gIHRoaXMudG9rZW5zID0gdGhpcy50b2tlbnMgfHwgY29ucy50b2tlbml6ZSh0aGlzLnJhdylcblxuICBwYXJzZXIgPSBuZXcgdGhpcy5wYXJzZXIoXG4gICAgICB0aGlzLnRva2Vuc1xuICAgICwgdGhpcy50YWdMaWJyYXJ5XG4gICAgLCB0aGlzLmZpbHRlckxpYnJhcnlcbiAgICAsIHRoaXMucGx1Z2luTGlicmFyeVxuICAgICwgdGhpc1xuICApXG5cbiAgcmV0dXJuIHBhcnNlci5wYXJzZSgpXG59XG5cbnByb3RvLnJlbmRlciA9IHByb3RlY3QoZnVuY3Rpb24oY29udGV4dCwgcmVhZHkpIHtcbiAgY29udGV4dCA9IG5ldyBDb250ZXh0KGNvbnRleHQpXG5cbiAgdmFyIHJlc3VsdFxuXG4gIHJlc3VsdCA9IFxuICB0aGlzXG4gICAgLmdldE5vZGVMaXN0KClcbiAgICAucmVuZGVyKGNvbnRleHQpXG5cbiAgaWYocmVzdWx0LmNvbnN0cnVjdG9yID09PSBQcm9taXNlKSB7XG4gICAgcmVzdWx0Lm9uY2UoJ2RvbmUnLCBmdW5jdGlvbihkYXRhKSB7XG4gICAgICByZWFkeShudWxsLCBkYXRhKVxuICAgIH0pXG4gIH0gZWxzZSB7XG4gICAgbGF0ZXIoZnVuY3Rpb24oKSB7XG4gICAgICByZWFkeShudWxsLCByZXN1bHQpXG4gICAgfSwgMClcbiAgfVxuXG59KVxuXG5mdW5jdGlvbiBwcm90ZWN0KGZuKSB7XG4gIHJldHVybiBmdW5jdGlvbihjb250ZXh0LCByZWFkeSkge1xuICAgIGlmKCFjb250ZXh0IHx8ICFyZWFkeSkge1xuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcigpXG4gICAgfVxuXG4gICAgdHJ5IHtcbiAgICAgIHJldHVybiBmbi5jYWxsKHRoaXMsIGNvbnRleHQsIHJlYWR5KVxuICAgIH0gY2F0Y2goZSkge1xuICAgICAgbGF0ZXIoZnVuY3Rpb24oKSB7XG4gICAgICAgIHJlYWR5KGUsIG51bGwpXG4gICAgICB9LCAwKVxuICAgIH1cbiAgfVxufVxuXG5jb25zLk1BVENIX1JFID0gL1xce1slI1xce10oLio/KVtcXH0jJV1cXH0vXG5cbmNvbnMudG9rZW5pemUgPSBmdW5jdGlvbihjb250ZW50KSB7XG4gIHZhciBtYXRjaCA9IG51bGxcbiAgICAsIHRva2VucyA9IFtdXG4gICAgLCBsaW5lTm8gPSAxXG4gICAgLCBpbmNMaW5lTm8gPSBmdW5jdGlvbihzdHIpIHsgbGluZU5vICs9IHN0ci5zcGxpdCgnXFxuJykubGVuZ3RoIH1cbiAgICAsIG1hcCA9IHtcbiAgICAgICAgICAnJSc6IFRhZ1Rva2VuXG4gICAgICAgICwgJyMnOiBDb21tZW50VG9rZW5cbiAgICAgICAgLCAneyc6IEZpbHRlclRva2VuXG4gICAgICB9XG4gICAgLCByZXggPSB0aGlzLk1BVENIX1JFXG4gICAgLCBsaXRlcmFsXG5cbiAgZG8ge1xuICAgIG1hdGNoID0gcmV4LmV4ZWMoY29udGVudClcbiAgICBpZighbWF0Y2gpXG4gICAgICBjb250aW51ZVxuXG4gICAgbGl0ZXJhbCA9IGNvbnRlbnQuc2xpY2UoMCwgbWF0Y2guaW5kZXgpXG4gICAgaW5jTGluZU5vKGxpdGVyYWwpXG4gICAgaWYobWF0Y2guaW5kZXgpXG4gICAgICB0b2tlbnMucHVzaChuZXcgVGV4dFRva2VuKGxpdGVyYWwuc2xpY2UoMCwgbWF0Y2guaW5kZXgsIGxpbmVObykpKVxuXG4gICAgbWF0Y2hbMV0gPSBtYXRjaFsxXVxuICAgICAgLnJlcGxhY2UoL15cXHMrLywgJycpXG4gICAgICAucmVwbGFjZSgvXFxzKyQvLCAnJylcblxuICAgIHRva2Vucy5wdXNoKG5ldyBtYXBbbWF0Y2hbMF0uY2hhckF0KDEpXShtYXRjaFsxXSwgbGluZU5vKSlcblxuICAgIGNvbnRlbnQgPSBjb250ZW50LnNsaWNlKG1hdGNoLmluZGV4ICsgbWF0Y2hbMF0ubGVuZ3RoKVxuICB9IHdoaWxlKGNvbnRlbnQubGVuZ3RoICYmIG1hdGNoKVxuXG4gIHRva2Vucy5wdXNoKG5ldyBUZXh0VG9rZW4oY29udGVudCkpXG5cbiAgcmV0dXJuIHRva2Vuc1xufVxuXG59KShzZWxmKSIsIm1vZHVsZS5leHBvcnRzID0ge1xuICAgIExpYnJhcnk6IHJlcXVpcmUoJy4vbGlicmFyeScpXG4gICwgRGVmYXVsdFBsdWdpbkxpYnJhcnk6IHJlcXVpcmUoJy4vbGlicmFyeScpXG4gICwgRGVmYXVsdFRhZ0xpYnJhcnk6IHJlcXVpcmUoJy4vZGVmYXVsdHRhZ3MnKVxuICAsIERlZmF1bHRGaWx0ZXJMaWJyYXJ5OiByZXF1aXJlKCcuL2RlZmF1bHRmaWx0ZXJzJylcbn0gXG4iLCJtb2R1bGUuZXhwb3J0cyA9IExpYnJhcnlcblxudmFyIFByb21pc2UgPSByZXF1aXJlKCcuL3Byb21pc2UnKVxuXG5mdW5jdGlvbiBMaWJyYXJ5KGxpYikge1xuICB0aGlzLnJlZ2lzdHJ5ID0gbGliIHx8IHt9XG59XG5cbnZhciBjb25zID0gTGlicmFyeVxuICAsIHByb3RvID0gY29ucy5wcm90b3R5cGVcblxucHJvdG8ubG9va3VwID0gZXJyb3JPbk51bGwoZnVuY3Rpb24obmFtZSkge1xuICB2YXIgb3V0ID0gdGhpcy5yZWdpc3RyeVtuYW1lXSB8fCBudWxsXG5cbiAgaWYodHlwZW9mIG91dCA9PT0gJ2Z1bmN0aW9uJyAmJiBvdXQubGVuZ3RoID09PSAyICYmIG5hbWUgPT09ICdsb2FkZXInKSB7XG4gICAgb3V0ID0gUHJvbWlzZS50b1Byb21pc2Uob3V0KVxuICB9XG5cbiAgcmV0dXJuIG91dFxufSwgXCJDb3VsZCBub3QgZmluZCB7MH0hXCIpXG5cbnByb3RvLnJlZ2lzdGVyID0gZXJyb3JPbk51bGwoZnVuY3Rpb24obmFtZSwgaXRlbSkge1xuICBpZih0aGlzLnJlZ2lzdHJ5W25hbWVdKVxuICAgIHJldHVybiBudWxsXG5cbiAgdGhpcy5yZWdpc3RyeVtuYW1lXSA9IGl0ZW1cbn0sIFwiezB9IGlzIGFscmVhZHkgcmVnaXN0ZXJlZCFcIilcblxuXG5mdW5jdGlvbiBlcnJvck9uTnVsbChmbiwgbXNnKSB7XG4gIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICB2YXIgcmVzdWx0ID0gZm4uY2FsbCh0aGlzLCBhcmd1bWVudHNbMF0sIGFyZ3VtZW50c1sxXSlcbiAgICAgICwgYXJncyA9IGFyZ3VtZW50c1xuXG4gICAgaWYocmVzdWx0ID09PSBudWxsKVxuICAgICAgdGhyb3cgbmV3IEVycm9yKG1zZy5yZXBsYWNlKC9cXHsoXFxkKz8pXFx9L2csIGZ1bmN0aW9uKGEsIG0pIHtcbiAgICAgICAgcmV0dXJuIGFyZ3NbK21dXG4gICAgICB9KSlcblxuICAgIHJldHVybiByZXN1bHRcbiAgfVxufVxuXG4iLCJ2YXIgbGlicmFyaWVzID0gcmVxdWlyZSgnLi9saWJyYXJpZXMnKVxuXG5tb2R1bGUuZXhwb3J0cyA9IE1ldGFcblxuZnVuY3Rpb24gTWV0YSgpIHtcbiAgdGhpcy5fYXV0b3JlZ2lzdGVyID0ge1xuICAgICAgcGx1Z2luOiB7fVxuICAgICwgdGFnOiB7fVxuICAgICwgZmlsdGVyOiB7fVxuICB9XG5cbiAgdGhpcy5fY2FjaGUgPSB7fVxuXG4gIHRoaXMuX2NsYXNzZXMgPSB7XG4gICAgICBmaWx0ZXI6IGxpYnJhcmllcy5EZWZhdWx0RmlsdGVyTGlicmFyeVxuICAgICwgcGx1Z2luOiBsaWJyYXJpZXMuRGVmYXVsdFBsdWdpbkxpYnJhcnlcbiAgICAsIHRhZzogbGlicmFyaWVzLkRlZmF1bHRUYWdMaWJyYXJ5XG4gIH1cbn1cblxudmFyIGNvbnMgPSBNZXRhXG4gICwgcHJvdG8gPSBjb25zLnByb3RvdHlwZVxuXG5wcm90by5jcmVhdGVQbHVnaW5MaWJyYXJ5ID0gY3JlYXRlTGlicmFyeSgncGx1Z2luJylcbnByb3RvLmNyZWF0ZUZpbHRlckxpYnJhcnkgPSBjcmVhdGVMaWJyYXJ5KCdmaWx0ZXInKVxucHJvdG8uY3JlYXRlVGFnTGlicmFyeSA9IGNyZWF0ZUxpYnJhcnkoJ3RhZycpXG5cbnByb3RvLnJlZ2lzdGVyUGx1Z2luID0gY3JlYXRlQXV0b3JlZ2lzdGVyKCdwbHVnaW4nKVxucHJvdG8ucmVnaXN0ZXJGaWx0ZXIgPSBjcmVhdGVBdXRvcmVnaXN0ZXIoJ2ZpbHRlcicpXG5wcm90by5yZWdpc3RlclRhZyA9IGNyZWF0ZUF1dG9yZWdpc3RlcigndGFnJylcblxuZnVuY3Rpb24gY3JlYXRlQXV0b3JlZ2lzdGVyKG5hbWUpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uKGtleSwgaXRlbSkge1xuICAgIGlmKHRoaXMuX2NhY2hlW25hbWVdKVxuICAgICAgdGhpcy5fY2FjaGVbbmFtZV0ucmVnaXN0ZXIoa2V5LCBpdGVtKTtcbiAgICBlbHNlXG4gICAgICB0aGlzLl9hdXRvcmVnaXN0ZXJbbmFtZV1ba2V5XSA9IGl0ZW07XG4gIH1cbn1cblxuZnVuY3Rpb24gY3JlYXRlTGlicmFyeShuYW1lKSB7XG4gIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICBpZih0aGlzLl9jYWNoZVtuYW1lXSlcbiAgICAgIHJldHVybiB0aGlzLl9jYWNoZVtuYW1lXTsgXG5cbiAgICB2YXIgbGliID0gbmV3IHRoaXMuX2NsYXNzZXNbbmFtZV1cblxuICAgIGZvcih2YXIga2V5IGluIHRoaXMuX2F1dG9yZWdpc3RlcltuYW1lXSkge1xuICAgICAgbGliLnJlZ2lzdGVyKGtleSwgdGhpcy5fYXV0b3JlZ2lzdGVyW25hbWVdW2tleV0pXG4gICAgfVxuXG4gICAgdGhpcy5fY2FjaGVbbmFtZV0gPSBsaWJcbiAgICByZXR1cm4gbGliXG4gIH1cbn1cblxuIiwibW9kdWxlLmV4cG9ydHMgPSBOb2RlTGlzdFxuXG52YXIgUHJvbWlzZSA9IHJlcXVpcmUoJy4vcHJvbWlzZScpXG5cbmZ1bmN0aW9uIE5vZGVMaXN0KG5vZGVzKSB7XG4gIHRoaXMubm9kZXMgPSBub2Rlc1xufVxuXG52YXIgY29ucyA9IE5vZGVMaXN0XG4gICwgcHJvdG8gPSBjb25zLnByb3RvdHlwZVxuXG5wcm90by5yZW5kZXIgPSBmdW5jdGlvbihjb250ZXh0KSB7XG4gIHZhciBwcm9taXNlcyA9IFtdXG4gICAgLCByZXN1bHRzID0gW11cbiAgICAsIG5vZGVzID0gdGhpcy5ub2Rlc1xuICAgICwgcmVzdWx0XG5cbiAgZm9yKHZhciBpID0gMCwgbGVuID0gbm9kZXMubGVuZ3RoOyBpIDwgbGVuOyArK2kpIHtcbiAgICByZXN1bHRzW2ldID0gcmVzdWx0ID0gbm9kZXNbaV0ucmVuZGVyKGNvbnRleHQpXG5cbiAgICBpZihyZXN1bHQuY29uc3RydWN0b3IgPT09IFByb21pc2UpIHtcbiAgICAgIHByb21pc2VzLnB1c2gocmVzdWx0KVxuICAgIH1cbiAgfVxuXG4gIGlmKHByb21pc2VzLmxlbmd0aCkge1xuICAgIHJldHVybiB0aGlzLnJlc29sdmVQcm9taXNlcyhyZXN1bHRzLCBwcm9taXNlcykgXG4gIH1cblxuICByZXR1cm4gcmVzdWx0cy5qb2luKCcnKVxufVxuXG5wcm90by5yZXNvbHZlUHJvbWlzZXMgPSBmdW5jdGlvbihyZXN1bHRzLCBwcm9taXNlcykge1xuICB2YXIgc2VsZiA9IHRoaXNcbiAgICAsIHByb21pc2UgPSBuZXcgUHJvbWlzZVxuICAgICwgdG90YWwgPSBwcm9taXNlcy5sZW5ndGhcblxuICBmb3IodmFyIGkgPSAwLCBwID0gMCwgbGVuID0gcmVzdWx0cy5sZW5ndGg7IGkgPCBsZW47ICsraSkge1xuICAgIGlmKHJlc3VsdHNbaV0uY29uc3RydWN0b3IgIT09IFByb21pc2UpIFxuICAgICAgY29udGludWVcblxuICAgIHByb21pc2VzW3ArK10ub25jZSgnZG9uZScsIGJpbmQoaSwgZnVuY3Rpb24oaWR4LCByZXN1bHQpIHtcbiAgICAgIHJlc3VsdHNbaWR4XSA9IHJlc3VsdFxuXG4gICAgICBpZighLS10b3RhbClcbiAgICAgICAgcHJvbWlzZS5yZXNvbHZlKHJlc3VsdHMuam9pbignJykpXG4gICAgfSkpXG4gIH1cblxuICByZXR1cm4gcHJvbWlzZVxufVxuXG5mdW5jdGlvbiBiaW5kKG51bSwgZm4pIHtcbiAgcmV0dXJuIGZ1bmN0aW9uKHJlc3VsdCkge1xuICAgIHJldHVybiBmbihudW0sIHJlc3VsdClcbiAgfVxufVxuIiwibW9kdWxlLmV4cG9ydHMgPSBQYXJzZXJcblxudmFyIE5vZGVMaXN0ID0gcmVxdWlyZSgnLi9ub2RlX2xpc3QnKVxuXG52YXIgRmlsdGVyQXBwbGljYXRpb24gPSByZXF1aXJlKCcuL2ZpbHRlcl9hcHBsaWNhdGlvbicpXG4gICwgRmlsdGVyTG9va3VwID0gcmVxdWlyZSgnLi9maWx0ZXJfbG9va3VwJylcbiAgLCBGaWx0ZXJDaGFpbiA9IHJlcXVpcmUoJy4vZmlsdGVyX2NoYWluJylcbiAgLCBUYWdUb2tlbiA9IHJlcXVpcmUoJy4vdGFnX3Rva2VuJylcblxuZnVuY3Rpb24gUGFyc2VyKHRva2VucywgdGFncywgZmlsdGVycywgcGx1Z2lucykge1xuICB0aGlzLnRva2VucyA9IHRva2Vuc1xuICB0aGlzLnRhZ3MgPSB0YWdzXG4gIHRoaXMuZmlsdGVycyA9IGZpbHRlcnNcbiAgdGhpcy5wbHVnaW5zID0gcGx1Z2luc1xuXG4gIC8vIGZvciB1c2Ugd2l0aCBleHRlbmRzIC8gYmxvY2sgdGFnc1xuICB0aGlzLmxvYWRlZEJsb2NrcyA9IFtdXG59XG5cbnZhciBjb25zID0gUGFyc2VyXG4gICwgcHJvdG8gPSBjb25zLnByb3RvdHlwZVxuXG5wcm90by5jYWNoZSA9IHt9XG5cbnByb3RvLnBhcnNlID0gZnVuY3Rpb24odW50aWwpIHtcbiAgdmFyIG9rYXkgPSAhdW50aWxcbiAgICAsIHRva2VuID0gbnVsbFxuICAgICwgb3V0cHV0ID0gW11cbiAgICAsIG5vZGVcblxuICB3aGlsZSh0aGlzLnRva2Vucy5sZW5ndGggPiAwKSB7XG4gICAgdG9rZW4gPSB0aGlzLnRva2Vucy5zaGlmdCgpXG5cbiAgICBpZih1bnRpbCAmJiB0b2tlbi5pcyh1bnRpbCkgJiYgdG9rZW4uY29uc3RydWN0b3IgPT09IFRhZ1Rva2VuKSB7XG4gICAgICB0aGlzLnRva2Vucy51bnNoaWZ0KHRva2VuKVxuICAgICAgb2theSA9IHRydWVcblxuICAgICAgYnJlYWtcbiAgICB9XG5cbiAgICBpZihub2RlID0gdG9rZW4ubm9kZSh0aGlzKSkge1xuICAgICAgb3V0cHV0LnB1c2gobm9kZSlcbiAgICB9XG4gIH1cblxuICBpZighb2theSkge1xuICAgIHRocm93IG5ldyBFcnJvcignZXhwZWN0ZWQgb25lIG9mICcgKyB1bnRpbClcbiAgfVxuXG4gIHJldHVybiBuZXcgTm9kZUxpc3Qob3V0cHV0KVxufVxuXG5wcm90by5jb21waWxlTnVtYmVyID0gZnVuY3Rpb24oY29udGVudCwgaWR4LCBvdXRwdXQpIHtcbiAgdmFyIGRlY2ltYWwgPSBjb250ZW50LmNoYXJBdChpZHgpID09PSAnLidcbiAgICAsIGJpdHMgPSBkZWNpbWFsID8gWycwLiddIDogW11cbiAgICAsIHBhcnNlXG4gICAgLCBjXG5cbiAgZG8ge1xuICAgIGMgPSBjb250ZW50LmNoYXJBdChpZHgpXG5cbiAgICBpZihjID09PSAnLicpIHtcbiAgICAgIGlmKGRlY2ltYWwpIHtcbiAgICAgICAgYnJlYWtcbiAgICAgIH1cblxuICAgICAgZGVjaW1hbCA9IHRydWVcbiAgICAgIGJpdHMucHVzaCgnLicpXG4gICAgfSBlbHNlIGlmKC9cXGQvLnRlc3QoYykpIHtcbiAgICAgIGJpdHMucHVzaChjKVxuICAgIH1cbiAgfSB3aGlsZSgrK2lkeCA8IGNvbnRlbnQubGVuZ3RoKVxuXG4gIHBhcnNlID0gZGVjaW1hbCA/IHBhcnNlRmxvYXQgOiBwYXJzZUludFxuICBvdXRwdXQucHVzaChwYXJzZShiaXRzLmpvaW4oJycpLCAxMCkpXG5cbiAgcmV0dXJuIGlkeFxufVxuXG5wcm90by5jb21waWxlU3RyaW5nID0gZnVuY3Rpb24oY29udGVudCwgaWR4LCBvdXRwdXQpIHtcbiAgdmFyIHR5cGUgPSBjb250ZW50LmNoYXJBdChpZHgpXG4gICAgLCBlc2NhcGVkID0gZmFsc2VcbiAgICAsIGJpdHMgPSBbXVxuICAgICwgY1xuXG4gICsraWR4XG5cbiAgZG8ge1xuICAgIGMgPSBjb250ZW50LmNoYXJBdChpZHgpXG5cbiAgICBpZighZXNjYXBlZCkge1xuICAgICAgaWYoYyA9PT0gJ1xcXFwnKSB7XG4gICAgICAgIGVzY2FwZWQgPSB0cnVlXG5cbiAgICAgICAgY29udGludWVcbiAgICAgIH1cblxuICAgICAgaWYoYyA9PT0gdHlwZSkge1xuICAgICAgICBicmVha1xuICAgICAgfVxuXG4gICAgICBiaXRzLnB1c2goYylcbiAgICB9IGVsc2Uge1xuICAgICAgaWYoIS9bJ1wiXFxcXF0vLnRlc3QoYykpIHtcbiAgICAgICAgYml0cy5wdXNoKCdcXFxcJylcbiAgICAgIH1cblxuICAgICAgYml0cy5wdXNoKGMpXG4gICAgICBlc2NhcGVkID0gZmFsc2VcbiAgICB9XG5cbiAgfSB3aGlsZSgrK2lkeCA8IGNvbnRlbnQubGVuZ3RoKVxuXG4gIG91dHB1dC5wdXNoKGJpdHMuam9pbignJykpXG5cbiAgcmV0dXJuIGlkeFxufVxuXG5wcm90by5jb21waWxlTmFtZSA9IGZ1bmN0aW9uKGNvbnRlbnQsIGlkeCwgb3V0cHV0KSB7XG4gIHZhciBvdXQgPSBbXVxuICAgICwgY1xuXG4gIGRvIHtcbiAgICBjID0gY29udGVudC5jaGFyQXQoaWR4KVxuXG4gICAgaWYoL1teXFx3XFxkXFxfXS8udGVzdChjKSkge1xuICAgICAgYnJlYWtcbiAgICB9XG5cbiAgICBvdXQucHVzaChjKVxuICB9IHdoaWxlKCsraWR4IDwgY29udGVudC5sZW5ndGgpXG5cbiAgb3V0cHV0LnB1c2gob3V0LmpvaW4oJycpKVxuXG4gIHJldHVybiBpZHhcbn1cblxucHJvdG8uY29tcGlsZUZpbHRlciA9IGZ1bmN0aW9uKGNvbnRlbnQsIGlkeCwgb3V0cHV0KSB7XG4gIHZhciBmaWx0ZXJOYW1lXG4gICAgLCBvbGRMZW5cbiAgICAsIGJpdHNcblxuICArK2lkeFxuXG4gIGlkeCA9IHRoaXMuY29tcGlsZU5hbWUoY29udGVudCwgaWR4LCBvdXRwdXQpXG4gIGZpbHRlck5hbWUgPSBvdXRwdXQucG9wKClcblxuICBpZihjb250ZW50LmNoYXJBdChpZHgpICE9PSAnOicpIHtcbiAgICBvdXRwdXQucHVzaChuZXcgRmlsdGVyQXBwbGljYXRpb24oZmlsdGVyTmFtZSwgW10pKVxuXG4gICAgcmV0dXJuIGlkeCAtIDFcbiAgfVxuXG4gICsraWR4XG5cbiAgb2xkTGVuID0gb3V0cHV0Lmxlbmd0aFxuICBpZHggPSB0aGlzLmNvbXBpbGVGdWxsKGNvbnRlbnQsIGlkeCwgb3V0cHV0LCB0cnVlKVxuICBiaXRzID0gb3V0cHV0LnNwbGljZShvbGRMZW4sIG91dHB1dC5sZW5ndGggLSBvbGRMZW4pXG5cbiAgb3V0cHV0LnB1c2gobmV3IEZpbHRlckFwcGxpY2F0aW9uKGZpbHRlck5hbWUsIGJpdHMpKVxuXG4gIHJldHVybiBpZHhcbn1cblxucHJvdG8uY29tcGlsZUxvb2t1cCA9IGZ1bmN0aW9uKGNvbnRlbnQsIGlkeCwgb3V0cHV0KSB7XG4gIHZhciBiaXRzID0gW11cblxuICBkbyB7XG4gICAgaWR4ID0gdGhpcy5jb21waWxlTmFtZShjb250ZW50LCBpZHgsIG91dHB1dClcbiAgICBiaXRzLnB1c2gob3V0cHV0LnBvcCgpKVxuXG4gICAgaWYoY29udGVudC5jaGFyQXQoaWR4KSAhPT0gJy4nKSB7XG4gICAgICBicmVha1xuICAgIH1cbiAgfSB3aGlsZSgrK2lkeCA8IGNvbnRlbnQubGVuZ3RoKVxuXG4gIG91dHB1dC5wdXNoKG5ldyBGaWx0ZXJMb29rdXAoYml0cykpXG5cbiAgcmV0dXJuIGlkeCAtIDFcbn1cblxucHJvdG8uY29tcGlsZUZ1bGwgPSBmdW5jdGlvbihjb250ZW50LCBpZHgsIG91dHB1dCwgb21pdFBpcGUpIHtcbiAgdmFyIGNcblxuICBvdXRwdXQgPSBvdXRwdXQgfHwgW11cbiAgaWR4ID0gaWR4IHx8IDBcbiAgLy8gc29tZXRoaW5nfGZpbHRlcm5hbWVbOmFyZywgYXJnXVxuICAvLyBcInF1b3Rlc1wiXG4gIC8vIDFcbiAgLy8gMS4yXG4gIC8vIHRydWUgfCBmYWxzZVxuICAvLyBzd2FsbG93IGxlYWRpbmcgd2hpdGVzcGFjZS5cblxuICB3aGlsZSgvXFxzLy50ZXN0KGNvbnRlbnQuY2hhckF0KGlkeCkpKSB7XG4gICAgKytpZHhcbiAgfVxuXG4gIGRvIHtcbiAgICBjID0gY29udGVudC5jaGFyQXQoaWR4KVxuXG4gICAgaWYoL1ssXFxzXS8udGVzdChjKSkge1xuICAgICAgYnJlYWtcbiAgICB9XG5cbiAgICBpZihvbWl0UGlwZSAmJiBjID09PSAnfCcpIHtcbiAgICAgIC0taWR4XG5cbiAgICAgIGJyZWFrXG4gICAgfVxuXG4gICAgc3dpdGNoKHRydWUpIHtcbiAgICAgIGNhc2UgL1tcXGRcXC5dLy50ZXN0KGMpOlxuICAgICAgICBpZHggPSB0aGlzLmNvbXBpbGVOdW1iZXIoY29udGVudCwgaWR4LCBvdXRwdXQpXG4gICAgICAgIGJyZWFrXG4gICAgICBjYXNlIC9bJ1wiXS8udGVzdChjKTpcbiAgICAgICAgaWR4ID0gdGhpcy5jb21waWxlU3RyaW5nKGNvbnRlbnQsIGlkeCwgb3V0cHV0KVxuICAgICAgICBicmVha1xuICAgICAgY2FzZSBjID09PSAnfCc6XG4gICAgICAgIGlkeCA9IHRoaXMuY29tcGlsZUZpbHRlcihjb250ZW50LCBpZHgsIG91dHB1dClcbiAgICAgICAgYnJlYWtcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIGlkeCA9IHRoaXMuY29tcGlsZUxvb2t1cChjb250ZW50LCBpZHgsIG91dHB1dClcbiAgICAgICAgYnJlYWtcbiAgICB9XG4gIH0gd2hpbGUoKytpZHggPCBjb250ZW50Lmxlbmd0aClcblxuICByZXR1cm4gaWR4XG59XG5cbnByb3RvLmNvbXBpbGUgPSBmdW5jdGlvbihjb250ZW50KSB7XG4gIHZhciBvdXRwdXQgPSBbXVxuXG4gIGlmKHRoaXMuY2FjaGVbY29udGVudF0pIHtcbiAgICByZXR1cm4gdGhpcy5jYWNoZVtjb250ZW50XVxuICB9XG5cbiAgdGhpcy5jb21waWxlRnVsbChjb250ZW50LCAwLCBvdXRwdXQpXG5cbiAgb3V0cHV0ID0gdGhpcy5jYWNoZVtjb250ZW50XSA9IG5ldyBGaWx0ZXJDaGFpbihvdXRwdXQsIHRoaXMpXG4gIG91dHB1dC5hdHRhY2godGhpcylcblxuICByZXR1cm4gb3V0cHV0XG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IFByb21pc2VcblxuZnVuY3Rpb24gUHJvbWlzZSgpIHtcbiAgdGhpcy50cmlnZ2VyID0gbnVsbFxufVxuXG52YXIgY29ucyA9IFByb21pc2VcbiAgLCBwcm90byA9IGNvbnMucHJvdG90eXBlXG5cbnByb3RvLnJlc29sdmUgPSBmdW5jdGlvbih2YWx1ZSkge1xuICB2YXIgdHJpZ2dlciA9IHRoaXMudHJpZ2dlclxuXG4gIGlmKCF2YWx1ZSB8fCB2YWx1ZS5jb25zdHJ1Y3RvciAhPT0gY29ucykge1xuICAgIHJldHVybiB0cmlnZ2VyKHZhbHVlKVxuICB9XG5cbiAgdmFsdWUub25jZSgnZG9uZScsIHRyaWdnZXIpXG59XG5cbnByb3RvLm9uY2UgPSBmdW5jdGlvbihldiwgZm4pIHtcbiAgdGhpcy50cmlnZ2VyID0gZm5cbn1cblxuY29ucy50b1Byb21pc2UgPSBmdW5jdGlvbihmbikge1xuICByZXR1cm4gZnVuY3Rpb24gcHJvbWlzaWZpZWQoKSB7XG4gICAgdmFyIGFyZ3MgPSBbXS5zbGljZS5jYWxsKGFyZ3VtZW50cylcbiAgICAgICwgcHJvbWlzZSA9IG5ldyBjb25zXG4gICAgICAsIHNlbGYgPSB0aGlzXG5cbiAgICBhcmdzLnB1c2gob25yZWFkeSlcblxuICAgIHNldFRpbWVvdXQoYmFuZywgMClcblxuICAgIHJldHVybiBwcm9taXNlXG5cbiAgICBmdW5jdGlvbiBiYW5nKCkge1xuICAgICAgZm4uYXBwbHkoc2VsZiwgYXJncylcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBvbnJlYWR5KGVyciwgZGF0YSkge1xuICAgICAgcHJvbWlzZS5yZXNvbHZlKGRhdGEpXG4gICAgfVxuICB9XG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IFRhZ1Rva2VuXG5cbnZhciBUb2tlbiA9IHJlcXVpcmUoJy4vdG9rZW4nKVxuXG5mdW5jdGlvbiBUYWdUb2tlbihjb250ZW50LCBsaW5lKSB7XG4gIFRva2VuLmNhbGwodGhpcywgY29udGVudCwgbGluZSlcbn1cblxudmFyIGNvbnMgPSBUYWdUb2tlblxuICAsIHByb3RvID0gY29ucy5wcm90b3R5cGUgPSBuZXcgVG9rZW5cblxucHJvdG8uY29uc3RydWN0b3IgPSBjb25zXG5cbnByb3RvLm5vZGUgPSBmdW5jdGlvbihwYXJzZXIpIHtcbiAgdmFyIHRhZyA9IHBhcnNlci50YWdzLmxvb2t1cCh0aGlzLm5hbWUpXG5cbiAgcmV0dXJuIHRhZyh0aGlzLmNvbnRlbnQsIHBhcnNlcilcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gQmxvY2tOb2RlXG5cbnZhciBQcm9taXNlID0gcmVxdWlyZSgnLi4vcHJvbWlzZScpXG4gICwgQmxvY2tDb250ZXh0ID0gcmVxdWlyZSgnLi4vYmxvY2tfY29udGV4dCcpXG5cbmZ1bmN0aW9uIEJsb2NrTm9kZShuYW1lLCBub2Rlcykge1xuICB0aGlzLm5hbWUgPSBuYW1lXG4gIHRoaXMubm9kZXMgPSBub2Rlc1xuXG4gIHRoaXMuY29udGV4dCA9IG51bGxcbn1cblxudmFyIGNvbnMgPSBCbG9ja05vZGVcbiAgLCBwcm90byA9IGNvbnMucHJvdG90eXBlXG5cbnByb3RvLnJlbmRlciA9IGZ1bmN0aW9uKGNvbnRleHQpIHtcbiAgdmFyIHNlbGYgPSB0aGlzXG4gICAgLCBibG9ja0NvbnRleHQgPSBCbG9ja0NvbnRleHQuZnJvbShjb250ZXh0KVxuICAgICwgcmVzdWx0XG4gICAgLCBibG9ja1xuICAgICwgcHVzaFxuXG4gIGlmKCFibG9ja0NvbnRleHQpIHtcbiAgICBjb250ZXh0LmJsb2NrID0gc2VsZlxuICAgIHJldHVybiBzZWxmLm5vZGVzLnJlbmRlcihjb250ZXh0KVxuICB9XG5cbiAgYmxvY2sgPSBwdXNoID0gYmxvY2tDb250ZXh0LnBvcChzZWxmLm5hbWUpXG5cbiAgaWYoIWJsb2NrKSB7IFxuICAgIGJsb2NrID0gc2VsZlxuICB9IFxuXG4gIGJsb2NrID0gbmV3IEJsb2NrTm9kZShibG9jay5uYW1lLCBibG9jay5ub2RlcylcblxuICBibG9jay5jb250ZXh0ID0gY29udGV4dFxuICBibG9jay5jb250ZXh0LmJsb2NrID0gYmxvY2tcbiAgY29udGV4dC5ibG9jayA9IGJsb2NrXG5cbiAgcmVzdWx0ID0gYmxvY2subm9kZXMucmVuZGVyKGNvbnRleHQpXG5cbiAgaWYocHVzaCkge1xuICAgIGJsb2NrQ29udGV4dC5wdXNoKHNlbGYubmFtZSwgcHVzaClcbiAgfVxuXG4gIHJldHVybiByZXN1bHRcblxufVxuXG5wcm90by5pc0Jsb2NrTm9kZSA9IHRydWVcblxucHJvdG8uX3N1cGVyID0gZnVuY3Rpb24oKSB7XG4gIHZhciBibG9ja0NvbnRleHQgPSBCbG9ja0NvbnRleHQuZnJvbSh0aGlzLmNvbnRleHQpXG4gICAgLCBibG9ja1xuICAgICwgc3RyXG5cbiAgaWYoYmxvY2tDb250ZXh0ICYmIChibG9jayA9IGJsb2NrQ29udGV4dC5nZXQodGhpcy5uYW1lKSkpIHtcbiAgICBzdHIgPSBuZXcgU3RyaW5nKGJsb2NrLnJlbmRlcih0aGlzLmNvbnRleHQpKVxuICAgIHN0ci5zYWZlID0gdHJ1ZVxuICAgIHJldHVybiBzdHIgXG4gIH1cblxuICByZXR1cm4gJydcbn1cblxuY29ucy5wYXJzZSA9IGZ1bmN0aW9uKGNvbnRlbnRzLCBwYXJzZXIpIHtcbiAgdmFyIGJpdHMgPSBjb250ZW50cy5zcGxpdCgnICcpXG4gICAgLCBuYW1lID0gYml0c1sxXVxuICAgICwgbG9hZGVkID0gcGFyc2VyLmxvYWRlZEJsb2Nrc1xuICAgICwgbm9kZXNcblxuICBmb3IodmFyIGkgPSAwLCBsZW4gPSBsb2FkZWQubGVuZ3RoOyBpIDwgbGVuOyArK2kpXG4gICAgaWYobG9hZGVkW2ldID09PSBuYW1lKVxuICAgICAgdGhyb3cgbmV3IEVycm9yKCdibG9jayB0YWcgd2l0aCB0aGUgbmFtZSBcIicrbmFtZSsnXCIgYXBwZWFycyBtb3JlIHRoYW4gb25jZScpXG5cbiAgbG9hZGVkLnB1c2gobmFtZSlcblxuICBub2RlcyA9IHBhcnNlci5wYXJzZShbJ2VuZGJsb2NrJ10pXG4gIHBhcnNlci50b2tlbnMuc2hpZnQoKVxuXG4gIHJldHVybiBuZXcgY29ucyhuYW1lLCBub2RlcykgIFxufVxuIiwibW9kdWxlLmV4cG9ydHMgPSBDb21tZW50Tm9kZVxuXG5mdW5jdGlvbiBDb21tZW50Tm9kZSgpIHtcbiAgLy8gbm8tb3AuXG59XG5cbnZhciBjb25zID0gQ29tbWVudE5vZGVcbiAgLCBwcm90byA9IGNvbnMucHJvdG90eXBlXG5cbnByb3RvLnJlbmRlciA9IGZ1bmN0aW9uKGNvbnRleHQpIHtcbiAgcmV0dXJuICcnXG59XG5cbmNvbnMucGFyc2UgPSBmdW5jdGlvbihjb250ZW50cywgcGFyc2VyKSB7XG4gIG5sID0gcGFyc2VyLnBhcnNlKFsnZW5kY29tbWVudCddKVxuICBwYXJzZXIudG9rZW5zLnNoaWZ0KClcblxuICByZXR1cm4gbmV3IGNvbnNcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gRGVidWdOb2RlXG5cbnZhciBQcm9taXNlID0gcmVxdWlyZSgnLi4vcHJvbWlzZScpXG4gICwgQ29udGV4dCA9IHJlcXVpcmUoJy4uL2NvbnRleHQnKVxuICAsIGRlYnVnID0gcmVxdWlyZSgnLi4vZGVidWcnKVxuXG5mdW5jdGlvbiBEZWJ1Z05vZGUodmFybmFtZSkge1xuICB0aGlzLnZhcm5hbWUgPSB2YXJuYW1lXG59XG5cbnZhciBjb25zID0gRGVidWdOb2RlXG4gICwgcHJvdG8gPSBjb25zLnByb3RvdHlwZVxuXG5wcm90by5yZW5kZXIgPSBmdW5jdGlvbihjb250ZXh0LCB2YWx1ZSkge1xuICB2YXIgc2VsZiA9IHRoaXNcbiAgICAsIHRhcmdldCA9IGNvbnRleHRcbiAgICAsIHByb21pc2VcblxuICBpZihzZWxmLnZhcm5hbWUgIT09IG51bGwpIHtcbiAgICB2YWx1ZSA9IGFyZ3VtZW50cy5sZW5ndGggPT09IDIgPyB2YWx1ZSA6IHNlbGYudmFybmFtZS5yZXNvbHZlKGNvbnRleHQpXG4gICAgaWYodmFsdWUgJiYgdmFsdWUuY29uc3RydWN0b3IgPT09IFByb21pc2UpIHtcbiAgICAgIHByb21pc2UgPSBuZXcgUHJvbWlzZVxuICAgICAgdmFsdWUub25jZSgnZG9uZScsIGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgcHJvbWlzZS5yZXNvbHZlKHNlbGYucmVuZGVyKGNvbnRleHQsIGRhdGEpKVxuICAgICAgfSlcbiAgICAgIHJldHVybiBwcm9taXNlXG4gICAgfVxuICAgIHRhcmdldCA9IHZhbHVlXG4gIH1cblxuICBpZih0YXJnZXQgPT09IGNvbnRleHQpIHtcbiAgICB3aGlsZSh0YXJnZXQgIT09IENvbnRleHQucHJvdG90eXBlKSB7XG4gICAgICBkZWJ1Zy5sb2codGFyZ2V0KVxuICAgICAgdGFyZ2V0ID0gT2JqZWN0LmdldFByb3RvdHlwZU9mKHRhcmdldClcbiAgICB9XG4gICAgcmV0dXJuICcnXG4gIH1cbiAgZGVidWcubG9nKHRhcmdldClcbiAgcmV0dXJuICcnXG59XG5cbmNvbnMucGFyc2UgPSBmdW5jdGlvbihjb250ZW50cywgcGFyc2VyKSB7XG4gIHZhciBiaXRzID0gY29udGVudHMuc3BsaXQoJyAnKVxuXG4gIHJldHVybiBuZXcgRGVidWdOb2RlKGJpdHNbMV0gPyBwYXJzZXIuY29tcGlsZShiaXRzWzFdKSA6IG51bGwpXG59XG5cbiIsIm1vZHVsZS5leHBvcnRzID0gRXh0ZW5kc05vZGVcblxudmFyIFByb21pc2UgPSByZXF1aXJlKCcuLi9wcm9taXNlJylcbiAgLCBCbG9ja0NvbnRleHQgPSByZXF1aXJlKCcuLi9ibG9ja19jb250ZXh0JylcblxuXG5mdW5jdGlvbiBFeHRlbmRzTm9kZShwYXJlbnQsIG5vZGVzLCBsb2FkZXIpIHtcbiAgdGhpcy5wYXJlbnQgPSBwYXJlbnRcbiAgdGhpcy5sb2FkZXIgPSBsb2FkZXJcblxuICB0aGlzLmJsb2NrcyA9IHt9XG5cbiAgZm9yKHZhciBpID0gMCwgbGVuID0gbm9kZXMubm9kZXMubGVuZ3RoOyBpIDwgbGVuOyArK2kpIHtcbiAgICBpZighbm9kZXMubm9kZXNbaV0uaXNCbG9ja05vZGUpXG4gICAgICBjb250aW51ZVxuXG4gICAgdGhpcy5ibG9ja3Nbbm9kZXMubm9kZXNbaV0ubmFtZV0gPSBub2Rlcy5ub2Rlc1tpXVxuICB9XG59XG5cbnZhciBjb25zID0gRXh0ZW5kc05vZGVcbiAgLCBwcm90byA9IGNvbnMucHJvdG90eXBlXG5cbnByb3RvLmlzRXh0ZW5kc05vZGUgPSB0cnVlXG5cbnByb3RvLnJlbmRlciA9IGZ1bmN0aW9uKGNvbnRleHQsIHBhcmVudCkge1xuICB2YXIgc2VsZiA9IHRoaXNcbiAgICAsIHByb21pc2VcblxuICBwYXJlbnQgPSBwYXJlbnQgfHwgdGhpcy5wYXJlbnQucmVzb2x2ZShjb250ZXh0KVxuXG4gIGlmKHBhcmVudC5jb25zdHJ1Y3RvciA9PT0gUHJvbWlzZSkge1xuICAgIHByb21pc2UgPSBuZXcgUHJvbWlzZVxuXG4gICAgcGFyZW50Lm9uY2UoJ2RvbmUnLCBmdW5jdGlvbihkYXRhKSB7XG4gICAgICBwcm9taXNlLnJlc29sdmUoc2VsZi5yZW5kZXIoY29udGV4dCwgZGF0YSkpXG4gICAgfSlcblxuICAgIHJldHVybiBwcm9taXNlXG4gIH1cblxuICBwYXJlbnQgPSBzZWxmLmdldF90ZW1wbGF0ZShwYXJlbnQpXG5cbiAgaWYocGFyZW50LmNvbnN0cnVjdG9yID09PSBQcm9taXNlKSB7XG4gICAgcHJvbWlzZSA9IG5ldyBQcm9taXNlXG5cbiAgICBwYXJlbnQub25jZSgnZG9uZScsIGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgIHByb21pc2UucmVzb2x2ZShzZWxmLnJlbmRlcihjb250ZXh0LCBkYXRhKSlcbiAgICB9KSAgXG5cbiAgICByZXR1cm4gcHJvbWlzZVxuICB9XG5cbiAgdmFyIGJsb2NrQ29udGV4dCA9IEJsb2NrQ29udGV4dC5mcm9tKGNvbnRleHQpIHx8IEJsb2NrQ29udGV4dC5pbnRvKGNvbnRleHQpXG4gICAgLCBibG9ja3MgPSB7fVxuICAgICwgbm9kZUxpc3QgPSBwYXJlbnQuZ2V0Tm9kZUxpc3QoKVxuICAgICwgZXh0ZW5kc0lEWCA9IGZhbHNlXG5cbiAgYmxvY2tDb250ZXh0LmFkZChzZWxmLmJsb2NrcylcblxuICBmb3IodmFyIGkgPSAwLCBsZW4gPSBub2RlTGlzdC5ub2Rlcy5sZW5ndGg7IGkgPCBsZW47ICsraSkge1xuICAgIGlmKG5vZGVMaXN0Lm5vZGVzW2ldLmlzRXh0ZW5kc05vZGUpIHtcbiAgICAgIGV4dGVuZHNJRFggPSB0cnVlXG4gICAgICBicmVha1xuICAgIH1cblxuICAgIGlmKG5vZGVMaXN0Lm5vZGVzW2ldLmlzQmxvY2tOb2RlKSB7XG4gICAgICBibG9ja3Nbbm9kZUxpc3Qubm9kZXNbaV0ubmFtZV0gPSBub2RlTGlzdC5ub2Rlc1tpXVxuICAgIH1cbiAgfVxuXG4gIGlmKCFleHRlbmRzSURYKSB7XG4gICAgYmxvY2tDb250ZXh0LmFkZChibG9ja3MpXG4gIH1cblxuICBwcm9taXNlID0gbmV3IFByb21pc2VcblxuICBwYXJlbnQucmVuZGVyKGNvbnRleHQsIGZ1bmN0aW9uKGVyciwgZGF0YSkge1xuICAgIHByb21pc2UucmVzb2x2ZShkYXRhKVxuICB9KVxuXG4gIHJldHVybiBwcm9taXNlXG59XG5cbnByb3RvLmdldF90ZW1wbGF0ZSA9IGZ1bmN0aW9uKHBhcmVudCkge1xuICBpZih0eXBlb2YgcGFyZW50ICE9PSAnc3RyaW5nJykge1xuICAgIHJldHVybiBwYXJlbnRcbiAgfVxuXG4gIHJldHVybiB0aGlzLmxvYWRlcihwYXJlbnQpXG59XG5cbmNvbnMucGFyc2UgPSBmdW5jdGlvbihjb250ZW50cywgcGFyc2VyKSB7XG4gIHZhciBiaXRzID0gY29udGVudHMuc3BsaXQoJyAnKVxuICAgICwgcGFyZW50ID0gcGFyc2VyLmNvbXBpbGUoYml0cy5zbGljZSgxKS5qb2luKCcgJykpXG4gICAgLCBub2RlcyA9IHBhcnNlci5wYXJzZSgpXG4gICAgLCBsb2FkZXIgPSBwYXJzZXIucGx1Z2lucy5sb29rdXAoJ2xvYWRlcicpXG5cbiAgcmV0dXJuIG5ldyBjb25zKHBhcmVudCwgbm9kZXMsIGxvYWRlcilcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gRm9yTm9kZVxuXG52YXIgTm9kZUxpc3QgPSByZXF1aXJlKCcuLi9ub2RlX2xpc3QnKVxuICAsIFByb21pc2UgPSByZXF1aXJlKCcuLi9wcm9taXNlJylcblxuZnVuY3Rpb24gRm9yTm9kZSh0YXJnZXQsIHVucGFjaywgbG9vcCwgZW1wdHksIHJldmVyc2VkKSB7XG4gIHRoaXMudGFyZ2V0ID0gdGFyZ2V0XG4gIHRoaXMudW5wYWNrID0gdW5wYWNrXG4gIHRoaXMubG9vcCA9IGxvb3BcbiAgdGhpcy5lbXB0eSA9IGVtcHR5XG4gIHRoaXMucmV2ZXJzZWQgPSByZXZlcnNlZFxufVxuXG52YXIgY29ucyA9IEZvck5vZGVcbiAgLCBwcm90byA9IGNvbnMucHJvdG90eXBlXG5cbmZ1bmN0aW9uIGdldEluSW5kZXgoYml0cykge1xuICBmb3IodmFyIGkgPSAwLCBsZW4gPSBiaXRzLmxlbmd0aDsgaSA8IGxlbjsgKytpKVxuICAgIGlmKGJpdHNbaV0gPT09ICdpbicpXG4gICAgICByZXR1cm4gaVxuXG4gIHJldHVybiAtMSBcbn1cblxucHJvdG8ucmVuZGVyID0gZnVuY3Rpb24oY29udGV4dCwgdmFsdWUpIHtcbiAgdmFyIHNlbGYgPSB0aGlzXG4gICAgLCBhcnIgPSB2YWx1ZSB8fCBzZWxmLnRhcmdldC5yZXNvbHZlKGNvbnRleHQpXG4gICAgLCBwcm9taXNlXG5cblxuICBpZihhcnIgJiYgYXJyLmNvbnN0cnVjdG9yID09PSBQcm9taXNlKSB7XG4gICAgcHJvbWlzZSA9IG5ldyBQcm9taXNlXG4gICAgYXJyLm9uY2UoJ2RvbmUnLCBmdW5jdGlvbihkYXRhKSB7XG4gICAgICBwcm9taXNlLnJlc29sdmUoc2VsZi5yZW5kZXIoY29udGV4dCwgZGF0YSkpXG4gICAgfSlcblxuICAgIHJldHVybiBwcm9taXNlXG4gIH1cblxuICBpZihhcnIgPT09IHVuZGVmaW5lZCB8fCBhcnIgPT09IG51bGwpIHtcbiAgICBhcnIgPSBbXVxuICB9XG5cbiAgdmFyIGJpdHMgPSBbXVxuICAgICwgcHJvbWlzZXMgPSBbXVxuICAgICwgcGFyZW50ID0gY29udGV4dC5mb3Jsb29wXG4gICAgLCBsb29wID0ge31cbiAgICAsIHJlc3VsdFxuICAgICwgY3R4dFxuICAgICwgc3ViXG5cbiAgaWYoISgnbGVuZ3RoJyBpbiBhcnIpKSB7XG4gICAgZm9yKHZhciBrZXkgaW4gYXJyKSBpZihhcnIuaGFzT3duUHJvcGVydHkoa2V5KSkge1xuICAgICAgYml0cy5wdXNoKGtleSlcbiAgICB9XG5cbiAgICBhcnIgPSBiaXRzLnNsaWNlKClcbiAgICBiaXRzLmxlbmd0aCA9IDBcbiAgfVxuXG4gIGlmKCFhcnIubGVuZ3RoKSB7XG4gICAgcmV0dXJuIHNlbGYuZW1wdHkucmVuZGVyKGNvbnRleHQpXG4gIH1cblxuICBzdWIgPSBzZWxmLnJldmVyc2VkID8gYXJyLmxlbmd0aCAtIDEgOiAwXG5cbiAgZm9yKHZhciBpID0gMCwgbGVuID0gYXJyLmxlbmd0aCwgaWR4OyBpIDwgbGVuOyArK2kpIHtcbiAgICBjdHh0ID0gY29udGV4dC5jb3B5KClcbiAgICBpZHggPSBNYXRoLmFicyhzdWIgLSBpKVxuICAgIGxvb3AuY291bnRlciA9IGkgKyAxXG4gICAgbG9vcC5jb3VudGVyMCA9IGlcbiAgICBsb29wLnJldmNvdW50ZXIgPSBsZW4gLSBpXG4gICAgbG9vcC5yZXZjb3VudGVyMCA9IGxlbiAtIChpICsgMSlcbiAgICBsb29wLmZpcnN0ID0gaSA9PT0gMFxuICAgIGxvb3AubGFzdCA9IGkgPT09IGxlbiAtIDFcbiAgICBsb29wLnBhcmVudGxvb3AgPSBwYXJlbnQgXG4gICAgY3R4dC5mb3Jsb29wID0gbG9vcFxuXG4gICAgaWYoc2VsZi51bnBhY2subGVuZ3RoID09PSAxKVxuICAgICAgY3R4dFtzZWxmLnVucGFja1swXV0gPSBhcnJbaWR4XVxuICAgIGVsc2UgZm9yKHZhciB1ID0gMDsgdSA8IHNlbGYudW5wYWNrLmxlbmd0aDsgKyt1KVxuICAgICAgY3R4dFtzZWxmLnVucGFja1t1XV0gPSBhcnJbaWR4XVt1XVxuXG4gICAgcmVzdWx0ID0gc2VsZi5sb29wLnJlbmRlcihjdHh0KVxuICAgIGlmKHJlc3VsdC5jb25zdHJ1Y3RvciA9PT0gUHJvbWlzZSlcbiAgICAgIHByb21pc2VzLnB1c2gocmVzdWx0KVxuICAgICBcbiAgICBiaXRzLnB1c2gocmVzdWx0KSBcbiAgfVxuXG4gIGlmKHByb21pc2VzLmxlbmd0aCkge1xuICAgIHJldHVybiBzZWxmLmxvb3AucmVzb2x2ZVByb21pc2VzKGJpdHMsIHByb21pc2VzKVxuICB9XG5cbiAgcmV0dXJuIGJpdHMuam9pbignJylcbn1cblxuY29ucy5wYXJzZSA9IGZ1bmN0aW9uKGNvbnRlbnRzLCBwYXJzZXIpIHtcbiAgdmFyIGJpdHMgPSBjb250ZW50cy5zcGxpdCgvXFxzKy8pXG4gICAgLCByZXZlcnNlZCA9IGJpdHNbYml0cy5sZW5ndGgtMV0gPT09ICdyZXZlcnNlZCdcbiAgICAsIGlkeEluID0gZ2V0SW5JbmRleChiaXRzKVxuICAgICwgdmFyaWFibGVzID0gYml0cy5zbGljZSgxLCBpZHhJbilcbiAgICAsIHRhcmdldCA9IHBhcnNlci5jb21waWxlKGJpdHNbaWR4SW4rMV0pXG4gICAgLCBub2RlbGlzdCA9IHBhcnNlci5wYXJzZShbJ2VtcHR5JywgJ2VuZGZvciddKVxuICAgICwgdW5wYWNrID0gW11cbiAgICAsIGVtcHR5XG5cblxuICBpZihwYXJzZXIudG9rZW5zLnNoaWZ0KCkuaXMoWydlbXB0eSddKSkge1xuICAgIGVtcHR5ID0gcGFyc2VyLnBhcnNlKFsnZW5kZm9yJ10pXG4gICAgcGFyc2VyLnRva2Vucy5zaGlmdCgpXG4gIH0gZWxzZSB7XG4gICAgZW1wdHkgPSBuZXcgTm9kZUxpc3QoW10pXG4gIH1cblxuICB2YXJpYWJsZXMgPSB2YXJpYWJsZXMuam9pbignICcpLnNwbGl0KCcsJylcbiAgZm9yKHZhciBpID0gMCwgbGVuID0gdmFyaWFibGVzLmxlbmd0aDsgaSA8IGxlbjsgKytpKSB7XG4gICAgdmFyaWFibGVzW2ldID0gdmFyaWFibGVzW2ldLnJlcGxhY2UoLyheXFxzK3xcXHMrJCkvLCAnJylcbiAgICBpZih2YXJpYWJsZXNbaV0pXG4gICAgICB1bnBhY2sucHVzaCh2YXJpYWJsZXNbaV0pXG4gIH1cblxuICByZXR1cm4gbmV3IGNvbnModGFyZ2V0LCB1bnBhY2ssIG5vZGVsaXN0LCBlbXB0eSwgcmV2ZXJzZWQpO1xufVxuIiwibW9kdWxlLmV4cG9ydHMgPSBFbmRUb2tlblxuXG5mdW5jdGlvbiBFbmRUb2tlbigpIHtcbiAgdGhpcy5sYnAgPSAwXG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IEluZml4T3BlcmF0b3JcblxudmFyIFByb21pc2UgPSByZXF1aXJlKCcuLi8uLi9wcm9taXNlJylcblxuZnVuY3Rpb24gSW5maXhPcGVyYXRvcihicCwgY21wKSB7XG4gIHRoaXMubGJwID0gYnBcbiAgdGhpcy5jbXAgPSBjbXBcblxuICB0aGlzLmZpcnN0ID0gXG4gIHRoaXMuc2Vjb25kID0gbnVsbFxufSBcblxudmFyIGNvbnMgPSBJbmZpeE9wZXJhdG9yXG4gICwgcHJvdG8gPSBjb25zLnByb3RvdHlwZVxuXG5wcm90by5udWQgPSBmdW5jdGlvbihwYXJzZXIpIHtcbiAgdGhyb3cgbmV3IEVycm9yKFwiVW5leHBlY3RlZCB0b2tlblwiKVxufVxuXG5wcm90by5sZWQgPSBmdW5jdGlvbihsaHMsIHBhcnNlcikge1xuICB0aGlzLmZpcnN0ID0gbGhzXG4gIHRoaXMuc2Vjb25kID0gcGFyc2VyLmV4cHJlc3Npb24odGhpcy5sYnApXG4gIHJldHVybiB0aGlzXG59XG5cbnByb3RvLmV2YWx1YXRlID0gZnVuY3Rpb24oY29udGV4dCwgZmlyc3QsIHNlY29uZCwgc2VudEZpcnN0LCBzZW50U2Vjb25kKSB7XG4gIHZhciBzZWxmID0gdGhpc1xuICAgICwgcHJvbWlzZVxuXG4gIGZpcnN0ID0gc2VudEZpcnN0ID8gZmlyc3QgOiBzZWxmLmZpcnN0LmV2YWx1YXRlKGNvbnRleHQpXG5cbiAgaWYoZmlyc3QgJiYgZmlyc3QuY29uc3RydWN0b3IgPT09IFByb21pc2UpIHtcbiAgICBwcm9taXNlID0gbmV3IFByb21pc2VcblxuICAgIGZpcnN0Lm9uY2UoJ2RvbmUnLCBmdW5jdGlvbihkYXRhKSB7XG4gICAgICBwcm9taXNlLnJlc29sdmUoc2VsZi5ldmFsdWF0ZShjb250ZXh0LCBkYXRhLCBudWxsLCB0cnVlLCBmYWxzZSkpXG4gICAgfSlcblxuICAgIHJldHVybiBwcm9taXNlXG4gIH1cblxuICBzZWNvbmQgPSBzZW50U2Vjb25kID8gc2Vjb25kIDogc2VsZi5zZWNvbmQuZXZhbHVhdGUoY29udGV4dClcblxuICBpZihzZWNvbmQgJiYgc2Vjb25kLmNvbnN0cnVjdG9yID09PSBQcm9taXNlKSB7XG4gICAgcHJvbWlzZSA9IG5ldyBQcm9taXNlXG5cbiAgICBzZWNvbmQub25jZSgnZG9uZScsIGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgIHByb21pc2UucmVzb2x2ZShzZWxmLmV2YWx1YXRlKGNvbnRleHQsIGZpcnN0LCBkYXRhLCB0cnVlLCB0cnVlKSlcbiAgICB9KVxuXG4gICAgcmV0dXJuIHByb21pc2VcbiAgfVxuXG4gIHJldHVybiBzZWxmLmNtcChmaXJzdCwgc2Vjb25kKVxufVxuXG4iLCJtb2R1bGUuZXhwb3J0cyA9IExpdGVyYWxUb2tlblxuXG5mdW5jdGlvbiBMaXRlcmFsVG9rZW4odmFsdWUsIG9yaWdpbmFsKSB7XG4gIHRoaXMubGJwID0gMFxuICB0aGlzLnZhbHVlID0gdmFsdWVcbn1cblxudmFyIGNvbnMgPSBMaXRlcmFsVG9rZW5cbiAgLCBwcm90byA9IGNvbnMucHJvdG90eXBlXG5cbnByb3RvLm51ZCA9IGZ1bmN0aW9uKHBhcnNlcikge1xuICByZXR1cm4gdGhpc1xufVxuXG5wcm90by5sZWQgPSBmdW5jdGlvbigpIHtcbiAgdGhyb3cgbmV3IEVycm9yKClcbn1cblxucHJvdG8uZXZhbHVhdGUgPSBmdW5jdGlvbihjb250ZXh0KSB7XG4gIGlmKCF0aGlzLnZhbHVlKVxuICAgIHJldHVybiB0aGlzLnZhbHVlXG5cbiAgaWYoIXRoaXMudmFsdWUucmVzb2x2ZSlcbiAgICByZXR1cm4gdGhpcy52YWx1ZVxuXG4gIHJldHVybiB0aGlzLnZhbHVlLnJlc29sdmUoY29udGV4dClcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gSWZOb2RlXG5cbnZhciBQcm9taXNlID0gcmVxdWlyZSgnLi4vLi4vcHJvbWlzZScpXG4gICwgTm9kZUxpc3QgPSByZXF1aXJlKCcuLi8uLi9ub2RlX2xpc3QnKVxuICAsIFBhcnNlciA9IHJlcXVpcmUoJy4vcGFyc2VyJylcblxuZnVuY3Rpb24gSWZOb2RlKHByZWRpY2F0ZSwgd2hlbl90cnVlLCB3aGVuX2ZhbHNlKSB7XG4gIHRoaXMucHJlZGljYXRlID0gcHJlZGljYXRlXG4gIHRoaXMud2hlbl90cnVlID0gd2hlbl90cnVlXG4gIHRoaXMud2hlbl9mYWxzZSA9IHdoZW5fZmFsc2Vcbn1cblxudmFyIGNvbnMgPSBJZk5vZGVcbiAgLCBwcm90byA9IGNvbnMucHJvdG90eXBlXG5cbnByb3RvLnJlbmRlciA9IGZ1bmN0aW9uKGNvbnRleHQsIHJlc3VsdCwgdGltZXMpIHtcbiAgdmFyIHNlbGYgPSB0aGlzXG4gICAgLCBwcm9taXNlXG5cbiAgcmVzdWx0ID0gdGltZXMgPT09IDEgPyByZXN1bHQgOiB0aGlzLnByZWRpY2F0ZS5ldmFsdWF0ZShjb250ZXh0KVxuXG4gIGlmKHJlc3VsdCAmJiByZXN1bHQuY29uc3RydWN0b3IgPT09IFByb21pc2UpIHtcbiAgICBwcm9taXNlID0gbmV3IFByb21pc2VcblxuICAgIHJlc3VsdC5vbmNlKCdkb25lJywgZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgIHByb21pc2UucmVzb2x2ZShzZWxmLnJlbmRlcihjb250ZXh0LCB2YWx1ZSwgMSkpXG4gICAgfSlcblxuICAgIHJldHVybiBwcm9taXNlXG4gIH1cblxuICBpZihyZXN1bHQpIHtcbiAgICByZXR1cm4gdGhpcy53aGVuX3RydWUucmVuZGVyKGNvbnRleHQpXG4gIH1cbiAgcmV0dXJuIHRoaXMud2hlbl9mYWxzZS5yZW5kZXIoY29udGV4dClcbn1cblxuY29ucy5wYXJzZSA9IGZ1bmN0aW9uKGNvbnRlbnRzLCBwYXJzZXIpIHtcbiAgdmFyIGJpdHMgPSBjb250ZW50cy5zcGxpdCgnICcpLnNsaWNlKDEpXG4gICAgLCBpZnAgPSBuZXcgUGFyc2VyKGJpdHMsIHBhcnNlcilcbiAgICAsIHByZWRpY2F0ZVxuICAgICwgd2hlbl90cnVlXG4gICAgLCB3aGVuX2ZhbHNlXG4gICAgLCBuZXh0XG5cbiAgcHJlZGljYXRlID0gaWZwLnBhcnNlKClcblxuICB3aGVuX3RydWUgPSBwYXJzZXIucGFyc2UoWydlbHNlJywgJ2VsaWYnLCAnZW5kaWYnXSlcblxuICBuZXh0ID0gcGFyc2VyLnRva2Vucy5zaGlmdCgpXG5cbiAgaWYobmV4dC5pcyhbJ2VuZGlmJ10pKSB7XG4gICAgd2hlbl9mYWxzZSA9IG5ldyBOb2RlTGlzdChbXSlcbiAgfSBlbHNlIGlmKG5leHQuaXMoWydlbGlmJ10pKSB7XG4gICAgd2hlbl9mYWxzZSA9IGNvbnMucGFyc2UobmV4dC5jb250ZW50LCBwYXJzZXIpXG4gIH0gZWxzZSB7XG4gICAgd2hlbl9mYWxzZSA9IHBhcnNlci5wYXJzZShbJ2VuZGlmJ10pXG4gICAgcGFyc2VyLnRva2Vucy5zaGlmdCgpXG4gIH1cblxuICByZXR1cm4gbmV3IGNvbnMocHJlZGljYXRlLCB3aGVuX3RydWUsIHdoZW5fZmFsc2UpXG59XG4iLCJ2YXIgSW5maXhPcGVyYXRvciA9IHJlcXVpcmUoJy4vaW5maXgnKVxuICAsIFByZWZpeE9wZXJhdG9yID0gcmVxdWlyZSgnLi9wcmVmaXgnKVxuXG52YXIga2V5c1xuXG5rZXlzID0gT2JqZWN0LmtleXMgfHwga2V5c2hpbVxuXG5mdW5jdGlvbiBrZXlzaGltKG9iaikge1xuICB2YXIgYWNjdW0gPSBbXVxuXG4gIGZvcih2YXIgbiBpbiBvYmopIGlmKG9iai5oYXNPd25Qcm9wZXJ0eShuKSkge1xuICAgIGFjY3VtLnB1c2gobilcbiAgfVxuXG4gIHJldHVybiBhY2N1bVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICAnb3InOiBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBuZXcgSW5maXhPcGVyYXRvcig2LCBmdW5jdGlvbih4LCB5KSB7XG4gICAgICAgICAgcmV0dXJuIHggfHwgeVxuICAgICAgfSlcbiAgICB9XG5cbiAgLCAnYW5kJzogZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gbmV3IEluZml4T3BlcmF0b3IoNywgZnVuY3Rpb24oeCwgeSkge1xuICAgICAgICAgIHJldHVybiB4ICYmIHlcbiAgICAgIH0pXG4gICAgfVxuXG4gICwgJ25vdCc6IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIG5ldyBQcmVmaXhPcGVyYXRvcig4LCBmdW5jdGlvbih4KSB7XG4gICAgICAgIHJldHVybiAheFxuICAgICAgfSlcbiAgICB9XG5cbiAgLCAnaW4nOiBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBuZXcgSW5maXhPcGVyYXRvcig5LCBpbl9vcGVyYXRvcilcbiAgICB9XG5cbiAgLCAnbm90IGluJzogZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIG5ldyBJbmZpeE9wZXJhdG9yKDksIGZ1bmN0aW9uKHgsIHkpIHtcbiAgICAgIHJldHVybiAhaW5fb3BlcmF0b3IoeCx5KVxuICAgIH0pXG4gIH1cblxuICAsICc9JzogZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIG5ldyBJbmZpeE9wZXJhdG9yKDEwLCBmdW5jdGlvbih4LCB5KSB7IFxuICAgICAgcmV0dXJuIHggPT0geVxuICAgIH0pXG4gIH1cblxuICAsICc9PSc6IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIG5ldyBJbmZpeE9wZXJhdG9yKDEwLCBmdW5jdGlvbih4LCB5KSB7IFxuICAgICAgICByZXR1cm4geCA9PSB5XG4gICAgICB9KVxuICAgIH1cblxuICAsICchPSc6IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIG5ldyBJbmZpeE9wZXJhdG9yKDEwLCBmdW5jdGlvbih4LCB5KSB7IFxuICAgICAgICByZXR1cm4geCAhPT0geVxuICAgICAgfSlcbiAgICB9XG5cbiAgLCAnPic6IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIG5ldyBJbmZpeE9wZXJhdG9yKDEwLCBmdW5jdGlvbih4LCB5KSB7IFxuICAgICAgICByZXR1cm4geCA+IHlcbiAgICAgIH0pXG4gICAgfVxuXG4gICwgJz49JzogZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gbmV3IEluZml4T3BlcmF0b3IoMTAsIGZ1bmN0aW9uKHgsIHkpIHsgXG4gICAgICAgIHJldHVybiB4ID49IHlcbiAgICAgIH0pXG4gICAgfVxuXG4gICwgJzwnOiBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBuZXcgSW5maXhPcGVyYXRvcigxMCwgZnVuY3Rpb24oeCwgeSkgeyBcbiAgICAgICAgcmV0dXJuIHggPCB5XG4gICAgICB9KVxuICAgIH1cblxuICAsICc8PSc6IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIG5ldyBJbmZpeE9wZXJhdG9yKDEwLCBmdW5jdGlvbih4LCB5KSB7IFxuICAgICAgICByZXR1cm4geCA8PSB5XG4gICAgICB9KVxuICAgIH1cbn1cblxuZnVuY3Rpb24gaW5fb3BlcmF0b3IoeCwgeSkge1xuICBpZighKHggaW5zdGFuY2VvZiBPYmplY3QpICYmIHkgaW5zdGFuY2VvZiBPYmplY3QpIHtcbiAgICBpZighKHkgJiYgJ2xlbmd0aCcgaW4geSkpIHtcbiAgICAgIHkgPSBrZXlzKHkpXG4gICAgfVxuICB9XG5cbiAgaWYodHlwZW9mKHgpID09ICdzdHJpbmcnICYmIHR5cGVvZih5KSA9PSdzdHJpbmcnKSB7XG4gICAgcmV0dXJuIHkuaW5kZXhPZih4KSAhPT0gLTFcbiAgfVxuXG4gIGlmKHggPT09IHVuZGVmaW5lZCB8fCB4ID09PSBudWxsKVxuICAgIHJldHVybiBmYWxzZVxuXG4gIGlmKHkgPT09IHVuZGVmaW5lZCB8fCB5ID09PSBudWxsKVxuICAgIHJldHVybiBmYWxzZVxuXG4gIGZvcih2YXIgZm91bmQgPSBmYWxzZSwgaSA9IDAsIGxlbiA9IHkubGVuZ3RoOyBpIDwgbGVuICYmICFmb3VuZDsgKytpKSB7XG4gICAgdmFyIHJocyA9IHlbaV1cbiAgICBpZih4IGluc3RhbmNlb2YgQXJyYXkpIHtcbiAgICAgIGZvcih2YXIgaWR4ID0gMCxcbiAgICAgICAgZXF1YWwgPSB4Lmxlbmd0aCA9PSByaHMubGVuZ3RoLFxuICAgICAgICB4bGVuID0geC5sZW5ndGg7XG4gICAgICAgIGlkeCA8IHhsZW4gJiYgZXF1YWw7ICsraWR4KSB7XG5cbiAgICAgICAgZXF1YWwgPSAoeFtpZHhdID09PSByaHNbaWR4XSlcbiAgICAgIH1cbiAgICAgIGZvdW5kID0gZXF1YWxcblxuICAgIH0gZWxzZSBpZih4IGluc3RhbmNlb2YgT2JqZWN0KSB7XG4gICAgICBpZih4ID09PSByaHMpIHtcbiAgICAgICAgcmV0dXJuIHRydWVcbiAgICAgIH1cbiAgICAgIHZhciB4a2V5cyA9IGtleXMoeCksXG4gICAgICAgIHJrZXlzID0ga2V5cyhyaHMpXG5cbiAgICAgIGlmKHhrZXlzLmxlbmd0aCA9PT0gcmtleXMubGVuZ3RoKSB7IFxuICAgICAgICBmb3IodmFyIGkgPSAwLCBsZW4gPSB4a2V5cy5sZW5ndGgsIGVxdWFsID0gdHJ1ZTtcbiAgICAgICAgICBpIDwgbGVuICYmIGVxdWFsO1xuICAgICAgICAgICsraSkge1xuICAgICAgICAgIGVxdWFsID0geGtleXNbaV0gPT09IHJrZXlzW2ldICYmXG4gICAgICAgICAgICAgIHhbeGtleXNbaV1dID09PSByaHNbcmtleXNbaV1dXG4gICAgICAgIH1cbiAgICAgICAgZm91bmQgPSBlcXVhbFxuICAgICAgfSBcbiAgICB9IGVsc2Uge1xuICAgICAgZm91bmQgPSB4ID09IHJoc1xuICAgIH1cbiAgfVxuICByZXR1cm4gZm91bmRcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gSWZQYXJzZXJcblxudmFyIExpdGVyYWxUb2tlbiA9IHJlcXVpcmUoJy4vbGl0ZXJhbCcpXG4gICwgRW5kVG9rZW4gPSByZXF1aXJlKCcuL2VuZCcpXG4gICwgb3BlcmF0b3JzID0gcmVxdWlyZSgnLi9vcGVyYXRvcnMnKVxuXG5mdW5jdGlvbiBJZlBhcnNlcih0b2tlbnMsIHBhcnNlcikge1xuICB0aGlzLmNyZWF0ZVZhcmlhYmxlID0gZnVuY3Rpb24odG9rZW4pIHtcbiAgICByZXR1cm4gbmV3IExpdGVyYWxUb2tlbihwYXJzZXIuY29tcGlsZSh0b2tlbiksIHRva2VuKVxuICB9XG5cbiAgdmFyIGxlbiA9IHRva2Vucy5sZW5ndGhcbiAgICAsIGkgPSAwXG4gICAgLCBtYXBwZWRUb2tlbnMgPSBbXVxuICAgICwgdG9rZW5cblxuICB3aGlsZShpIDwgbGVuKSB7XG4gICAgdG9rZW4gPSB0b2tlbnNbaV1cbiAgICBpZih0b2tlbiA9PSAnbm90JyAmJiB0b2tlbnNbaSsxXSA9PSAnaW4nKSB7XG4gICAgICArK2lcbiAgICAgIHRva2VuID0gJ25vdCBpbidcbiAgICB9XG4gICAgbWFwcGVkVG9rZW5zLnB1c2godGhpcy50cmFuc2xhdGVUb2tlbih0b2tlbikpXG4gICAgKytpXG4gIH1cblxuICB0aGlzLnBvcyA9IDBcbiAgdGhpcy50b2tlbnMgPSBtYXBwZWRUb2tlbnNcbiAgdGhpcy5jdXJyZW50VG9rZW4gPSB0aGlzLm5leHQoKVxufVxuXG52YXIgY29ucyA9IElmUGFyc2VyXG4gICwgcHJvdG8gPSBjb25zLnByb3RvdHlwZVxuXG5wcm90by50cmFuc2xhdGVUb2tlbiA9IGZ1bmN0aW9uKHRva2VuKSB7XG4gIHZhciBvcCA9IG9wZXJhdG9yc1t0b2tlbl1cblxuICBpZihvcCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgcmV0dXJuIHRoaXMuY3JlYXRlVmFyaWFibGUodG9rZW4pXG4gIH1cblxuICByZXR1cm4gb3AoKVxufVxuXG5wcm90by5uZXh0ID0gZnVuY3Rpb24oKSB7XG4gIGlmKHRoaXMucG9zID49IHRoaXMudG9rZW5zLmxlbmd0aCkge1xuICAgIHJldHVybiBuZXcgRW5kVG9rZW4oKVxuICB9XG4gIHJldHVybiB0aGlzLnRva2Vuc1t0aGlzLnBvcysrXVxufVxuXG5wcm90by5wYXJzZSA9IGZ1bmN0aW9uKCkge1xuICB2YXIgcmV0dmFsID0gdGhpcy5leHByZXNzaW9uKClcblxuICBpZighKHRoaXMuY3VycmVudFRva2VuLmNvbnN0cnVjdG9yID09PSBFbmRUb2tlbikpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJVbnVzZWQgXCIrdGhpcy5jdXJyZW50VG9rZW4rXCIgYXQgZW5kIG9mIGlmIGV4cHJlc3Npb24uXCIpXG4gIH1cblxuICByZXR1cm4gcmV0dmFsXG59XG5cbnByb3RvLmV4cHJlc3Npb24gPSBmdW5jdGlvbihyYnApIHtcbiAgcmJwID0gcmJwIHx8IDBcblxuICB2YXIgdCA9IHRoaXMuY3VycmVudFRva2VuXG4gICAgLCBsZWZ0XG5cbiAgdGhpcy5jdXJyZW50VG9rZW4gPSB0aGlzLm5leHQoKVxuXG4gIGxlZnQgPSB0Lm51ZCh0aGlzKVxuICB3aGlsZShyYnAgPCB0aGlzLmN1cnJlbnRUb2tlbi5sYnApIHtcbiAgICB0ID0gdGhpcy5jdXJyZW50VG9rZW5cblxuICAgIHRoaXMuY3VycmVudFRva2VuID0gdGhpcy5uZXh0KClcblxuICAgIGxlZnQgPSB0LmxlZChsZWZ0LCB0aGlzKVxuICB9XG5cbiAgcmV0dXJuIGxlZnRcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gUHJlZml4T3BlcmF0b3JcblxudmFyIFByb21pc2UgPSByZXF1aXJlKCcuLi8uLi9wcm9taXNlJylcblxuZnVuY3Rpb24gUHJlZml4T3BlcmF0b3IoYnAsIGNtcCkge1xuICB0aGlzLmxicCA9IGJwXG4gIHRoaXMuY21wID0gY21wXG5cbiAgdGhpcy5maXJzdCA9IFxuICB0aGlzLnNlY29uZCA9IG51bGxcbn1cblxudmFyIGNvbnMgPSBQcmVmaXhPcGVyYXRvclxuICAsIHByb3RvID0gY29ucy5wcm90b3R5cGVcblxucHJvdG8ubnVkID0gZnVuY3Rpb24ocGFyc2VyKSB7XG4gIHRoaXMuZmlyc3QgPSBwYXJzZXIuZXhwcmVzc2lvbih0aGlzLmxicClcbiAgdGhpcy5zZWNvbmQgPSBudWxsXG4gIHJldHVybiB0aGlzXG59XG5cbnByb3RvLmxlZCA9IGZ1bmN0aW9uKGZpcnN0LCBwYXJzZXIpIHtcbiAgdGhyb3cgbmV3IEVycm9yKFwiVW5leHBlY3RlZCB0b2tlblwiKVxufVxuXG5wcm90by5ldmFsdWF0ZSA9IGZ1bmN0aW9uKGNvbnRleHQsIGZpcnN0LCB0aW1lcykge1xuICB2YXIgc2VsZiA9IHRoaXNcbiAgICAsIHByb21pc2VcblxuICBmaXJzdCA9IHRpbWVzID09PSAxID8gZmlyc3QgOiBzZWxmLmZpcnN0LmV2YWx1YXRlKGNvbnRleHQpXG5cbiAgaWYoZmlyc3QgJiYgZmlyc3QuY29uc3RydWN0b3IgPT09IFByb21pc2UpIHtcbiAgICBwcm9taXNlID0gbmV3IFByb21pc2VcblxuICAgIGZpcnN0Lm9uY2UoJ2RvbmUnLCBmdW5jdGlvbihkYXRhKSB7XG4gICAgICBwcm9taXNlLnJlc29sdmUoc2VsZi5ldmFsdWF0ZShjb250ZXh0LCBkYXRhLCAxKSlcbiAgICB9KVxuXG4gICAgcmV0dXJuIHByb21pc2VcbiAgfVxuXG4gIHJldHVybiBzZWxmLmNtcChmaXJzdClcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gSW5jbHVkZU5vZGVcblxudmFyIFByb21pc2UgPSByZXF1aXJlKCcuLi9wcm9taXNlJylcblxuZnVuY3Rpb24gSW5jbHVkZU5vZGUodGFyZ2V0X3ZhciwgbG9hZGVyKSB7XG4gIHRoaXMudGFyZ2V0X3ZhciA9IHRhcmdldF92YXJcbiAgdGhpcy5sb2FkZXIgPSBsb2FkZXJcbn1cblxudmFyIGNvbnMgPSBJbmNsdWRlTm9kZVxuICAsIHByb3RvID0gY29ucy5wcm90b3R5cGVcblxuY29ucy5wYXJzZSA9IGZ1bmN0aW9uKGNvbnRlbnRzLCBwYXJzZXIpIHtcbiAgdmFyIGJpdHMgPSBjb250ZW50cy5zcGxpdCgnICcpXG4gICAgLCB2YXJuYW1lID0gcGFyc2VyLmNvbXBpbGUoYml0cy5zbGljZSgxKS5qb2luKCcgJykpXG4gICAgLCBsb2FkZXIgPSBwYXJzZXIucGx1Z2lucy5sb29rdXAoJ2xvYWRlcicpXG5cbiAgcmV0dXJuIG5ldyBjb25zKHZhcm5hbWUsIGxvYWRlcikgXG59XG5cbnByb3RvLnJlbmRlciA9IGZ1bmN0aW9uKGNvbnRleHQsIHRhcmdldCkge1xuICB2YXIgc2VsZiA9IHRoaXNcbiAgICAsIHByb21pc2VcblxuICB0YXJnZXQgPSB0YXJnZXQgfHwgdGhpcy50YXJnZXRfdmFyLnJlc29sdmUoY29udGV4dClcblxuICBpZih0YXJnZXQgJiYgdGFyZ2V0LmNvbnN0cnVjdG9yID09PSBQcm9taXNlKSB7XG4gICAgcHJvbWlzZSA9IG5ldyBQcm9taXNlXG5cbiAgICB0YXJnZXQub25jZSgnZG9uZScsIGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgIHByb21pc2UucmVzb2x2ZShzZWxmLnJlbmRlcihjb250ZXh0LCBkYXRhKSlcbiAgICB9KVxuXG4gICAgcmV0dXJuIHByb21pc2VcbiAgfVxuXG4gIHRhcmdldCA9IHNlbGYuZ2V0X3RlbXBsYXRlKHRhcmdldClcblxuICBpZih0YXJnZXQgJiYgdGFyZ2V0LmNvbnN0cnVjdG9yID09PSBQcm9taXNlKSB7XG4gICAgcHJvbWlzZSA9IG5ldyBQcm9taXNlXG5cbiAgICB0YXJnZXQub25jZSgnZG9uZScsIGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgIHByb21pc2UucmVzb2x2ZShzZWxmLnJlbmRlcihjb250ZXh0LCBkYXRhKSlcbiAgICB9KSAgXG5cbiAgICByZXR1cm4gcHJvbWlzZVxuICB9XG5cbiAgcHJvbWlzZSA9IG5ldyBQcm9taXNlXG5cbiAgdGFyZ2V0LnJlbmRlcihjb250ZXh0LmNvcHkoKSwgZnVuY3Rpb24oZXJyLCBkYXRhKSB7XG4gICAgcHJvbWlzZS5yZXNvbHZlKGRhdGEpXG4gIH0pXG5cbiAgcmV0dXJuIHByb21pc2Vcbn1cblxucHJvdG8uZ2V0X3RlbXBsYXRlID0gZnVuY3Rpb24odGFyZ2V0KSB7XG4gIGlmKHR5cGVvZiB0YXJnZXQgPT09ICdzdHJpbmcnKSB7XG4gICAgcmV0dXJuIHRoaXMubG9hZGVyKHRhcmdldClcbiAgfVxuXG4gIC8vIG9rYXksIGl0J3MgcHJvYmFibHkgYSB0ZW1wbGF0ZSBvYmplY3RcbiAgcmV0dXJuIHRhcmdldFxufVxuIiwibW9kdWxlLmV4cG9ydHMgPSBOb3dOb2RlXG5cbnZhciBmb3JtYXQgPSByZXF1aXJlKCcuLi9kYXRlJykuZGF0ZVxuXG5mdW5jdGlvbiBOb3dOb2RlKGZvcm1hdFN0cmluZykge1xuICB0aGlzLmZvcm1hdCA9IGZvcm1hdFN0cmluZ1xufVxuXG52YXIgY29ucyA9IE5vd05vZGVcbiAgLCBwcm90byA9IGNvbnMucHJvdG90eXBlXG5cbnByb3RvLnJlbmRlciA9IGZ1bmN0aW9uKGNvbnRleHQpIHtcbiAgcmV0dXJuIGZvcm1hdChuZXcgRGF0ZSwgdGhpcy5mb3JtYXQpXG59XG5cbmNvbnMucGFyc2UgPSBmdW5jdGlvbihjb250ZW50cywgcGFyc2VyKSB7XG4gIHZhciBiaXRzID0gY29udGVudHMuc3BsaXQoJyAnKVxuICAgICwgZm10ID0gYml0cy5zbGljZSgxKS5qb2luKCcgJylcblxuICBmbXQgPSBmbXRcbiAgICAucmVwbGFjZSgvXlxccysvLCAnJylcbiAgICAucmVwbGFjZSgvXFxzKyQvLCAnJylcblxuICBpZigvWydcIl0vLnRlc3QoZm10LmNoYXJBdCgwKSkpIHtcbiAgICBmbXQgPSBmbXQuc2xpY2UoMSwgLTEpXG4gIH1cblxuICByZXR1cm4gbmV3IE5vd05vZGUoZm10IHx8ICdOIGosIFknKVxufVxuIiwibW9kdWxlLmV4cG9ydHMgPSBXaXRoTm9kZVxuXG52YXIgUHJvbWlzZSA9IHJlcXVpcmUoJy4uL3Byb21pc2UnKVxuXG5mdW5jdGlvbiBXaXRoTm9kZSh3aXRoX3ZhciwgYXNfdmFyLCBub2Rlcykge1xuICB0aGlzLndpdGhfdmFyID0gd2l0aF92YXJcbiAgdGhpcy5hc192YXIgPSBhc192YXJcbiAgdGhpcy5ub2RlcyA9IG5vZGVzXG59XG5cbnZhciBjb25zID0gV2l0aE5vZGVcbiAgLCBwcm90byA9IGNvbnMucHJvdG90eXBlXG5cbmNvbnMucGFyc2UgPSBmdW5jdGlvbihjb250ZW50cywgcGFyc2VyKSB7XG4gIHZhciBiaXRzID0gY29udGVudHMuc3BsaXQoL1xccysvZylcbiAgICAsIHdpdGh2YXIgPSBwYXJzZXIuY29tcGlsZShiaXRzWzFdKVxuICAgICwgYXN2YXIgPSBiaXRzWzNdXG4gICAgLCBub2RlbGlzdCA9IHBhcnNlci5wYXJzZShbJ2VuZHdpdGgnXSlcblxuICBwYXJzZXIudG9rZW5zLnNoaWZ0KClcbiAgcmV0dXJuIG5ldyBjb25zKHdpdGh2YXIsIGFzdmFyLCBub2RlbGlzdClcbn1cblxucHJvdG8ucmVuZGVyID0gZnVuY3Rpb24oY29udGV4dCwgdmFsdWUpIHtcbiAgdmFyIHNlbGYgPSB0aGlzIFxuICAgICwgcmVzdWx0XG4gICAgLCBwcm9taXNlXG5cbiAgdmFsdWUgPSB2YWx1ZSB8fCBzZWxmLndpdGhfdmFyLnJlc29sdmUoY29udGV4dClcblxuICBpZih2YWx1ZS5jb25zdHJ1Y3RvciA9PT0gUHJvbWlzZSkge1xuICAgIHByb21pc2UgPSBuZXcgUHJvbWlzZVxuXG4gICAgdmFsdWUub25jZSgnZG9uZScsIGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgIHByb21pc2UucmVzb2x2ZShzZWxmLnJlbmRlcihjb250ZXh0LCBkYXRhKSlcbiAgICB9KVxuXG4gICAgcmV0dXJuIHByb21pc2VcbiAgfVxuXG4gIGNvbnRleHQgPSBjb250ZXh0LmNvcHkoKVxuICBjb250ZXh0W3NlbGYuYXNfdmFyXSA9IHZhbHVlXG5cbiAgcmVzdWx0ID0gc2VsZi5ub2Rlcy5yZW5kZXIoY29udGV4dClcblxuICByZXR1cm4gcmVzdWx0XG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IFRleHROb2RlXG5cbmZ1bmN0aW9uIFRleHROb2RlKGNvbnRlbnQpIHtcbiAgdGhpcy5jb250ZW50ID0gY29udGVudFxufVxuXG52YXIgY29ucyA9IFRleHROb2RlXG4gICwgcHJvdG8gPSBjb25zLnByb3RvdHlwZVxuXG5wcm90by5yZW5kZXIgPSBmdW5jdGlvbihjb250ZXh0KSB7XG4gIHJldHVybiB0aGlzLmNvbnRlbnRcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gVGV4dFRva2VuXG5cbnZhciBUb2tlbiA9IHJlcXVpcmUoJy4vdG9rZW4nKVxuICAsIFRleHROb2RlID0gcmVxdWlyZSgnLi90ZXh0X25vZGUnKVxuXG5mdW5jdGlvbiBUZXh0VG9rZW4oY29udGVudCwgbGluZSkge1xuICBUb2tlbi5jYWxsKHRoaXMsIGNvbnRlbnQsIGxpbmUpXG59XG5cbnZhciBjb25zID0gVGV4dFRva2VuXG4gICwgcHJvdG8gPSBjb25zLnByb3RvdHlwZSA9IG5ldyBUb2tlblxuXG5wcm90by5jb25zdHJ1Y3RvciA9IGNvbnNcblxucHJvdG8ubm9kZSA9IGZ1bmN0aW9uKHBhcnNlcikge1xuICByZXR1cm4gbmV3IFRleHROb2RlKHRoaXMuY29udGVudClcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gVG9rZW5cblxuZnVuY3Rpb24gVG9rZW4oY29udGVudCwgbGluZSkge1xuICB0aGlzLmNvbnRlbnQgPSBjb250ZW50XG4gIHRoaXMubGluZSA9IGxpbmVcblxuICB0aGlzLm5hbWUgPSBjb250ZW50ICYmIGNvbnRlbnQuc3BsaXQoJyAnKVswXVxufVxuXG52YXIgY29ucyA9IFRva2VuXG4gICwgcHJvdG8gPSBjb25zLnByb3RvdHlwZVxuXG5wcm90by50b1N0cmluZyA9IGZ1bmN0aW9uKCkge1xuICAvLyBOQjogdGhpcyBzaG91bGQgb25seSBiZVxuICAvLyBkZWJ1ZyBvdXRwdXQsIHNvIGl0J3NcbiAgLy8gcHJvYmFibHkgc2FmZSB0byB1c2VcbiAgLy8gSlNPTi5zdHJpbmdpZnkgaGVyZS5cbiAgcmV0dXJuICc8Jyt0aGlzLmNvbnN0cnVjdG9yLm5hbWUrJzogJytKU09OLnN0cmluZ2lmeSh0aGlzLmNvbnRlbnQpKyc+J1xufVxuXG5wcm90by5pcyA9IGZ1bmN0aW9uKG5hbWVzKSB7XG4gIGZvcih2YXIgaSA9IDAsIGxlbiA9IG5hbWVzLmxlbmd0aDsgaSA8IGxlbjsgKytpKVxuICAgIGlmKG5hbWVzW2ldID09PSB0aGlzLm5hbWUpXG4gICAgICByZXR1cm4gdHJ1ZVxuICByZXR1cm4gZmFsc2Vcbn1cbiIsIjsoZnVuY3Rpb24oKSB7XG5cbi8vIHNvLCB0aGUgb25seSB3YXkgd2UgKHJlbGlhYmx5KSBnZXQgYWNjZXNzIHRvIERTVCBpbiBqYXZhc2NyaXB0XG4vLyBpcyB2aWEgYERhdGUjZ2V0VGltZXpvbmVPZmZzZXRgLlxuLy9cbi8vIHRoaXMgdmFsdWUgd2lsbCBzd2l0Y2ggZm9yIGEgZ2l2ZW4gZGF0ZSBiYXNlZCBvbiB0aGUgcHJlc2VuY2Ugb3IgYWJzZW5jZVxuLy8gb2YgRFNUIGF0IHRoYXQgZGF0ZS5cblxuZnVuY3Rpb24gZmluZF9kc3RfdGhyZXNob2xkIChuZWFyLCBmYXIpIHtcbiAgdmFyIG5lYXJfZGF0ZSA9IG5ldyBEYXRlKG5lYXIpXG4gICAgLCBmYXJfZGF0ZSA9IG5ldyBEYXRlKGZhcilcbiAgICAsIG5lYXJfb2ZmcyA9IG5lYXJfZGF0ZS5nZXRUaW1lem9uZU9mZnNldCgpXG4gICAgLCBmYXJfb2ZmcyA9IGZhcl9kYXRlLmdldFRpbWV6b25lT2Zmc2V0KClcblxuICBpZihuZWFyX29mZnMgPT09IGZhcl9vZmZzKSByZXR1cm4gMFxuXG4gIGlmKE1hdGguYWJzKG5lYXJfZGF0ZSAtIGZhcl9kYXRlKSA8IDEwMDApIHJldHVybiBuZWFyX2RhdGVcblxuICByZXR1cm4gZmluZF9kc3RfdGhyZXNob2xkKG5lYXIsIG5lYXIrKGZhci1uZWFyKS8yKSB8fCBmaW5kX2RzdF90aHJlc2hvbGQobmVhcisoZmFyLW5lYXIpLzIsIGZhcilcbn1cblxuXG5mdW5jdGlvbiBmaW5kX2RzdF90aHJlc2hvbGRzKCkge1xuICB2YXIgZCA9IG5ldyBEYXRlKClcbiAgICAsIGQgPSBuZXcgRGF0ZShkLmdldEZ1bGxZZWFyKCksIDAsIDEpXG4gICAgLCBmID0gbmV3IERhdGUoZC5nZXRGdWxsWWVhcigpLCAxMSwgMzEpXG4gICAgLCB4XG4gICAgLCBmaXJzdFxuICAgICwgc2Vjb25kXG5cbiAgeCA9IChmIC0gZCkgLyAtMlxuICBmaXJzdCA9IGZpbmRfZHN0X3RocmVzaG9sZCgrZCwgZCAtIHgpXG4gIHNlY29uZCA9IGZpbmRfZHN0X3RocmVzaG9sZChkIC0geCwgK2YpXG5cbiAgcmV0dXJuIHtcbiAgICBzcHJpbmdfZm9yd2FyZCAgOiBmaXJzdCA/IChmaXJzdC5nZXRUaW1lem9uZU9mZnNldCgpIDwgc2Vjb25kLmdldFRpbWV6b25lT2Zmc2V0KCkgPyBzZWNvbmQgOiBmaXJzdCkgLSBuZXcgRGF0ZShkLmdldEZ1bGxZZWFyKCksIDAsIDEsIDAsIDApIDogMFxuICAsIGZhbGxfYmFjayAgICAgICA6IGZpcnN0ID8gKGZpcnN0LmdldFRpbWV6b25lT2Zmc2V0KCkgPCBzZWNvbmQuZ2V0VGltZXpvbmVPZmZzZXQoKSA/IGZpcnN0IDogc2Vjb25kKSAtIG5ldyBEYXRlKGQuZ2V0RnVsbFllYXIoKSwgMCwgMSwgMCwgMCkgOiAwXG4gIH1cbn1cblxudmFyIFRIUkVTSE9MRFMgPSBmaW5kX2RzdF90aHJlc2hvbGRzKClcblxuZnVuY3Rpb24gaXNfZHN0KGRhdGV0aW1lLCB0aHJlc2hvbGRzKSB7XG5cbiAgdGhyZXNob2xkcyA9IHRocmVzaG9sZHMgfHwgVEhSRVNIT0xEU1xuXG4gIGlmKHRocmVzaG9sZHMuc3ByaW5nX2ZvcndhcmQgPT09IHRocmVzaG9sZHMuZmFsbF9iYWNrKVxuICAgIHJldHVybiBmYWxzZVxuXG4gIHZhciBvZmZzZXQgPSBkYXRldGltZSAtIG5ldyBEYXRlKGRhdGV0aW1lLmdldEZ1bGxZZWFyKCksIDAsIDEsIDAsIDApXG4gICAgLCBkc3RfaXNfcmV2ZXJzZWQgPSB0aHJlc2hvbGRzLnNwcmluZ19mb3J3YXJkID4gdGhyZXNob2xkcy5mYWxsX2JhY2tcbiAgICAsIG1heCA9IE1hdGgubWF4KHRocmVzaG9sZHMuZmFsbF9iYWNrLCB0aHJlc2hvbGRzLnNwcmluZ19mb3J3YXJkKVxuICAgICwgbWluID0gTWF0aC5taW4odGhyZXNob2xkcy5mYWxsX2JhY2ssIHRocmVzaG9sZHMuc3ByaW5nX2ZvcndhcmQpXG5cbiAgaWYobWluIDwgb2Zmc2V0ICYmIG9mZnNldCA8IG1heClcbiAgICByZXR1cm4gIWRzdF9pc19yZXZlcnNlZFxuICByZXR1cm4gZHN0X2lzX3JldmVyc2VkXG59XG5cbkRhdGUucHJvdG90eXBlLmlzRFNUID0gZnVuY3Rpb24odGhyZXNob2xkcykge1xuICByZXR1cm4gaXNfZHN0KHRoaXMsIHRocmVzaG9sZHMpIFxufVxuXG5pc19kc3QuZmluZF90aHJlc2hvbGRzID0gZmluZF9kc3RfdGhyZXNob2xkc1xuXG5pZih0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJykge1xuICBtb2R1bGUuZXhwb3J0cyA9IGlzX2RzdFxufSBlbHNlIHtcbiAgd2luZG93LmlzX2RzdCA9IGlzX2RzdCBcbn1cblxufSkoKVxuIiwidmFyIHR6ID0gcmVxdWlyZSgnLi90eicpXG4gICwgaXNEU1QgPSByZXF1aXJlKCdkc3QnKVxuXG5tb2R1bGUuZXhwb3J0cyA9IHR6aW5mb1xuXG5mdW5jdGlvbiBnZXRfb2Zmc2V0X2ZtdCh0em9mZnMpIHtcbiAgdmFyIG9mZnMgPSB+fih0em9mZnMgLyA2MClcbiAgICAsIG1pbnMgPSAoJzAwJyArIH5+TWF0aC5hYnModHpvZmZzICUgNjApKS5zbGljZSgtMilcblxuICBvZmZzID0gKCh0em9mZnMgPiAwKSA/ICctJyA6ICcrJykgKyAoJzAwJyArIE1hdGguYWJzKG9mZnMpKS5zbGljZSgtMikgKyBtaW5zXG5cbiAgcmV0dXJuIG9mZnNcbn1cblxuZnVuY3Rpb24gdHppbmZvKGRhdGUsIHR6X2xpc3QsIGRldGVybWluZV9kc3QsIFRaKSB7XG5cbiAgdmFyIGZtdCA9IGdldF9vZmZzZXRfZm10KGRhdGUuZ2V0VGltZXpvbmVPZmZzZXQoKSlcblxuICBUWiA9IFRaIHx8IHR6XG4gIHR6X2xpc3QgPSB0el9saXN0IHx8IFRaW2ZtdF1cbiAgZGV0ZXJtaW5lX2RzdCA9IGRldGVybWluZV9kc3QgfHwgaXNEU1RcblxuICB2YXIgZGF0ZV9pc19kc3QgPSBkZXRlcm1pbmVfZHN0KGRhdGUpXG4gICAgLCBkYXRlX2RzdF90aHJlc2hvbGRzID0gZGV0ZXJtaW5lX2RzdC5maW5kX3RocmVzaG9sZHMoKVxuICAgICwgaGFzX2RzdCA9IGRhdGVfZHN0X3RocmVzaG9sZHMuc3ByaW5nX2ZvcndhcmQgIT09IGRhdGVfZHN0X3RocmVzaG9sZHMuZmFsbF9iYWNrXG4gICAgLCBpc19ub3J0aCA9IGhhc19kc3QgJiYgZGF0ZV9kc3RfdGhyZXNob2xkcy5zcHJpbmdfZm9yd2FyZCA8IGRhdGVfZHN0X3RocmVzaG9sZHMuZmFsbF9iYWNrIFxuICAgICwgbGlzdCA9ICh0el9saXN0IHx8IFtdKS5zbGljZSgpXG4gICAgLCBmaWx0ZXJlZCA9IFtdXG5cbiAgaWYoIWlzX25vcnRoKVxuICAgIGxpc3QgPSBsaXN0LnJldmVyc2UoKVxuXG4gIGZvcih2YXIgaSA9IDAsIGxlbiA9IGxpc3QubGVuZ3RoOyBpIDwgbGVuOyArK2kpIHtcbiAgICBpZihkYXRlX2lzX2RzdCA9PT0gLyhbRGRdYXlsaWdodHxbU3NddW1tZXIpLy50ZXN0KGxpc3RbaV0ubmFtZSkpIHtcbiAgICAgIGZpbHRlcmVkLnB1c2gobGlzdFtpXSlcbiAgICB9XG4gIH1cbiAgbGlzdCA9IGZpbHRlcmVkXG4gIGlmKCFsaXN0Lmxlbmd0aCkgcmV0dXJuIHt9XG5cbiAgcmV0dXJuIHtcbiAgICAgICduYW1lJzogICAgIGxpc3RbMF0ubmFtZVxuICAgICwgJ2xvYyc6ICAgICAgbGlzdFswXS5sb2NcbiAgICAsICdhYmJyJzogICAgIGxpc3RbMF0uYWJiclxuICAgICwgJ29mZnNldCc6ICAgZm10XG4gIH1cbn0gXG5cbnR6aW5mby5nZXRfb2Zmc2V0X2Zvcm1hdCA9IGdldF9vZmZzZXRfZm10XG50emluZm8udHpfbGlzdCA9IHR6XG5cbkRhdGUucHJvdG90eXBlLnR6aW5mbyA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gdHppbmZvKHRoaXMpXG59XG5cbkRhdGUucHJvdG90eXBlLnR6b2Zmc2V0ID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiAnR01UJytnZXRfb2Zmc2V0X2ZtdCh0aGlzLmdldFRpbWV6b25lT2Zmc2V0KCkpXG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IHtcbiAgXCIrMDkwMFwiOiBbXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJBc2lhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiSlNUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiSmFwYW4gU3RhbmRhcmQgVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJBdXN0cmFsaWFcIiwgXG4gICAgICBcImFiYnJcIjogXCJXRFRcIiwgXG4gICAgICBcIm5hbWVcIjogXCJXZXN0ZXJuIERheWxpZ2h0IFRpbWVcIlxuICAgIH0gXG4gIF0sIFxuICBcIisxMzQ1XCI6IFtcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIlBhY2lmaWNcIiwgXG4gICAgICBcImFiYnJcIjogXCJDSEFEVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIkNoYXRoYW0gSXNsYW5kIERheWxpZ2h0IFRpbWVcIlxuICAgIH1cbiAgXSwgXG4gIFwiKzA1MDBcIjogW1xuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiQXNpYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIlBLVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIlBha2lzdGFuIFN0YW5kYXJkIFRpbWVcIlxuICAgIH0gXG4gIF0sIFxuICBcIiswNDMwXCI6IFtcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIkFzaWFcIiwgXG4gICAgICBcImFiYnJcIjogXCJBRlRcIiwgXG4gICAgICBcIm5hbWVcIjogXCJBZmdoYW5pc3RhbiBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIkFzaWFcIiwgXG4gICAgICBcImFiYnJcIjogXCJJUkRUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiSXJhbiBEYXlsaWdodCBUaW1lXCJcbiAgICB9XG4gIF0sIFxuICBcIisxMjAwXCI6IFtcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIkFzaWFcIiwgXG4gICAgICBcImFiYnJcIjogXCJBTkFTVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIkFuYWR5ciBTdW1tZXIgVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJBc2lhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiQU5BVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIkFuYWR5ciBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIlBhY2lmaWNcIiwgXG4gICAgICBcImFiYnJcIjogXCJGSlRcIiwgXG4gICAgICBcIm5hbWVcIjogXCJGaWppIFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiUGFjaWZpY1wiLCBcbiAgICAgIFwiYWJiclwiOiBcIkdJTFRcIiwgXG4gICAgICBcIm5hbWVcIjogXCJHaWxiZXJ0IElzbGFuZCBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIkFzaWFcIiwgXG4gICAgICBcImFiYnJcIjogXCJNQUdTVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIk1hZ2FkYW4gU3VtbWVyIFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiUGFjaWZpY1wiLCBcbiAgICAgIFwiYWJiclwiOiBcIk1IVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIk1hcnNoYWxsIElzbGFuZHMgVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJQYWNpZmljXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiTlpTVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIk5ldyBaZWFsYW5kIFN0YW5kYXJkIFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiQXNpYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIlBFVFNUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiS2FtY2hhdGthIFN1bW1lciBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIkFzaWFcIiwgXG4gICAgICBcImFiYnJcIjogXCJQRVRUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiS2FtY2hhdGthIFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiUGFjaWZpY1wiLCBcbiAgICAgIFwiYWJiclwiOiBcIlRWVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIlR1dmFsdSBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIlBhY2lmaWNcIiwgXG4gICAgICBcImFiYnJcIjogXCJXRlRcIiwgXG4gICAgICBcIm5hbWVcIjogXCJXYWxsaXMgYW5kIEZ1dHVuYSBUaW1lXCJcbiAgICB9XG4gIF0sIFxuICBcIi0xMTAwXCI6IFtcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIlBhY2lmaWNcIiwgXG4gICAgICBcImFiYnJcIjogXCJTU1RcIiwgXG4gICAgICBcIm5hbWVcIjogXCJTYW1vYSBTdGFuZGFyZCBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIlBhY2lmaWNcIiwgXG4gICAgICBcImFiYnJcIjogXCJXU1RcIiwgXG4gICAgICBcIm5hbWVcIjogXCJXZXN0IFNhbW9hIFRpbWVcIlxuICAgIH0gXG4gIF0sIFxuICBcIisxNDAwXCI6IFtcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIlBhY2lmaWNcIiwgXG4gICAgICBcImFiYnJcIjogXCJMSU5UXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiTGluZSBJc2xhbmRzIFRpbWVcIlxuICAgIH1cbiAgXSwgXG4gIFwiLTAyMzBcIjogW1xuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiTm9ydGggQW1lcmljYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIkhBVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIkhldXJlIEF2YW5jXFx1MDBlOWUgZGUgVGVycmUtTmV1dmVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiTm9ydGggQW1lcmljYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIk5EVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIk5ld2ZvdW5kbGFuZCBEYXlsaWdodCBUaW1lXCJcbiAgICB9XG4gIF0sIFxuICBcIi0wMTAwXCI6IFtcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIkFmcmljYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIkNWVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIkNhcGUgVmVyZGUgVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJOb3J0aCBBbWVyaWNhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiRUdUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiRWFzdCBHcmVlbmxhbmQgVGltZVwiXG4gICAgfSBcbiAgXSwgXG4gIFwiLTEyMDBcIjogW1xuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiTWlsaXRhcnlcIiwgXG4gICAgICBcImFiYnJcIjogXCJZXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiWWFua2VlIFRpbWUgWm9uZVwiXG4gICAgfVxuICBdLCBcbiAgXCIrMDgwMFwiOiBbXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJBc2lhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiQ1NUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiQ2hpbmEgU3RhbmRhcmQgVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJBc2lhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiS1JBU1RcIiwgXG4gICAgICBcIm5hbWVcIjogXCJLcmFzbm95YXJzayBTdW1tZXIgVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJBdXN0cmFsaWFcIiwgXG4gICAgICBcImFiYnJcIjogXCJXU1RcIiwgXG4gICAgICBcIm5hbWVcIjogXCJXZXN0ZXJuIFN0YW5kYXJkIFRpbWVcIlxuICAgIH1cbiAgXSwgXG4gIFwiKzA2MzBcIjogW1xuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiQXNpYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIk1NVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIk15YW5tYXIgVGltZVwiXG4gICAgfSxcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIkluZGlhbiBPY2VhblwiLCBcbiAgICAgIFwiYWJiclwiOiBcIkNDVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIkNvY29zIElzbGFuZHMgVGltZVwiXG4gICAgfVxuICBdLCBcbiAgXCItMDQzMFwiOiBbXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJTb3V0aCBBbWVyaWNhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiSExWXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiSG9yYSBMZWdhbCBkZSBWZW5lenVlbGFcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiU291dGggQW1lcmljYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIlZFVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIlZlbmV6dWVsYW4gU3RhbmRhcmQgVGltZVwiXG4gICAgfVxuICBdLCBcbiAgXCItMDcwMFwiOiBbXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJOb3J0aCBBbWVyaWNhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiTVNUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiTW91bnRhaW4gU3RhbmRhcmQgVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJOb3J0aCBBbWVyaWNhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiUERUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiUGFjaWZpYyBEYXlsaWdodCBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIk5vcnRoIEFtZXJpY2FcIiwgXG4gICAgICBcImFiYnJcIjogXCJIQVBcIiwgXG4gICAgICBcIm5hbWVcIjogXCJIZXVyZSBBdmFuY1xcdTAwZTllIGR1IFBhY2lmaXF1ZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJOb3J0aCBBbWVyaWNhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiSE5SXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiSGV1cmUgTm9ybWFsZSBkZXMgUm9jaGV1c2VzXCJcbiAgICB9IFxuICBdLCBcbiAgXCItMDIwMFwiOiBbXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJTb3V0aCBBbWVyaWNhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiRk5UXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiRmVybmFuZG8gZGUgTm9yb25oYSBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIk5vcnRoIEFtZXJpY2FcIiwgXG4gICAgICBcImFiYnJcIjogXCJXR1NUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiV2VzdGVybiBHcmVlbmxhbmQgU3VtbWVyIFRpbWVcIlxuICAgIH0sXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJOb3J0aCBBbWVyaWNhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiUE1EVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIlBpZXJyZSAmIE1pcXVlbG9uIERheWxpZ2h0IFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiU291dGggQW1lcmljYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIlVZU1RcIiwgXG4gICAgICBcIm5hbWVcIjogXCJVcnVndWF5IFN1bW1lciBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIlNvdXRoIEFtZXJpY2FcIiwgXG4gICAgICBcImFiYnJcIjogXCJCUlNUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiQnJhc2lsaWEgU3VtbWVyIFRpbWVcIlxuICAgIH0gXG4gIF0sIFxuICBcIisxMDMwXCI6IFtcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIkF1c3RyYWxpYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIkNEVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIkNlbnRyYWwgRGF5bGlnaHQgVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJBdXN0cmFsaWFcIiwgXG4gICAgICBcImFiYnJcIjogXCJMSFNUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiTG9yZCBIb3dlIFN0YW5kYXJkIFRpbWVcIlxuICAgIH1cbiAgXSwgXG4gIFwiKzAzMDBcIjogW1xuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiRXVyb3BlXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiTVNLXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiTW9zY293IFN0YW5kYXJkIFRpbWVcIlxuICAgIH0sXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJBc2lhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiSURUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiSXNyYWVsIERheWxpZ2h0IFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiQXNpYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIkFTVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIkFyYWJpYSBTdGFuZGFyZCBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIkluZGlhbiBPY2VhblwiLCBcbiAgICAgIFwiYWJiclwiOiBcIkVBVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIkVhc3QgQWZyaWNhIFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiRXVyb3BlXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiRUVTVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIkVhc3Rlcm4gRXVyb3BlYW4gU3VtbWVyIFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiQWZyaWNhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiRUFUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiRWFzdGVybiBBZnJpY2EgVGltZVwiXG4gICAgfSBcbiAgXSwgXG4gIFwiVVRDXCI6IFtcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIkF0bGFudGljXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiQVpPU1RcIiwgXG4gICAgICBcIm5hbWVcIjogXCJBem9yZXMgU3VtbWVyIFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiTm9ydGggQW1lcmljYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIkVHU1RcIiwgXG4gICAgICBcIm5hbWVcIjogXCJFYXN0ZXJuIEdyZWVubGFuZCBTdW1tZXIgVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJBZnJpY2FcIiwgXG4gICAgICBcImFiYnJcIjogXCJHTVRcIiwgXG4gICAgICBcIm5hbWVcIjogXCJHcmVlbndpY2ggTWVhbiBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIkV1cm9wZVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIkdNVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIkdyZWVud2ljaCBNZWFuIFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiQWZyaWNhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiV0VUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiV2VzdGVybiBFdXJvcGVhbiBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIkV1cm9wZVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIldFVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIldlc3Rlcm4gRXVyb3BlYW4gVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJBZnJpY2FcIiwgXG4gICAgICBcImFiYnJcIjogXCJXVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIldlc3Rlcm4gU2FoYXJhIFN0YW5kYXJkIFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiTWlsaXRhcnlcIiwgXG4gICAgICBcImFiYnJcIjogXCJaXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiWnVsdSBUaW1lIFpvbmVcIlxuICAgIH1cbiAgXSwgXG4gIFwiKzA0MDBcIjogW1xuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiQXNpYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIkFNVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIkFybWVuaWEgVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJBc2lhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiQVpUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiQXplcmJhaWphbiBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIk1pbGl0YXJ5XCIsIFxuICAgICAgXCJhYmJyXCI6IFwiRFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIkRlbHRhIFRpbWUgWm9uZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJBc2lhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiR0VUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiR2VvcmdpYSBTdGFuZGFyZCBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIkFzaWFcIiwgXG4gICAgICBcImFiYnJcIjogXCJHU1RcIiwgXG4gICAgICBcIm5hbWVcIjogXCJHdWxmIFN0YW5kYXJkIFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiRXVyb3BlXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiS1VZVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIkt1eWJ5c2hldiBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIkV1cm9wZVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIk1TRFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIk1vc2NvdyBEYXlsaWdodCBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIkFmcmljYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIk1VVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIk1hdXJpdGl1cyBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIkFmcmljYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIlJFVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIlJldW5pb24gVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJFdXJvcGVcIiwgXG4gICAgICBcImFiYnJcIjogXCJTQU1UXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiU2FtYXJhIFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiQWZyaWNhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiU0NUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiU2V5Y2hlbGxlcyBUaW1lXCJcbiAgICB9XG4gIF0sIFxuICBcIiswNzAwXCI6IFtcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIkF1c3RyYWxpYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIkNYVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIkNocmlzdG1hcyBJc2xhbmQgVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJBbnRhcmN0aWNhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiREFWVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIkRhdmlzIFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiTWlsaXRhcnlcIiwgXG4gICAgICBcImFiYnJcIjogXCJHXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiR29sZiBUaW1lIFpvbmVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiQXNpYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIkhPVlRcIiwgXG4gICAgICBcIm5hbWVcIjogXCJIb3ZkIFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiQXNpYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIklDVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIkluZG9jaGluYSBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIkFzaWFcIiwgXG4gICAgICBcImFiYnJcIjogXCJLUkFUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiS3Jhc25veWFyc2sgVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJBc2lhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiTk9WU1RcIiwgXG4gICAgICBcIm5hbWVcIjogXCJOb3Zvc2liaXJzayBTdW1tZXIgVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJBc2lhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiT01TU1RcIiwgXG4gICAgICBcIm5hbWVcIjogXCJPbXNrIFN1bW1lciBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIkFzaWFcIiwgXG4gICAgICBcImFiYnJcIjogXCJXSUJcIiwgXG4gICAgICBcIm5hbWVcIjogXCJXZXN0ZXJuIEluZG9uZXNpYW4gVGltZVwiXG4gICAgfVxuICBdLCBcbiAgXCIrMDIwMFwiOiBbXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJNaWxpdGFyeVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIkJcIiwgXG4gICAgICBcIm5hbWVcIjogXCJCcmF2byBUaW1lIFpvbmVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiQWZyaWNhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiQ0FUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiQ2VudHJhbCBBZnJpY2EgVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJFdXJvcGVcIiwgXG4gICAgICBcImFiYnJcIjogXCJDRVNUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiQ2VudHJhbCBFdXJvcGVhbiBTdW1tZXIgVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJBZnJpY2FcIiwgXG4gICAgICBcImFiYnJcIjogXCJFRVRcIiwgXG4gICAgICBcIm5hbWVcIjogXCJFYXN0ZXJuIEV1cm9wZWFuIFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiQXNpYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIkVFVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIkVhc3Rlcm4gRXVyb3BlYW4gVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJFdXJvcGVcIiwgXG4gICAgICBcImFiYnJcIjogXCJFRVRcIiwgXG4gICAgICBcIm5hbWVcIjogXCJFYXN0ZXJuIEV1cm9wZWFuIFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiQXNpYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIklTVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIklzcmFlbCBTdGFuZGFyZCBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIkFmcmljYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIlNBU1RcIiwgXG4gICAgICBcIm5hbWVcIjogXCJTb3V0aCBBZnJpY2EgU3RhbmRhcmQgVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJBZnJpY2FcIiwgXG4gICAgICBcImFiYnJcIjogXCJXQVNUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiV2VzdCBBZnJpY2EgU3VtbWVyIFRpbWVcIlxuICAgIH1cbiAgXSwgXG4gIFwiLTEwMDBcIjogW1xuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiUGFjaWZpY1wiLCBcbiAgICAgIFwiYWJiclwiOiBcIkNLVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIkNvb2sgSXNsYW5kIFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiTm9ydGggQW1lcmljYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIkhBU1RcIiwgXG4gICAgICBcIm5hbWVcIjogXCJIYXdhaWktQWxldXRpYW4gU3RhbmRhcmQgVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJQYWNpZmljXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiVEFIVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIlRhaGl0aSBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIlBhY2lmaWNcIiwgXG4gICAgICBcImFiYnJcIjogXCJUS1RcIiwgXG4gICAgICBcIm5hbWVcIjogXCJUb2tlbGF1IFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiTWlsaXRhcnlcIiwgXG4gICAgICBcImFiYnJcIjogXCJXXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiV2hpc2tleSBUaW1lIFpvbmVcIlxuICAgIH1cbiAgXSwgXG4gIFwiKzA5MzBcIjogW1xuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiQXVzdHJhbGlhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiQ1NUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiQ2VudHJhbCBTdGFuZGFyZCBUaW1lXCJcbiAgICB9XG4gIF0sIFxuICBcIiswNTMwXCI6IFtcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIkFzaWFcIiwgXG4gICAgICBcImFiYnJcIjogXCJJU1RcIiwgXG4gICAgICBcIm5hbWVcIjogXCJJbmRpYSBTdGFuZGFyZCBUaW1lXCJcbiAgICB9XG4gIF0sIFxuICBcIisxMzAwXCI6IFtcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIlBhY2lmaWNcIiwgXG4gICAgICBcImFiYnJcIjogXCJGSlNUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiRmlqaSBTdW1tZXIgVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJBbnRhcmN0aWNhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiTlpEVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIk5ldyBaZWFsYW5kIERheWxpZ2h0IFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiUGFjaWZpY1wiLCBcbiAgICAgIFwiYWJiclwiOiBcIk5aRFRcIiwgXG4gICAgICBcIm5hbWVcIjogXCJOZXcgWmVhbGFuZCBEYXlsaWdodCBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIlBhY2lmaWNcIiwgXG4gICAgICBcImFiYnJcIjogXCJQSE9UXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiUGhvZW5peCBJc2xhbmQgVGltZVwiXG4gICAgfVxuICBdLCBcbiAgXCIrMDU0NVwiOiBbXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJBc2lhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiTlBUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiTmVwYWwgVGltZVwiXG4gICAgfVxuICBdLCBcbiAgXCIrMTAwMFwiOiBbXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJQYWNpZmljXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiQ2hTVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIkNoYW1vcnJvIFN0YW5kYXJkIFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiQXVzdHJhbGlhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiRVNUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiRWFzdGVybiBTdGFuZGFyZCBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIk1pbGl0YXJ5XCIsIFxuICAgICAgXCJhYmJyXCI6IFwiS1wiLCBcbiAgICAgIFwibmFtZVwiOiBcIktpbG8gVGltZSBab25lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIlBhY2lmaWNcIiwgXG4gICAgICBcImFiYnJcIjogXCJQR1RcIiwgXG4gICAgICBcIm5hbWVcIjogXCJQYXB1YSBOZXcgR3VpbmVhIFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiQXNpYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIlZMQVRcIiwgXG4gICAgICBcIm5hbWVcIjogXCJWbGFkaXZvc3RvayBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIkFzaWFcIiwgXG4gICAgICBcImFiYnJcIjogXCJZQUtTVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIllha3V0c2sgU3VtbWVyIFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiUGFjaWZpY1wiLCBcbiAgICAgIFwiYWJiclwiOiBcIllBUFRcIiwgXG4gICAgICBcIm5hbWVcIjogXCJZYXAgVGltZVwiXG4gICAgfVxuICBdLCBcbiAgXCItMDYwMFwiOiBbXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJOb3J0aCBBbWVyaWNhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiQ1NUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiQ2VudHJhbCBTdGFuZGFyZCBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIk5vcnRoIEFtZXJpY2FcIiwgXG4gICAgICBcImFiYnJcIjogXCJNRFRcIiwgXG4gICAgICBcIm5hbWVcIjogXCJNb3VudGFpbiBEYXlsaWdodCBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIlBhY2lmaWNcIiwgXG4gICAgICBcImFiYnJcIjogXCJHQUxUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiR2FsYXBhZ29zIFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiTm9ydGggQW1lcmljYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIkhBUlwiLCBcbiAgICAgIFwibmFtZVwiOiBcIkhldXJlIEF2YW5jXFx1MDBlOWUgZGVzIFJvY2hldXNlc1wiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJOb3J0aCBBbWVyaWNhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiSE5DXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiSGV1cmUgTm9ybWFsZSBkdSBDZW50cmVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiQ2VudHJhbCBBbWVyaWNhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiSE5DXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiSGV1cmUgTm9ybWFsZSBkdSBDZW50cmVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiQ2VudHJhbCBBbWVyaWNhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiQ1NUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiQ2VudHJhbCBTdGFuZGFyZCBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIlBhY2lmaWNcIiwgXG4gICAgICBcImFiYnJcIjogXCJFQVNUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiRWFzdGVyIElzbGFuZCBTdGFuZGFyZCBUaW1lXCJcbiAgICB9XG4gIF0sIFxuICBcIiswMTAwXCI6IFtcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIkV1cm9wZVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIkNFVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIkNlbnRyYWwgRXVyb3BlYW4gVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJFdXJvcGVcIiwgXG4gICAgICBcImFiYnJcIjogXCJCU1RcIiwgXG4gICAgICBcIm5hbWVcIjogXCJCcml0aXNoIFN1bW1lciBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIkFmcmljYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIkNFVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIkNlbnRyYWwgRXVyb3BlYW4gVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJBZnJpY2FcIiwgXG4gICAgICBcImFiYnJcIjogXCJXRVNUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiV2VzdGVybiBFdXJvcGVhbiBTdW1tZXIgVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJFdXJvcGVcIiwgXG4gICAgICBcImFiYnJcIjogXCJXRVNUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiV2VzdGVybiBFdXJvcGVhbiBTdW1tZXIgVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJBZnJpY2FcIiwgXG4gICAgICBcImFiYnJcIjogXCJXU1RcIiwgXG4gICAgICBcIm5hbWVcIjogXCJXZXN0ZXJuIFNhaGFyYSBTdW1tZXIgVGltZVwiXG4gICAgfSxcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIkFmcmljYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIldBVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIldlc3QgQWZyaWNhIFRpbWVcIlxuICAgIH1cbiAgXSwgXG4gIFwiLTA0MDBcIjogW1xuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiTm9ydGggQW1lcmljYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIkFTVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIkF0bGFudGljIFN0YW5kYXJkIFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiTm9ydGggQW1lcmljYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIkVEVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIkVhc3Rlcm4gRGF5bGlnaHQgVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJTb3V0aCBBbWVyaWNhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiQ0xUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiQ2hpbGUgU3RhbmRhcmQgVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJTb3V0aCBBbWVyaWNhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiRktUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiRmFsa2xhbmQgSXNsYW5kIFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiU291dGggQW1lcmljYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIkdZVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIkd1eWFuYSBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIlNvdXRoIEFtZXJpY2FcIiwgXG4gICAgICBcImFiYnJcIjogXCJQWVRcIiwgXG4gICAgICBcIm5hbWVcIjogXCJQYXJhZ3VheSBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIlNvdXRoIEFtZXJpY2FcIiwgXG4gICAgICBcImFiYnJcIjogXCJBTVRcIiwgXG4gICAgICBcIm5hbWVcIjogXCJBbWF6b24gVGltZVwiXG4gICAgfSBcbiAgXSwgXG4gIFwiLTAzMzBcIjogW1xuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiTm9ydGggQW1lcmljYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIk5TVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIk5ld2ZvdW5kbGFuZCBTdGFuZGFyZCBUaW1lXCJcbiAgICB9XG4gIF0sIFxuICBcIi0wNTAwXCI6IFtcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIk5vcnRoIEFtZXJpY2FcIiwgXG4gICAgICBcImFiYnJcIjogXCJFU1RcIiwgXG4gICAgICBcIm5hbWVcIjogXCJFYXN0ZXJuIFN0YW5kYXJkIFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiTm9ydGggQW1lcmljYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIkNEVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIkNlbnRyYWwgRGF5bGlnaHQgVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJTb3V0aCBBbWVyaWNhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiQ09UXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiQ29sb21iaWEgVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJDYXJpYmJlYW5cIiwgXG4gICAgICBcImFiYnJcIjogXCJDU1RcIiwgXG4gICAgICBcIm5hbWVcIjogXCJDdWJhIFN0YW5kYXJkIFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiUGFjaWZpY1wiLCBcbiAgICAgIFwiYWJiclwiOiBcIkVBU1NUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiRWFzdGVyIElzbGFuZCBTdW1tZXIgVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJTb3V0aCBBbWVyaWNhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiRUNUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiRWN1YWRvciBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIkNlbnRyYWwgQW1lcmljYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIkVTVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIkVhc3Rlcm4gU3RhbmRhcmQgVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJDYXJpYmJlYW5cIiwgXG4gICAgICBcImFiYnJcIjogXCJFU1RcIiwgXG4gICAgICBcIm5hbWVcIjogXCJFYXN0ZXJuIFN0YW5kYXJkIFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiQ2VudHJhbCBBbWVyaWNhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiRVRcIiwgXG4gICAgICBcIm5hbWVcIjogXCJUaWVtcG8gZGVsIEVzdGVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiQ2FyaWJiZWFuXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiRVRcIiwgXG4gICAgICBcIm5hbWVcIjogXCJUaWVtcG8gZGVsIEVzdGVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiTm9ydGggQW1lcmljYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIkVUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiVGllbXBvIERlbCBFc3RlXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIk5vcnRoIEFtZXJpY2FcIiwgXG4gICAgICBcImFiYnJcIjogXCJIQUNcIiwgXG4gICAgICBcIm5hbWVcIjogXCJIZXVyZSBBdmFuY1xcdTAwZTllIGR1IENlbnRyZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJTb3V0aCBBbWVyaWNhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiUEVUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiUGVydSBUaW1lXCJcbiAgICB9IFxuICBdLCBcbiAgXCItMDkwMFwiOiBbXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJOb3J0aCBBbWVyaWNhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiQUtTVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIkFsYXNrYSBTdGFuZGFyZCBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIk5vcnRoIEFtZXJpY2FcIiwgXG4gICAgICBcImFiYnJcIjogXCJIQURUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiSGF3YWlpLUFsZXV0aWFuIERheWxpZ2h0IFRpbWVcIlxuICAgIH0gXG4gIF0sIFxuICBcIi0wMzAwXCI6IFtcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIk5vcnRoIEFtZXJpY2FcIiwgXG4gICAgICBcImFiYnJcIjogXCJBRFRcIiwgXG4gICAgICBcIm5hbWVcIjogXCJBdGxhbnRpYyBEYXlsaWdodCBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIlNvdXRoIEFtZXJpY2FcIiwgXG4gICAgICBcImFiYnJcIjogXCJBTVNUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiQW1hem9uIFN1bW1lciBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIlNvdXRoIEFtZXJpY2FcIiwgXG4gICAgICBcImFiYnJcIjogXCJCUlRcIiwgXG4gICAgICBcIm5hbWVcIjogXCJCcmFzXFx1MDBlZGxpYSB0aW1lXCJcbiAgICB9IFxuICBdLCBcbiAgXCIrMTI0NVwiOiBbXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJQYWNpZmljXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiQ0hBU1RcIiwgXG4gICAgICBcIm5hbWVcIjogXCJDaGF0aGFtIElzbGFuZCBTdGFuZGFyZCBUaW1lXCJcbiAgICB9XG4gIF0sIFxuICBcIiswNjAwXCI6IFtcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIkFzaWFcIiwgXG4gICAgICBcImFiYnJcIjogXCJCU1RcIiwgXG4gICAgICBcIm5hbWVcIjogXCJCYW5nbGFkZXNoIFN0YW5kYXJkIFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiQXNpYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIllFS1NUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiWWVrYXRlcmluYnVyZyBTdW1tZXIgVGltZVwiXG4gICAgfSxcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIkFzaWFcIiwgXG4gICAgICBcImFiYnJcIjogXCJCU1RcIiwgXG4gICAgICBcIm5hbWVcIjogXCJCYW5nbGFkZXNoIFN0YW5kYXJkIFRpbWVcIlxuICAgIH0gXG4gIF0sIFxuICBcIi0wOTMwXCI6IFtcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIlBhY2lmaWNcIiwgXG4gICAgICBcImFiYnJcIjogXCJNQVJUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiTWFycXVlc2FzIFRpbWVcIlxuICAgIH1cbiAgXSwgXG4gIFwiKzAzMzBcIjogW1xuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiQXNpYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIklSU1RcIiwgXG4gICAgICBcIm5hbWVcIjogXCJJcmFuIFN0YW5kYXJkIFRpbWVcIlxuICAgIH1cbiAgXSwgXG4gIFwiKzExMzBcIjogW1xuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiQXVzdHJhbGlhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiTkZUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiTm9yZm9sayBUaW1lXCJcbiAgICB9XG4gIF0sIFxuICBcIisxMTAwXCI6IFtcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIkFzaWFcIiwgXG4gICAgICBcImFiYnJcIjogXCJWTEFTVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIlZsYWRpdm9zdG9rIFN1bW1lciBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIkF1c3RyYWxpYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIkVEVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIkVhc3Rlcm4gRGF5bGlnaHQgVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJQYWNpZmljXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiTkNUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiTmV3IENhbGVkb25pYSBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIlBhY2lmaWNcIiwgXG4gICAgICBcImFiYnJcIjogXCJQT05UXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiUG9obnBlaSBTdGFuZGFyZCBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIlBhY2lmaWNcIiwgXG4gICAgICBcImFiYnJcIjogXCJTQlRcIiwgXG4gICAgICBcIm5hbWVcIjogXCJTb2xvbW9uIElzbGFuZHNUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIlBhY2lmaWNcIiwgXG4gICAgICBcImFiYnJcIjogXCJWVVRcIiwgXG4gICAgICBcIm5hbWVcIjogXCJWYW51YXR1IFRpbWVcIlxuICAgIH1cbiAgXSwgXG4gIFwiLTA4MDBcIjogW1xuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiTm9ydGggQW1lcmljYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIlBTVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIlBhY2lmaWMgU3RhbmRhcmQgVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJOb3J0aCBBbWVyaWNhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiQUtEVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIkFsYXNrYSBEYXlsaWdodCBUaW1lXCJcbiAgICB9IFxuICBdXG59XG4iXX0=(1)
});
;