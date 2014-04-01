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

},{"./lib/date":5,"./lib/debug":6,"./lib/index":65,"./lib/libraries":66,"./lib/promise":71,"dst":92}],2:[function(require,module,exports){
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

},{"tz":93}],6:[function(require,module,exports){
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
var url_finder = require('../url_finder')

module.exports = function(input) {
  return safe(url_finder(input, function() {
    return '<a href="'+arguments[0]+'">'+arguments[0]+'</a>';
  }))
}

},{"../url_finder":91,"./safe":47}],61:[function(require,module,exports){
var safe = require('./safe')
var url_finder = require('../url_finder')

module.exports = function(input, len) {
  len = parseInt(len, 10) || 1000
  return safe(url_finder(input, function() {
    var ltr = arguments[0].length > len ? arguments[0].slice(0, len) + '...' : arguments[0];
    return '<a href="'+arguments[0]+'">'+ltr+'</a>';
  }))
}

},{"../url_finder":91,"./safe":47}],62:[function(require,module,exports){
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
var global=self;var FilterToken = require('./filter_token')
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
module.exports = function(input, callback) {
  var str = input.toString()
  return str.replace(/(((http(s)?:\/\/)|(mailto:))([\w\d\-\.:@\/?&=%])+)/g, callback)
}
},{}],92:[function(require,module,exports){
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

},{}],93:[function(require,module,exports){
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

},{"./tz":94,"dst":92}],94:[function(require,module,exports){
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
//@ sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvVXNlcnMveGlhbi9naXQvcGxhdGUvYnJvd3Nlci5qcyIsIi9Vc2Vycy94aWFuL2dpdC9wbGF0ZS9saWIvYmxvY2tfY29udGV4dC5qcyIsIi9Vc2Vycy94aWFuL2dpdC9wbGF0ZS9saWIvY29tbWVudF90b2tlbi5qcyIsIi9Vc2Vycy94aWFuL2dpdC9wbGF0ZS9saWIvY29udGV4dC5qcyIsIi9Vc2Vycy94aWFuL2dpdC9wbGF0ZS9saWIvZGF0ZS5qcyIsIi9Vc2Vycy94aWFuL2dpdC9wbGF0ZS9saWIvZGVidWcuanMiLCIvVXNlcnMveGlhbi9naXQvcGxhdGUvbGliL2RlZmF1bHRmaWx0ZXJzLmpzIiwiL1VzZXJzL3hpYW4vZ2l0L3BsYXRlL2xpYi9kZWZhdWx0dGFncy5qcyIsIi9Vc2Vycy94aWFuL2dpdC9wbGF0ZS9saWIvZmlsdGVyX2FwcGxpY2F0aW9uLmpzIiwiL1VzZXJzL3hpYW4vZ2l0L3BsYXRlL2xpYi9maWx0ZXJfY2hhaW4uanMiLCIvVXNlcnMveGlhbi9naXQvcGxhdGUvbGliL2ZpbHRlcl9sb29rdXAuanMiLCIvVXNlcnMveGlhbi9naXQvcGxhdGUvbGliL2ZpbHRlcl9ub2RlLmpzIiwiL1VzZXJzL3hpYW4vZ2l0L3BsYXRlL2xpYi9maWx0ZXJfdG9rZW4uanMiLCIvVXNlcnMveGlhbi9naXQvcGxhdGUvbGliL2ZpbHRlcnMvYWRkLmpzIiwiL1VzZXJzL3hpYW4vZ2l0L3BsYXRlL2xpYi9maWx0ZXJzL2FkZHNsYXNoZXMuanMiLCIvVXNlcnMveGlhbi9naXQvcGxhdGUvbGliL2ZpbHRlcnMvY2FwZmlyc3QuanMiLCIvVXNlcnMveGlhbi9naXQvcGxhdGUvbGliL2ZpbHRlcnMvY2VudGVyLmpzIiwiL1VzZXJzL3hpYW4vZ2l0L3BsYXRlL2xpYi9maWx0ZXJzL2N1dC5qcyIsIi9Vc2Vycy94aWFuL2dpdC9wbGF0ZS9saWIvZmlsdGVycy9kYXRlLmpzIiwiL1VzZXJzL3hpYW4vZ2l0L3BsYXRlL2xpYi9maWx0ZXJzL2RlZmF1bHQuanMiLCIvVXNlcnMveGlhbi9naXQvcGxhdGUvbGliL2ZpbHRlcnMvZGljdHNvcnQuanMiLCIvVXNlcnMveGlhbi9naXQvcGxhdGUvbGliL2ZpbHRlcnMvZGljdHNvcnRyZXZlcnNlZC5qcyIsIi9Vc2Vycy94aWFuL2dpdC9wbGF0ZS9saWIvZmlsdGVycy9kaXZpc2libGVieS5qcyIsIi9Vc2Vycy94aWFuL2dpdC9wbGF0ZS9saWIvZmlsdGVycy9lc2NhcGUuanMiLCIvVXNlcnMveGlhbi9naXQvcGxhdGUvbGliL2ZpbHRlcnMvZmlsZXNpemVmb3JtYXQuanMiLCIvVXNlcnMveGlhbi9naXQvcGxhdGUvbGliL2ZpbHRlcnMvZmlyc3QuanMiLCIvVXNlcnMveGlhbi9naXQvcGxhdGUvbGliL2ZpbHRlcnMvZmxvYXRmb3JtYXQuanMiLCIvVXNlcnMveGlhbi9naXQvcGxhdGUvbGliL2ZpbHRlcnMvZm9yY2VfZXNjYXBlLmpzIiwiL1VzZXJzL3hpYW4vZ2l0L3BsYXRlL2xpYi9maWx0ZXJzL2dldF9kaWdpdC5qcyIsIi9Vc2Vycy94aWFuL2dpdC9wbGF0ZS9saWIvZmlsdGVycy9pbmRleC5qcyIsIi9Vc2Vycy94aWFuL2dpdC9wbGF0ZS9saWIvZmlsdGVycy9pcmllbmNvZGUuanMiLCIvVXNlcnMveGlhbi9naXQvcGxhdGUvbGliL2ZpbHRlcnMvaXRlcml0ZW1zLmpzIiwiL1VzZXJzL3hpYW4vZ2l0L3BsYXRlL2xpYi9maWx0ZXJzL2pvaW4uanMiLCIvVXNlcnMveGlhbi9naXQvcGxhdGUvbGliL2ZpbHRlcnMvbGFzdC5qcyIsIi9Vc2Vycy94aWFuL2dpdC9wbGF0ZS9saWIvZmlsdGVycy9sZW5ndGguanMiLCIvVXNlcnMveGlhbi9naXQvcGxhdGUvbGliL2ZpbHRlcnMvbGVuZ3RoX2lzLmpzIiwiL1VzZXJzL3hpYW4vZ2l0L3BsYXRlL2xpYi9maWx0ZXJzL2xpbmVicmVha3MuanMiLCIvVXNlcnMveGlhbi9naXQvcGxhdGUvbGliL2ZpbHRlcnMvbGluZWJyZWFrc2JyLmpzIiwiL1VzZXJzL3hpYW4vZ2l0L3BsYXRlL2xpYi9maWx0ZXJzL2xpbmVudW1iZXJzLmpzIiwiL1VzZXJzL3hpYW4vZ2l0L3BsYXRlL2xpYi9maWx0ZXJzL2xqdXN0LmpzIiwiL1VzZXJzL3hpYW4vZ2l0L3BsYXRlL2xpYi9maWx0ZXJzL2xvd2VyLmpzIiwiL1VzZXJzL3hpYW4vZ2l0L3BsYXRlL2xpYi9maWx0ZXJzL21ha2VfbGlzdC5qcyIsIi9Vc2Vycy94aWFuL2dpdC9wbGF0ZS9saWIvZmlsdGVycy9waG9uZTJudW1lcmljLmpzIiwiL1VzZXJzL3hpYW4vZ2l0L3BsYXRlL2xpYi9maWx0ZXJzL3BsdXJhbGl6ZS5qcyIsIi9Vc2Vycy94aWFuL2dpdC9wbGF0ZS9saWIvZmlsdGVycy9yYW5kb20uanMiLCIvVXNlcnMveGlhbi9naXQvcGxhdGUvbGliL2ZpbHRlcnMvcmp1c3QuanMiLCIvVXNlcnMveGlhbi9naXQvcGxhdGUvbGliL2ZpbHRlcnMvc2FmZS5qcyIsIi9Vc2Vycy94aWFuL2dpdC9wbGF0ZS9saWIvZmlsdGVycy9zbGljZS5qcyIsIi9Vc2Vycy94aWFuL2dpdC9wbGF0ZS9saWIvZmlsdGVycy9zbHVnaWZ5LmpzIiwiL1VzZXJzL3hpYW4vZ2l0L3BsYXRlL2xpYi9maWx0ZXJzL3NwbGl0LmpzIiwiL1VzZXJzL3hpYW4vZ2l0L3BsYXRlL2xpYi9maWx0ZXJzL3N0cmlwdGFncy5qcyIsIi9Vc2Vycy94aWFuL2dpdC9wbGF0ZS9saWIvZmlsdGVycy90aW1lc2luY2UuanMiLCIvVXNlcnMveGlhbi9naXQvcGxhdGUvbGliL2ZpbHRlcnMvdGltZXVudGlsLmpzIiwiL1VzZXJzL3hpYW4vZ2l0L3BsYXRlL2xpYi9maWx0ZXJzL3RpdGxlLmpzIiwiL1VzZXJzL3hpYW4vZ2l0L3BsYXRlL2xpYi9maWx0ZXJzL3RydW5jYXRlY2hhcnMuanMiLCIvVXNlcnMveGlhbi9naXQvcGxhdGUvbGliL2ZpbHRlcnMvdHJ1bmNhdGV3b3Jkcy5qcyIsIi9Vc2Vycy94aWFuL2dpdC9wbGF0ZS9saWIvZmlsdGVycy91bm9yZGVyZWRfbGlzdC5qcyIsIi9Vc2Vycy94aWFuL2dpdC9wbGF0ZS9saWIvZmlsdGVycy91cHBlci5qcyIsIi9Vc2Vycy94aWFuL2dpdC9wbGF0ZS9saWIvZmlsdGVycy91cmxlbmNvZGUuanMiLCIvVXNlcnMveGlhbi9naXQvcGxhdGUvbGliL2ZpbHRlcnMvdXJsaXplLmpzIiwiL1VzZXJzL3hpYW4vZ2l0L3BsYXRlL2xpYi9maWx0ZXJzL3VybGl6ZXRydW5jLmpzIiwiL1VzZXJzL3hpYW4vZ2l0L3BsYXRlL2xpYi9maWx0ZXJzL3dvcmRjb3VudC5qcyIsIi9Vc2Vycy94aWFuL2dpdC9wbGF0ZS9saWIvZmlsdGVycy93b3Jkd3JhcC5qcyIsIi9Vc2Vycy94aWFuL2dpdC9wbGF0ZS9saWIvZmlsdGVycy95ZXNuby5qcyIsIi9Vc2Vycy94aWFuL2dpdC9wbGF0ZS9saWIvaW5kZXguanMiLCIvVXNlcnMveGlhbi9naXQvcGxhdGUvbGliL2xpYnJhcmllcy5qcyIsIi9Vc2Vycy94aWFuL2dpdC9wbGF0ZS9saWIvbGlicmFyeS5qcyIsIi9Vc2Vycy94aWFuL2dpdC9wbGF0ZS9saWIvbWV0YS5qcyIsIi9Vc2Vycy94aWFuL2dpdC9wbGF0ZS9saWIvbm9kZV9saXN0LmpzIiwiL1VzZXJzL3hpYW4vZ2l0L3BsYXRlL2xpYi9wYXJzZXIuanMiLCIvVXNlcnMveGlhbi9naXQvcGxhdGUvbGliL3Byb21pc2UuanMiLCIvVXNlcnMveGlhbi9naXQvcGxhdGUvbGliL3RhZ190b2tlbi5qcyIsIi9Vc2Vycy94aWFuL2dpdC9wbGF0ZS9saWIvdGFncy9ibG9jay5qcyIsIi9Vc2Vycy94aWFuL2dpdC9wbGF0ZS9saWIvdGFncy9jb21tZW50LmpzIiwiL1VzZXJzL3hpYW4vZ2l0L3BsYXRlL2xpYi90YWdzL2RlYnVnLmpzIiwiL1VzZXJzL3hpYW4vZ2l0L3BsYXRlL2xpYi90YWdzL2V4dGVuZHMuanMiLCIvVXNlcnMveGlhbi9naXQvcGxhdGUvbGliL3RhZ3MvZm9yLmpzIiwiL1VzZXJzL3hpYW4vZ2l0L3BsYXRlL2xpYi90YWdzL2lmL2VuZC5qcyIsIi9Vc2Vycy94aWFuL2dpdC9wbGF0ZS9saWIvdGFncy9pZi9pbmZpeC5qcyIsIi9Vc2Vycy94aWFuL2dpdC9wbGF0ZS9saWIvdGFncy9pZi9saXRlcmFsLmpzIiwiL1VzZXJzL3hpYW4vZ2l0L3BsYXRlL2xpYi90YWdzL2lmL25vZGUuanMiLCIvVXNlcnMveGlhbi9naXQvcGxhdGUvbGliL3RhZ3MvaWYvb3BlcmF0b3JzLmpzIiwiL1VzZXJzL3hpYW4vZ2l0L3BsYXRlL2xpYi90YWdzL2lmL3BhcnNlci5qcyIsIi9Vc2Vycy94aWFuL2dpdC9wbGF0ZS9saWIvdGFncy9pZi9wcmVmaXguanMiLCIvVXNlcnMveGlhbi9naXQvcGxhdGUvbGliL3RhZ3MvaW5jbHVkZS5qcyIsIi9Vc2Vycy94aWFuL2dpdC9wbGF0ZS9saWIvdGFncy9ub3cuanMiLCIvVXNlcnMveGlhbi9naXQvcGxhdGUvbGliL3RhZ3Mvd2l0aC5qcyIsIi9Vc2Vycy94aWFuL2dpdC9wbGF0ZS9saWIvdGV4dF9ub2RlLmpzIiwiL1VzZXJzL3hpYW4vZ2l0L3BsYXRlL2xpYi90ZXh0X3Rva2VuLmpzIiwiL1VzZXJzL3hpYW4vZ2l0L3BsYXRlL2xpYi90b2tlbi5qcyIsIi9Vc2Vycy94aWFuL2dpdC9wbGF0ZS9saWIvdXJsX2ZpbmRlci5qcyIsIi9Vc2Vycy94aWFuL2dpdC9wbGF0ZS9ub2RlX21vZHVsZXMvZHN0L2luZGV4LmpzIiwiL1VzZXJzL3hpYW4vZ2l0L3BsYXRlL25vZGVfbW9kdWxlcy90ei9pbmRleC5qcyIsIi9Vc2Vycy94aWFuL2dpdC9wbGF0ZS9ub2RlX21vZHVsZXMvdHovdHouanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZaQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOURBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbEJBO0FBQ0E7QUFDQTtBQUNBOztBQ0hBO0FBQ0E7QUFDQTtBQUNBOztBQ0hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDUkE7QUFDQTtBQUNBO0FBQ0E7O0FDSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNQQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTEE7QUFDQTtBQUNBO0FBQ0E7O0FDSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDYkE7QUFDQTtBQUNBO0FBQ0E7O0FDSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNQQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNaQTs7QUNBQTtBQUNBO0FBQ0E7QUFDQTs7QUNIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1BBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ0xBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ05BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1pBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDYkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDWkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1hBO0FBQ0E7QUFDQTtBQUNBOztBQ0hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDYkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNQQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNaQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1BBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNUQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ05BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNkQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNaQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNmQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pCQTtBQUNBO0FBQ0E7QUFDQTs7QUNIQTtBQUNBO0FBQ0E7QUFDQTs7QUNIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDUkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNWQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNOQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDWEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNOQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuUEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9DQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUlBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDWkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUJBO0FBQ0E7QUFDQTtBQUNBOztBQ0hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJzb3VyY2VzQ29udGVudCI6WyJyZXF1aXJlKCdkc3QnKVxuXG52YXIgcGxhdGUgPSByZXF1aXJlKCcuL2xpYi9pbmRleCcpXG5pZih0eXBlb2YgZGVmaW5lICE9PSAndW5kZWZpbmVkJyAmJiBkZWZpbmUuYW1kKSB7XG4gIGRlZmluZSgncGxhdGUnLCBbXSwgZnVuY3Rpb24oKSB7IHJldHVybiBwbGF0ZSB9KVxufSBlbHNlIHtcbiAgd2luZG93LnBsYXRlID0gcGxhdGVcbn1cblxucGxhdGUuZGVidWcgPSByZXF1aXJlKCcuL2xpYi9kZWJ1ZycpXG5wbGF0ZS51dGlscyA9IHBsYXRlLmRhdGUgPSByZXF1aXJlKCcuL2xpYi9kYXRlJylcbnBsYXRlLnV0aWxzLlByb21pc2UgPSByZXF1aXJlKCcuL2xpYi9wcm9taXNlJylcbnBsYXRlLnV0aWxzLlNhZmVTdHJpbmcgPSBmdW5jdGlvbihzdHIpIHtcbiAgc3RyID0gbmV3IFN0cmluZyhzdHIpXG4gIHN0ci5zYWZlID0gdHJ1ZVxuICByZXR1cm4gc3RyXG59XG5wbGF0ZS5saWJyYXJpZXMgPSByZXF1aXJlKCcuL2xpYi9saWJyYXJpZXMnKVxuXG5tb2R1bGUuZXhwb3J0cyA9IHBsYXRlXG4iLCJtb2R1bGUuZXhwb3J0cyA9IEJsb2NrQ29udGV4dFxuXG5mdW5jdGlvbiBCbG9ja0NvbnRleHQoKSB7XG4gIHRoaXMuYmxvY2tzID0ge31cbn1cblxudmFyIGNvbnMgPSBCbG9ja0NvbnRleHRcbiAgLCBwcm90byA9IGNvbnMucHJvdG90eXBlXG5cbmNvbnMuS0VZID0gJ19fQkxPQ0tfQ09OVEVYVF9fJ1xuXG5jb25zLmZyb20gPSBmdW5jdGlvbihjb250ZXh0KSB7XG4gIHJldHVybiBjb250ZXh0W3RoaXMuS0VZXVxufVxuXG5jb25zLmludG8gPSBmdW5jdGlvbihjb250ZXh0KSB7XG4gIHJldHVybiBjb250ZXh0W3RoaXMuS0VZXSA9IG5ldyB0aGlzKClcbn1cblxucHJvdG8uYWRkID0gZnVuY3Rpb24oYmxvY2tzKSB7XG4gIGZvcih2YXIgbmFtZSBpbiBibG9ja3MpIHtcbiAgICAodGhpcy5ibG9ja3NbbmFtZV0gPSB0aGlzLmJsb2Nrc1tuYW1lXSB8fCBbXSkudW5zaGlmdChibG9ja3NbbmFtZV0pXG4gIH1cbn1cblxucHJvdG8uZ2V0ID0gZnVuY3Rpb24obmFtZSkge1xuICB2YXIgbGlzdCA9IHRoaXMuYmxvY2tzW25hbWVdIHx8IFtdXG5cbiAgcmV0dXJuIGxpc3RbbGlzdC5sZW5ndGggLSAxXVxufVxuXG5wcm90by5wdXNoID0gZnVuY3Rpb24obmFtZSwgYmxvY2spIHtcbiAgKHRoaXMuYmxvY2tzW25hbWVdID0gdGhpcy5ibG9ja3NbbmFtZV0gfHwgW10pLnB1c2goYmxvY2spXG59XG5cbnByb3RvLnBvcCA9IGZ1bmN0aW9uKG5hbWUpIHtcbiAgcmV0dXJuICh0aGlzLmJsb2Nrc1tuYW1lXSA9IHRoaXMuYmxvY2tzW25hbWVdIHx8IFtdKS5wb3AoKVxufVxuIiwibW9kdWxlLmV4cG9ydHMgPSBDb21tZW50VG9rZW5cblxudmFyIFRva2VuID0gcmVxdWlyZSgnLi90b2tlbicpXG5cbmZ1bmN0aW9uIENvbW1lbnRUb2tlbihjb250ZW50LCBsaW5lKSB7XG4gIFRva2VuLmNhbGwodGhpcywgY29udGVudCwgbGluZSlcbn1cblxudmFyIGNvbnMgPSBDb21tZW50VG9rZW5cbiAgLCBwcm90byA9IGNvbnMucHJvdG90eXBlID0gbmV3IFRva2VuXG5cbnByb3RvLmNvbnN0cnVjdG9yID0gY29uc1xuXG5wcm90by5ub2RlID0gZnVuY3Rpb24ocGFyc2VyKSB7XG4gIC8vIG5vLW9wZXJhdGlvblxuICByZXR1cm4gbnVsbFxufVxuXG4iLCJtb2R1bGUuZXhwb3J0cyA9IENvbnRleHRcblxuZnVuY3Rpb24gQ29udGV4dChmcm9tKSB7XG4gIGlmKGZyb20gJiYgZnJvbS5jb25zdHJ1Y3RvciA9PT0gQ29udGV4dCkge1xuICAgIHJldHVybiBmcm9tXG4gIH1cblxuICBmcm9tID0gZnJvbSB8fCB7fVxuICBmb3IodmFyIGtleSBpbiBmcm9tKSBpZihmcm9tLmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICB0aGlzW2tleV0gPSBmcm9tW2tleV1cbiAgfVxufVxuXG52YXIgY29ucyA9IENvbnRleHRcbiAgLCBwcm90byA9IGNvbnMucHJvdG90eXBlXG5cbnByb3RvLmNvcHkgPSBmdW5jdGlvbigpIHtcbiAgdmFyIEYgPSBGdW5jdGlvbigpXG4gIEYubmFtZSA9IGNvbnMubmFtZVxuICBGLnByb3RvdHlwZSA9IHRoaXNcbiAgcmV0dXJuIG5ldyBGXG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IHsgdGltZTogdGltZV9mb3JtYXQsIGRhdGU6IGZvcm1hdCwgRGF0ZUZvcm1hdDogRGF0ZUZvcm1hdCB9XG5cbnRyeSB7IHJlcXVpcmUoJ3R6JykgfSBjYXRjaChlKSB7IH1cblxuZnVuY3Rpb24gY2FwZmlyc3QgKHN0cikge1xuICByZXR1cm4gc3RyLnJlcGxhY2UoL14oLnsxfSkvLCBmdW5jdGlvbihhLCBtKSB7IHJldHVybiBtLnRvVXBwZXJDYXNlKCkgfSlcbn1cblxuZnVuY3Rpb24gbWFwIChhcnIsIGl0ZXIpIHtcbiAgdmFyIG91dCA9IFtdXG4gIGZvcih2YXIgaSA9IDAsIGxlbiA9IGFyci5sZW5ndGg7IGkgPCBsZW47ICsraSlcbiAgICBvdXQucHVzaChpdGVyKGFycltpXSwgaSwgYXJyKSlcbiAgcmV0dXJuIG91dFxufVxuXG5mdW5jdGlvbiByZWR1Y2UoYXJyLCBpdGVyLCBzdGFydCkge1xuICBhcnIgPSBhcnIuc2xpY2UoKVxuICBpZihzdGFydCAhPT0gdW5kZWZpbmVkKVxuICAgIGFyci51bnNoaWZ0KHN0YXJ0KVxuXG4gIGlmKGFyci5sZW5ndGggPT09IDApXG4gICAgdGhyb3cgbmV3IEVycm9yKCdyZWR1Y2Ugb2YgZW1wdHkgYXJyYXknKVxuXG4gIGlmKGFyci5sZW5ndGggPT09IDEpXG4gICAgcmV0dXJuIGFyclswXVxuXG4gIHZhciBvdXQgPSBhcnIuc2xpY2UoKVxuICAgICwgaXRlbSA9IGFyci5zaGlmdCgpXG5cbiAgZG8ge1xuICAgIGl0ZW0gPSBpdGVyKGl0ZW0sIGFyci5zaGlmdCgpKVxuICB9IHdoaWxlKGFyci5sZW5ndGgpXG5cbiAgcmV0dXJuIGl0ZW1cbn1cblxuZnVuY3Rpb24gc3RydG9hcnJheShzdHIpIHtcbiAgdmFyIGFyciA9IFtdXG4gIGZvcih2YXIgaSA9IDAsIGxlbiA9IHN0ci5sZW5ndGg7IGkgPCBsZW47ICsraSlcbiAgICBhcnIucHVzaChzdHIuY2hhckF0KGkpKVxuICByZXR1cm4gYXJyXG59XG5cbnZhciBXRUVLREFZUyA9IFsgJ3N1bmRheScsICdtb25kYXknLCAndHVlc2RheScsICd3ZWRuZXNkYXknLCAndGh1cnNkYXknLCAnZnJpZGF5JywgJ3NhdHVyZGF5JyBdXG4gICwgV0VFS0RBWVNfQUJCUiA9IG1hcChXRUVLREFZUywgZnVuY3Rpb24oeCkgeyByZXR1cm4gc3RydG9hcnJheSh4KS5zbGljZSgwLCAzKS5qb2luKCcnKSB9KVxuICAsIFdFRUtEQVlTX1JFViA9IHJlZHVjZShtYXAoV0VFS0RBWVMsIGZ1bmN0aW9uKHgsIGkpIHsgcmV0dXJuIFt4LCBpXSB9KSwgZnVuY3Rpb24obGhzLCByaHMpIHsgbGhzW3Joc1swXV0gPSByaHNbMV07IHJldHVybiBsaHMgfSwge30pXG4gICwgTU9OVEhTID0gWyAnamFudWFyeScsICdmZWJydWFyeScsICdtYXJjaCcsICdhcHJpbCcsICdtYXknLCAnanVuZScsICdqdWx5JywgJ2F1Z3VzdCcsICdzZXB0ZW1iZXInLCAnb2N0b2JlcicsICdub3ZlbWJlcicsICdkZWNlbWJlcicgXVxuICAsIE1PTlRIU18zID0gbWFwKE1PTlRIUywgZnVuY3Rpb24oeCkgeyByZXR1cm4gc3RydG9hcnJheSh4KS5zbGljZSgwLCAzKS5qb2luKCcnKSB9KVxuICAsIE1PTlRIU18zX1JFViA9IHJlZHVjZShtYXAoTU9OVEhTXzMsIGZ1bmN0aW9uKHgsIGkpIHsgcmV0dXJuIFt4LCBpXSB9KSwgZnVuY3Rpb24obGhzLCByaHMpIHsgbGhzW3Joc1swXV0gPSByaHNbMV07IHJldHVybiBsaHMgfSwge30pXG4gICwgTU9OVEhTX0FQID0gW1xuICAgICdKYW4uJ1xuICAsICdGZWIuJ1xuICAsICdNYXJjaCdcbiAgLCAnQXByaWwnXG4gICwgJ01heSdcbiAgLCAnSnVuZSdcbiAgLCAnSnVseSdcbiAgLCAnQXVnLidcbiAgLCAnU2VwdC4nXG4gICwgJ09jdC4nXG4gICwgJ05vdi4nXG4gICwgJ0RlYy4nXG4gIF1cblxuXG52YXIgTU9OVEhTX0FMVCA9IHtcbiAgMTogJ0phbnVhcnknLFxuICAyOiAnRmVicnVhcnknLFxuICAzOiAnTWFyY2gnLFxuICA0OiAnQXByaWwnLFxuICA1OiAnTWF5JyxcbiAgNjogJ0p1bmUnLFxuICA3OiAnSnVseScsXG4gIDg6ICdBdWd1c3QnLFxuICA5OiAnU2VwdGVtYmVyJyxcbiAgMTA6ICdPY3RvYmVyJyxcbiAgMTE6ICdOb3ZlbWJlcicsXG4gIDEyOiAnRGVjZW1iZXInXG59XG5cbmZ1bmN0aW9uIEZvcm1hdHRlcih0KSB7XG4gIHRoaXMuZGF0YSA9IHRcbn1cblxuRm9ybWF0dGVyLnByb3RvdHlwZS5mb3JtYXQgPSBmdW5jdGlvbihzdHIpIHtcbiAgdmFyIGJpdHMgPSBzdHJ0b2FycmF5KHN0cilcbiAgLCBlc2MgPSBmYWxzZVxuICAsIG91dCA9IFtdXG4gICwgYml0XG5cbiAgd2hpbGUoYml0cy5sZW5ndGgpIHtcbiAgICBiaXQgPSBiaXRzLnNoaWZ0KClcblxuICAgIGlmKGVzYykge1xuICAgICAgb3V0LnB1c2goYml0KVxuICAgICAgZXNjID0gZmFsc2VcbiAgICB9IGVsc2UgaWYoYml0ID09PSAnXFxcXCcpIHtcbiAgICAgIGVzYyA9IHRydWVcbiAgICB9IGVsc2UgaWYodGhpc1tiaXRdKSB7XG4gICAgICBvdXQucHVzaCh0aGlzW2JpdF0oKSlcbiAgICB9IGVsc2Uge1xuICAgICAgb3V0LnB1c2goYml0KVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiBvdXQuam9pbignJylcbn1cblxuZnVuY3Rpb24gVGltZUZvcm1hdCh0KSB7XG4gIEZvcm1hdHRlci5jYWxsKHRoaXMsIHQpXG59XG5cbnZhciBwcm90byA9IFRpbWVGb3JtYXQucHJvdG90eXBlID0gbmV3IEZvcm1hdHRlcigpXG5cbnByb3RvLmEgPSBmdW5jdGlvbigpIHtcbiAgLy8gJ2EubS4nIG9yICdwLm0uJ1xuICBpZiAodGhpcy5kYXRhLmdldEhvdXJzKCkgPiAxMSlcbiAgICByZXR1cm4gJ3AubS4nXG4gIHJldHVybiAnYS5tLidcbn1cblxucHJvdG8uQSA9IGZ1bmN0aW9uKCkge1xuICAvLyAnQU0nIG9yICdQTSdcbiAgaWYgKHRoaXMuZGF0YS5nZXRIb3VycygpID4gMTEpXG4gICAgcmV0dXJuICdQTSdcbiAgcmV0dXJuICdBTSdcbn1cblxucHJvdG8uZiA9IGZ1bmN0aW9uKCkge1xuICAvKlxuICBUaW1lLCBpbiAxMi1ob3VyIGhvdXJzIGFuZCBtaW51dGVzLCB3aXRoIG1pbnV0ZXMgbGVmdCBvZmYgaWYgdGhleSdyZVxuICB6ZXJvLlxuICBFeGFtcGxlczogJzEnLCAnMTozMCcsICcyOjA1JywgJzInXG4gIFByb3ByaWV0YXJ5IGV4dGVuc2lvbi5cbiAgKi9cbiAgaWYgKHRoaXMuZGF0YS5nZXRNaW51dGVzKCkgPT0gMClcbiAgICByZXR1cm4gdGhpcy5nKClcbiAgcmV0dXJuIHRoaXMuZygpICsgXCI6XCIgKyB0aGlzLmkoKVxufVxuXG5wcm90by5nID0gZnVuY3Rpb24oKSB7XG4gIC8vIEhvdXIsIDEyLWhvdXIgZm9ybWF0IHdpdGhvdXQgbGVhZGluZyB6ZXJvcyBpLmUuICcxJyB0byAnMTInXG4gIHZhciBoID0gdGhpcy5kYXRhLmdldEhvdXJzKClcblxuICByZXR1cm4gdGhpcy5kYXRhLmdldEhvdXJzKCkgJSAxMiB8fCAxMlxufVxuXG5wcm90by5HID0gZnVuY3Rpb24oKSB7XG4gIC8vIEhvdXIsIDI0LWhvdXIgZm9ybWF0IHdpdGhvdXQgbGVhZGluZyB6ZXJvcyBpLmUuICcwJyB0byAnMjMnXG4gIHJldHVybiB0aGlzLmRhdGEuZ2V0SG91cnMoKVxufVxuXG5wcm90by5oID0gZnVuY3Rpb24oKSB7XG4gIC8vIEhvdXIsIDEyLWhvdXIgZm9ybWF0IGkuZS4gJzAxJyB0byAnMTInXG4gIHJldHVybiAoJzAnK3RoaXMuZygpKS5zbGljZSgtMilcbn1cblxucHJvdG8uSCA9IGZ1bmN0aW9uKCkge1xuICAvLyBIb3VyLCAyNC1ob3VyIGZvcm1hdCBpLmUuICcwMCcgdG8gJzIzJ1xuICByZXR1cm4gKCcwJyt0aGlzLkcoKSkuc2xpY2UoLTIpXG59XG5cbnByb3RvLmkgPSBmdW5jdGlvbigpIHtcbiAgLy8gTWludXRlcyBpLmUuICcwMCcgdG8gJzU5J1xuICByZXR1cm4gKCcwJyArIHRoaXMuZGF0YS5nZXRNaW51dGVzKCkpLnNsaWNlKC0yKVxufVxuXG5wcm90by5QID0gZnVuY3Rpb24oKSB7XG4gIC8qXG4gIFRpbWUsIGluIDEyLWhvdXIgaG91cnMsIG1pbnV0ZXMgYW5kICdhLm0uJy8ncC5tLicsIHdpdGggbWludXRlcyBsZWZ0IG9mZlxuICBpZiB0aGV5J3JlIHplcm8gYW5kIHRoZSBzdHJpbmdzICdtaWRuaWdodCcgYW5kICdub29uJyBpZiBhcHByb3ByaWF0ZS5cbiAgRXhhbXBsZXM6ICcxIGEubS4nLCAnMTozMCBwLm0uJywgJ21pZG5pZ2h0JywgJ25vb24nLCAnMTI6MzAgcC5tLidcbiAgUHJvcHJpZXRhcnkgZXh0ZW5zaW9uLlxuICAqL1xuICB2YXIgbSA9IHRoaXMuZGF0YS5nZXRNaW51dGVzKClcbiAgICAsIGggPSB0aGlzLmRhdGEuZ2V0SG91cnMoKVxuXG4gIGlmIChtID09IDAgJiYgaCA9PSAwKVxuICAgIHJldHVybiAnbWlkbmlnaHQnXG4gIGlmIChtID09IDAgJiYgaCA9PSAxMilcbiAgICByZXR1cm4gJ25vb24nXG4gIHJldHVybiB0aGlzLmYoKSArIFwiIFwiICsgdGhpcy5hKClcbn1cblxucHJvdG8ucyA9IGZ1bmN0aW9uKCkge1xuICAvLyBTZWNvbmRzIGkuZS4gJzAwJyB0byAnNTknXG4gIHJldHVybiAoJzAnK3RoaXMuZGF0YS5nZXRTZWNvbmRzKCkpLnNsaWNlKC0yKVxufVxuXG5wcm90by51ID0gZnVuY3Rpb24oKSB7XG4gIC8vIE1pY3Jvc2Vjb25kc1xuICByZXR1cm4gdGhpcy5kYXRhLmdldE1pbGxpc2Vjb25kcygpXG59XG5cbi8vIERhdGVGb3JtYXRcblxuZnVuY3Rpb24gRGF0ZUZvcm1hdCh0KSB7XG4gIHRoaXMuZGF0YSA9IHRcbiAgdGhpcy55ZWFyX2RheXMgPSBbMCwgMzEsIDU5LCA5MCwgMTIwLCAxNTEsIDE4MSwgMjEyLCAyNDMsIDI3MywgMzA0LCAzMzRdXG59XG5cbnByb3RvID0gRGF0ZUZvcm1hdC5wcm90b3R5cGUgPSBuZXcgVGltZUZvcm1hdCgpXG5cbnByb3RvLmNvbnRydWN0b3IgPSBEYXRlRm9ybWF0XG5cbnByb3RvLmIgPSBmdW5jdGlvbigpIHtcbiAgLy8gTW9udGgsIHRleHR1YWwsIDMgbGV0dGVycywgbG93ZXJjYXNlIGUuZy4gJ2phbidcbiAgcmV0dXJuIE1PTlRIU18zW3RoaXMuZGF0YS5nZXRNb250aCgpXVxufVxuXG5wcm90by5jPSBmdW5jdGlvbigpIHtcbiAgLypcbiAgSVNPIDg2MDEgRm9ybWF0XG4gIEV4YW1wbGUgOiAnMjAwOC0wMS0wMlQxMDozMDowMC4wMDAxMjMnXG4gICovXG4gIHJldHVybiB0aGlzLmRhdGEudG9JU09TdHJpbmcgPyB0aGlzLmRhdGEudG9JU09TdHJpbmcoKSA6ICcnXG59XG5cbnByb3RvLmQgPSBmdW5jdGlvbigpIHtcbiAgLy8gRGF5IG9mIHRoZSBtb250aCwgMiBkaWdpdHMgd2l0aCBsZWFkaW5nIHplcm9zIGkuZS4gJzAxJyB0byAnMzEnXG4gIHJldHVybiAoJzAnK3RoaXMuZGF0YS5nZXREYXRlKCkpLnNsaWNlKC0yKVxufVxuXG5wcm90by5EID0gZnVuY3Rpb24oKSB7XG4gIC8vIERheSBvZiB0aGUgd2VlaywgdGV4dHVhbCwgMyBsZXR0ZXJzIGUuZy4gJ0ZyaSdcbiAgcmV0dXJuIGNhcGZpcnN0KFdFRUtEQVlTX0FCQlJbdGhpcy5kYXRhLmdldERheSgpXSlcbn1cblxucHJvdG8uRSA9IGZ1bmN0aW9uKCkge1xuICAvLyBBbHRlcm5hdGl2ZSBtb250aCBuYW1lcyBhcyByZXF1aXJlZCBieSBzb21lIGxvY2FsZXMuIFByb3ByaWV0YXJ5IGV4dGVuc2lvbi5cbiAgcmV0dXJuIE1PTlRIU19BTFRbdGhpcy5kYXRhLmdldE1vbnRoKCkrMV1cbn1cblxucHJvdG8uRj0gZnVuY3Rpb24oKSB7XG4gIC8vIE1vbnRoLCB0ZXh0dWFsLCBsb25nIGUuZy4gJ0phbnVhcnknXG4gIHJldHVybiBjYXBmaXJzdChNT05USFNbdGhpcy5kYXRhLmdldE1vbnRoKCldKVxufVxuXG5wcm90by5JID0gZnVuY3Rpb24oKSB7XG4gIC8vICcxJyBpZiBEYXlsaWdodCBTYXZpbmdzIFRpbWUsICcwJyBvdGhlcndpc2UuXG4gIHJldHVybiB0aGlzLmRhdGEuaXNEU1QoKSA/ICcxJyA6ICcwJ1xufVxuXG5wcm90by5qID0gZnVuY3Rpb24oKSB7XG4gIC8vIERheSBvZiB0aGUgbW9udGggd2l0aG91dCBsZWFkaW5nIHplcm9zIGkuZS4gJzEnIHRvICczMSdcbiAgcmV0dXJuIHRoaXMuZGF0YS5nZXREYXRlKClcbn1cblxucHJvdG8ubCA9IGZ1bmN0aW9uKCkge1xuICAvLyBEYXkgb2YgdGhlIHdlZWssIHRleHR1YWwsIGxvbmcgZS5nLiAnRnJpZGF5J1xuICByZXR1cm4gY2FwZmlyc3QoV0VFS0RBWVNbdGhpcy5kYXRhLmdldERheSgpXSlcbn1cblxucHJvdG8uTCA9IGZ1bmN0aW9uKCkge1xuICAvLyBCb29sZWFuIGZvciB3aGV0aGVyIGl0IGlzIGEgbGVhcCB5ZWFyIGkuZS4gVHJ1ZSBvciBGYWxzZVxuICAvLyBTZWxlY3RzIHRoaXMgeWVhcidzIEZlYnJ1YXJ5IDI5dGggYW5kIGNoZWNrcyBpZiB0aGUgbW9udGhcbiAgLy8gaXMgc3RpbGwgRmVicnVhcnkuXG4gIHJldHVybiAobmV3IERhdGUodGhpcy5kYXRhLmdldEZ1bGxZZWFyKCksIDEsIDI5KS5nZXRNb250aCgpKSA9PT0gMVxufVxuXG5wcm90by5tID0gZnVuY3Rpb24oKSB7XG4gIC8vIE1vbnRoIGkuZS4gJzAxJyB0byAnMTInXCJcbiAgcmV0dXJuICgnMCcrKHRoaXMuZGF0YS5nZXRNb250aCgpKzEpKS5zbGljZSgtMilcbn1cblxucHJvdG8uTSA9IGZ1bmN0aW9uKCkge1xuICAvLyBNb250aCwgdGV4dHVhbCwgMyBsZXR0ZXJzIGUuZy4gJ0phbidcbiAgcmV0dXJuIGNhcGZpcnN0KE1PTlRIU18zW3RoaXMuZGF0YS5nZXRNb250aCgpXSlcbn1cblxucHJvdG8ubiA9IGZ1bmN0aW9uKCkge1xuICAvLyBNb250aCB3aXRob3V0IGxlYWRpbmcgemVyb3MgaS5lLiAnMScgdG8gJzEyJ1xuICByZXR1cm4gdGhpcy5kYXRhLmdldE1vbnRoKCkgKyAxXG59XG5cbnByb3RvLk4gPSBmdW5jdGlvbigpIHtcbiAgLy8gTW9udGggYWJicmV2aWF0aW9uIGluIEFzc29jaWF0ZWQgUHJlc3Mgc3R5bGUuIFByb3ByaWV0YXJ5IGV4dGVuc2lvbi5cbiAgcmV0dXJuIE1PTlRIU19BUFt0aGlzLmRhdGEuZ2V0TW9udGgoKV1cbn1cblxucHJvdG8uTyA9IGZ1bmN0aW9uKCkge1xuICAvLyBEaWZmZXJlbmNlIHRvIEdyZWVud2ljaCB0aW1lIGluIGhvdXJzIGUuZy4gJyswMjAwJ1xuXG4gIHZhciB0em9mZnMgPSB0aGlzLmRhdGEuZ2V0VGltZXpvbmVPZmZzZXQoKVxuICAgICwgb2ZmcyA9IH5+KHR6b2ZmcyAvIDYwKVxuICAgICwgbWlucyA9ICgnMDAnICsgfn5NYXRoLmFicyh0em9mZnMgJSA2MCkpLnNsaWNlKC0yKVxuICBcbiAgcmV0dXJuICgodHpvZmZzID4gMCkgPyAnLScgOiAnKycpICsgKCcwMCcgKyBNYXRoLmFicyhvZmZzKSkuc2xpY2UoLTIpICsgbWluc1xufVxuXG5wcm90by5yID0gZnVuY3Rpb24oKSB7XG4gIC8vIFJGQyAyODIyIGZvcm1hdHRlZCBkYXRlIGUuZy4gJ1RodSwgMjEgRGVjIDIwMDAgMTY6MDE6MDcgKzAyMDAnXG4gIHJldHVybiB0aGlzLmZvcm1hdCgnRCwgaiBNIFkgSDppOnMgTycpXG59XG5cbnByb3RvLlMgPSBmdW5jdGlvbigpIHtcbiAgLyogRW5nbGlzaCBvcmRpbmFsIHN1ZmZpeCBmb3IgdGhlIGRheSBvZiB0aGUgbW9udGgsIDIgY2hhcmFjdGVycyBpLmUuICdzdCcsICduZCcsICdyZCcgb3IgJ3RoJyAqL1xuICB2YXIgZCA9IHRoaXMuZGF0YS5nZXREYXRlKClcblxuICBpZiAoZCA+PSAxMSAmJiBkIDw9IDEzKVxuICAgIHJldHVybiAndGgnXG4gIHZhciBsYXN0ID0gZCAlIDEwXG5cbiAgaWYgKGxhc3QgPT0gMSlcbiAgICByZXR1cm4gJ3N0J1xuICBpZiAobGFzdCA9PSAyKVxuICAgIHJldHVybiAnbmQnXG4gIGlmIChsYXN0ID09IDMpXG4gICAgcmV0dXJuICdyZCdcbiAgcmV0dXJuICd0aCdcbn1cblxucHJvdG8udCA9IGZ1bmN0aW9uKCkge1xuICAvLyBOdW1iZXIgb2YgZGF5cyBpbiB0aGUgZ2l2ZW4gbW9udGggaS5lLiAnMjgnIHRvICczMSdcbiAgLy8gVXNlIGEgamF2YXNjcmlwdCB0cmljayB0byBkZXRlcm1pbmUgdGhlIGRheXMgaW4gYSBtb250aFxuICByZXR1cm4gMzIgLSBuZXcgRGF0ZSh0aGlzLmRhdGEuZ2V0RnVsbFllYXIoKSwgdGhpcy5kYXRhLmdldE1vbnRoKCksIDMyKS5nZXREYXRlKClcbn1cblxucHJvdG8uVCA9IGZ1bmN0aW9uKCkge1xuICAvLyBUaW1lIHpvbmUgb2YgdGhpcyBtYWNoaW5lIGUuZy4gJ0VTVCcgb3IgJ01EVCdcbiAgaWYodGhpcy5kYXRhLnR6aW5mbykge1xuICAgIHJldHVybiB0aGlzLmRhdGEudHppbmZvKCkuYWJiciB8fCAnPz8/J1xuICB9XG4gIHJldHVybiAnPz8/J1xufVxuXG5wcm90by5VID0gZnVuY3Rpb24oKSB7XG4gIC8vIFNlY29uZHMgc2luY2UgdGhlIFVuaXggZXBvY2ggKEphbnVhcnkgMSAxOTcwIDAwOjAwOjAwIEdNVClcbiAgLy8gVVRDKCkgcmV0dXJuIG1pbGxpc2Vjb25kcyBmcm1vIHRoZSBlcG9jaFxuICAvLyByZXR1cm4gTWF0aC5yb3VuZCh0aGlzLmRhdGEuVVRDKCkgKiAxMDAwKVxuICByZXR1cm4gfn4odGhpcy5kYXRhIC8gMTAwMClcbn1cblxucHJvdG8udyA9IGZ1bmN0aW9uKCkge1xuICAvLyBEYXkgb2YgdGhlIHdlZWssIG51bWVyaWMsIGkuZS4gJzAnIChTdW5kYXkpIHRvICc2JyAoU2F0dXJkYXkpXG4gIHJldHVybiB0aGlzLmRhdGEuZ2V0RGF5KClcbn1cblxucHJvdG8uVyA9IGZ1bmN0aW9uKCkge1xuICAvLyBJU08tODYwMSB3ZWVrIG51bWJlciBvZiB5ZWFyLCB3ZWVrcyBzdGFydGluZyBvbiBNb25kYXlcbiAgLy8gQWxnb3JpdGhtIGZyb20gaHR0cDovL3d3dy5wZXJzb25hbC5lY3UuZWR1L21jY2FydHlyL0lTT3dkQUxHLnR4dFxuICB2YXIgamFuMV93ZWVrZGF5ID0gbmV3IERhdGUodGhpcy5kYXRhLmdldEZ1bGxZZWFyKCksIDAsIDEpLmdldERheSgpIFxuICAgICwgd2Vla2RheSA9IHRoaXMuZGF0YS5nZXREYXkoKVxuICAgICwgZGF5X29mX3llYXIgPSB0aGlzLnooKVxuICAgICwgd2Vla19udW1iZXJcbiAgICAsIGkgPSAzNjVcblxuICBpZihkYXlfb2ZfeWVhciA8PSAoOCAtIGphbjFfd2Vla2RheSkgJiYgamFuMV93ZWVrZGF5ID4gNCkge1xuICAgIGlmKGphbjFfd2Vla2RheSA9PT0gNSB8fCAoamFuMV93ZWVrZGF5ID09PSA2ICYmIHRoaXMuTC5jYWxsKHtkYXRhOm5ldyBEYXRlKHRoaXMuZGF0YS5nZXRGdWxsWWVhcigpLTEsIDAsIDEpfSkpKSB7XG4gICAgICB3ZWVrX251bWJlciA9IDUzXG4gICAgfSBlbHNlIHtcbiAgICAgIHdlZWtfbnVtYmVyID0gNTJcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgaWYodGhpcy5MKCkpIHtcbiAgICAgIGkgPSAzNjZcbiAgICB9XG4gICAgaWYoKGkgLSBkYXlfb2ZfeWVhcikgPCAoNCAtIHdlZWtkYXkpKSB7XG4gICAgICB3ZWVrX251bWJlciA9IDFcbiAgICB9IGVsc2Uge1xuICAgICAgd2Vla19udW1iZXIgPSB+figoZGF5X29mX3llYXIgKyAoNyAtIHdlZWtkYXkpICsgKGphbjFfd2Vla2RheSAtIDEpKSAvIDcpXG4gICAgICBpZihqYW4xX3dlZWtkYXkgPiA0KVxuICAgICAgICB3ZWVrX251bWJlciAtPSAxXG4gICAgfVxuICB9XG4gIHJldHVybiB3ZWVrX251bWJlclxufVxuXG5wcm90by55ID0gZnVuY3Rpb24oKSB7XG4gIC8vIFllYXIsIDIgZGlnaXRzIGUuZy4gJzk5J1xuICByZXR1cm4gKCcnK3RoaXMuZGF0YS5nZXRGdWxsWWVhcigpKS5zbGljZSgtMilcbn1cblxucHJvdG8uWSA9IGZ1bmN0aW9uKCkge1xuICAvLyBZZWFyLCA0IGRpZ2l0cyBlLmcuICcxOTk5J1xuICByZXR1cm4gdGhpcy5kYXRhLmdldEZ1bGxZZWFyKClcbn1cblxucHJvdG8ueiA9IGZ1bmN0aW9uKCkge1xuICAvLyBEYXkgb2YgdGhlIHllYXIgaS5lLiAnMCcgdG8gJzM2NSdcblxuICBkb3kgPSB0aGlzLnllYXJfZGF5c1t0aGlzLmRhdGEuZ2V0TW9udGgoKV0gKyB0aGlzLmRhdGEuZ2V0RGF0ZSgpXG4gIGlmICh0aGlzLkwoKSAmJiB0aGlzLmRhdGEuZ2V0TW9udGgoKSA+IDEpXG4gICAgZG95ICs9IDFcbiAgcmV0dXJuIGRveVxufVxuXG5wcm90by5aID0gZnVuY3Rpb24oKSB7XG4gIC8qXG4gIFRpbWUgem9uZSBvZmZzZXQgaW4gc2Vjb25kcyAoaS5lLiAnLTQzMjAwJyB0byAnNDMyMDAnKS4gVGhlIG9mZnNldCBmb3JcbiAgdGltZXpvbmVzIHdlc3Qgb2YgVVRDIGlzIGFsd2F5cyBuZWdhdGl2ZSwgYW5kIGZvciB0aG9zZSBlYXN0IG9mIFVUQyBpc1xuICBhbHdheXMgcG9zaXRpdmUuXG4gICovXG4gIHJldHVybiB0aGlzLmRhdGEuZ2V0VGltZXpvbmVPZmZzZXQoKSAqIC02MFxufVxuXG5cbmZ1bmN0aW9uIGZvcm1hdCh2YWx1ZSwgZm9ybWF0X3N0cmluZykge1xuICB2YXIgZGYgPSBuZXcgRGF0ZUZvcm1hdCh2YWx1ZSlcbiAgcmV0dXJuIGRmLmZvcm1hdChmb3JtYXRfc3RyaW5nKVxufVxuXG5cbmZ1bmN0aW9uIHRpbWVfZm9ybWF0KHZhbHVlLCBmb3JtYXRfc3RyaW5nKSB7XG4gIHZhciB0ZiA9IG5ldyBUaW1lRm9ybWF0KHZhbHVlKVxuICByZXR1cm4gdGYuZm9ybWF0KGZvcm1hdF9zdHJpbmcpXG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBsb2c6IGZ1bmN0aW9uKHZhbHVlKSB7IGNvbnNvbGUubG9nKHZhbHVlKSB9XG4gICwgZXJyb3I6IGZ1bmN0aW9uKGVycikgeyBjb25zb2xlLmVycm9yKGVyciwgZXJyICYmIGVyci5zdGFjaykgfVxuICAsIGluZm86IGZ1bmN0aW9uKHZhbHVlKSB7IH0gXG59XG4iLCJ2YXIgTGlicmFyeSA9IHJlcXVpcmUoJy4vbGlicmFyeScpXG5cbm1vZHVsZS5leHBvcnRzID0gRGVmYXVsdEZpbHRlcnNcblxuZnVuY3Rpb24gRGVmYXVsdEZpbHRlcnMoKSB7XG4gIExpYnJhcnkuY2FsbCh0aGlzLCB0aGlzLmJ1aWx0aW5zKVxufVxuXG52YXIgY29ucyA9IERlZmF1bHRGaWx0ZXJzXG4gICwgcHJvdG8gPSBjb25zLnByb3RvdHlwZSA9IG5ldyBMaWJyYXJ5XG5cbnByb3RvLmNvbnN0cnVjdG9yID0gY29uc1xuXG5wcm90by5idWlsdGlucyA9IHtcbiAgICAnYWRkJzogcmVxdWlyZSgnLi9maWx0ZXJzL2FkZCcpXG4gICwgJ2FkZHNsYXNoZXMnOiByZXF1aXJlKCcuL2ZpbHRlcnMvYWRkc2xhc2hlcycpXG4gICwgJ2NhcGZpcnN0JzogcmVxdWlyZSgnLi9maWx0ZXJzL2NhcGZpcnN0JylcbiAgLCAnY2VudGVyJzogcmVxdWlyZSgnLi9maWx0ZXJzL2NlbnRlcicpXG4gICwgJ2N1dCc6IHJlcXVpcmUoJy4vZmlsdGVycy9jdXQnKVxuICAsICdkYXRlJzogcmVxdWlyZSgnLi9maWx0ZXJzL2RhdGUnKVxuICAsICdkZWZhdWx0JzogcmVxdWlyZSgnLi9maWx0ZXJzL2RlZmF1bHQnKVxuICAsICdkaWN0c29ydCc6IHJlcXVpcmUoJy4vZmlsdGVycy9kaWN0c29ydCcpXG4gICwgJ2RpY3Rzb3J0cmV2ZXJzZWQnOiByZXF1aXJlKCcuL2ZpbHRlcnMvZGljdHNvcnRyZXZlcnNlZCcpXG4gICwgJ2RpdmlzaWJsZWJ5JzogcmVxdWlyZSgnLi9maWx0ZXJzL2RpdmlzaWJsZWJ5JylcbiAgLCAnZXNjYXBlJzogcmVxdWlyZSgnLi9maWx0ZXJzL2VzY2FwZScpXG4gICwgJ2ZpbGVzaXplZm9ybWF0JzogcmVxdWlyZSgnLi9maWx0ZXJzL2ZpbGVzaXplZm9ybWF0JylcbiAgLCAnZmlyc3QnOiByZXF1aXJlKCcuL2ZpbHRlcnMvZmlyc3QnKVxuICAsICdmbG9hdGZvcm1hdCc6IHJlcXVpcmUoJy4vZmlsdGVycy9mbG9hdGZvcm1hdCcpXG4gICwgJ2ZvcmNlX2VzY2FwZSc6IHJlcXVpcmUoJy4vZmlsdGVycy9mb3JjZV9lc2NhcGUnKVxuICAsICdnZXRfZGlnaXQnOiByZXF1aXJlKCcuL2ZpbHRlcnMvZ2V0X2RpZ2l0JylcbiAgLCAnaW5kZXgnOiByZXF1aXJlKCcuL2ZpbHRlcnMvaW5kZXgnKVxuICAsICdpdGVyaXRlbXMnOiByZXF1aXJlKCcuL2ZpbHRlcnMvaXRlcml0ZW1zJylcbiAgLCAnaXJpZW5jb2RlJzogcmVxdWlyZSgnLi9maWx0ZXJzL2lyaWVuY29kZScpXG4gICwgJ2pvaW4nOiByZXF1aXJlKCcuL2ZpbHRlcnMvam9pbicpXG4gICwgJ2xhc3QnOiByZXF1aXJlKCcuL2ZpbHRlcnMvbGFzdCcpXG4gICwgJ2xlbmd0aCc6IHJlcXVpcmUoJy4vZmlsdGVycy9sZW5ndGgnKVxuICAsICdsZW5ndGhfaXMnOiByZXF1aXJlKCcuL2ZpbHRlcnMvbGVuZ3RoX2lzJylcbiAgLCAnbGluZWJyZWFrcyc6IHJlcXVpcmUoJy4vZmlsdGVycy9saW5lYnJlYWtzJylcbiAgLCAnbGluZWJyZWFrc2JyJzogcmVxdWlyZSgnLi9maWx0ZXJzL2xpbmVicmVha3NicicpXG4gICwgJ2xpbmVudW1iZXJzJzogcmVxdWlyZSgnLi9maWx0ZXJzL2xpbmVudW1iZXJzJylcbiAgLCAnbGp1c3QnOiByZXF1aXJlKCcuL2ZpbHRlcnMvbGp1c3QnKVxuICAsICdsb3dlcic6IHJlcXVpcmUoJy4vZmlsdGVycy9sb3dlcicpXG4gICwgJ21ha2VfbGlzdCc6IHJlcXVpcmUoJy4vZmlsdGVycy9tYWtlX2xpc3QnKVxuICAsICdwaG9uZTJudW1lcmljJzogcmVxdWlyZSgnLi9maWx0ZXJzL3Bob25lMm51bWVyaWMnKVxuICAsICdwbHVyYWxpemUnOiByZXF1aXJlKCcuL2ZpbHRlcnMvcGx1cmFsaXplJylcbiAgLCAncmFuZG9tJzogcmVxdWlyZSgnLi9maWx0ZXJzL3JhbmRvbScpXG4gICwgJ3JqdXN0JzogcmVxdWlyZSgnLi9maWx0ZXJzL3JqdXN0JylcbiAgLCAnc2FmZSc6IHJlcXVpcmUoJy4vZmlsdGVycy9zYWZlJylcbiAgLCAnc2xpY2UnOiByZXF1aXJlKCcuL2ZpbHRlcnMvc2xpY2UnKVxuICAsICdzbHVnaWZ5JzogcmVxdWlyZSgnLi9maWx0ZXJzL3NsdWdpZnknKVxuICAsICdzcGxpdCc6IHJlcXVpcmUoJy4vZmlsdGVycy9zcGxpdCcpXG4gICwgJ3N0cmlwdGFncyc6IHJlcXVpcmUoJy4vZmlsdGVycy9zdHJpcHRhZ3MnKVxuICAsICd0aW1lc2luY2UnOiByZXF1aXJlKCcuL2ZpbHRlcnMvdGltZXNpbmNlJylcbiAgLCAndGltZXVudGlsJzogcmVxdWlyZSgnLi9maWx0ZXJzL3RpbWV1bnRpbCcpXG4gICwgJ3RpdGxlJzogcmVxdWlyZSgnLi9maWx0ZXJzL3RpdGxlJylcbiAgLCAndHJ1bmNhdGVjaGFycyc6IHJlcXVpcmUoJy4vZmlsdGVycy90cnVuY2F0ZWNoYXJzJylcbiAgLCAndHJ1bmNhdGV3b3Jkcyc6IHJlcXVpcmUoJy4vZmlsdGVycy90cnVuY2F0ZXdvcmRzJylcbiAgLCAndW5vcmRlcmVkX2xpc3QnOiByZXF1aXJlKCcuL2ZpbHRlcnMvdW5vcmRlcmVkX2xpc3QnKVxuICAsICd1cHBlcic6IHJlcXVpcmUoJy4vZmlsdGVycy91cHBlcicpXG4gICwgJ3VybGVuY29kZSc6IHJlcXVpcmUoJy4vZmlsdGVycy91cmxlbmNvZGUnKVxuICAsICd1cmxpemUnOiByZXF1aXJlKCcuL2ZpbHRlcnMvdXJsaXplJylcbiAgLCAndXJsaXpldHJ1bmMnOiByZXF1aXJlKCcuL2ZpbHRlcnMvdXJsaXpldHJ1bmMnKVxuICAsICd3b3JkY291bnQnOiByZXF1aXJlKCcuL2ZpbHRlcnMvd29yZGNvdW50JylcbiAgLCAnd29yZHdyYXAnOiByZXF1aXJlKCcuL2ZpbHRlcnMvd29yZHdyYXAnKVxuICAsICd5ZXNubyc6IHJlcXVpcmUoJy4vZmlsdGVycy95ZXNubycpXG59XG5cbiIsInZhciBMaWJyYXJ5ID0gcmVxdWlyZSgnLi9saWJyYXJ5JylcblxubW9kdWxlLmV4cG9ydHMgPSBEZWZhdWx0VGFnc1xuXG5mdW5jdGlvbiBEZWZhdWx0VGFncygpIHtcbiAgTGlicmFyeS5jYWxsKHRoaXMsIHRoaXMuYnVpbHRpbnMpXG59XG5cbnZhciBjb25zID0gRGVmYXVsdFRhZ3NcbiAgLCBwcm90byA9IGNvbnMucHJvdG90eXBlID0gbmV3IExpYnJhcnlcblxucHJvdG8uY29uc3RydWN0b3IgPSBjb25zXG5cbnByb3RvLmJ1aWx0aW5zID0ge1xuICAgICdibG9jayc6IHJlcXVpcmUoJy4vdGFncy9ibG9jaycpLnBhcnNlXG4gICwgJ2NvbW1lbnQnOiByZXF1aXJlKCcuL3RhZ3MvY29tbWVudCcpLnBhcnNlXG4gICwgJ2RlYnVnJzogcmVxdWlyZSgnLi90YWdzL2RlYnVnJykucGFyc2VcbiAgLCAnZXh0ZW5kcyc6IHJlcXVpcmUoJy4vdGFncy9leHRlbmRzJykucGFyc2VcbiAgLCAnZm9yJzogcmVxdWlyZSgnLi90YWdzL2ZvcicpLnBhcnNlXG4gICwgJ2lmJzogcmVxdWlyZSgnLi90YWdzL2lmL25vZGUnKS5wYXJzZVxuICAsICdpbmNsdWRlJzogcmVxdWlyZSgnLi90YWdzL2luY2x1ZGUnKS5wYXJzZVxuICAsICdub3cnOiByZXF1aXJlKCcuL3RhZ3Mvbm93JykucGFyc2VcbiAgLCAnd2l0aCc6IHJlcXVpcmUoJy4vdGFncy93aXRoJykucGFyc2Vcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gRmlsdGVyQXBwbGljYXRpb25cblxudmFyIFByb21pc2UgPSByZXF1aXJlKCcuL3Byb21pc2UnKVxuXG5mdW5jdGlvbiBGaWx0ZXJBcHBsaWNhdGlvbihuYW1lLCBiaXRzKSB7XG4gIHRoaXMubmFtZSA9IG5hbWVcbiAgdGhpcy5hcmdzID0gYml0c1xuICB0aGlzLmZpbHRlciA9IG51bGxcbn1cblxudmFyIGNvbnMgPSBGaWx0ZXJBcHBsaWNhdGlvblxuICAsIHByb3RvID0gY29ucy5wcm90b3R5cGVcblxucHJvdG8uYXR0YWNoID0gZnVuY3Rpb24ocGFyc2VyKSB7XG4gIHRoaXMuZmlsdGVyID0gcGFyc2VyLmZpbHRlcnMubG9va3VwKHRoaXMubmFtZSlcbn1cblxucHJvdG8ucmVzb2x2ZSA9IGZ1bmN0aW9uKGNvbnRleHQsIHZhbHVlLCBmcm9tSURYLCBhcmdWYWx1ZXMpIHtcbiAgdmFyIHNlbGYgPSB0aGlzXG4gICAgLCBwcm9taXNlXG4gICAgLCBzdGFydCA9IGZyb21JRFggfHwgMFxuICAgICwgcmVzdWx0XG4gICAgLCB0bXBcblxuICBhcmdWYWx1ZXMgPSBhcmdWYWx1ZXMgfHwgW11cblxuICBpZih2YWx1ZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgcmV0dXJuXG4gIH1cblxuICBpZih2YWx1ZSAmJiB2YWx1ZS5jb25zdHJ1Y3RvciA9PT0gUHJvbWlzZSkge1xuICAgIHByb21pc2UgPSBuZXcgUHJvbWlzZVxuICAgIHZhbHVlLm9uY2UoJ2RvbmUnLCBmdW5jdGlvbih2YWwpIHtcbiAgICAgIHByb21pc2UucmVzb2x2ZShzZWxmLnJlc29sdmUoY29udGV4dCwgdmFsKSlcbiAgICB9KVxuXG4gICAgLy8gc3RhcnQgb3ZlciBvbmNlIHdlJ3ZlIHJlc29sdmVkIHRoZSBiYXNlIHZhbHVlXG4gICAgcmV0dXJuIHByb21pc2VcbiAgfVxuXG4gIGZvcih2YXIgaSA9IHN0YXJ0LCBsZW4gPSBzZWxmLmFyZ3MubGVuZ3RoOyBpIDwgbGVuOyArK2kpIHtcbiAgICB2YXIgYXJnVmFsdWUgPSBzZWxmLmFyZ3NbaV0ucmVzb2x2ZSA/IFxuICAgICAgICBzZWxmLmFyZ3NbaV0ucmVzb2x2ZShjb250ZXh0KSA6XG4gICAgICAgIHNlbGYuYXJnc1tpXVxuXG4gICAgaWYoYXJnVmFsdWUgPT09IHVuZGVmaW5lZCB8fCBhcmdWYWx1ZSA9PT0gbnVsbCkge1xuICAgICAgYXJnVmFsdWVzW2ldID0gYXJnVmFsdWVcbiAgICAgIGNvbnRpbnVlXG4gICAgfVxuXG4gICAgaWYoYXJnVmFsdWUuY29uc3RydWN0b3IgPT09IFByb21pc2UpIHtcbiAgICAgIHByb21pc2UgPSBuZXcgUHJvbWlzZVxuXG4gICAgICBhcmdWYWx1ZS5vbmNlKCdkb25lJywgZnVuY3Rpb24odmFsKSB7XG4gICAgICAgIGFyZ1ZhbHVlc1tpXSA9IHZhbFxuICAgICAgICBwcm9taXNlLnJlc29sdmUoc2VsZi5yZXNvbHZlKCBcbiAgICAgICAgICAgIGNvbnRleHRcbiAgICAgICAgICAsIHZhbHVlXG4gICAgICAgICAgLCBpXG4gICAgICAgICAgLCBhcmdWYWx1ZXNcbiAgICAgICAgKSlcbiAgICAgIH0pXG5cbiAgICAgIHJldHVybiBwcm9taXNlXG4gICAgfVxuXG4gICAgYXJnVmFsdWVzW2ldID0gYXJnVmFsdWVcbiAgfVxuXG4gIHByb21pc2UgPSBuZXcgUHJvbWlzZVxuICB0bXAgPSBzZWxmLmZpbHRlci5hcHBseShudWxsLCBbdmFsdWVdLmNvbmNhdChhcmdWYWx1ZXMpLmNvbmNhdChbcmVhZHldKSlcblxuICBpZih0bXAgIT09IHVuZGVmaW5lZCkge1xuICAgIHJlc3VsdCA9IHRtcFxuICB9XG5cbiAgaWYocmVzdWx0ID09PSB1bmRlZmluZWQpIHtcbiAgICByZXR1cm4gcHJvbWlzZVxuICB9XG5cbiAgcmV0dXJuIHJlc3VsdFxuXG4gIGZ1bmN0aW9uIHJlYWR5KGVyciwgZGF0YSkge1xuICAgIGlmKHByb21pc2UudHJpZ2dlcikgXG4gICAgICByZXR1cm4gcHJvbWlzZS5yZXNvbHZlKGVyciA/IGVyciA6IGRhdGEpXG5cbiAgICByZXN1bHQgPSBkYXRhXG4gIH1cbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gRmlsdGVyQ2hhaW5cblxuZnVuY3Rpb24gRmlsdGVyQ2hhaW4oYml0cykge1xuICB0aGlzLmJpdHMgPSBiaXRzXG59XG5cbnZhciBjb25zID0gRmlsdGVyQ2hhaW5cbiAgLCBwcm90byA9IGNvbnMucHJvdG90eXBlXG5cbnByb3RvLmF0dGFjaCA9IGZ1bmN0aW9uKHBhcnNlcikge1xuICBmb3IodmFyIGkgPSAwLCBsZW4gPSB0aGlzLmJpdHMubGVuZ3RoOyBpIDwgbGVuOyArK2kpIHtcbiAgICBpZih0aGlzLmJpdHNbaV0gJiYgdGhpcy5iaXRzW2ldLmF0dGFjaCkgeyBcbiAgICAgIHRoaXMuYml0c1tpXS5hdHRhY2gocGFyc2VyKVxuICAgIH1cbiAgfVxufVxuXG5wcm90by5yZXNvbHZlID0gZnVuY3Rpb24oY29udGV4dCkge1xuICB2YXIgcmVzdWx0ID0gdGhpcy5iaXRzWzBdLnJlc29sdmUgP1xuICAgICAgdGhpcy5iaXRzWzBdLnJlc29sdmUoY29udGV4dCkgOlxuICAgICAgdGhpcy5iaXRzWzBdXG5cbiAgZm9yKHZhciBpID0gMSwgbGVuID0gdGhpcy5iaXRzLmxlbmd0aDsgaSA8IGxlbjsgKytpKSB7XG4gICAgcmVzdWx0ID0gdGhpcy5iaXRzW2ldLnJlc29sdmUoY29udGV4dCwgcmVzdWx0KVxuICB9XG5cbiAgcmV0dXJuIHJlc3VsdFxufVxuXG4iLCJtb2R1bGUuZXhwb3J0cyA9IEZpbHRlckxvb2t1cFxuXG52YXIgUHJvbWlzZSA9IHJlcXVpcmUoJy4vcHJvbWlzZScpXG5cbmZ1bmN0aW9uIEZpbHRlckxvb2t1cChiaXRzKSB7XG4gIHRoaXMuYml0cyA9IGJpdHNcbn1cblxudmFyIGNvbnMgPSBGaWx0ZXJMb29rdXBcbiAgLCBwcm90byA9IGNvbnMucHJvdG90eXBlXG5cbnByb3RvLnJlc29sdmUgPSBmdW5jdGlvbihjb250ZXh0LCBmcm9tSURYKSB7XG4gIGZyb21JRFggPSBmcm9tSURYIHx8IDBcblxuICB2YXIgc2VsZiA9IHRoaXNcbiAgICAsIGJpdHMgPSBzZWxmLmJpdHNcbiAgICAsIGN1cnJlbnQgPSBjb250ZXh0XG4gICAgLCB0ZW1wb3JhcnkgPSBudWxsXG4gICAgLCBwcm9taXNlXG4gICAgLCByZXN1bHRcbiAgICAsIG5leHRcblxuICBmb3IodmFyIGkgPSBmcm9tSURYLCBsZW4gPSBiaXRzLmxlbmd0aDsgaSA8IGxlbjsgKytpKSB7XG4gICAgaWYoY3VycmVudCA9PT0gdW5kZWZpbmVkIHx8IGN1cnJlbnQgPT09IG51bGwpIHtcbiAgICAgIGJyZWFrXG4gICAgfVxuXG4gICAgLy8gZml4IGZvciBJRTpcbiAgICBpZihiaXRzW2ldID09PSAnc3VwZXInKSB7XG4gICAgICBiaXRzW2ldID0gJ19zdXBlcidcbiAgICB9XG5cbiAgICBuZXh0ID0gY3VycmVudFtiaXRzW2ldXVxuXG4gICAgLy8gY291bGQgYmUgYXN5bmMsIGNvdWxkIGJlIHN5bmMuXG4gICAgaWYodHlwZW9mIG5leHQgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIHByb21pc2UgPSBuZXcgUHJvbWlzZVxuXG4gICAgICBwcm9taXNlLm9uY2UoJ2RvbmUnLCBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgIHRlbXBvcmFyeSA9IGRhdGFcbiAgICAgIH0pXG5cbiAgICAgIGN1cnJlbnQgPSBuZXh0LmNhbGwoY3VycmVudCwgZnVuY3Rpb24oZXJyLCBkYXRhKSB7XG4gICAgICAgIHByb21pc2UucmVzb2x2ZShlcnIgPyBudWxsIDogc2VsZi5yZXNvbHZlKGRhdGEsIGkrMSkpXG4gICAgICB9KVxuXG4gICAgICBpZih0ZW1wb3JhcnkgIT09IG51bGwpXG4gICAgICAgIGN1cnJlbnQgPSB0ZW1wb3JhcnlcblxuICAgICAgcHJvbWlzZS50cmlnZ2VyID0gdGVtcG9yYXJ5ID0gbnVsbFxuXG4gICAgICBpZihjdXJyZW50ID09PSB1bmRlZmluZWQpXG4gICAgICAgIHJldHVybiBwcm9taXNlXG5cbiAgICB9IGVsc2Uge1xuICAgICAgY3VycmVudCA9IG5leHRcbiAgICB9XG5cbiAgfSBcblxuICByZXR1cm4gY3VycmVudFxufVxuIiwibW9kdWxlLmV4cG9ydHMgPSBGaWx0ZXJOb2RlXG5cbnZhciBQcm9taXNlID0gcmVxdWlyZSgnLi9wcm9taXNlJylcbiAgLCBkZWJ1ZyA9IHJlcXVpcmUoJy4vZGVidWcnKVxuXG5mdW5jdGlvbiBGaWx0ZXJOb2RlKGZpbHRlcikge1xuICB0aGlzLmZpbHRlciA9IGZpbHRlclxufVxuXG52YXIgY29ucyA9IEZpbHRlck5vZGVcbiAgLCBwcm90byA9IGNvbnMucHJvdG90eXBlXG5cbmNvbnMuZXNjYXBlID0gZXNjYXBlSFRNTFxuXG5wcm90by5yZW5kZXIgPSBzYWZlbHkoZnVuY3Rpb24oY29udGV4dCkge1xuICB2YXIgc2VsZiA9IHRoaXNcbiAgICAsIHJlc3VsdCA9IHNlbGYuZmlsdGVyLnJlc29sdmUoY29udGV4dClcbiAgICAsIHByb21pc2VcblxuICBpZihyZXN1bHQgPT09IHVuZGVmaW5lZClcbiAgICByZXR1cm4gJydcblxuICBpZihyZXN1bHQgJiYgcmVzdWx0LmNvbnN0cnVjdG9yID09PSBQcm9taXNlKSB7XG4gICAgcHJvbWlzZSA9IG5ldyBQcm9taXNlXG5cbiAgICByZXN1bHQub25jZSgnZG9uZScsIGZ1bmN0aW9uKHJlc3VsdCkge1xuICAgICAgcHJvbWlzZS5yZXNvbHZlKHNlbGYuZm9ybWF0KHJlc3VsdCkpXG4gICAgfSlcblxuICAgIHJldHVybiBwcm9taXNlXG4gIH1cblxuICByZXR1cm4gc2VsZi5mb3JtYXQocmVzdWx0KVxufSlcblxucHJvdG8uZm9ybWF0ID0gZnVuY3Rpb24ocmVzdWx0KSB7XG4gIGlmKHJlc3VsdCAmJiByZXN1bHQuc2FmZSkge1xuICAgIHJldHVybiByZXN1bHQudG9TdHJpbmcoKVxuICB9XG5cbiAgaWYocmVzdWx0ID09PSBudWxsIHx8IHJlc3VsdCA9PT0gdW5kZWZpbmVkKVxuICAgIHJldHVybiAnJ1xuXG4gIHJldHVybiBlc2NhcGVIVE1MKHJlc3VsdCsnJylcbn1cblxuZnVuY3Rpb24gc2FmZWx5KGZuKSB7XG4gIHJldHVybiBmdW5jdGlvbihjb250ZXh0KSB7XG4gICAgdHJ5IHtcbiAgICAgIHJldHVybiBmbi5jYWxsKHRoaXMsIGNvbnRleHQpXG4gICAgfSBjYXRjaChlcnIpIHtcbiAgICAgIGRlYnVnLmluZm8oZXJyKSBcbiAgICAgIHJldHVybiAnJ1xuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiBlc2NhcGVIVE1MKHN0cikge1xuICByZXR1cm4gc3RyXG4gICAgLnJlcGxhY2UoL1xcJi9nLCAnJmFtcDsnKVxuICAgIC5yZXBsYWNlKC88L2csICcmbHQ7JylcbiAgICAucmVwbGFjZSgvPi9nLCAnJmd0OycpXG4gICAgLnJlcGxhY2UoL1wiL2csICcmcXVvdDsnKVxuICAgIC5yZXBsYWNlKC8nL2csICcmIzM5OycpXG59XG4iLCJ2YXIgVG9rZW4gPSByZXF1aXJlKCcuL3Rva2VuJylcbiAgLCBGaWx0ZXJOb2RlID0gcmVxdWlyZSgnLi9maWx0ZXJfbm9kZScpXG5cbm1vZHVsZS5leHBvcnRzID0gRmlsdGVyVG9rZW5cblxuZnVuY3Rpb24gRmlsdGVyVG9rZW4oY29udGVudCwgbGluZSkge1xuICBUb2tlbi5jYWxsKHRoaXMsIGNvbnRlbnQsIGxpbmUpXG59XG5cbnZhciBjb25zID0gRmlsdGVyVG9rZW5cbiAgLCBwcm90byA9IGNvbnMucHJvdG90eXBlID0gbmV3IFRva2VuXG5cbnByb3RvLmNvbnN0cnVjdG9yID0gY29uc1xuXG5wcm90by5ub2RlID0gZnVuY3Rpb24ocGFyc2VyKSB7XG4gIHJldHVybiBuZXcgRmlsdGVyTm9kZShwYXJzZXIuY29tcGlsZSh0aGlzLmNvbnRlbnQpKVxufVxuXG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGlucHV0LCB2YWx1ZSkge1xuICByZXR1cm4gcGFyc2VJbnQoaW5wdXQsIDEwKSArIHBhcnNlSW50KHZhbHVlLCAxMClcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oaW5wdXQpIHtcbiAgcmV0dXJuIGlucHV0LnRvU3RyaW5nKCkucmVwbGFjZSgvJy9nLCBcIlxcXFwnXCIpXG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGlucHV0KSB7XG4gIHZhciBzdHIgPSBpbnB1dC50b1N0cmluZygpO1xuICByZXR1cm4gW3N0ci5zbGljZSgwLDEpLnRvVXBwZXJDYXNlKCksIHN0ci5zbGljZSgxKV0uam9pbignJylcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oaW5wdXQsIGxlbiwgcmVhZHkpIHtcbiAgaWYocmVhZHkgPT09IHVuZGVmaW5lZClcbiAgICBsZW4gPSAwXG5cbiAgdmFyIHN0ciA9IGlucHV0LnRvU3RyaW5nKClcbiAgICAsIHZhbHVlID0gJyAnXG5cbiAgbGVuIC09IHN0ci5sZW5ndGhcbiAgaWYobGVuIDwgMCkgeyBcbiAgICByZXR1cm4gc3RyXG4gIH1cblxuICB2YXIgbGVuX2hhbGYgPSBsZW4vMi4wXG4gICAgLCBhcnIgPSBbXVxuICAgICwgaWR4ID0gTWF0aC5mbG9vcihsZW5faGFsZilcblxuICB3aGlsZShpZHgtLSA+IDApIHtcbiAgICBhcnIucHVzaCh2YWx1ZSlcbiAgfVxuXG4gIGFyciA9IGFyci5qb2luKCcnKVxuICBzdHIgPSBhcnIgKyBzdHIgKyBhcnJcbiAgaWYoKGxlbl9oYWxmIC0gTWF0aC5mbG9vcihsZW5faGFsZikpID4gMCkge1xuICAgIHN0ciA9IGlucHV0LnRvU3RyaW5nKCkubGVuZ3RoICUgMiA9PSAwID8gdmFsdWUgKyBzdHIgOiBzdHIgKyB2YWx1ZVxuICB9XG4gIFxuICByZXR1cm4gc3RyXG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGlucHV0LCB2YWx1ZSkge1xuICB2YXIgc3RyID0gaW5wdXQudG9TdHJpbmcoKVxuICByZXR1cm4gc3RyLnJlcGxhY2UobmV3IFJlZ0V4cCh2YWx1ZSwgXCJnXCIpLCAnJylcbn1cbiIsInZhciBmb3JtYXQgPSByZXF1aXJlKCcuLi9kYXRlJykuZGF0ZVxuICBcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oaW5wdXQsIHZhbHVlLCByZWFkeSkge1xuICBpZiAocmVhZHkgPT09IHVuZGVmaW5lZClcbiAgICB2YWx1ZSA9ICdOIGosIFknXG5cbiAgcmV0dXJuIGZvcm1hdChpbnB1dC5nZXRGdWxsWWVhciA/IGlucHV0IDogbmV3IERhdGUoaW5wdXQpLCB2YWx1ZSlcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oaW5wdXQsIGRlZiwgcmVhZHkpIHtcbiAgcmV0dXJuIGlucHV0ID8gaW5wdXQgOiBkZWZcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oaW5wdXQsIGtleSkge1xuICByZXR1cm4gaW5wdXQuc29ydChmdW5jdGlvbih4LCB5KSB7XG4gICAgaWYoeFtrZXldID4geVtrZXldKSByZXR1cm4gMVxuICAgIGlmKHhba2V5XSA9PSB5W2tleV0pIHJldHVybiAwXG4gICAgaWYoeFtrZXldIDwgeVtrZXldKSByZXR1cm4gLTFcbiAgfSlcbn1cbiIsInZhciBkaWN0c29ydCA9IHJlcXVpcmUoJy4vZGljdHNvcnQnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihpbnB1dCwga2V5KSB7XG4gIHJldHVybiBkaWN0c29ydChpbnB1dCwga2V5KS5yZXZlcnNlKClcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oaW5wdXQsIG51bSkge1xuICByZXR1cm4gaW5wdXQgJSBwYXJzZUludChudW0sIDEwKSA9PSAwXG59XG4iLCJ2YXIgRmlsdGVyTm9kZSA9IHJlcXVpcmUoJy4uL2ZpbHRlcl9ub2RlJylcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihpbnB1dCkge1xuICBpZihpbnB1dCAmJiBpbnB1dC5zYWZlKSB7XG4gICAgcmV0dXJuIGlucHV0XG4gIH1cblxuICBpbnB1dCA9IG5ldyBTdHJpbmcoRmlsdGVyTm9kZS5lc2NhcGUoaW5wdXQpKVxuICBpbnB1dC5zYWZlID0gdHJ1ZVxuICByZXR1cm4gaW5wdXRcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oaW5wdXQpIHtcbiAgdmFyIG51bSA9IChuZXcgTnVtYmVyKGlucHV0KSkudmFsdWVPZigpXG4gICAgLCBzaW5ndWxhciA9IG51bSA9PSAxID8gJycgOiAncydcbiAgICAsIHZhbHVlIFxuICAgIFxuICB2YWx1ZSA9XG4gICAgbnVtIDwgMTAyNCA/IG51bSArICcgYnl0ZScrc2luZ3VsYXIgOlxuICAgIG51bSA8ICgxMDI0KjEwMjQpID8gKG51bS8xMDI0KSsnIEtCJyA6XG4gICAgbnVtIDwgKDEwMjQqMTAyNCoxMDI0KSA/IChudW0gLyAoMTAyNCoxMDI0KSkgKyAnIE1CJyA6XG4gICAgbnVtIC8gKDEwMjQqMTAyNCoxMDI0KSArICcgR0InXG5cbiAgcmV0dXJuIHZhbHVlXG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGlucHV0KSB7XG4gIHJldHVybiBpbnB1dFswXVxufVxuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihpbnB1dCwgdmFsKSB7XG4gIHZhbCA9IHBhcnNlSW50KHZhbCwgMTApXG4gIHZhbCA9IGlzTmFOKHZhbCkgPyAtMSA6IHZhbFxuXG4gIHZhciBpc1Bvc2l0aXZlID0gdmFsID49IDBcbiAgICAsIGFzTnVtYmVyID0gcGFyc2VGbG9hdChpbnB1dClcbiAgICAsIGFic1ZhbHVlID0gTWF0aC5hYnModmFsKVxuICAgICwgcG93ID0gTWF0aC5wb3coMTAsIGFic1ZhbHVlKVxuICAgICwgcG93X21pbnVzX29uZSA9IE1hdGgucG93KDEwLCBNYXRoLm1heChhYnNWYWx1ZS0xLCAwKSlcbiAgICAsIGFzU3RyaW5nXG5cbiAgYXNOdW1iZXIgPSBNYXRoLnJvdW5kKChwb3cgKiBhc051bWJlcikgLyBwb3dfbWludXNfb25lKVxuXG4gIGlmKHZhbCAhPT0gMClcbiAgICBhc051bWJlciAvPSAxMFxuXG4gIGFzU3RyaW5nID0gYXNOdW1iZXIudG9TdHJpbmcoKVxuXG4gIGlmKGlzUG9zaXRpdmUpIHtcbiAgICB2YXIgc3BsaXQgPSBhc1N0cmluZy5zcGxpdCgnLicpXG4gICAgICAsIGRlY2ltYWwgPSBzcGxpdC5sZW5ndGggPiAxID8gc3BsaXRbMV0gOiAnJ1xuXG4gICAgd2hpbGUoZGVjaW1hbC5sZW5ndGggPCB2YWwpIHtcbiAgICAgIGRlY2ltYWwgKz0gJzAnXG4gICAgfVxuXG4gICAgYXNTdHJpbmcgPSBkZWNpbWFsLmxlbmd0aCA/IFtzcGxpdFswXSwgZGVjaW1hbF0uam9pbignLicpIDogc3BsaXRbMF1cbiAgfVxuXG4gIHJldHVybiBhc1N0cmluZ1xufVxuIiwidmFyIEZpbHRlck5vZGUgPSByZXF1aXJlKCcuLi9maWx0ZXJfbm9kZScpXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oaW5wdXQpIHtcbiAgdmFyIHggPSBuZXcgU3RyaW5nKEZpbHRlck5vZGUuZXNjYXBlKGlucHV0KycnKSlcbiAgeC5zYWZlID0gdHJ1ZVxuICByZXR1cm4geFxufVxuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihpbnB1dCwgZGlnaXQpIHtcbiAgdmFyIGlzTnVtID0gIWlzTmFOKHBhcnNlSW50KGlucHV0LCAxMCkpXG4gICAgLCBzdHIgPSBpbnB1dC50b1N0cmluZygpXG4gICAgLCBsZW4gPSBzdHIuc3BsaXQoJycpLmxlbmd0aFxuXG4gIGRpZ2l0ID0gcGFyc2VJbnQoZGlnaXQsIDEwKVxuICBpZihpc051bSAmJiAhaXNOYU4oZGlnaXQpICYmIGRpZ2l0IDw9IGxlbikge1xuICAgIHJldHVybiBzdHIuY2hhckF0KGxlbiAtIGRpZ2l0KVxuICB9XG5cbiAgcmV0dXJuIGlucHV0XG59XG4iLG51bGwsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oaW5wdXQpIHtcbiAgcmV0dXJuIGlucHV0XG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGlucHV0KSB7XG4gIHZhciBvdXRwdXQgPSBbXVxuICBmb3IodmFyIG5hbWUgaW4gaW5wdXQpIGlmKGlucHV0Lmhhc093blByb3BlcnR5KG5hbWUpKSB7XG4gICAgb3V0cHV0LnB1c2goW25hbWUsIGlucHV0W25hbWVdXSlcbiAgfVxuICByZXR1cm4gb3V0cHV0XG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGlucHV0LCBnbHVlKSB7XG4gIGlucHV0ID0gaW5wdXQgaW5zdGFuY2VvZiBBcnJheSA/IGlucHV0IDogaW5wdXQudG9TdHJpbmcoKS5zcGxpdCgnJylcbiAgcmV0dXJuIGlucHV0LmpvaW4oZ2x1ZSlcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oaW5wdXQpIHtcbiAgdmFyIGNiID0gaW5wdXQuY2hhckF0IHx8IGZ1bmN0aW9uKGluZCkgeyByZXR1cm4gaW5wdXRbaW5kXTsgfVxuXG4gIHJldHVybiBjYi5jYWxsKGlucHV0LCBpbnB1dC5sZW5ndGgtMSk7XG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGlucHV0LCByZWFkeSkge1xuICBpZihpbnB1dCAmJiB0eXBlb2YgaW5wdXQubGVuZ3RoID09PSAnZnVuY3Rpb24nKSB7XG4gICAgcmV0dXJuIGlucHV0Lmxlbmd0aChyZWFkeSlcbiAgfVxuICByZXR1cm4gaW5wdXQubGVuZ3RoXG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGlucHV0LCBleHBlY3RlZCwgcmVhZHkpIHtcbiAgdmFyIHRtcFxuICBpZihpbnB1dCAmJiB0eXBlb2YgaW5wdXQubGVuZ3RoID09PSAnZnVuY3Rpb24nKSB7XG4gICAgdG1wID0gaW5wdXQubGVuZ3RoKGZ1bmN0aW9uKGVyciwgbGVuKSB7XG4gICAgICByZWFkeShlcnIsIGVyciA/IG51bGwgOiBsZW4gPT09IGV4cGVjdGVkKVxuICAgIH0pXG5cbiAgICByZXR1cm4gdG1wID09PSB1bmRlZmluZWQgPyB1bmRlZmluZWQgOiB0bXAgPT09IGV4cGVjdGVkXG4gIH1cblxuICByZXR1cm4gaW5wdXQubGVuZ3RoID09PSBleHBlY3RlZFxufVxuIiwidmFyIHNhZmUgPSByZXF1aXJlKCcuL3NhZmUnKVxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGlucHV0KSB7XG4gIHZhciBzdHIgPSBpbnB1dC50b1N0cmluZygpXG4gICAgLCBwYXJhcyA9IHN0ci5zcGxpdCgnXFxuXFxuJylcbiAgICAsIG91dCA9IFtdXG5cbiAgd2hpbGUocGFyYXMubGVuZ3RoKSB7XG4gICAgb3V0LnVuc2hpZnQocGFyYXMucG9wKCkucmVwbGFjZSgvXFxuL2csICc8YnIgLz4nKSlcbiAgfVxuXG4gIHJldHVybiBzYWZlKCc8cD4nK291dC5qb2luKCc8L3A+PHA+JykrJzwvcD4nKVxufVxuIiwidmFyIHNhZmUgPSByZXF1aXJlKCcuL3NhZmUnKVxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGlucHV0KSB7XG4gIHZhciBzdHIgPSBpbnB1dC50b1N0cmluZygpXG4gIHJldHVybiBzYWZlKHN0ci5yZXBsYWNlKC9cXG4vZywgJzxiciAvPicpKVxufVxuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihpbnB1dCkge1xuICB2YXIgc3RyID0gaW5wdXQudG9TdHJpbmcoKVxuICAgICwgYml0cyA9IHN0ci5zcGxpdCgnXFxuJylcbiAgICAsIG91dCA9IFtdXG4gICAgLCBsZW4gPSBiaXRzLmxlbmd0aFxuXG4gIHdoaWxlKGJpdHMubGVuZ3RoKSB7XG4gICAgb3V0LnVuc2hpZnQobGVuIC0gb3V0Lmxlbmd0aCArICcuICcgKyBiaXRzLnBvcCgpKVxuICB9XG5cbiAgcmV0dXJuIG91dC5qb2luKCdcXG4nKVxufVxuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihpbnB1dCwgbnVtKSB7XG4gIHZhciBiaXRzID0gKGlucHV0ID09PSBudWxsIHx8IGlucHV0ID09PSB1bmRlZmluZWQgPyAnJyA6IGlucHV0KS50b1N0cmluZygpLnNwbGl0KCcnKVxuICAgICwgZGlmZmVyZW5jZSA9IG51bSAtIGJpdHMubGVuZ3RoXG5cbiAgLy8gcHVzaCByZXR1cm5zIG5ldyBsZW5ndGggb2YgYXJyYXkuXG4gIHdoaWxlKGRpZmZlcmVuY2UgPiAwKSB7XG4gICAgZGlmZmVyZW5jZSA9IG51bSAtIGJpdHMucHVzaCgnICcpXG4gIH1cblxuICByZXR1cm4gYml0cy5qb2luKCcnKVxufVxuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihpbnB1dCkge1xuICByZXR1cm4gaW5wdXQudG9TdHJpbmcoKS50b0xvd2VyQ2FzZSgpXG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGlucHV0KSB7XG4gIGlucHV0ID0gaW5wdXQgaW5zdGFuY2VvZiBBcnJheSA/IGlucHV0IDogaW5wdXQudG9TdHJpbmcoKS5zcGxpdCgnJylcblxuICByZXR1cm4gaW5wdXRcbn1cbiIsIlxudmFyIExFVFRFUlMgPSB7XG4nYSc6ICcyJywgJ2InOiAnMicsICdjJzogJzInLCAnZCc6ICczJywgJ2UnOiAnMycsXG4nZic6ICczJywgJ2cnOiAnNCcsICdoJzogJzQnLCAnaSc6ICc0JywgJ2onOiAnNScsICdrJzogJzUnLCAnbCc6ICc1JyxcbidtJzogJzYnLCAnbic6ICc2JywgJ28nOiAnNicsICdwJzogJzcnLCAncSc6ICc3JywgJ3InOiAnNycsICdzJzogJzcnLFxuJ3QnOiAnOCcsICd1JzogJzgnLCAndic6ICc4JywgJ3cnOiAnOScsICd4JzogJzknLCAneSc6ICc5JywgJ3onOiAnOSdcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oaW5wdXQpIHtcbiAgdmFyIHN0ciA9IGlucHV0LnRvU3RyaW5nKCkudG9Mb3dlckNhc2UoKS5zcGxpdCgnJylcbiAgICAsIG91dCA9IFtdXG4gICAgLCBsdHJcblxuICB3aGlsZShzdHIubGVuZ3RoKSB7XG4gICAgbHRyID0gc3RyLnBvcCgpXG4gICAgb3V0LnVuc2hpZnQoTEVUVEVSU1tsdHJdID8gTEVUVEVSU1tsdHJdIDogbHRyKVxuICB9XG5cbiAgcmV0dXJuIG91dC5qb2luKCcnKVxufVxuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihpbnB1dCwgcGx1cmFsKSB7XG4gIHBsdXJhbCA9ICh0eXBlb2YgcGx1cmFsID09PSAnc3RyaW5nJyA/IHBsdXJhbCA6ICdzJykuc3BsaXQoJywnKVxuXG4gIHZhciB2YWwgPSBOdW1iZXIoaW5wdXQpXG4gICAgLCBzdWZmaXhcblxuICBzdWZmaXggPSBwbHVyYWxbcGx1cmFsLmxlbmd0aC0xXTtcbiAgaWYodmFsID09PSAxKSB7XG4gICAgc3VmZml4ID0gcGx1cmFsLmxlbmd0aCA+IDEgPyBwbHVyYWxbMF0gOiAnJzsgICAgXG4gIH1cblxuICByZXR1cm4gc3VmZml4XG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGlucHV0KSB7XG4gIHZhciBjYiA9IGlucHV0LmNoYXJBdCB8fCBmdW5jdGlvbihpZHgpIHtcbiAgICByZXR1cm4gdGhpc1tpZHhdO1xuICB9O1xuXG4gIHJldHVybiBjYi5jYWxsKGlucHV0LCBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBpbnB1dC5sZW5ndGgpKVxufVxuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihpbnB1dCwgbnVtKSB7XG4gIHZhciBiaXRzID0gKGlucHV0ID09PSBudWxsIHx8IGlucHV0ID09PSB1bmRlZmluZWQgPyAnJyA6IGlucHV0KS50b1N0cmluZygpLnNwbGl0KCcnKVxuICAgICwgZGlmZmVyZW5jZSA9IG51bSAtIGJpdHMubGVuZ3RoXG5cbiAgLy8gcHVzaCByZXR1cm5zIG5ldyBsZW5ndGggb2YgYXJyYXkuXG4gIC8vIE5COiBbXS51bnNoaWZ0IHJldHVybnMgYHVuZGVmaW5lZGAgaW4gSUU8OS5cbiAgd2hpbGUoZGlmZmVyZW5jZSA+IDApIHtcbiAgICBkaWZmZXJlbmNlID0gKGJpdHMudW5zaGlmdCgnICcpLCBudW0gLSBiaXRzLmxlbmd0aClcbiAgfVxuXG4gIHJldHVybiBiaXRzLmpvaW4oJycpXG59XG4iLCJ2YXIgRmlsdGVyTm9kZSA9IHJlcXVpcmUoJy4uL2ZpbHRlcl9ub2RlJylcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihpbnB1dCkge1xuICBpbnB1dCA9IG5ldyBTdHJpbmcoaW5wdXQpXG4gIGlucHV0LnNhZmUgPSB0cnVlXG4gIHJldHVybiBpbnB1dFxufVxuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihpbnB1dCwgYnkpIHtcbiAgYnkgPSBieS50b1N0cmluZygpXG4gIGlmKGJ5LmNoYXJBdCgwKSA9PT0gJzonKSB7XG4gICAgYnkgPSAnMCcrYnlcbiAgfVxuXG4gIGlmKGJ5LmNoYXJBdChieS5sZW5ndGgtMSkgPT09ICc6Jykge1xuICAgIGJ5ID0gYnkuc2xpY2UoMCwgLTEpXG4gIH1cblxuICB2YXIgc3BsaXRCeSA9IGJ5LnNwbGl0KCc6JylcbiAgICAsIHNsaWNlID0gaW5wdXQuc2xpY2UgfHwgKGZ1bmN0aW9uKCkge1xuICAgICAgICBpbnB1dCA9IHRoaXMudG9TdHJpbmcoKVxuICAgICAgICByZXR1cm4gaW5wdXQuc2xpY2VcbiAgICAgIH0pKClcblxuICByZXR1cm4gc2xpY2UuYXBwbHkoaW5wdXQsIHNwbGl0QnkpXG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGlucHV0KSB7XG4gIGlucHV0ID0gaW5wdXQudG9TdHJpbmcoKVxuICByZXR1cm4gaW5wdXRcbiAgICAgICAgLnJlcGxhY2UoL1teXFx3XFxzXFxkXFwtXS9nLCAnJylcbiAgICAgICAgLnJlcGxhY2UoL15cXHMqLywgJycpXG4gICAgICAgIC5yZXBsYWNlKC9cXHMqJC8sICcnKVxuICAgICAgICAucmVwbGFjZSgvW1xcLVxcc10rL2csICctJylcbiAgICAgICAgLnRvTG93ZXJDYXNlKClcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oaW5wdXQsIGJ5LCByZWFkeSkge1xuICBieSA9IGFyZ3VtZW50cy5sZW5ndGggPT09IDIgPyAnLCcgOiBieVxuICBpbnB1dCA9ICcnK2lucHV0XG4gIHJldHVybiBpbnB1dC5zcGxpdChieSlcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oaW5wdXQpIHtcbiAgdmFyIHN0ciA9IGlucHV0LnRvU3RyaW5nKClcbiAgcmV0dXJuIHN0ci5yZXBsYWNlKC88W14+XSo/Pi9nLCAnJylcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oaW5wdXQsIG4sIHJlYWR5KSB7XG4gIHZhciBpbnB1dCA9IG5ldyBEYXRlKGlucHV0KVxuICAgICwgbm93ICAgPSByZWFkeSA9PT0gdW5kZWZpbmVkID8gbmV3IERhdGUoKSA6IG5ldyBEYXRlKG4pXG4gICAgLCBkaWZmICA9IGlucHV0IC0gbm93XG4gICAgLCBzaW5jZSA9IE1hdGguYWJzKGRpZmYpXG5cbiAgaWYoZGlmZiA+IDApXG4gICAgcmV0dXJuICcwIG1pbnV0ZXMnXG5cbiAgLy8gMzY1LjI1ICogMjQgKiA2MCAqIDYwICogMTAwMCA9PT0geWVhcnNcbiAgdmFyIHllYXJzID0gICB+fihzaW5jZSAvIDMxNTU3NjAwMDAwKVxuICAgICwgbW9udGhzID0gIH5+KChzaW5jZSAtICh5ZWFycyozMTU1NzYwMDAwMCkpIC8gMjU5MjAwMDAwMClcbiAgICAsIGRheXMgPSAgICB+figoc2luY2UgLSAoeWVhcnMgKiAzMTU1NzYwMDAwMCArIG1vbnRocyAqIDI1OTIwMDAwMDApKSAvIDg2NDAwMDAwKVxuICAgICwgaG91cnMgPSAgIH5+KChzaW5jZSAtICh5ZWFycyAqIDMxNTU3NjAwMDAwICsgbW9udGhzICogMjU5MjAwMDAwMCArIGRheXMgKiA4NjQwMDAwMCkpIC8gMzYwMDAwMClcbiAgICAsIG1pbnV0ZXMgPSB+figoc2luY2UgLSAoeWVhcnMgKiAzMTU1NzYwMDAwMCArIG1vbnRocyAqIDI1OTIwMDAwMDAgKyBkYXlzICogODY0MDAwMDAgKyBob3VycyAqIDM2MDAwMDApKSAvIDYwMDAwKVxuICAgICwgcmVzdWx0ID0gW1xuICAgICAgICB5ZWFycyAgID8gcGx1cmFsaXplKHllYXJzLCAgICAneWVhcicpIDogbnVsbFxuICAgICAgLCBtb250aHMgID8gcGx1cmFsaXplKG1vbnRocywgICAnbW9udGgnKSA6IG51bGxcbiAgICAgICwgZGF5cyAgICA/IHBsdXJhbGl6ZShkYXlzLCAgICAgJ2RheScpIDogbnVsbFxuICAgICAgLCBob3VycyAgID8gcGx1cmFsaXplKGhvdXJzLCAgICAnaG91cicpIDogbnVsbFxuICAgICAgLCBtaW51dGVzID8gcGx1cmFsaXplKG1pbnV0ZXMsICAnbWludXRlJykgOiBudWxsXG4gICAgXVxuICAgICwgb3V0ID0gW11cblxuICBmb3IodmFyIGkgPSAwLCBsZW4gPSByZXN1bHQubGVuZ3RoOyBpIDwgbGVuOyArK2kpIHtcbiAgICByZXN1bHRbaV0gIT09IG51bGwgJiYgb3V0LnB1c2gocmVzdWx0W2ldKVxuICB9XG5cbiAgaWYoIW91dC5sZW5ndGgpIHtcbiAgICByZXR1cm4gJzAgbWludXRlcydcbiAgfVxuXG4gIHJldHVybiBvdXRbMF0gKyAob3V0WzFdID8gJywgJyArIG91dFsxXSA6ICcnKVxuXG4gIGZ1bmN0aW9uIHBsdXJhbGl6ZSh4LCBzdHIpIHtcbiAgICByZXR1cm4geCArICcgJyArIHN0ciArICh4ID09PSAxID8gJycgOiAncycpXG4gIH1cbn1cbiIsInZhciB0aW1lc2luY2UgPSByZXF1aXJlKCcuL3RpbWVzaW5jZScpLnRpbWVzaW5jZVxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGlucHV0LCBuKSB7XG4gIHZhciBub3cgPSBuID8gbmV3IERhdGUobikgOiBuZXcgRGF0ZSgpXG4gIHJldHVybiB0aW1lc2luY2Uobm93LCBpbnB1dClcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oaW5wdXQpIHtcbiAgdmFyIHN0ciA9IGlucHV0LnRvU3RyaW5nKClcbiAgICAsIGJpdHMgPSBzdHIuc3BsaXQoL1xcc3sxfS9nKVxuICAgICwgb3V0ID0gW11cbiAgXG4gIHdoaWxlKGJpdHMubGVuZ3RoKSB7XG4gICAgdmFyIHdvcmQgPSBiaXRzLnNoaWZ0KClcbiAgICB3b3JkID0gd29yZC5jaGFyQXQoMCkudG9VcHBlckNhc2UoKSArIHdvcmQuc2xpY2UoMSlcbiAgICBvdXQucHVzaCh3b3JkKVxuICB9XG5cbiAgb3V0ID0gb3V0LmpvaW4oJyAnKVxuICByZXR1cm4gb3V0LnJlcGxhY2UoLyhbYS16XSknKFtBLVpdKS9nLCBmdW5jdGlvbihhLCBtLCB4KSB7IHJldHVybiB4LnRvTG93ZXJDYXNlKCkgfSlcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oaW5wdXQsIG4pIHtcbiAgdmFyIHN0ciA9IGlucHV0LnRvU3RyaW5nKClcbiAgICAsIG51bSA9IHBhcnNlSW50KG4sIDEwKVxuXG4gIGlmKGlzTmFOKG51bSkpXG4gICAgcmV0dXJuIGlucHV0XG5cbiAgaWYoaW5wdXQubGVuZ3RoIDw9IG51bSlcbiAgICByZXR1cm4gaW5wdXRcblxuICByZXR1cm4gaW5wdXQuc2xpY2UoMCwgbnVtKSsnLi4uJ1xufVxuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihpbnB1dCwgbikge1xuICB2YXIgc3RyID0gaW5wdXQudG9TdHJpbmcoKVxuICAgICwgbnVtID0gcGFyc2VJbnQobiwgMTApXG4gICAgLCB3b3Jkc1xuXG4gIGlmKGlzTmFOKG51bSkpXG4gICAgcmV0dXJuIGlucHV0XG5cbiAgd29yZHMgPSBpbnB1dC5zcGxpdCgvXFxzKy8pXG5cbiAgaWYod29yZHMubGVuZ3RoIDw9IG51bSlcbiAgICByZXR1cm4gaW5wdXRcblxuICByZXR1cm4gd29yZHMuc2xpY2UoMCwgbnVtKS5qb2luKCcgJykrJy4uLidcbn1cbiIsInZhciBzYWZlID0gcmVxdWlyZSgnLi9zYWZlJyk7XG5cbnZhciB1bHBhcnNlciA9IGZ1bmN0aW9uKGxpc3QpIHtcbiAgdmFyIG91dCA9IFtdXG4gICAgLCBsID0gbGlzdC5zbGljZSgpXG4gICAgLCBpdGVtXG5cbiAgd2hpbGUobC5sZW5ndGgpIHtcbiAgICBpdGVtID0gbC5wb3AoKVxuXG4gICAgaWYoaXRlbSBpbnN0YW5jZW9mIEFycmF5KVxuICAgICAgb3V0LnVuc2hpZnQoJzx1bD4nK3VscGFyc2VyKGl0ZW0pKyc8L3VsPicpXG4gICAgZWxzZVxuICAgICAgb3V0LnVuc2hpZnQoJzwvbGk+PGxpPicraXRlbSlcbiAgfVxuXG4gIC8vIGdldCByaWQgb2YgdGhlIGxlYWRpbmcgPC9saT4sIGlmIGFueS4gYWRkIHRyYWlsaW5nIDwvbGk+LlxuICByZXR1cm4gb3V0LmpvaW4oJycpLnJlcGxhY2UoL148XFwvbGk+LywgJycpICsgJzwvbGk+J1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGlucHV0KSB7XG4gIHJldHVybiBpbnB1dCBpbnN0YW5jZW9mIEFycmF5ID9cbiAgICBzYWZlKHVscGFyc2VyKGlucHV0KSkgOlxuICAgIGlucHV0XG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGlucHV0KSB7XG4gIHJldHVybiBpbnB1dC50b1N0cmluZygpLnRvVXBwZXJDYXNlKClcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oaW5wdXQpIHtcbiAgcmV0dXJuIGVzY2FwZShpbnB1dC50b1N0cmluZygpKVxufVxuIiwidmFyIHNhZmUgPSByZXF1aXJlKCcuL3NhZmUnKVxudmFyIHVybF9maW5kZXIgPSByZXF1aXJlKCcuLi91cmxfZmluZGVyJylcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihpbnB1dCkge1xuICByZXR1cm4gc2FmZSh1cmxfZmluZGVyKGlucHV0LCBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gJzxhIGhyZWY9XCInK2FyZ3VtZW50c1swXSsnXCI+Jythcmd1bWVudHNbMF0rJzwvYT4nO1xuICB9KSlcbn1cbiIsInZhciBzYWZlID0gcmVxdWlyZSgnLi9zYWZlJylcbnZhciB1cmxfZmluZGVyID0gcmVxdWlyZSgnLi4vdXJsX2ZpbmRlcicpXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oaW5wdXQsIGxlbikge1xuICBsZW4gPSBwYXJzZUludChsZW4sIDEwKSB8fCAxMDAwXG4gIHJldHVybiBzYWZlKHVybF9maW5kZXIoaW5wdXQsIGZ1bmN0aW9uKCkge1xuICAgIHZhciBsdHIgPSBhcmd1bWVudHNbMF0ubGVuZ3RoID4gbGVuID8gYXJndW1lbnRzWzBdLnNsaWNlKDAsIGxlbikgKyAnLi4uJyA6IGFyZ3VtZW50c1swXTtcbiAgICByZXR1cm4gJzxhIGhyZWY9XCInK2FyZ3VtZW50c1swXSsnXCI+JytsdHIrJzwvYT4nO1xuICB9KSlcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oaW5wdXQpIHtcbiAgdmFyIHN0ciA9IGlucHV0LnRvU3RyaW5nKClcbiAgICAsIGJpdHMgPSBzdHIuc3BsaXQoL1xccysvZylcblxuICByZXR1cm4gYml0cy5sZW5ndGhcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oaW5wdXQsIGxlbikge1xuICB2YXIgd29yZHMgPSBpbnB1dC50b1N0cmluZygpLnNwbGl0KC9cXHMrL2cpXG4gICAgLCBvdXQgPSBbXVxuICAgICwgbGVuID0gcGFyc2VJbnQobGVuLCAxMCkgfHwgd29yZHMubGVuZ3RoXG5cbiAgd2hpbGUod29yZHMubGVuZ3RoKSB7XG4gICAgb3V0LnVuc2hpZnQod29yZHMuc3BsaWNlKDAsIGxlbikuam9pbignICcpKVxuICB9XG5cbiAgcmV0dXJuIG91dC5qb2luKCdcXG4nKVxufVxuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihpbnB1dCwgbWFwKSB7XG4gIHZhciBvdXJNYXAgPSBtYXAudG9TdHJpbmcoKS5zcGxpdCgnLCcpXG4gICAgLCB2YWx1ZVxuXG4gIG91ck1hcC5sZW5ndGggPCAzICYmIG91ck1hcC5wdXNoKG91ck1hcFsxXSlcblxuICB2YWx1ZSA9IG91ck1hcFtcbiAgICBpbnB1dCA/IDAgOlxuICAgIGlucHV0ID09PSBmYWxzZSA/IDEgOlxuICAgIDJcbiAgXVxuXG4gIHJldHVybiB2YWx1ZVxufVxuIiwidmFyIGdsb2JhbD1zZWxmO3ZhciBGaWx0ZXJUb2tlbiA9IHJlcXVpcmUoJy4vZmlsdGVyX3Rva2VuJylcbiAgLCBUYWdUb2tlbiA9IHJlcXVpcmUoJy4vdGFnX3Rva2VuJylcbiAgLCBDb21tZW50VG9rZW4gPSByZXF1aXJlKCcuL2NvbW1lbnRfdG9rZW4nKVxuICAsIFRleHRUb2tlbiA9IHJlcXVpcmUoJy4vdGV4dF90b2tlbicpIFxuICAsIGxpYnJhcmllcyA9IHJlcXVpcmUoJy4vbGlicmFyaWVzJylcbiAgLCBQYXJzZXIgPSByZXF1aXJlKCcuL3BhcnNlcicpXG4gICwgQ29udGV4dCA9IHJlcXVpcmUoJy4vY29udGV4dCcpXG4gICwgTWV0YSA9IHJlcXVpcmUoJy4vbWV0YScpXG4gICwgUHJvbWlzZSA9IHJlcXVpcmUoJy4vcHJvbWlzZScpXG5cbm1vZHVsZS5leHBvcnRzID0gVGVtcGxhdGVcblxuLy8gY2lyY3VsYXIgYWxpYXMgdG8gc3VwcG9ydCBvbGRcbi8vIHZlcnNpb25zIG9mIHBsYXRlLlxuVGVtcGxhdGUuVGVtcGxhdGUgPSBUZW1wbGF0ZVxuVGVtcGxhdGUuQ29udGV4dCA9IENvbnRleHRcblxudmFyIGxhdGVyID0gdHlwZW9mIGdsb2JhbCAhPT0gJ3VuZGVmaW5lZCcgPyBcbiAgICBmdW5jdGlvbihmbikgeyBnbG9iYWwuc2V0VGltZW91dChmbiwgMCkgfSA6XG4gICAgZnVuY3Rpb24oZm4pIHsgdGhpcy5zZXRUaW1lb3V0KGZuLCAwKSB9XG5cbmZ1bmN0aW9uIFRlbXBsYXRlKHJhdywgbGlicmFyaWVzLCBwYXJzZXIpIHtcbiAgaWYodHlwZW9mIHJhdyAhPT0gJ3N0cmluZycpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdpbnB1dCBzaG91bGQgYmUgYSBzdHJpbmcnKVxuICB9XG5cbiAgdGhpcy5yYXcgPSByYXdcblxuICBsaWJyYXJpZXMgPSBsaWJyYXJpZXMgfHwge31cblxuICB0aGlzLnRhZ0xpYnJhcnkgPVxuICAgIGxpYnJhcmllcy50YWdfbGlicmFyeSB8fCBUZW1wbGF0ZS5NZXRhLmNyZWF0ZVRhZ0xpYnJhcnkoKVxuXG4gIHRoaXMuZmlsdGVyTGlicmFyeSA9IFxuICAgIGxpYnJhcmllcy5maWx0ZXJfbGlicmFyeSB8fCBUZW1wbGF0ZS5NZXRhLmNyZWF0ZUZpbHRlckxpYnJhcnkoKVxuXG4gIHRoaXMucGx1Z2luTGlicmFyeSA9IFxuICAgIGxpYnJhcmllcy5wbHVnaW5fbGlicmFyeSB8fCBUZW1wbGF0ZS5NZXRhLmNyZWF0ZVBsdWdpbkxpYnJhcnkoKVxuXG4gIHRoaXMucGFyc2VyID0gcGFyc2VyIHx8IFBhcnNlclxuXG4gIHRoaXMudG9rZW5zID0gbnVsbFxufVxuXG52YXIgY29ucyA9IFRlbXBsYXRlXG4gICwgcHJvdG8gPSBjb25zLnByb3RvdHlwZVxuICAsIG1ldGEgPSBjb25zLk1ldGEgPSBuZXcgTWV0YVxuXG5jb25zLmNyZWF0ZVBsdWdpbkxpYnJhcnkgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIG5ldyBsaWJyYXJpZXMuRGVmYXVsdFBsdWdpbkxpYnJhcnkoKVxufVxuXG5wcm90by5nZXROb2RlTGlzdCA9IGZ1bmN0aW9uKCkge1xuICB0aGlzLm5vZGVsaXN0ID0gdGhpcy5ub2RlbGlzdCB8fCB0aGlzLnBhcnNlKClcblxuICByZXR1cm4gdGhpcy5ub2RlbGlzdFxufVxuXG5wcm90by5wYXJzZSA9IGZ1bmN0aW9uKCkge1xuICB2YXIgcGFyc2VyXG5cbiAgdGhpcy50b2tlbnMgPSB0aGlzLnRva2VucyB8fCBjb25zLnRva2VuaXplKHRoaXMucmF3KVxuXG4gIHBhcnNlciA9IG5ldyB0aGlzLnBhcnNlcihcbiAgICAgIHRoaXMudG9rZW5zXG4gICAgLCB0aGlzLnRhZ0xpYnJhcnlcbiAgICAsIHRoaXMuZmlsdGVyTGlicmFyeVxuICAgICwgdGhpcy5wbHVnaW5MaWJyYXJ5XG4gICAgLCB0aGlzXG4gIClcblxuICByZXR1cm4gcGFyc2VyLnBhcnNlKClcbn1cblxucHJvdG8ucmVuZGVyID0gcHJvdGVjdChmdW5jdGlvbihjb250ZXh0LCByZWFkeSkge1xuICBjb250ZXh0ID0gbmV3IENvbnRleHQoY29udGV4dClcblxuICB2YXIgcmVzdWx0XG5cbiAgcmVzdWx0ID0gXG4gIHRoaXNcbiAgICAuZ2V0Tm9kZUxpc3QoKVxuICAgIC5yZW5kZXIoY29udGV4dClcblxuICBpZihyZXN1bHQuY29uc3RydWN0b3IgPT09IFByb21pc2UpIHtcbiAgICByZXN1bHQub25jZSgnZG9uZScsIGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgIHJlYWR5KG51bGwsIGRhdGEpXG4gICAgfSlcbiAgfSBlbHNlIHtcbiAgICBsYXRlcihmdW5jdGlvbigpIHtcbiAgICAgIHJlYWR5KG51bGwsIHJlc3VsdClcbiAgICB9LCAwKVxuICB9XG5cbn0pXG5cbmZ1bmN0aW9uIHByb3RlY3QoZm4pIHtcbiAgcmV0dXJuIGZ1bmN0aW9uKGNvbnRleHQsIHJlYWR5KSB7XG4gICAgaWYoIWNvbnRleHQgfHwgIXJlYWR5KSB7XG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKClcbiAgICB9XG5cbiAgICB0cnkge1xuICAgICAgcmV0dXJuIGZuLmNhbGwodGhpcywgY29udGV4dCwgcmVhZHkpXG4gICAgfSBjYXRjaChlKSB7XG4gICAgICBsYXRlcihmdW5jdGlvbigpIHtcbiAgICAgICAgcmVhZHkoZSwgbnVsbClcbiAgICAgIH0sIDApXG4gICAgfVxuICB9XG59XG5cbmNvbnMuTUFUQ0hfUkUgPSAvXFx7WyUjXFx7XSguKj8pW1xcfSMlXVxcfS9cblxuY29ucy50b2tlbml6ZSA9IGZ1bmN0aW9uKGNvbnRlbnQpIHtcbiAgdmFyIG1hdGNoID0gbnVsbFxuICAgICwgdG9rZW5zID0gW11cbiAgICAsIGxpbmVObyA9IDFcbiAgICAsIGluY0xpbmVObyA9IGZ1bmN0aW9uKHN0cikgeyBsaW5lTm8gKz0gc3RyLnNwbGl0KCdcXG4nKS5sZW5ndGggfVxuICAgICwgbWFwID0ge1xuICAgICAgICAgICclJzogVGFnVG9rZW5cbiAgICAgICAgLCAnIyc6IENvbW1lbnRUb2tlblxuICAgICAgICAsICd7JzogRmlsdGVyVG9rZW5cbiAgICAgIH1cbiAgICAsIHJleCA9IHRoaXMuTUFUQ0hfUkVcbiAgICAsIGxpdGVyYWxcblxuICBkbyB7XG4gICAgbWF0Y2ggPSByZXguZXhlYyhjb250ZW50KVxuICAgIGlmKCFtYXRjaClcbiAgICAgIGNvbnRpbnVlXG5cbiAgICBsaXRlcmFsID0gY29udGVudC5zbGljZSgwLCBtYXRjaC5pbmRleClcbiAgICBpbmNMaW5lTm8obGl0ZXJhbClcbiAgICBpZihtYXRjaC5pbmRleClcbiAgICAgIHRva2Vucy5wdXNoKG5ldyBUZXh0VG9rZW4obGl0ZXJhbC5zbGljZSgwLCBtYXRjaC5pbmRleCwgbGluZU5vKSkpXG5cbiAgICBtYXRjaFsxXSA9IG1hdGNoWzFdXG4gICAgICAucmVwbGFjZSgvXlxccysvLCAnJylcbiAgICAgIC5yZXBsYWNlKC9cXHMrJC8sICcnKVxuXG4gICAgdG9rZW5zLnB1c2gobmV3IG1hcFttYXRjaFswXS5jaGFyQXQoMSldKG1hdGNoWzFdLCBsaW5lTm8pKVxuXG4gICAgY29udGVudCA9IGNvbnRlbnQuc2xpY2UobWF0Y2guaW5kZXggKyBtYXRjaFswXS5sZW5ndGgpXG4gIH0gd2hpbGUoY29udGVudC5sZW5ndGggJiYgbWF0Y2gpXG5cbiAgdG9rZW5zLnB1c2gobmV3IFRleHRUb2tlbihjb250ZW50KSlcblxuICByZXR1cm4gdG9rZW5zXG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBMaWJyYXJ5OiByZXF1aXJlKCcuL2xpYnJhcnknKVxuICAsIERlZmF1bHRQbHVnaW5MaWJyYXJ5OiByZXF1aXJlKCcuL2xpYnJhcnknKVxuICAsIERlZmF1bHRUYWdMaWJyYXJ5OiByZXF1aXJlKCcuL2RlZmF1bHR0YWdzJylcbiAgLCBEZWZhdWx0RmlsdGVyTGlicmFyeTogcmVxdWlyZSgnLi9kZWZhdWx0ZmlsdGVycycpXG59IFxuIiwibW9kdWxlLmV4cG9ydHMgPSBMaWJyYXJ5XG5cbnZhciBQcm9taXNlID0gcmVxdWlyZSgnLi9wcm9taXNlJylcblxuZnVuY3Rpb24gTGlicmFyeShsaWIpIHtcbiAgdGhpcy5yZWdpc3RyeSA9IGxpYiB8fCB7fVxufVxuXG52YXIgY29ucyA9IExpYnJhcnlcbiAgLCBwcm90byA9IGNvbnMucHJvdG90eXBlXG5cbnByb3RvLmxvb2t1cCA9IGVycm9yT25OdWxsKGZ1bmN0aW9uKG5hbWUpIHtcbiAgdmFyIG91dCA9IHRoaXMucmVnaXN0cnlbbmFtZV0gfHwgbnVsbFxuXG4gIGlmKHR5cGVvZiBvdXQgPT09ICdmdW5jdGlvbicgJiYgb3V0Lmxlbmd0aCA9PT0gMiAmJiBuYW1lID09PSAnbG9hZGVyJykge1xuICAgIG91dCA9IFByb21pc2UudG9Qcm9taXNlKG91dClcbiAgfVxuXG4gIHJldHVybiBvdXRcbn0sIFwiQ291bGQgbm90IGZpbmQgezB9IVwiKVxuXG5wcm90by5yZWdpc3RlciA9IGVycm9yT25OdWxsKGZ1bmN0aW9uKG5hbWUsIGl0ZW0pIHtcbiAgaWYodGhpcy5yZWdpc3RyeVtuYW1lXSlcbiAgICByZXR1cm4gbnVsbFxuXG4gIHRoaXMucmVnaXN0cnlbbmFtZV0gPSBpdGVtXG59LCBcInswfSBpcyBhbHJlYWR5IHJlZ2lzdGVyZWQhXCIpXG5cblxuZnVuY3Rpb24gZXJyb3JPbk51bGwoZm4sIG1zZykge1xuICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgdmFyIHJlc3VsdCA9IGZuLmNhbGwodGhpcywgYXJndW1lbnRzWzBdLCBhcmd1bWVudHNbMV0pXG4gICAgICAsIGFyZ3MgPSBhcmd1bWVudHNcblxuICAgIGlmKHJlc3VsdCA9PT0gbnVsbClcbiAgICAgIHRocm93IG5ldyBFcnJvcihtc2cucmVwbGFjZSgvXFx7KFxcZCs/KVxcfS9nLCBmdW5jdGlvbihhLCBtKSB7XG4gICAgICAgIHJldHVybiBhcmdzWyttXVxuICAgICAgfSkpXG5cbiAgICByZXR1cm4gcmVzdWx0XG4gIH1cbn1cblxuIiwidmFyIGxpYnJhcmllcyA9IHJlcXVpcmUoJy4vbGlicmFyaWVzJylcblxubW9kdWxlLmV4cG9ydHMgPSBNZXRhXG5cbmZ1bmN0aW9uIE1ldGEoKSB7XG4gIHRoaXMuX2F1dG9yZWdpc3RlciA9IHtcbiAgICAgIHBsdWdpbjoge31cbiAgICAsIHRhZzoge31cbiAgICAsIGZpbHRlcjoge31cbiAgfVxuXG4gIHRoaXMuX2NhY2hlID0ge31cblxuICB0aGlzLl9jbGFzc2VzID0ge1xuICAgICAgZmlsdGVyOiBsaWJyYXJpZXMuRGVmYXVsdEZpbHRlckxpYnJhcnlcbiAgICAsIHBsdWdpbjogbGlicmFyaWVzLkRlZmF1bHRQbHVnaW5MaWJyYXJ5XG4gICAgLCB0YWc6IGxpYnJhcmllcy5EZWZhdWx0VGFnTGlicmFyeVxuICB9XG59XG5cbnZhciBjb25zID0gTWV0YVxuICAsIHByb3RvID0gY29ucy5wcm90b3R5cGVcblxucHJvdG8uY3JlYXRlUGx1Z2luTGlicmFyeSA9IGNyZWF0ZUxpYnJhcnkoJ3BsdWdpbicpXG5wcm90by5jcmVhdGVGaWx0ZXJMaWJyYXJ5ID0gY3JlYXRlTGlicmFyeSgnZmlsdGVyJylcbnByb3RvLmNyZWF0ZVRhZ0xpYnJhcnkgPSBjcmVhdGVMaWJyYXJ5KCd0YWcnKVxuXG5wcm90by5yZWdpc3RlclBsdWdpbiA9IGNyZWF0ZUF1dG9yZWdpc3RlcigncGx1Z2luJylcbnByb3RvLnJlZ2lzdGVyRmlsdGVyID0gY3JlYXRlQXV0b3JlZ2lzdGVyKCdmaWx0ZXInKVxucHJvdG8ucmVnaXN0ZXJUYWcgPSBjcmVhdGVBdXRvcmVnaXN0ZXIoJ3RhZycpXG5cbmZ1bmN0aW9uIGNyZWF0ZUF1dG9yZWdpc3RlcihuYW1lKSB7XG4gIHJldHVybiBmdW5jdGlvbihrZXksIGl0ZW0pIHtcbiAgICBpZih0aGlzLl9jYWNoZVtuYW1lXSlcbiAgICAgIHRoaXMuX2NhY2hlW25hbWVdLnJlZ2lzdGVyKGtleSwgaXRlbSk7XG4gICAgZWxzZVxuICAgICAgdGhpcy5fYXV0b3JlZ2lzdGVyW25hbWVdW2tleV0gPSBpdGVtO1xuICB9XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZUxpYnJhcnkobmFtZSkge1xuICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgaWYodGhpcy5fY2FjaGVbbmFtZV0pXG4gICAgICByZXR1cm4gdGhpcy5fY2FjaGVbbmFtZV07IFxuXG4gICAgdmFyIGxpYiA9IG5ldyB0aGlzLl9jbGFzc2VzW25hbWVdXG5cbiAgICBmb3IodmFyIGtleSBpbiB0aGlzLl9hdXRvcmVnaXN0ZXJbbmFtZV0pIHtcbiAgICAgIGxpYi5yZWdpc3RlcihrZXksIHRoaXMuX2F1dG9yZWdpc3RlcltuYW1lXVtrZXldKVxuICAgIH1cblxuICAgIHRoaXMuX2NhY2hlW25hbWVdID0gbGliXG4gICAgcmV0dXJuIGxpYlxuICB9XG59XG5cbiIsIm1vZHVsZS5leHBvcnRzID0gTm9kZUxpc3RcblxudmFyIFByb21pc2UgPSByZXF1aXJlKCcuL3Byb21pc2UnKVxuXG5mdW5jdGlvbiBOb2RlTGlzdChub2Rlcykge1xuICB0aGlzLm5vZGVzID0gbm9kZXNcbn1cblxudmFyIGNvbnMgPSBOb2RlTGlzdFxuICAsIHByb3RvID0gY29ucy5wcm90b3R5cGVcblxucHJvdG8ucmVuZGVyID0gZnVuY3Rpb24oY29udGV4dCkge1xuICB2YXIgcHJvbWlzZXMgPSBbXVxuICAgICwgcmVzdWx0cyA9IFtdXG4gICAgLCBub2RlcyA9IHRoaXMubm9kZXNcbiAgICAsIHJlc3VsdFxuXG4gIGZvcih2YXIgaSA9IDAsIGxlbiA9IG5vZGVzLmxlbmd0aDsgaSA8IGxlbjsgKytpKSB7XG4gICAgcmVzdWx0c1tpXSA9IHJlc3VsdCA9IG5vZGVzW2ldLnJlbmRlcihjb250ZXh0KVxuXG4gICAgaWYocmVzdWx0LmNvbnN0cnVjdG9yID09PSBQcm9taXNlKSB7XG4gICAgICBwcm9taXNlcy5wdXNoKHJlc3VsdClcbiAgICB9XG4gIH1cblxuICBpZihwcm9taXNlcy5sZW5ndGgpIHtcbiAgICByZXR1cm4gdGhpcy5yZXNvbHZlUHJvbWlzZXMocmVzdWx0cywgcHJvbWlzZXMpIFxuICB9XG5cbiAgcmV0dXJuIHJlc3VsdHMuam9pbignJylcbn1cblxucHJvdG8ucmVzb2x2ZVByb21pc2VzID0gZnVuY3Rpb24ocmVzdWx0cywgcHJvbWlzZXMpIHtcbiAgdmFyIHNlbGYgPSB0aGlzXG4gICAgLCBwcm9taXNlID0gbmV3IFByb21pc2VcbiAgICAsIHRvdGFsID0gcHJvbWlzZXMubGVuZ3RoXG5cbiAgZm9yKHZhciBpID0gMCwgcCA9IDAsIGxlbiA9IHJlc3VsdHMubGVuZ3RoOyBpIDwgbGVuOyArK2kpIHtcbiAgICBpZihyZXN1bHRzW2ldLmNvbnN0cnVjdG9yICE9PSBQcm9taXNlKSBcbiAgICAgIGNvbnRpbnVlXG5cbiAgICBwcm9taXNlc1twKytdLm9uY2UoJ2RvbmUnLCBiaW5kKGksIGZ1bmN0aW9uKGlkeCwgcmVzdWx0KSB7XG4gICAgICByZXN1bHRzW2lkeF0gPSByZXN1bHRcblxuICAgICAgaWYoIS0tdG90YWwpXG4gICAgICAgIHByb21pc2UucmVzb2x2ZShyZXN1bHRzLmpvaW4oJycpKVxuICAgIH0pKVxuICB9XG5cbiAgcmV0dXJuIHByb21pc2Vcbn1cblxuZnVuY3Rpb24gYmluZChudW0sIGZuKSB7XG4gIHJldHVybiBmdW5jdGlvbihyZXN1bHQpIHtcbiAgICByZXR1cm4gZm4obnVtLCByZXN1bHQpXG4gIH1cbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gUGFyc2VyXG5cbnZhciBOb2RlTGlzdCA9IHJlcXVpcmUoJy4vbm9kZV9saXN0JylcblxudmFyIEZpbHRlckFwcGxpY2F0aW9uID0gcmVxdWlyZSgnLi9maWx0ZXJfYXBwbGljYXRpb24nKVxuICAsIEZpbHRlckxvb2t1cCA9IHJlcXVpcmUoJy4vZmlsdGVyX2xvb2t1cCcpXG4gICwgRmlsdGVyQ2hhaW4gPSByZXF1aXJlKCcuL2ZpbHRlcl9jaGFpbicpXG4gICwgVGFnVG9rZW4gPSByZXF1aXJlKCcuL3RhZ190b2tlbicpXG5cbmZ1bmN0aW9uIFBhcnNlcih0b2tlbnMsIHRhZ3MsIGZpbHRlcnMsIHBsdWdpbnMpIHtcbiAgdGhpcy50b2tlbnMgPSB0b2tlbnNcbiAgdGhpcy50YWdzID0gdGFnc1xuICB0aGlzLmZpbHRlcnMgPSBmaWx0ZXJzXG4gIHRoaXMucGx1Z2lucyA9IHBsdWdpbnNcblxuICAvLyBmb3IgdXNlIHdpdGggZXh0ZW5kcyAvIGJsb2NrIHRhZ3NcbiAgdGhpcy5sb2FkZWRCbG9ja3MgPSBbXVxufVxuXG52YXIgY29ucyA9IFBhcnNlclxuICAsIHByb3RvID0gY29ucy5wcm90b3R5cGVcblxucHJvdG8uY2FjaGUgPSB7fVxuXG5wcm90by5wYXJzZSA9IGZ1bmN0aW9uKHVudGlsKSB7XG4gIHZhciBva2F5ID0gIXVudGlsXG4gICAgLCB0b2tlbiA9IG51bGxcbiAgICAsIG91dHB1dCA9IFtdXG4gICAgLCBub2RlXG5cbiAgd2hpbGUodGhpcy50b2tlbnMubGVuZ3RoID4gMCkge1xuICAgIHRva2VuID0gdGhpcy50b2tlbnMuc2hpZnQoKVxuXG4gICAgaWYodW50aWwgJiYgdG9rZW4uaXModW50aWwpICYmIHRva2VuLmNvbnN0cnVjdG9yID09PSBUYWdUb2tlbikge1xuICAgICAgdGhpcy50b2tlbnMudW5zaGlmdCh0b2tlbilcbiAgICAgIG9rYXkgPSB0cnVlXG5cbiAgICAgIGJyZWFrXG4gICAgfVxuXG4gICAgaWYobm9kZSA9IHRva2VuLm5vZGUodGhpcykpIHtcbiAgICAgIG91dHB1dC5wdXNoKG5vZGUpXG4gICAgfVxuICB9XG5cbiAgaWYoIW9rYXkpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ2V4cGVjdGVkIG9uZSBvZiAnICsgdW50aWwpXG4gIH1cblxuICByZXR1cm4gbmV3IE5vZGVMaXN0KG91dHB1dClcbn1cblxucHJvdG8uY29tcGlsZU51bWJlciA9IGZ1bmN0aW9uKGNvbnRlbnQsIGlkeCwgb3V0cHV0KSB7XG4gIHZhciBkZWNpbWFsID0gY29udGVudC5jaGFyQXQoaWR4KSA9PT0gJy4nXG4gICAgLCBiaXRzID0gZGVjaW1hbCA/IFsnMC4nXSA6IFtdXG4gICAgLCBwYXJzZVxuICAgICwgY1xuXG4gIGRvIHtcbiAgICBjID0gY29udGVudC5jaGFyQXQoaWR4KVxuXG4gICAgaWYoYyA9PT0gJy4nKSB7XG4gICAgICBpZihkZWNpbWFsKSB7XG4gICAgICAgIGJyZWFrXG4gICAgICB9XG5cbiAgICAgIGRlY2ltYWwgPSB0cnVlXG4gICAgICBiaXRzLnB1c2goJy4nKVxuICAgIH0gZWxzZSBpZigvXFxkLy50ZXN0KGMpKSB7XG4gICAgICBiaXRzLnB1c2goYylcbiAgICB9XG4gIH0gd2hpbGUoKytpZHggPCBjb250ZW50Lmxlbmd0aClcblxuICBwYXJzZSA9IGRlY2ltYWwgPyBwYXJzZUZsb2F0IDogcGFyc2VJbnRcbiAgb3V0cHV0LnB1c2gocGFyc2UoYml0cy5qb2luKCcnKSwgMTApKVxuXG4gIHJldHVybiBpZHhcbn1cblxucHJvdG8uY29tcGlsZVN0cmluZyA9IGZ1bmN0aW9uKGNvbnRlbnQsIGlkeCwgb3V0cHV0KSB7XG4gIHZhciB0eXBlID0gY29udGVudC5jaGFyQXQoaWR4KVxuICAgICwgZXNjYXBlZCA9IGZhbHNlXG4gICAgLCBiaXRzID0gW11cbiAgICAsIGNcblxuICArK2lkeFxuXG4gIGRvIHtcbiAgICBjID0gY29udGVudC5jaGFyQXQoaWR4KVxuXG4gICAgaWYoIWVzY2FwZWQpIHtcbiAgICAgIGlmKGMgPT09ICdcXFxcJykge1xuICAgICAgICBlc2NhcGVkID0gdHJ1ZVxuXG4gICAgICAgIGNvbnRpbnVlXG4gICAgICB9XG5cbiAgICAgIGlmKGMgPT09IHR5cGUpIHtcbiAgICAgICAgYnJlYWtcbiAgICAgIH1cblxuICAgICAgYml0cy5wdXNoKGMpXG4gICAgfSBlbHNlIHtcbiAgICAgIGlmKCEvWydcIlxcXFxdLy50ZXN0KGMpKSB7XG4gICAgICAgIGJpdHMucHVzaCgnXFxcXCcpXG4gICAgICB9XG5cbiAgICAgIGJpdHMucHVzaChjKVxuICAgICAgZXNjYXBlZCA9IGZhbHNlXG4gICAgfVxuXG4gIH0gd2hpbGUoKytpZHggPCBjb250ZW50Lmxlbmd0aClcblxuICBvdXRwdXQucHVzaChiaXRzLmpvaW4oJycpKVxuXG4gIHJldHVybiBpZHhcbn1cblxucHJvdG8uY29tcGlsZU5hbWUgPSBmdW5jdGlvbihjb250ZW50LCBpZHgsIG91dHB1dCkge1xuICB2YXIgb3V0ID0gW11cbiAgICAsIGNcblxuICBkbyB7XG4gICAgYyA9IGNvbnRlbnQuY2hhckF0KGlkeClcblxuICAgIGlmKC9bXlxcd1xcZFxcX10vLnRlc3QoYykpIHtcbiAgICAgIGJyZWFrXG4gICAgfVxuXG4gICAgb3V0LnB1c2goYylcbiAgfSB3aGlsZSgrK2lkeCA8IGNvbnRlbnQubGVuZ3RoKVxuXG4gIG91dHB1dC5wdXNoKG91dC5qb2luKCcnKSlcblxuICByZXR1cm4gaWR4XG59XG5cbnByb3RvLmNvbXBpbGVGaWx0ZXIgPSBmdW5jdGlvbihjb250ZW50LCBpZHgsIG91dHB1dCkge1xuICB2YXIgZmlsdGVyTmFtZVxuICAgICwgb2xkTGVuXG4gICAgLCBiaXRzXG5cbiAgKytpZHhcblxuICBpZHggPSB0aGlzLmNvbXBpbGVOYW1lKGNvbnRlbnQsIGlkeCwgb3V0cHV0KVxuICBmaWx0ZXJOYW1lID0gb3V0cHV0LnBvcCgpXG5cbiAgaWYoY29udGVudC5jaGFyQXQoaWR4KSAhPT0gJzonKSB7XG4gICAgb3V0cHV0LnB1c2gobmV3IEZpbHRlckFwcGxpY2F0aW9uKGZpbHRlck5hbWUsIFtdKSlcblxuICAgIHJldHVybiBpZHggLSAxXG4gIH1cblxuICArK2lkeFxuXG4gIG9sZExlbiA9IG91dHB1dC5sZW5ndGhcbiAgaWR4ID0gdGhpcy5jb21waWxlRnVsbChjb250ZW50LCBpZHgsIG91dHB1dCwgdHJ1ZSlcbiAgYml0cyA9IG91dHB1dC5zcGxpY2Uob2xkTGVuLCBvdXRwdXQubGVuZ3RoIC0gb2xkTGVuKVxuXG4gIG91dHB1dC5wdXNoKG5ldyBGaWx0ZXJBcHBsaWNhdGlvbihmaWx0ZXJOYW1lLCBiaXRzKSlcblxuICByZXR1cm4gaWR4XG59XG5cbnByb3RvLmNvbXBpbGVMb29rdXAgPSBmdW5jdGlvbihjb250ZW50LCBpZHgsIG91dHB1dCkge1xuICB2YXIgYml0cyA9IFtdXG5cbiAgZG8ge1xuICAgIGlkeCA9IHRoaXMuY29tcGlsZU5hbWUoY29udGVudCwgaWR4LCBvdXRwdXQpXG4gICAgYml0cy5wdXNoKG91dHB1dC5wb3AoKSlcblxuICAgIGlmKGNvbnRlbnQuY2hhckF0KGlkeCkgIT09ICcuJykge1xuICAgICAgYnJlYWtcbiAgICB9XG4gIH0gd2hpbGUoKytpZHggPCBjb250ZW50Lmxlbmd0aClcblxuICBvdXRwdXQucHVzaChuZXcgRmlsdGVyTG9va3VwKGJpdHMpKVxuXG4gIHJldHVybiBpZHggLSAxXG59XG5cbnByb3RvLmNvbXBpbGVGdWxsID0gZnVuY3Rpb24oY29udGVudCwgaWR4LCBvdXRwdXQsIG9taXRQaXBlKSB7XG4gIHZhciBjXG5cbiAgb3V0cHV0ID0gb3V0cHV0IHx8IFtdXG4gIGlkeCA9IGlkeCB8fCAwXG4gIC8vIHNvbWV0aGluZ3xmaWx0ZXJuYW1lWzphcmcsIGFyZ11cbiAgLy8gXCJxdW90ZXNcIlxuICAvLyAxXG4gIC8vIDEuMlxuICAvLyB0cnVlIHwgZmFsc2VcbiAgLy8gc3dhbGxvdyBsZWFkaW5nIHdoaXRlc3BhY2UuXG5cbiAgd2hpbGUoL1xccy8udGVzdChjb250ZW50LmNoYXJBdChpZHgpKSkge1xuICAgICsraWR4XG4gIH1cblxuICBkbyB7XG4gICAgYyA9IGNvbnRlbnQuY2hhckF0KGlkeClcblxuICAgIGlmKC9bLFxcc10vLnRlc3QoYykpIHtcbiAgICAgIGJyZWFrXG4gICAgfVxuXG4gICAgaWYob21pdFBpcGUgJiYgYyA9PT0gJ3wnKSB7XG4gICAgICAtLWlkeFxuXG4gICAgICBicmVha1xuICAgIH1cblxuICAgIHN3aXRjaCh0cnVlKSB7XG4gICAgICBjYXNlIC9bXFxkXFwuXS8udGVzdChjKTpcbiAgICAgICAgaWR4ID0gdGhpcy5jb21waWxlTnVtYmVyKGNvbnRlbnQsIGlkeCwgb3V0cHV0KVxuICAgICAgICBicmVha1xuICAgICAgY2FzZSAvWydcIl0vLnRlc3QoYyk6XG4gICAgICAgIGlkeCA9IHRoaXMuY29tcGlsZVN0cmluZyhjb250ZW50LCBpZHgsIG91dHB1dClcbiAgICAgICAgYnJlYWtcbiAgICAgIGNhc2UgYyA9PT0gJ3wnOlxuICAgICAgICBpZHggPSB0aGlzLmNvbXBpbGVGaWx0ZXIoY29udGVudCwgaWR4LCBvdXRwdXQpXG4gICAgICAgIGJyZWFrXG4gICAgICBkZWZhdWx0OlxuICAgICAgICBpZHggPSB0aGlzLmNvbXBpbGVMb29rdXAoY29udGVudCwgaWR4LCBvdXRwdXQpXG4gICAgICAgIGJyZWFrXG4gICAgfVxuICB9IHdoaWxlKCsraWR4IDwgY29udGVudC5sZW5ndGgpXG5cbiAgcmV0dXJuIGlkeFxufVxuXG5wcm90by5jb21waWxlID0gZnVuY3Rpb24oY29udGVudCkge1xuICB2YXIgb3V0cHV0ID0gW11cblxuICBpZih0aGlzLmNhY2hlW2NvbnRlbnRdKSB7XG4gICAgcmV0dXJuIHRoaXMuY2FjaGVbY29udGVudF1cbiAgfVxuXG4gIHRoaXMuY29tcGlsZUZ1bGwoY29udGVudCwgMCwgb3V0cHV0KVxuXG4gIG91dHB1dCA9IHRoaXMuY2FjaGVbY29udGVudF0gPSBuZXcgRmlsdGVyQ2hhaW4ob3V0cHV0LCB0aGlzKVxuICBvdXRwdXQuYXR0YWNoKHRoaXMpXG5cbiAgcmV0dXJuIG91dHB1dFxufVxuIiwibW9kdWxlLmV4cG9ydHMgPSBQcm9taXNlXG5cbmZ1bmN0aW9uIFByb21pc2UoKSB7XG4gIHRoaXMudHJpZ2dlciA9IG51bGxcbn1cblxudmFyIGNvbnMgPSBQcm9taXNlXG4gICwgcHJvdG8gPSBjb25zLnByb3RvdHlwZVxuXG5wcm90by5yZXNvbHZlID0gZnVuY3Rpb24odmFsdWUpIHtcbiAgdmFyIHRyaWdnZXIgPSB0aGlzLnRyaWdnZXJcblxuICBpZighdmFsdWUgfHwgdmFsdWUuY29uc3RydWN0b3IgIT09IGNvbnMpIHtcbiAgICByZXR1cm4gdHJpZ2dlcih2YWx1ZSlcbiAgfVxuXG4gIHZhbHVlLm9uY2UoJ2RvbmUnLCB0cmlnZ2VyKVxufVxuXG5wcm90by5vbmNlID0gZnVuY3Rpb24oZXYsIGZuKSB7XG4gIHRoaXMudHJpZ2dlciA9IGZuXG59XG5cbmNvbnMudG9Qcm9taXNlID0gZnVuY3Rpb24oZm4pIHtcbiAgcmV0dXJuIGZ1bmN0aW9uIHByb21pc2lmaWVkKCkge1xuICAgIHZhciBhcmdzID0gW10uc2xpY2UuY2FsbChhcmd1bWVudHMpXG4gICAgICAsIHByb21pc2UgPSBuZXcgY29uc1xuICAgICAgLCBzZWxmID0gdGhpc1xuXG4gICAgYXJncy5wdXNoKG9ucmVhZHkpXG5cbiAgICBzZXRUaW1lb3V0KGJhbmcsIDApXG5cbiAgICByZXR1cm4gcHJvbWlzZVxuXG4gICAgZnVuY3Rpb24gYmFuZygpIHtcbiAgICAgIGZuLmFwcGx5KHNlbGYsIGFyZ3MpXG4gICAgfVxuXG4gICAgZnVuY3Rpb24gb25yZWFkeShlcnIsIGRhdGEpIHtcbiAgICAgIHByb21pc2UucmVzb2x2ZShkYXRhKVxuICAgIH1cbiAgfVxufVxuIiwibW9kdWxlLmV4cG9ydHMgPSBUYWdUb2tlblxuXG52YXIgVG9rZW4gPSByZXF1aXJlKCcuL3Rva2VuJylcblxuZnVuY3Rpb24gVGFnVG9rZW4oY29udGVudCwgbGluZSkge1xuICBUb2tlbi5jYWxsKHRoaXMsIGNvbnRlbnQsIGxpbmUpXG59XG5cbnZhciBjb25zID0gVGFnVG9rZW5cbiAgLCBwcm90byA9IGNvbnMucHJvdG90eXBlID0gbmV3IFRva2VuXG5cbnByb3RvLmNvbnN0cnVjdG9yID0gY29uc1xuXG5wcm90by5ub2RlID0gZnVuY3Rpb24ocGFyc2VyKSB7XG4gIHZhciB0YWcgPSBwYXJzZXIudGFncy5sb29rdXAodGhpcy5uYW1lKVxuXG4gIHJldHVybiB0YWcodGhpcy5jb250ZW50LCBwYXJzZXIpXG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IEJsb2NrTm9kZVxuXG52YXIgUHJvbWlzZSA9IHJlcXVpcmUoJy4uL3Byb21pc2UnKVxuICAsIEJsb2NrQ29udGV4dCA9IHJlcXVpcmUoJy4uL2Jsb2NrX2NvbnRleHQnKVxuXG5mdW5jdGlvbiBCbG9ja05vZGUobmFtZSwgbm9kZXMpIHtcbiAgdGhpcy5uYW1lID0gbmFtZVxuICB0aGlzLm5vZGVzID0gbm9kZXNcblxuICB0aGlzLmNvbnRleHQgPSBudWxsXG59XG5cbnZhciBjb25zID0gQmxvY2tOb2RlXG4gICwgcHJvdG8gPSBjb25zLnByb3RvdHlwZVxuXG5wcm90by5yZW5kZXIgPSBmdW5jdGlvbihjb250ZXh0KSB7XG4gIHZhciBzZWxmID0gdGhpc1xuICAgICwgYmxvY2tDb250ZXh0ID0gQmxvY2tDb250ZXh0LmZyb20oY29udGV4dClcbiAgICAsIHJlc3VsdFxuICAgICwgYmxvY2tcbiAgICAsIHB1c2hcblxuICBpZighYmxvY2tDb250ZXh0KSB7XG4gICAgY29udGV4dC5ibG9jayA9IHNlbGZcbiAgICByZXR1cm4gc2VsZi5ub2Rlcy5yZW5kZXIoY29udGV4dClcbiAgfVxuXG4gIGJsb2NrID0gcHVzaCA9IGJsb2NrQ29udGV4dC5wb3Aoc2VsZi5uYW1lKVxuXG4gIGlmKCFibG9jaykgeyBcbiAgICBibG9jayA9IHNlbGZcbiAgfSBcblxuICBibG9jayA9IG5ldyBCbG9ja05vZGUoYmxvY2submFtZSwgYmxvY2subm9kZXMpXG5cbiAgYmxvY2suY29udGV4dCA9IGNvbnRleHRcbiAgYmxvY2suY29udGV4dC5ibG9jayA9IGJsb2NrXG4gIGNvbnRleHQuYmxvY2sgPSBibG9ja1xuXG4gIHJlc3VsdCA9IGJsb2NrLm5vZGVzLnJlbmRlcihjb250ZXh0KVxuXG4gIGlmKHB1c2gpIHtcbiAgICBibG9ja0NvbnRleHQucHVzaChzZWxmLm5hbWUsIHB1c2gpXG4gIH1cblxuICByZXR1cm4gcmVzdWx0XG5cbn1cblxucHJvdG8uaXNCbG9ja05vZGUgPSB0cnVlXG5cbnByb3RvLl9zdXBlciA9IGZ1bmN0aW9uKCkge1xuICB2YXIgYmxvY2tDb250ZXh0ID0gQmxvY2tDb250ZXh0LmZyb20odGhpcy5jb250ZXh0KVxuICAgICwgYmxvY2tcbiAgICAsIHN0clxuXG4gIGlmKGJsb2NrQ29udGV4dCAmJiAoYmxvY2sgPSBibG9ja0NvbnRleHQuZ2V0KHRoaXMubmFtZSkpKSB7XG4gICAgc3RyID0gbmV3IFN0cmluZyhibG9jay5yZW5kZXIodGhpcy5jb250ZXh0KSlcbiAgICBzdHIuc2FmZSA9IHRydWVcbiAgICByZXR1cm4gc3RyIFxuICB9XG5cbiAgcmV0dXJuICcnXG59XG5cbmNvbnMucGFyc2UgPSBmdW5jdGlvbihjb250ZW50cywgcGFyc2VyKSB7XG4gIHZhciBiaXRzID0gY29udGVudHMuc3BsaXQoJyAnKVxuICAgICwgbmFtZSA9IGJpdHNbMV1cbiAgICAsIGxvYWRlZCA9IHBhcnNlci5sb2FkZWRCbG9ja3NcbiAgICAsIG5vZGVzXG5cbiAgZm9yKHZhciBpID0gMCwgbGVuID0gbG9hZGVkLmxlbmd0aDsgaSA8IGxlbjsgKytpKVxuICAgIGlmKGxvYWRlZFtpXSA9PT0gbmFtZSlcbiAgICAgIHRocm93IG5ldyBFcnJvcignYmxvY2sgdGFnIHdpdGggdGhlIG5hbWUgXCInK25hbWUrJ1wiIGFwcGVhcnMgbW9yZSB0aGFuIG9uY2UnKVxuXG4gIGxvYWRlZC5wdXNoKG5hbWUpXG5cbiAgbm9kZXMgPSBwYXJzZXIucGFyc2UoWydlbmRibG9jayddKVxuICBwYXJzZXIudG9rZW5zLnNoaWZ0KClcblxuICByZXR1cm4gbmV3IGNvbnMobmFtZSwgbm9kZXMpICBcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gQ29tbWVudE5vZGVcblxuZnVuY3Rpb24gQ29tbWVudE5vZGUoKSB7XG4gIC8vIG5vLW9wLlxufVxuXG52YXIgY29ucyA9IENvbW1lbnROb2RlXG4gICwgcHJvdG8gPSBjb25zLnByb3RvdHlwZVxuXG5wcm90by5yZW5kZXIgPSBmdW5jdGlvbihjb250ZXh0KSB7XG4gIHJldHVybiAnJ1xufVxuXG5jb25zLnBhcnNlID0gZnVuY3Rpb24oY29udGVudHMsIHBhcnNlcikge1xuICBubCA9IHBhcnNlci5wYXJzZShbJ2VuZGNvbW1lbnQnXSlcbiAgcGFyc2VyLnRva2Vucy5zaGlmdCgpXG5cbiAgcmV0dXJuIG5ldyBjb25zXG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IERlYnVnTm9kZVxuXG52YXIgUHJvbWlzZSA9IHJlcXVpcmUoJy4uL3Byb21pc2UnKVxuICAsIENvbnRleHQgPSByZXF1aXJlKCcuLi9jb250ZXh0JylcbiAgLCBkZWJ1ZyA9IHJlcXVpcmUoJy4uL2RlYnVnJylcblxuZnVuY3Rpb24gRGVidWdOb2RlKHZhcm5hbWUpIHtcbiAgdGhpcy52YXJuYW1lID0gdmFybmFtZVxufVxuXG52YXIgY29ucyA9IERlYnVnTm9kZVxuICAsIHByb3RvID0gY29ucy5wcm90b3R5cGVcblxucHJvdG8ucmVuZGVyID0gZnVuY3Rpb24oY29udGV4dCwgdmFsdWUpIHtcbiAgdmFyIHNlbGYgPSB0aGlzXG4gICAgLCB0YXJnZXQgPSBjb250ZXh0XG4gICAgLCBwcm9taXNlXG5cbiAgaWYoc2VsZi52YXJuYW1lICE9PSBudWxsKSB7XG4gICAgdmFsdWUgPSBhcmd1bWVudHMubGVuZ3RoID09PSAyID8gdmFsdWUgOiBzZWxmLnZhcm5hbWUucmVzb2x2ZShjb250ZXh0KVxuICAgIGlmKHZhbHVlICYmIHZhbHVlLmNvbnN0cnVjdG9yID09PSBQcm9taXNlKSB7XG4gICAgICBwcm9taXNlID0gbmV3IFByb21pc2VcbiAgICAgIHZhbHVlLm9uY2UoJ2RvbmUnLCBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgIHByb21pc2UucmVzb2x2ZShzZWxmLnJlbmRlcihjb250ZXh0LCBkYXRhKSlcbiAgICAgIH0pXG4gICAgICByZXR1cm4gcHJvbWlzZVxuICAgIH1cbiAgICB0YXJnZXQgPSB2YWx1ZVxuICB9XG5cbiAgaWYodGFyZ2V0ID09PSBjb250ZXh0KSB7XG4gICAgd2hpbGUodGFyZ2V0ICE9PSBDb250ZXh0LnByb3RvdHlwZSkge1xuICAgICAgZGVidWcubG9nKHRhcmdldClcbiAgICAgIHRhcmdldCA9IE9iamVjdC5nZXRQcm90b3R5cGVPZih0YXJnZXQpXG4gICAgfVxuICAgIHJldHVybiAnJ1xuICB9XG4gIGRlYnVnLmxvZyh0YXJnZXQpXG4gIHJldHVybiAnJ1xufVxuXG5jb25zLnBhcnNlID0gZnVuY3Rpb24oY29udGVudHMsIHBhcnNlcikge1xuICB2YXIgYml0cyA9IGNvbnRlbnRzLnNwbGl0KCcgJylcblxuICByZXR1cm4gbmV3IERlYnVnTm9kZShiaXRzWzFdID8gcGFyc2VyLmNvbXBpbGUoYml0c1sxXSkgOiBudWxsKVxufVxuXG4iLCJtb2R1bGUuZXhwb3J0cyA9IEV4dGVuZHNOb2RlXG5cbnZhciBQcm9taXNlID0gcmVxdWlyZSgnLi4vcHJvbWlzZScpXG4gICwgQmxvY2tDb250ZXh0ID0gcmVxdWlyZSgnLi4vYmxvY2tfY29udGV4dCcpXG5cblxuZnVuY3Rpb24gRXh0ZW5kc05vZGUocGFyZW50LCBub2RlcywgbG9hZGVyKSB7XG4gIHRoaXMucGFyZW50ID0gcGFyZW50XG4gIHRoaXMubG9hZGVyID0gbG9hZGVyXG5cbiAgdGhpcy5ibG9ja3MgPSB7fVxuXG4gIGZvcih2YXIgaSA9IDAsIGxlbiA9IG5vZGVzLm5vZGVzLmxlbmd0aDsgaSA8IGxlbjsgKytpKSB7XG4gICAgaWYoIW5vZGVzLm5vZGVzW2ldLmlzQmxvY2tOb2RlKVxuICAgICAgY29udGludWVcblxuICAgIHRoaXMuYmxvY2tzW25vZGVzLm5vZGVzW2ldLm5hbWVdID0gbm9kZXMubm9kZXNbaV1cbiAgfVxufVxuXG52YXIgY29ucyA9IEV4dGVuZHNOb2RlXG4gICwgcHJvdG8gPSBjb25zLnByb3RvdHlwZVxuXG5wcm90by5pc0V4dGVuZHNOb2RlID0gdHJ1ZVxuXG5wcm90by5yZW5kZXIgPSBmdW5jdGlvbihjb250ZXh0LCBwYXJlbnQpIHtcbiAgdmFyIHNlbGYgPSB0aGlzXG4gICAgLCBwcm9taXNlXG5cbiAgcGFyZW50ID0gcGFyZW50IHx8IHRoaXMucGFyZW50LnJlc29sdmUoY29udGV4dClcblxuICBpZihwYXJlbnQuY29uc3RydWN0b3IgPT09IFByb21pc2UpIHtcbiAgICBwcm9taXNlID0gbmV3IFByb21pc2VcblxuICAgIHBhcmVudC5vbmNlKCdkb25lJywgZnVuY3Rpb24oZGF0YSkge1xuICAgICAgcHJvbWlzZS5yZXNvbHZlKHNlbGYucmVuZGVyKGNvbnRleHQsIGRhdGEpKVxuICAgIH0pXG5cbiAgICByZXR1cm4gcHJvbWlzZVxuICB9XG5cbiAgcGFyZW50ID0gc2VsZi5nZXRfdGVtcGxhdGUocGFyZW50KVxuXG4gIGlmKHBhcmVudC5jb25zdHJ1Y3RvciA9PT0gUHJvbWlzZSkge1xuICAgIHByb21pc2UgPSBuZXcgUHJvbWlzZVxuXG4gICAgcGFyZW50Lm9uY2UoJ2RvbmUnLCBmdW5jdGlvbihkYXRhKSB7XG4gICAgICBwcm9taXNlLnJlc29sdmUoc2VsZi5yZW5kZXIoY29udGV4dCwgZGF0YSkpXG4gICAgfSkgIFxuXG4gICAgcmV0dXJuIHByb21pc2VcbiAgfVxuXG4gIHZhciBibG9ja0NvbnRleHQgPSBCbG9ja0NvbnRleHQuZnJvbShjb250ZXh0KSB8fCBCbG9ja0NvbnRleHQuaW50byhjb250ZXh0KVxuICAgICwgYmxvY2tzID0ge31cbiAgICAsIG5vZGVMaXN0ID0gcGFyZW50LmdldE5vZGVMaXN0KClcbiAgICAsIGV4dGVuZHNJRFggPSBmYWxzZVxuXG4gIGJsb2NrQ29udGV4dC5hZGQoc2VsZi5ibG9ja3MpXG5cbiAgZm9yKHZhciBpID0gMCwgbGVuID0gbm9kZUxpc3Qubm9kZXMubGVuZ3RoOyBpIDwgbGVuOyArK2kpIHtcbiAgICBpZihub2RlTGlzdC5ub2Rlc1tpXS5pc0V4dGVuZHNOb2RlKSB7XG4gICAgICBleHRlbmRzSURYID0gdHJ1ZVxuICAgICAgYnJlYWtcbiAgICB9XG5cbiAgICBpZihub2RlTGlzdC5ub2Rlc1tpXS5pc0Jsb2NrTm9kZSkge1xuICAgICAgYmxvY2tzW25vZGVMaXN0Lm5vZGVzW2ldLm5hbWVdID0gbm9kZUxpc3Qubm9kZXNbaV1cbiAgICB9XG4gIH1cblxuICBpZighZXh0ZW5kc0lEWCkge1xuICAgIGJsb2NrQ29udGV4dC5hZGQoYmxvY2tzKVxuICB9XG5cbiAgcHJvbWlzZSA9IG5ldyBQcm9taXNlXG5cbiAgcGFyZW50LnJlbmRlcihjb250ZXh0LCBmdW5jdGlvbihlcnIsIGRhdGEpIHtcbiAgICBwcm9taXNlLnJlc29sdmUoZGF0YSlcbiAgfSlcblxuICByZXR1cm4gcHJvbWlzZVxufVxuXG5wcm90by5nZXRfdGVtcGxhdGUgPSBmdW5jdGlvbihwYXJlbnQpIHtcbiAgaWYodHlwZW9mIHBhcmVudCAhPT0gJ3N0cmluZycpIHtcbiAgICByZXR1cm4gcGFyZW50XG4gIH1cblxuICByZXR1cm4gdGhpcy5sb2FkZXIocGFyZW50KVxufVxuXG5jb25zLnBhcnNlID0gZnVuY3Rpb24oY29udGVudHMsIHBhcnNlcikge1xuICB2YXIgYml0cyA9IGNvbnRlbnRzLnNwbGl0KCcgJylcbiAgICAsIHBhcmVudCA9IHBhcnNlci5jb21waWxlKGJpdHMuc2xpY2UoMSkuam9pbignICcpKVxuICAgICwgbm9kZXMgPSBwYXJzZXIucGFyc2UoKVxuICAgICwgbG9hZGVyID0gcGFyc2VyLnBsdWdpbnMubG9va3VwKCdsb2FkZXInKVxuXG4gIHJldHVybiBuZXcgY29ucyhwYXJlbnQsIG5vZGVzLCBsb2FkZXIpXG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IEZvck5vZGVcblxudmFyIE5vZGVMaXN0ID0gcmVxdWlyZSgnLi4vbm9kZV9saXN0JylcbiAgLCBQcm9taXNlID0gcmVxdWlyZSgnLi4vcHJvbWlzZScpXG5cbmZ1bmN0aW9uIEZvck5vZGUodGFyZ2V0LCB1bnBhY2ssIGxvb3AsIGVtcHR5LCByZXZlcnNlZCkge1xuICB0aGlzLnRhcmdldCA9IHRhcmdldFxuICB0aGlzLnVucGFjayA9IHVucGFja1xuICB0aGlzLmxvb3AgPSBsb29wXG4gIHRoaXMuZW1wdHkgPSBlbXB0eVxuICB0aGlzLnJldmVyc2VkID0gcmV2ZXJzZWRcbn1cblxudmFyIGNvbnMgPSBGb3JOb2RlXG4gICwgcHJvdG8gPSBjb25zLnByb3RvdHlwZVxuXG5mdW5jdGlvbiBnZXRJbkluZGV4KGJpdHMpIHtcbiAgZm9yKHZhciBpID0gMCwgbGVuID0gYml0cy5sZW5ndGg7IGkgPCBsZW47ICsraSlcbiAgICBpZihiaXRzW2ldID09PSAnaW4nKVxuICAgICAgcmV0dXJuIGlcblxuICByZXR1cm4gLTEgXG59XG5cbnByb3RvLnJlbmRlciA9IGZ1bmN0aW9uKGNvbnRleHQsIHZhbHVlKSB7XG4gIHZhciBzZWxmID0gdGhpc1xuICAgICwgYXJyID0gdmFsdWUgfHwgc2VsZi50YXJnZXQucmVzb2x2ZShjb250ZXh0KVxuICAgICwgcHJvbWlzZVxuXG5cbiAgaWYoYXJyICYmIGFyci5jb25zdHJ1Y3RvciA9PT0gUHJvbWlzZSkge1xuICAgIHByb21pc2UgPSBuZXcgUHJvbWlzZVxuICAgIGFyci5vbmNlKCdkb25lJywgZnVuY3Rpb24oZGF0YSkge1xuICAgICAgcHJvbWlzZS5yZXNvbHZlKHNlbGYucmVuZGVyKGNvbnRleHQsIGRhdGEpKVxuICAgIH0pXG5cbiAgICByZXR1cm4gcHJvbWlzZVxuICB9XG5cbiAgaWYoYXJyID09PSB1bmRlZmluZWQgfHwgYXJyID09PSBudWxsKSB7XG4gICAgYXJyID0gW11cbiAgfVxuXG4gIHZhciBiaXRzID0gW11cbiAgICAsIHByb21pc2VzID0gW11cbiAgICAsIHBhcmVudCA9IGNvbnRleHQuZm9ybG9vcFxuICAgICwgbG9vcCA9IHt9XG4gICAgLCByZXN1bHRcbiAgICAsIGN0eHRcbiAgICAsIHN1YlxuXG4gIGlmKCEoJ2xlbmd0aCcgaW4gYXJyKSkge1xuICAgIGZvcih2YXIga2V5IGluIGFycikgaWYoYXJyLmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgIGJpdHMucHVzaChrZXkpXG4gICAgfVxuXG4gICAgYXJyID0gYml0cy5zbGljZSgpXG4gICAgYml0cy5sZW5ndGggPSAwXG4gIH1cblxuICBpZighYXJyLmxlbmd0aCkge1xuICAgIHJldHVybiBzZWxmLmVtcHR5LnJlbmRlcihjb250ZXh0KVxuICB9XG5cbiAgc3ViID0gc2VsZi5yZXZlcnNlZCA/IGFyci5sZW5ndGggLSAxIDogMFxuXG4gIGZvcih2YXIgaSA9IDAsIGxlbiA9IGFyci5sZW5ndGgsIGlkeDsgaSA8IGxlbjsgKytpKSB7XG4gICAgY3R4dCA9IGNvbnRleHQuY29weSgpXG4gICAgaWR4ID0gTWF0aC5hYnMoc3ViIC0gaSlcbiAgICBsb29wLmNvdW50ZXIgPSBpICsgMVxuICAgIGxvb3AuY291bnRlcjAgPSBpXG4gICAgbG9vcC5yZXZjb3VudGVyID0gbGVuIC0gaVxuICAgIGxvb3AucmV2Y291bnRlcjAgPSBsZW4gLSAoaSArIDEpXG4gICAgbG9vcC5maXJzdCA9IGkgPT09IDBcbiAgICBsb29wLmxhc3QgPSBpID09PSBsZW4gLSAxXG4gICAgbG9vcC5wYXJlbnRsb29wID0gcGFyZW50IFxuICAgIGN0eHQuZm9ybG9vcCA9IGxvb3BcblxuICAgIGlmKHNlbGYudW5wYWNrLmxlbmd0aCA9PT0gMSlcbiAgICAgIGN0eHRbc2VsZi51bnBhY2tbMF1dID0gYXJyW2lkeF1cbiAgICBlbHNlIGZvcih2YXIgdSA9IDA7IHUgPCBzZWxmLnVucGFjay5sZW5ndGg7ICsrdSlcbiAgICAgIGN0eHRbc2VsZi51bnBhY2tbdV1dID0gYXJyW2lkeF1bdV1cblxuICAgIHJlc3VsdCA9IHNlbGYubG9vcC5yZW5kZXIoY3R4dClcbiAgICBpZihyZXN1bHQuY29uc3RydWN0b3IgPT09IFByb21pc2UpXG4gICAgICBwcm9taXNlcy5wdXNoKHJlc3VsdClcbiAgICAgXG4gICAgYml0cy5wdXNoKHJlc3VsdCkgXG4gIH1cblxuICBpZihwcm9taXNlcy5sZW5ndGgpIHtcbiAgICByZXR1cm4gc2VsZi5sb29wLnJlc29sdmVQcm9taXNlcyhiaXRzLCBwcm9taXNlcylcbiAgfVxuXG4gIHJldHVybiBiaXRzLmpvaW4oJycpXG59XG5cbmNvbnMucGFyc2UgPSBmdW5jdGlvbihjb250ZW50cywgcGFyc2VyKSB7XG4gIHZhciBiaXRzID0gY29udGVudHMuc3BsaXQoL1xccysvKVxuICAgICwgcmV2ZXJzZWQgPSBiaXRzW2JpdHMubGVuZ3RoLTFdID09PSAncmV2ZXJzZWQnXG4gICAgLCBpZHhJbiA9IGdldEluSW5kZXgoYml0cylcbiAgICAsIHZhcmlhYmxlcyA9IGJpdHMuc2xpY2UoMSwgaWR4SW4pXG4gICAgLCB0YXJnZXQgPSBwYXJzZXIuY29tcGlsZShiaXRzW2lkeEluKzFdKVxuICAgICwgbm9kZWxpc3QgPSBwYXJzZXIucGFyc2UoWydlbXB0eScsICdlbmRmb3InXSlcbiAgICAsIHVucGFjayA9IFtdXG4gICAgLCBlbXB0eVxuXG5cbiAgaWYocGFyc2VyLnRva2Vucy5zaGlmdCgpLmlzKFsnZW1wdHknXSkpIHtcbiAgICBlbXB0eSA9IHBhcnNlci5wYXJzZShbJ2VuZGZvciddKVxuICAgIHBhcnNlci50b2tlbnMuc2hpZnQoKVxuICB9IGVsc2Uge1xuICAgIGVtcHR5ID0gbmV3IE5vZGVMaXN0KFtdKVxuICB9XG5cbiAgdmFyaWFibGVzID0gdmFyaWFibGVzLmpvaW4oJyAnKS5zcGxpdCgnLCcpXG4gIGZvcih2YXIgaSA9IDAsIGxlbiA9IHZhcmlhYmxlcy5sZW5ndGg7IGkgPCBsZW47ICsraSkge1xuICAgIHZhcmlhYmxlc1tpXSA9IHZhcmlhYmxlc1tpXS5yZXBsYWNlKC8oXlxccyt8XFxzKyQpLywgJycpXG4gICAgaWYodmFyaWFibGVzW2ldKVxuICAgICAgdW5wYWNrLnB1c2godmFyaWFibGVzW2ldKVxuICB9XG5cbiAgcmV0dXJuIG5ldyBjb25zKHRhcmdldCwgdW5wYWNrLCBub2RlbGlzdCwgZW1wdHksIHJldmVyc2VkKTtcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gRW5kVG9rZW5cblxuZnVuY3Rpb24gRW5kVG9rZW4oKSB7XG4gIHRoaXMubGJwID0gMFxufVxuIiwibW9kdWxlLmV4cG9ydHMgPSBJbmZpeE9wZXJhdG9yXG5cbnZhciBQcm9taXNlID0gcmVxdWlyZSgnLi4vLi4vcHJvbWlzZScpXG5cbmZ1bmN0aW9uIEluZml4T3BlcmF0b3IoYnAsIGNtcCkge1xuICB0aGlzLmxicCA9IGJwXG4gIHRoaXMuY21wID0gY21wXG5cbiAgdGhpcy5maXJzdCA9IFxuICB0aGlzLnNlY29uZCA9IG51bGxcbn0gXG5cbnZhciBjb25zID0gSW5maXhPcGVyYXRvclxuICAsIHByb3RvID0gY29ucy5wcm90b3R5cGVcblxucHJvdG8ubnVkID0gZnVuY3Rpb24ocGFyc2VyKSB7XG4gIHRocm93IG5ldyBFcnJvcihcIlVuZXhwZWN0ZWQgdG9rZW5cIilcbn1cblxucHJvdG8ubGVkID0gZnVuY3Rpb24obGhzLCBwYXJzZXIpIHtcbiAgdGhpcy5maXJzdCA9IGxoc1xuICB0aGlzLnNlY29uZCA9IHBhcnNlci5leHByZXNzaW9uKHRoaXMubGJwKVxuICByZXR1cm4gdGhpc1xufVxuXG5wcm90by5ldmFsdWF0ZSA9IGZ1bmN0aW9uKGNvbnRleHQsIGZpcnN0LCBzZWNvbmQsIHNlbnRGaXJzdCwgc2VudFNlY29uZCkge1xuICB2YXIgc2VsZiA9IHRoaXNcbiAgICAsIHByb21pc2VcblxuICBmaXJzdCA9IHNlbnRGaXJzdCA/IGZpcnN0IDogc2VsZi5maXJzdC5ldmFsdWF0ZShjb250ZXh0KVxuXG4gIGlmKGZpcnN0ICYmIGZpcnN0LmNvbnN0cnVjdG9yID09PSBQcm9taXNlKSB7XG4gICAgcHJvbWlzZSA9IG5ldyBQcm9taXNlXG5cbiAgICBmaXJzdC5vbmNlKCdkb25lJywgZnVuY3Rpb24oZGF0YSkge1xuICAgICAgcHJvbWlzZS5yZXNvbHZlKHNlbGYuZXZhbHVhdGUoY29udGV4dCwgZGF0YSwgbnVsbCwgdHJ1ZSwgZmFsc2UpKVxuICAgIH0pXG5cbiAgICByZXR1cm4gcHJvbWlzZVxuICB9XG5cbiAgc2Vjb25kID0gc2VudFNlY29uZCA/IHNlY29uZCA6IHNlbGYuc2Vjb25kLmV2YWx1YXRlKGNvbnRleHQpXG5cbiAgaWYoc2Vjb25kICYmIHNlY29uZC5jb25zdHJ1Y3RvciA9PT0gUHJvbWlzZSkge1xuICAgIHByb21pc2UgPSBuZXcgUHJvbWlzZVxuXG4gICAgc2Vjb25kLm9uY2UoJ2RvbmUnLCBmdW5jdGlvbihkYXRhKSB7XG4gICAgICBwcm9taXNlLnJlc29sdmUoc2VsZi5ldmFsdWF0ZShjb250ZXh0LCBmaXJzdCwgZGF0YSwgdHJ1ZSwgdHJ1ZSkpXG4gICAgfSlcblxuICAgIHJldHVybiBwcm9taXNlXG4gIH1cblxuICByZXR1cm4gc2VsZi5jbXAoZmlyc3QsIHNlY29uZClcbn1cblxuIiwibW9kdWxlLmV4cG9ydHMgPSBMaXRlcmFsVG9rZW5cblxuZnVuY3Rpb24gTGl0ZXJhbFRva2VuKHZhbHVlLCBvcmlnaW5hbCkge1xuICB0aGlzLmxicCA9IDBcbiAgdGhpcy52YWx1ZSA9IHZhbHVlXG59XG5cbnZhciBjb25zID0gTGl0ZXJhbFRva2VuXG4gICwgcHJvdG8gPSBjb25zLnByb3RvdHlwZVxuXG5wcm90by5udWQgPSBmdW5jdGlvbihwYXJzZXIpIHtcbiAgcmV0dXJuIHRoaXNcbn1cblxucHJvdG8ubGVkID0gZnVuY3Rpb24oKSB7XG4gIHRocm93IG5ldyBFcnJvcigpXG59XG5cbnByb3RvLmV2YWx1YXRlID0gZnVuY3Rpb24oY29udGV4dCkge1xuICBpZighdGhpcy52YWx1ZSlcbiAgICByZXR1cm4gdGhpcy52YWx1ZVxuXG4gIGlmKCF0aGlzLnZhbHVlLnJlc29sdmUpXG4gICAgcmV0dXJuIHRoaXMudmFsdWVcblxuICByZXR1cm4gdGhpcy52YWx1ZS5yZXNvbHZlKGNvbnRleHQpXG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IElmTm9kZVxuXG52YXIgUHJvbWlzZSA9IHJlcXVpcmUoJy4uLy4uL3Byb21pc2UnKVxuICAsIE5vZGVMaXN0ID0gcmVxdWlyZSgnLi4vLi4vbm9kZV9saXN0JylcbiAgLCBQYXJzZXIgPSByZXF1aXJlKCcuL3BhcnNlcicpXG5cbmZ1bmN0aW9uIElmTm9kZShwcmVkaWNhdGUsIHdoZW5fdHJ1ZSwgd2hlbl9mYWxzZSkge1xuICB0aGlzLnByZWRpY2F0ZSA9IHByZWRpY2F0ZVxuICB0aGlzLndoZW5fdHJ1ZSA9IHdoZW5fdHJ1ZVxuICB0aGlzLndoZW5fZmFsc2UgPSB3aGVuX2ZhbHNlXG59XG5cbnZhciBjb25zID0gSWZOb2RlXG4gICwgcHJvdG8gPSBjb25zLnByb3RvdHlwZVxuXG5wcm90by5yZW5kZXIgPSBmdW5jdGlvbihjb250ZXh0LCByZXN1bHQsIHRpbWVzKSB7XG4gIHZhciBzZWxmID0gdGhpc1xuICAgICwgcHJvbWlzZVxuXG4gIHJlc3VsdCA9IHRpbWVzID09PSAxID8gcmVzdWx0IDogdGhpcy5wcmVkaWNhdGUuZXZhbHVhdGUoY29udGV4dClcblxuICBpZihyZXN1bHQgJiYgcmVzdWx0LmNvbnN0cnVjdG9yID09PSBQcm9taXNlKSB7XG4gICAgcHJvbWlzZSA9IG5ldyBQcm9taXNlXG5cbiAgICByZXN1bHQub25jZSgnZG9uZScsIGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICBwcm9taXNlLnJlc29sdmUoc2VsZi5yZW5kZXIoY29udGV4dCwgdmFsdWUsIDEpKVxuICAgIH0pXG5cbiAgICByZXR1cm4gcHJvbWlzZVxuICB9XG5cbiAgaWYocmVzdWx0KSB7XG4gICAgcmV0dXJuIHRoaXMud2hlbl90cnVlLnJlbmRlcihjb250ZXh0KVxuICB9XG4gIHJldHVybiB0aGlzLndoZW5fZmFsc2UucmVuZGVyKGNvbnRleHQpXG59XG5cbmNvbnMucGFyc2UgPSBmdW5jdGlvbihjb250ZW50cywgcGFyc2VyKSB7XG4gIHZhciBiaXRzID0gY29udGVudHMuc3BsaXQoJyAnKS5zbGljZSgxKVxuICAgICwgaWZwID0gbmV3IFBhcnNlcihiaXRzLCBwYXJzZXIpXG4gICAgLCBwcmVkaWNhdGVcbiAgICAsIHdoZW5fdHJ1ZVxuICAgICwgd2hlbl9mYWxzZVxuICAgICwgbmV4dFxuXG4gIHByZWRpY2F0ZSA9IGlmcC5wYXJzZSgpXG5cbiAgd2hlbl90cnVlID0gcGFyc2VyLnBhcnNlKFsnZWxzZScsICdlbGlmJywgJ2VuZGlmJ10pXG5cbiAgbmV4dCA9IHBhcnNlci50b2tlbnMuc2hpZnQoKVxuXG4gIGlmKG5leHQuaXMoWydlbmRpZiddKSkge1xuICAgIHdoZW5fZmFsc2UgPSBuZXcgTm9kZUxpc3QoW10pXG4gIH0gZWxzZSBpZihuZXh0LmlzKFsnZWxpZiddKSkge1xuICAgIHdoZW5fZmFsc2UgPSBjb25zLnBhcnNlKG5leHQuY29udGVudCwgcGFyc2VyKVxuICB9IGVsc2Uge1xuICAgIHdoZW5fZmFsc2UgPSBwYXJzZXIucGFyc2UoWydlbmRpZiddKVxuICAgIHBhcnNlci50b2tlbnMuc2hpZnQoKVxuICB9XG5cbiAgcmV0dXJuIG5ldyBjb25zKHByZWRpY2F0ZSwgd2hlbl90cnVlLCB3aGVuX2ZhbHNlKVxufVxuIiwidmFyIEluZml4T3BlcmF0b3IgPSByZXF1aXJlKCcuL2luZml4JylcbiAgLCBQcmVmaXhPcGVyYXRvciA9IHJlcXVpcmUoJy4vcHJlZml4JylcblxudmFyIGtleXNcblxua2V5cyA9IE9iamVjdC5rZXlzIHx8IGtleXNoaW1cblxuZnVuY3Rpb24ga2V5c2hpbShvYmopIHtcbiAgdmFyIGFjY3VtID0gW11cblxuICBmb3IodmFyIG4gaW4gb2JqKSBpZihvYmouaGFzT3duUHJvcGVydHkobikpIHtcbiAgICBhY2N1bS5wdXNoKG4pXG4gIH1cblxuICByZXR1cm4gYWNjdW1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgJ29yJzogZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gbmV3IEluZml4T3BlcmF0b3IoNiwgZnVuY3Rpb24oeCwgeSkge1xuICAgICAgICAgIHJldHVybiB4IHx8IHlcbiAgICAgIH0pXG4gICAgfVxuXG4gICwgJ2FuZCc6IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIG5ldyBJbmZpeE9wZXJhdG9yKDcsIGZ1bmN0aW9uKHgsIHkpIHtcbiAgICAgICAgICByZXR1cm4geCAmJiB5XG4gICAgICB9KVxuICAgIH1cblxuICAsICdub3QnOiBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBuZXcgUHJlZml4T3BlcmF0b3IoOCwgZnVuY3Rpb24oeCkge1xuICAgICAgICByZXR1cm4gIXhcbiAgICAgIH0pXG4gICAgfVxuXG4gICwgJ2luJzogZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gbmV3IEluZml4T3BlcmF0b3IoOSwgaW5fb3BlcmF0b3IpXG4gICAgfVxuXG4gICwgJ25vdCBpbic6IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBuZXcgSW5maXhPcGVyYXRvcig5LCBmdW5jdGlvbih4LCB5KSB7XG4gICAgICByZXR1cm4gIWluX29wZXJhdG9yKHgseSlcbiAgICB9KVxuICB9XG5cbiAgLCAnPSc6IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBuZXcgSW5maXhPcGVyYXRvcigxMCwgZnVuY3Rpb24oeCwgeSkgeyBcbiAgICAgIHJldHVybiB4ID09IHlcbiAgICB9KVxuICB9XG5cbiAgLCAnPT0nOiBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBuZXcgSW5maXhPcGVyYXRvcigxMCwgZnVuY3Rpb24oeCwgeSkgeyBcbiAgICAgICAgcmV0dXJuIHggPT0geVxuICAgICAgfSlcbiAgICB9XG5cbiAgLCAnIT0nOiBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBuZXcgSW5maXhPcGVyYXRvcigxMCwgZnVuY3Rpb24oeCwgeSkgeyBcbiAgICAgICAgcmV0dXJuIHggIT09IHlcbiAgICAgIH0pXG4gICAgfVxuXG4gICwgJz4nOiBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBuZXcgSW5maXhPcGVyYXRvcigxMCwgZnVuY3Rpb24oeCwgeSkgeyBcbiAgICAgICAgcmV0dXJuIHggPiB5XG4gICAgICB9KVxuICAgIH1cblxuICAsICc+PSc6IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIG5ldyBJbmZpeE9wZXJhdG9yKDEwLCBmdW5jdGlvbih4LCB5KSB7IFxuICAgICAgICByZXR1cm4geCA+PSB5XG4gICAgICB9KVxuICAgIH1cblxuICAsICc8JzogZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gbmV3IEluZml4T3BlcmF0b3IoMTAsIGZ1bmN0aW9uKHgsIHkpIHsgXG4gICAgICAgIHJldHVybiB4IDwgeVxuICAgICAgfSlcbiAgICB9XG5cbiAgLCAnPD0nOiBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBuZXcgSW5maXhPcGVyYXRvcigxMCwgZnVuY3Rpb24oeCwgeSkgeyBcbiAgICAgICAgcmV0dXJuIHggPD0geVxuICAgICAgfSlcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGluX29wZXJhdG9yKHgsIHkpIHtcbiAgaWYoISh4IGluc3RhbmNlb2YgT2JqZWN0KSAmJiB5IGluc3RhbmNlb2YgT2JqZWN0KSB7XG4gICAgaWYoISh5ICYmICdsZW5ndGgnIGluIHkpKSB7XG4gICAgICB5ID0ga2V5cyh5KVxuICAgIH1cbiAgfVxuXG4gIGlmKHR5cGVvZih4KSA9PSAnc3RyaW5nJyAmJiB0eXBlb2YoeSkgPT0nc3RyaW5nJykge1xuICAgIHJldHVybiB5LmluZGV4T2YoeCkgIT09IC0xXG4gIH1cblxuICBpZih4ID09PSB1bmRlZmluZWQgfHwgeCA9PT0gbnVsbClcbiAgICByZXR1cm4gZmFsc2VcblxuICBpZih5ID09PSB1bmRlZmluZWQgfHwgeSA9PT0gbnVsbClcbiAgICByZXR1cm4gZmFsc2VcblxuICBmb3IodmFyIGZvdW5kID0gZmFsc2UsIGkgPSAwLCBsZW4gPSB5Lmxlbmd0aDsgaSA8IGxlbiAmJiAhZm91bmQ7ICsraSkge1xuICAgIHZhciByaHMgPSB5W2ldXG4gICAgaWYoeCBpbnN0YW5jZW9mIEFycmF5KSB7XG4gICAgICBmb3IodmFyIGlkeCA9IDAsXG4gICAgICAgIGVxdWFsID0geC5sZW5ndGggPT0gcmhzLmxlbmd0aCxcbiAgICAgICAgeGxlbiA9IHgubGVuZ3RoO1xuICAgICAgICBpZHggPCB4bGVuICYmIGVxdWFsOyArK2lkeCkge1xuXG4gICAgICAgIGVxdWFsID0gKHhbaWR4XSA9PT0gcmhzW2lkeF0pXG4gICAgICB9XG4gICAgICBmb3VuZCA9IGVxdWFsXG5cbiAgICB9IGVsc2UgaWYoeCBpbnN0YW5jZW9mIE9iamVjdCkge1xuICAgICAgaWYoeCA9PT0gcmhzKSB7XG4gICAgICAgIHJldHVybiB0cnVlXG4gICAgICB9XG4gICAgICB2YXIgeGtleXMgPSBrZXlzKHgpLFxuICAgICAgICBya2V5cyA9IGtleXMocmhzKVxuXG4gICAgICBpZih4a2V5cy5sZW5ndGggPT09IHJrZXlzLmxlbmd0aCkgeyBcbiAgICAgICAgZm9yKHZhciBpID0gMCwgbGVuID0geGtleXMubGVuZ3RoLCBlcXVhbCA9IHRydWU7XG4gICAgICAgICAgaSA8IGxlbiAmJiBlcXVhbDtcbiAgICAgICAgICArK2kpIHtcbiAgICAgICAgICBlcXVhbCA9IHhrZXlzW2ldID09PSBya2V5c1tpXSAmJlxuICAgICAgICAgICAgICB4W3hrZXlzW2ldXSA9PT0gcmhzW3JrZXlzW2ldXVxuICAgICAgICB9XG4gICAgICAgIGZvdW5kID0gZXF1YWxcbiAgICAgIH0gXG4gICAgfSBlbHNlIHtcbiAgICAgIGZvdW5kID0geCA9PSByaHNcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGZvdW5kXG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IElmUGFyc2VyXG5cbnZhciBMaXRlcmFsVG9rZW4gPSByZXF1aXJlKCcuL2xpdGVyYWwnKVxuICAsIEVuZFRva2VuID0gcmVxdWlyZSgnLi9lbmQnKVxuICAsIG9wZXJhdG9ycyA9IHJlcXVpcmUoJy4vb3BlcmF0b3JzJylcblxuZnVuY3Rpb24gSWZQYXJzZXIodG9rZW5zLCBwYXJzZXIpIHtcbiAgdGhpcy5jcmVhdGVWYXJpYWJsZSA9IGZ1bmN0aW9uKHRva2VuKSB7XG4gICAgcmV0dXJuIG5ldyBMaXRlcmFsVG9rZW4ocGFyc2VyLmNvbXBpbGUodG9rZW4pLCB0b2tlbilcbiAgfVxuXG4gIHZhciBsZW4gPSB0b2tlbnMubGVuZ3RoXG4gICAgLCBpID0gMFxuICAgICwgbWFwcGVkVG9rZW5zID0gW11cbiAgICAsIHRva2VuXG5cbiAgd2hpbGUoaSA8IGxlbikge1xuICAgIHRva2VuID0gdG9rZW5zW2ldXG4gICAgaWYodG9rZW4gPT0gJ25vdCcgJiYgdG9rZW5zW2krMV0gPT0gJ2luJykge1xuICAgICAgKytpXG4gICAgICB0b2tlbiA9ICdub3QgaW4nXG4gICAgfVxuICAgIG1hcHBlZFRva2Vucy5wdXNoKHRoaXMudHJhbnNsYXRlVG9rZW4odG9rZW4pKVxuICAgICsraVxuICB9XG5cbiAgdGhpcy5wb3MgPSAwXG4gIHRoaXMudG9rZW5zID0gbWFwcGVkVG9rZW5zXG4gIHRoaXMuY3VycmVudFRva2VuID0gdGhpcy5uZXh0KClcbn1cblxudmFyIGNvbnMgPSBJZlBhcnNlclxuICAsIHByb3RvID0gY29ucy5wcm90b3R5cGVcblxucHJvdG8udHJhbnNsYXRlVG9rZW4gPSBmdW5jdGlvbih0b2tlbikge1xuICB2YXIgb3AgPSBvcGVyYXRvcnNbdG9rZW5dXG5cbiAgaWYob3AgPT09IHVuZGVmaW5lZCkge1xuICAgIHJldHVybiB0aGlzLmNyZWF0ZVZhcmlhYmxlKHRva2VuKVxuICB9XG5cbiAgcmV0dXJuIG9wKClcbn1cblxucHJvdG8ubmV4dCA9IGZ1bmN0aW9uKCkge1xuICBpZih0aGlzLnBvcyA+PSB0aGlzLnRva2Vucy5sZW5ndGgpIHtcbiAgICByZXR1cm4gbmV3IEVuZFRva2VuKClcbiAgfVxuICByZXR1cm4gdGhpcy50b2tlbnNbdGhpcy5wb3MrK11cbn1cblxucHJvdG8ucGFyc2UgPSBmdW5jdGlvbigpIHtcbiAgdmFyIHJldHZhbCA9IHRoaXMuZXhwcmVzc2lvbigpXG5cbiAgaWYoISh0aGlzLmN1cnJlbnRUb2tlbi5jb25zdHJ1Y3RvciA9PT0gRW5kVG9rZW4pKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFwiVW51c2VkIFwiK3RoaXMuY3VycmVudFRva2VuK1wiIGF0IGVuZCBvZiBpZiBleHByZXNzaW9uLlwiKVxuICB9XG5cbiAgcmV0dXJuIHJldHZhbFxufVxuXG5wcm90by5leHByZXNzaW9uID0gZnVuY3Rpb24ocmJwKSB7XG4gIHJicCA9IHJicCB8fCAwXG5cbiAgdmFyIHQgPSB0aGlzLmN1cnJlbnRUb2tlblxuICAgICwgbGVmdFxuXG4gIHRoaXMuY3VycmVudFRva2VuID0gdGhpcy5uZXh0KClcblxuICBsZWZ0ID0gdC5udWQodGhpcylcbiAgd2hpbGUocmJwIDwgdGhpcy5jdXJyZW50VG9rZW4ubGJwKSB7XG4gICAgdCA9IHRoaXMuY3VycmVudFRva2VuXG5cbiAgICB0aGlzLmN1cnJlbnRUb2tlbiA9IHRoaXMubmV4dCgpXG5cbiAgICBsZWZ0ID0gdC5sZWQobGVmdCwgdGhpcylcbiAgfVxuXG4gIHJldHVybiBsZWZ0XG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IFByZWZpeE9wZXJhdG9yXG5cbnZhciBQcm9taXNlID0gcmVxdWlyZSgnLi4vLi4vcHJvbWlzZScpXG5cbmZ1bmN0aW9uIFByZWZpeE9wZXJhdG9yKGJwLCBjbXApIHtcbiAgdGhpcy5sYnAgPSBicFxuICB0aGlzLmNtcCA9IGNtcFxuXG4gIHRoaXMuZmlyc3QgPSBcbiAgdGhpcy5zZWNvbmQgPSBudWxsXG59XG5cbnZhciBjb25zID0gUHJlZml4T3BlcmF0b3JcbiAgLCBwcm90byA9IGNvbnMucHJvdG90eXBlXG5cbnByb3RvLm51ZCA9IGZ1bmN0aW9uKHBhcnNlcikge1xuICB0aGlzLmZpcnN0ID0gcGFyc2VyLmV4cHJlc3Npb24odGhpcy5sYnApXG4gIHRoaXMuc2Vjb25kID0gbnVsbFxuICByZXR1cm4gdGhpc1xufVxuXG5wcm90by5sZWQgPSBmdW5jdGlvbihmaXJzdCwgcGFyc2VyKSB7XG4gIHRocm93IG5ldyBFcnJvcihcIlVuZXhwZWN0ZWQgdG9rZW5cIilcbn1cblxucHJvdG8uZXZhbHVhdGUgPSBmdW5jdGlvbihjb250ZXh0LCBmaXJzdCwgdGltZXMpIHtcbiAgdmFyIHNlbGYgPSB0aGlzXG4gICAgLCBwcm9taXNlXG5cbiAgZmlyc3QgPSB0aW1lcyA9PT0gMSA/IGZpcnN0IDogc2VsZi5maXJzdC5ldmFsdWF0ZShjb250ZXh0KVxuXG4gIGlmKGZpcnN0ICYmIGZpcnN0LmNvbnN0cnVjdG9yID09PSBQcm9taXNlKSB7XG4gICAgcHJvbWlzZSA9IG5ldyBQcm9taXNlXG5cbiAgICBmaXJzdC5vbmNlKCdkb25lJywgZnVuY3Rpb24oZGF0YSkge1xuICAgICAgcHJvbWlzZS5yZXNvbHZlKHNlbGYuZXZhbHVhdGUoY29udGV4dCwgZGF0YSwgMSkpXG4gICAgfSlcblxuICAgIHJldHVybiBwcm9taXNlXG4gIH1cblxuICByZXR1cm4gc2VsZi5jbXAoZmlyc3QpXG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IEluY2x1ZGVOb2RlXG5cbnZhciBQcm9taXNlID0gcmVxdWlyZSgnLi4vcHJvbWlzZScpXG5cbmZ1bmN0aW9uIEluY2x1ZGVOb2RlKHRhcmdldF92YXIsIGxvYWRlcikge1xuICB0aGlzLnRhcmdldF92YXIgPSB0YXJnZXRfdmFyXG4gIHRoaXMubG9hZGVyID0gbG9hZGVyXG59XG5cbnZhciBjb25zID0gSW5jbHVkZU5vZGVcbiAgLCBwcm90byA9IGNvbnMucHJvdG90eXBlXG5cbmNvbnMucGFyc2UgPSBmdW5jdGlvbihjb250ZW50cywgcGFyc2VyKSB7XG4gIHZhciBiaXRzID0gY29udGVudHMuc3BsaXQoJyAnKVxuICAgICwgdmFybmFtZSA9IHBhcnNlci5jb21waWxlKGJpdHMuc2xpY2UoMSkuam9pbignICcpKVxuICAgICwgbG9hZGVyID0gcGFyc2VyLnBsdWdpbnMubG9va3VwKCdsb2FkZXInKVxuXG4gIHJldHVybiBuZXcgY29ucyh2YXJuYW1lLCBsb2FkZXIpIFxufVxuXG5wcm90by5yZW5kZXIgPSBmdW5jdGlvbihjb250ZXh0LCB0YXJnZXQpIHtcbiAgdmFyIHNlbGYgPSB0aGlzXG4gICAgLCBwcm9taXNlXG5cbiAgdGFyZ2V0ID0gdGFyZ2V0IHx8IHRoaXMudGFyZ2V0X3Zhci5yZXNvbHZlKGNvbnRleHQpXG5cbiAgaWYodGFyZ2V0ICYmIHRhcmdldC5jb25zdHJ1Y3RvciA9PT0gUHJvbWlzZSkge1xuICAgIHByb21pc2UgPSBuZXcgUHJvbWlzZVxuXG4gICAgdGFyZ2V0Lm9uY2UoJ2RvbmUnLCBmdW5jdGlvbihkYXRhKSB7XG4gICAgICBwcm9taXNlLnJlc29sdmUoc2VsZi5yZW5kZXIoY29udGV4dCwgZGF0YSkpXG4gICAgfSlcblxuICAgIHJldHVybiBwcm9taXNlXG4gIH1cblxuICB0YXJnZXQgPSBzZWxmLmdldF90ZW1wbGF0ZSh0YXJnZXQpXG5cbiAgaWYodGFyZ2V0ICYmIHRhcmdldC5jb25zdHJ1Y3RvciA9PT0gUHJvbWlzZSkge1xuICAgIHByb21pc2UgPSBuZXcgUHJvbWlzZVxuXG4gICAgdGFyZ2V0Lm9uY2UoJ2RvbmUnLCBmdW5jdGlvbihkYXRhKSB7XG4gICAgICBwcm9taXNlLnJlc29sdmUoc2VsZi5yZW5kZXIoY29udGV4dCwgZGF0YSkpXG4gICAgfSkgIFxuXG4gICAgcmV0dXJuIHByb21pc2VcbiAgfVxuXG4gIHByb21pc2UgPSBuZXcgUHJvbWlzZVxuXG4gIHRhcmdldC5yZW5kZXIoY29udGV4dC5jb3B5KCksIGZ1bmN0aW9uKGVyciwgZGF0YSkge1xuICAgIHByb21pc2UucmVzb2x2ZShkYXRhKVxuICB9KVxuXG4gIHJldHVybiBwcm9taXNlXG59XG5cbnByb3RvLmdldF90ZW1wbGF0ZSA9IGZ1bmN0aW9uKHRhcmdldCkge1xuICBpZih0eXBlb2YgdGFyZ2V0ID09PSAnc3RyaW5nJykge1xuICAgIHJldHVybiB0aGlzLmxvYWRlcih0YXJnZXQpXG4gIH1cblxuICAvLyBva2F5LCBpdCdzIHByb2JhYmx5IGEgdGVtcGxhdGUgb2JqZWN0XG4gIHJldHVybiB0YXJnZXRcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gTm93Tm9kZVxuXG52YXIgZm9ybWF0ID0gcmVxdWlyZSgnLi4vZGF0ZScpLmRhdGVcblxuZnVuY3Rpb24gTm93Tm9kZShmb3JtYXRTdHJpbmcpIHtcbiAgdGhpcy5mb3JtYXQgPSBmb3JtYXRTdHJpbmdcbn1cblxudmFyIGNvbnMgPSBOb3dOb2RlXG4gICwgcHJvdG8gPSBjb25zLnByb3RvdHlwZVxuXG5wcm90by5yZW5kZXIgPSBmdW5jdGlvbihjb250ZXh0KSB7XG4gIHJldHVybiBmb3JtYXQobmV3IERhdGUsIHRoaXMuZm9ybWF0KVxufVxuXG5jb25zLnBhcnNlID0gZnVuY3Rpb24oY29udGVudHMsIHBhcnNlcikge1xuICB2YXIgYml0cyA9IGNvbnRlbnRzLnNwbGl0KCcgJylcbiAgICAsIGZtdCA9IGJpdHMuc2xpY2UoMSkuam9pbignICcpXG5cbiAgZm10ID0gZm10XG4gICAgLnJlcGxhY2UoL15cXHMrLywgJycpXG4gICAgLnJlcGxhY2UoL1xccyskLywgJycpXG5cbiAgaWYoL1snXCJdLy50ZXN0KGZtdC5jaGFyQXQoMCkpKSB7XG4gICAgZm10ID0gZm10LnNsaWNlKDEsIC0xKVxuICB9XG5cbiAgcmV0dXJuIG5ldyBOb3dOb2RlKGZtdCB8fCAnTiBqLCBZJylcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gV2l0aE5vZGVcblxudmFyIFByb21pc2UgPSByZXF1aXJlKCcuLi9wcm9taXNlJylcblxuZnVuY3Rpb24gV2l0aE5vZGUod2l0aF92YXIsIGFzX3Zhciwgbm9kZXMpIHtcbiAgdGhpcy53aXRoX3ZhciA9IHdpdGhfdmFyXG4gIHRoaXMuYXNfdmFyID0gYXNfdmFyXG4gIHRoaXMubm9kZXMgPSBub2Rlc1xufVxuXG52YXIgY29ucyA9IFdpdGhOb2RlXG4gICwgcHJvdG8gPSBjb25zLnByb3RvdHlwZVxuXG5jb25zLnBhcnNlID0gZnVuY3Rpb24oY29udGVudHMsIHBhcnNlcikge1xuICB2YXIgYml0cyA9IGNvbnRlbnRzLnNwbGl0KC9cXHMrL2cpXG4gICAgLCB3aXRodmFyID0gcGFyc2VyLmNvbXBpbGUoYml0c1sxXSlcbiAgICAsIGFzdmFyID0gYml0c1szXVxuICAgICwgbm9kZWxpc3QgPSBwYXJzZXIucGFyc2UoWydlbmR3aXRoJ10pXG5cbiAgcGFyc2VyLnRva2Vucy5zaGlmdCgpXG4gIHJldHVybiBuZXcgY29ucyh3aXRodmFyLCBhc3Zhciwgbm9kZWxpc3QpXG59XG5cbnByb3RvLnJlbmRlciA9IGZ1bmN0aW9uKGNvbnRleHQsIHZhbHVlKSB7XG4gIHZhciBzZWxmID0gdGhpcyBcbiAgICAsIHJlc3VsdFxuICAgICwgcHJvbWlzZVxuXG4gIHZhbHVlID0gYXJndW1lbnRzLmxlbmd0aCA9PT0gMiA/IHZhbHVlIDogc2VsZi53aXRoX3Zhci5yZXNvbHZlKGNvbnRleHQpXG5cbiAgaWYodmFsdWUgJiYgdmFsdWUuY29uc3RydWN0b3IgPT09IFByb21pc2UpIHtcbiAgICBwcm9taXNlID0gbmV3IFByb21pc2VcblxuICAgIHZhbHVlLm9uY2UoJ2RvbmUnLCBmdW5jdGlvbihkYXRhKSB7XG4gICAgICBwcm9taXNlLnJlc29sdmUoc2VsZi5yZW5kZXIoY29udGV4dCwgZGF0YSkpXG4gICAgfSlcblxuICAgIHJldHVybiBwcm9taXNlXG4gIH1cblxuICBjb250ZXh0ID0gY29udGV4dC5jb3B5KClcbiAgY29udGV4dFtzZWxmLmFzX3Zhcl0gPSB2YWx1ZVxuXG4gIHJlc3VsdCA9IHNlbGYubm9kZXMucmVuZGVyKGNvbnRleHQpXG5cbiAgcmV0dXJuIHJlc3VsdFxufVxuIiwibW9kdWxlLmV4cG9ydHMgPSBUZXh0Tm9kZVxuXG5mdW5jdGlvbiBUZXh0Tm9kZShjb250ZW50KSB7XG4gIHRoaXMuY29udGVudCA9IGNvbnRlbnRcbn1cblxudmFyIGNvbnMgPSBUZXh0Tm9kZVxuICAsIHByb3RvID0gY29ucy5wcm90b3R5cGVcblxucHJvdG8ucmVuZGVyID0gZnVuY3Rpb24oY29udGV4dCkge1xuICByZXR1cm4gdGhpcy5jb250ZW50XG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IFRleHRUb2tlblxuXG52YXIgVG9rZW4gPSByZXF1aXJlKCcuL3Rva2VuJylcbiAgLCBUZXh0Tm9kZSA9IHJlcXVpcmUoJy4vdGV4dF9ub2RlJylcblxuZnVuY3Rpb24gVGV4dFRva2VuKGNvbnRlbnQsIGxpbmUpIHtcbiAgVG9rZW4uY2FsbCh0aGlzLCBjb250ZW50LCBsaW5lKVxufVxuXG52YXIgY29ucyA9IFRleHRUb2tlblxuICAsIHByb3RvID0gY29ucy5wcm90b3R5cGUgPSBuZXcgVG9rZW5cblxucHJvdG8uY29uc3RydWN0b3IgPSBjb25zXG5cbnByb3RvLm5vZGUgPSBmdW5jdGlvbihwYXJzZXIpIHtcbiAgcmV0dXJuIG5ldyBUZXh0Tm9kZSh0aGlzLmNvbnRlbnQpXG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IFRva2VuXG5cbmZ1bmN0aW9uIFRva2VuKGNvbnRlbnQsIGxpbmUpIHtcbiAgdGhpcy5jb250ZW50ID0gY29udGVudFxuICB0aGlzLmxpbmUgPSBsaW5lXG5cbiAgdGhpcy5uYW1lID0gY29udGVudCAmJiBjb250ZW50LnNwbGl0KCcgJylbMF1cbn1cblxudmFyIGNvbnMgPSBUb2tlblxuICAsIHByb3RvID0gY29ucy5wcm90b3R5cGVcblxucHJvdG8udG9TdHJpbmcgPSBmdW5jdGlvbigpIHtcbiAgLy8gTkI6IHRoaXMgc2hvdWxkIG9ubHkgYmVcbiAgLy8gZGVidWcgb3V0cHV0LCBzbyBpdCdzXG4gIC8vIHByb2JhYmx5IHNhZmUgdG8gdXNlXG4gIC8vIEpTT04uc3RyaW5naWZ5IGhlcmUuXG4gIHJldHVybiAnPCcrdGhpcy5jb25zdHJ1Y3Rvci5uYW1lKyc6ICcrSlNPTi5zdHJpbmdpZnkodGhpcy5jb250ZW50KSsnPidcbn1cblxucHJvdG8uaXMgPSBmdW5jdGlvbihuYW1lcykge1xuICBmb3IodmFyIGkgPSAwLCBsZW4gPSBuYW1lcy5sZW5ndGg7IGkgPCBsZW47ICsraSlcbiAgICBpZihuYW1lc1tpXSA9PT0gdGhpcy5uYW1lKVxuICAgICAgcmV0dXJuIHRydWVcbiAgcmV0dXJuIGZhbHNlXG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGlucHV0LCBjYWxsYmFjaykge1xuICB2YXIgc3RyID0gaW5wdXQudG9TdHJpbmcoKVxuICByZXR1cm4gc3RyLnJlcGxhY2UoLygoKGh0dHAocyk/OlxcL1xcLyl8KG1haWx0bzopKShbXFx3XFxkXFwtXFwuOkBcXC8/Jj0lXSkrKS9nLCBjYWxsYmFjaylcbn0iLCI7KGZ1bmN0aW9uKCkge1xuXG4vLyBzbywgdGhlIG9ubHkgd2F5IHdlIChyZWxpYWJseSkgZ2V0IGFjY2VzcyB0byBEU1QgaW4gamF2YXNjcmlwdFxuLy8gaXMgdmlhIGBEYXRlI2dldFRpbWV6b25lT2Zmc2V0YC5cbi8vXG4vLyB0aGlzIHZhbHVlIHdpbGwgc3dpdGNoIGZvciBhIGdpdmVuIGRhdGUgYmFzZWQgb24gdGhlIHByZXNlbmNlIG9yIGFic2VuY2Vcbi8vIG9mIERTVCBhdCB0aGF0IGRhdGUuXG5cbmZ1bmN0aW9uIGZpbmRfZHN0X3RocmVzaG9sZCAobmVhciwgZmFyKSB7XG4gIHZhciBuZWFyX2RhdGUgPSBuZXcgRGF0ZShuZWFyKVxuICAgICwgZmFyX2RhdGUgPSBuZXcgRGF0ZShmYXIpXG4gICAgLCBuZWFyX29mZnMgPSBuZWFyX2RhdGUuZ2V0VGltZXpvbmVPZmZzZXQoKVxuICAgICwgZmFyX29mZnMgPSBmYXJfZGF0ZS5nZXRUaW1lem9uZU9mZnNldCgpXG5cbiAgaWYobmVhcl9vZmZzID09PSBmYXJfb2ZmcykgcmV0dXJuIDBcblxuICBpZihNYXRoLmFicyhuZWFyX2RhdGUgLSBmYXJfZGF0ZSkgPCAxMDAwKSByZXR1cm4gbmVhcl9kYXRlXG5cbiAgcmV0dXJuIGZpbmRfZHN0X3RocmVzaG9sZChuZWFyLCBuZWFyKyhmYXItbmVhcikvMikgfHwgZmluZF9kc3RfdGhyZXNob2xkKG5lYXIrKGZhci1uZWFyKS8yLCBmYXIpXG59XG5cblxuZnVuY3Rpb24gZmluZF9kc3RfdGhyZXNob2xkcygpIHtcbiAgdmFyIGQgPSBuZXcgRGF0ZSgpXG4gICAgLCBkID0gbmV3IERhdGUoZC5nZXRGdWxsWWVhcigpLCAwLCAxKVxuICAgICwgZiA9IG5ldyBEYXRlKGQuZ2V0RnVsbFllYXIoKSwgMTEsIDMxKVxuICAgICwgeFxuICAgICwgZmlyc3RcbiAgICAsIHNlY29uZFxuXG4gIHggPSAoZiAtIGQpIC8gLTJcbiAgZmlyc3QgPSBmaW5kX2RzdF90aHJlc2hvbGQoK2QsIGQgLSB4KVxuICBzZWNvbmQgPSBmaW5kX2RzdF90aHJlc2hvbGQoZCAtIHgsICtmKVxuXG4gIHJldHVybiB7XG4gICAgc3ByaW5nX2ZvcndhcmQgIDogZmlyc3QgPyAoZmlyc3QuZ2V0VGltZXpvbmVPZmZzZXQoKSA8IHNlY29uZC5nZXRUaW1lem9uZU9mZnNldCgpID8gc2Vjb25kIDogZmlyc3QpIC0gbmV3IERhdGUoZC5nZXRGdWxsWWVhcigpLCAwLCAxLCAwLCAwKSA6IDBcbiAgLCBmYWxsX2JhY2sgICAgICAgOiBmaXJzdCA/IChmaXJzdC5nZXRUaW1lem9uZU9mZnNldCgpIDwgc2Vjb25kLmdldFRpbWV6b25lT2Zmc2V0KCkgPyBmaXJzdCA6IHNlY29uZCkgLSBuZXcgRGF0ZShkLmdldEZ1bGxZZWFyKCksIDAsIDEsIDAsIDApIDogMFxuICB9XG59XG5cbnZhciBUSFJFU0hPTERTID0gZmluZF9kc3RfdGhyZXNob2xkcygpXG5cbmZ1bmN0aW9uIGlzX2RzdChkYXRldGltZSwgdGhyZXNob2xkcykge1xuXG4gIHRocmVzaG9sZHMgPSB0aHJlc2hvbGRzIHx8IFRIUkVTSE9MRFNcblxuICBpZih0aHJlc2hvbGRzLnNwcmluZ19mb3J3YXJkID09PSB0aHJlc2hvbGRzLmZhbGxfYmFjaylcbiAgICByZXR1cm4gZmFsc2VcblxuICB2YXIgb2Zmc2V0ID0gZGF0ZXRpbWUgLSBuZXcgRGF0ZShkYXRldGltZS5nZXRGdWxsWWVhcigpLCAwLCAxLCAwLCAwKVxuICAgICwgZHN0X2lzX3JldmVyc2VkID0gdGhyZXNob2xkcy5zcHJpbmdfZm9yd2FyZCA+IHRocmVzaG9sZHMuZmFsbF9iYWNrXG4gICAgLCBtYXggPSBNYXRoLm1heCh0aHJlc2hvbGRzLmZhbGxfYmFjaywgdGhyZXNob2xkcy5zcHJpbmdfZm9yd2FyZClcbiAgICAsIG1pbiA9IE1hdGgubWluKHRocmVzaG9sZHMuZmFsbF9iYWNrLCB0aHJlc2hvbGRzLnNwcmluZ19mb3J3YXJkKVxuXG4gIGlmKG1pbiA8IG9mZnNldCAmJiBvZmZzZXQgPCBtYXgpXG4gICAgcmV0dXJuICFkc3RfaXNfcmV2ZXJzZWRcbiAgcmV0dXJuIGRzdF9pc19yZXZlcnNlZFxufVxuXG5EYXRlLnByb3RvdHlwZS5pc0RTVCA9IGZ1bmN0aW9uKHRocmVzaG9sZHMpIHtcbiAgcmV0dXJuIGlzX2RzdCh0aGlzLCB0aHJlc2hvbGRzKSBcbn1cblxuaXNfZHN0LmZpbmRfdGhyZXNob2xkcyA9IGZpbmRfZHN0X3RocmVzaG9sZHNcblxuaWYodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgbW9kdWxlLmV4cG9ydHMgPSBpc19kc3Rcbn0gZWxzZSB7XG4gIHdpbmRvdy5pc19kc3QgPSBpc19kc3QgXG59XG5cbn0pKClcbiIsInZhciB0eiA9IHJlcXVpcmUoJy4vdHonKVxuICAsIGlzRFNUID0gcmVxdWlyZSgnZHN0JylcblxubW9kdWxlLmV4cG9ydHMgPSB0emluZm9cblxuZnVuY3Rpb24gZ2V0X29mZnNldF9mbXQodHpvZmZzKSB7XG4gIHZhciBvZmZzID0gfn4odHpvZmZzIC8gNjApXG4gICAgLCBtaW5zID0gKCcwMCcgKyB+fk1hdGguYWJzKHR6b2ZmcyAlIDYwKSkuc2xpY2UoLTIpXG5cbiAgb2ZmcyA9ICgodHpvZmZzID4gMCkgPyAnLScgOiAnKycpICsgKCcwMCcgKyBNYXRoLmFicyhvZmZzKSkuc2xpY2UoLTIpICsgbWluc1xuXG4gIHJldHVybiBvZmZzXG59XG5cbmZ1bmN0aW9uIHR6aW5mbyhkYXRlLCB0el9saXN0LCBkZXRlcm1pbmVfZHN0LCBUWikge1xuXG4gIHZhciBmbXQgPSBnZXRfb2Zmc2V0X2ZtdChkYXRlLmdldFRpbWV6b25lT2Zmc2V0KCkpXG5cbiAgVFogPSBUWiB8fCB0elxuICB0el9saXN0ID0gdHpfbGlzdCB8fCBUWltmbXRdXG4gIGRldGVybWluZV9kc3QgPSBkZXRlcm1pbmVfZHN0IHx8IGlzRFNUXG5cbiAgdmFyIGRhdGVfaXNfZHN0ID0gZGV0ZXJtaW5lX2RzdChkYXRlKVxuICAgICwgZGF0ZV9kc3RfdGhyZXNob2xkcyA9IGRldGVybWluZV9kc3QuZmluZF90aHJlc2hvbGRzKClcbiAgICAsIGhhc19kc3QgPSBkYXRlX2RzdF90aHJlc2hvbGRzLnNwcmluZ19mb3J3YXJkICE9PSBkYXRlX2RzdF90aHJlc2hvbGRzLmZhbGxfYmFja1xuICAgICwgaXNfbm9ydGggPSBoYXNfZHN0ICYmIGRhdGVfZHN0X3RocmVzaG9sZHMuc3ByaW5nX2ZvcndhcmQgPCBkYXRlX2RzdF90aHJlc2hvbGRzLmZhbGxfYmFjayBcbiAgICAsIGxpc3QgPSAodHpfbGlzdCB8fCBbXSkuc2xpY2UoKVxuICAgICwgZmlsdGVyZWQgPSBbXVxuXG4gIHZhciBkYXRlc3Ryb2Zmc2V0ID0gL1xcKCguKj8pXFwpLy5leGVjKCcnICsgbmV3IERhdGUoKSlcblxuICBpZihkYXRlc3Ryb2Zmc2V0KSB7XG4gICAgZGF0ZXN0cm9mZnNldCA9IGRhdGVzdHJvZmZzZXRbMV1cblxuICAgIGZvcih2YXIgaSA9IDAsIGxlbiA9IGxpc3QubGVuZ3RoOyBpIDwgbGVuOyArK2kpIHtcbiAgICAgIGlmKGxpc3RbaV0uYWJiciA9PT0gZGF0ZXN0cm9mZnNldCkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgJ25hbWUnOiBsaXN0W2ldLm5hbWVcbiAgICAgICAgICAsICdsb2MnOiBsaXN0W2ldLmxvY1xuICAgICAgICAgICwgJ2FiYnInOiBsaXN0W2ldLmFiYnJcbiAgICAgICAgICAsICdvZmZzZXQnOiBmbXRcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG5cbiAgaWYoIWlzX25vcnRoKVxuICAgIGxpc3QgPSBsaXN0LnJldmVyc2UoKVxuXG4gIGZvcih2YXIgaSA9IDAsIGxlbiA9IGxpc3QubGVuZ3RoOyBpIDwgbGVuOyArK2kpIHtcbiAgICBpZihkYXRlX2lzX2RzdCA9PT0gLyhbRGRdYXlsaWdodHxbU3NddW1tZXIpLy50ZXN0KGxpc3RbaV0ubmFtZSkpIHtcbiAgICAgIGZpbHRlcmVkLnB1c2gobGlzdFtpXSlcbiAgICB9XG4gIH1cbiAgbGlzdCA9IGZpbHRlcmVkXG4gIGlmKCFsaXN0Lmxlbmd0aCkgcmV0dXJuIHt9XG5cbiAgcmV0dXJuIHtcbiAgICAgICduYW1lJzogICAgIGxpc3RbMF0ubmFtZVxuICAgICwgJ2xvYyc6ICAgICAgbGlzdFswXS5sb2NcbiAgICAsICdhYmJyJzogICAgIGxpc3RbMF0uYWJiclxuICAgICwgJ29mZnNldCc6ICAgZm10XG4gIH1cbn0gXG5cbnR6aW5mby5nZXRfb2Zmc2V0X2Zvcm1hdCA9IGdldF9vZmZzZXRfZm10XG50emluZm8udHpfbGlzdCA9IHR6XG5cbkRhdGUucHJvdG90eXBlLnR6aW5mbyA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gdHppbmZvKHRoaXMpXG59XG5cbkRhdGUucHJvdG90eXBlLnR6b2Zmc2V0ID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiAnR01UJytnZXRfb2Zmc2V0X2ZtdCh0aGlzLmdldFRpbWV6b25lT2Zmc2V0KCkpXG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IHtcbiAgXCIrMDkwMFwiOiBbXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJBc2lhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiSlNUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiSmFwYW4gU3RhbmRhcmQgVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJBc2lhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiS1NUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiS29yZWEgU3RhbmRhcmQgVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJBdXN0cmFsaWFcIiwgXG4gICAgICBcImFiYnJcIjogXCJXRFRcIiwgXG4gICAgICBcIm5hbWVcIjogXCJXZXN0ZXJuIERheWxpZ2h0IFRpbWVcIlxuICAgIH0gXG4gIF0sIFxuICBcIisxMzQ1XCI6IFtcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIlBhY2lmaWNcIiwgXG4gICAgICBcImFiYnJcIjogXCJDSEFEVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIkNoYXRoYW0gSXNsYW5kIERheWxpZ2h0IFRpbWVcIlxuICAgIH1cbiAgXSwgXG4gIFwiKzA1MDBcIjogW1xuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiQXNpYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIlBLVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIlBha2lzdGFuIFN0YW5kYXJkIFRpbWVcIlxuICAgIH0gXG4gIF0sIFxuICBcIiswNDMwXCI6IFtcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIkFzaWFcIiwgXG4gICAgICBcImFiYnJcIjogXCJBRlRcIiwgXG4gICAgICBcIm5hbWVcIjogXCJBZmdoYW5pc3RhbiBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIkFzaWFcIiwgXG4gICAgICBcImFiYnJcIjogXCJJUkRUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiSXJhbiBEYXlsaWdodCBUaW1lXCJcbiAgICB9XG4gIF0sIFxuICBcIisxMjAwXCI6IFtcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIkFzaWFcIiwgXG4gICAgICBcImFiYnJcIjogXCJBTkFTVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIkFuYWR5ciBTdW1tZXIgVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJBc2lhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiQU5BVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIkFuYWR5ciBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIlBhY2lmaWNcIiwgXG4gICAgICBcImFiYnJcIjogXCJGSlRcIiwgXG4gICAgICBcIm5hbWVcIjogXCJGaWppIFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiUGFjaWZpY1wiLCBcbiAgICAgIFwiYWJiclwiOiBcIkdJTFRcIiwgXG4gICAgICBcIm5hbWVcIjogXCJHaWxiZXJ0IElzbGFuZCBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIkFzaWFcIiwgXG4gICAgICBcImFiYnJcIjogXCJNQUdTVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIk1hZ2FkYW4gU3VtbWVyIFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiUGFjaWZpY1wiLCBcbiAgICAgIFwiYWJiclwiOiBcIk1IVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIk1hcnNoYWxsIElzbGFuZHMgVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJQYWNpZmljXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiTlpTVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIk5ldyBaZWFsYW5kIFN0YW5kYXJkIFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiQXNpYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIlBFVFNUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiS2FtY2hhdGthIFN1bW1lciBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIkFzaWFcIiwgXG4gICAgICBcImFiYnJcIjogXCJQRVRUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiS2FtY2hhdGthIFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiUGFjaWZpY1wiLCBcbiAgICAgIFwiYWJiclwiOiBcIlRWVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIlR1dmFsdSBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIlBhY2lmaWNcIiwgXG4gICAgICBcImFiYnJcIjogXCJXRlRcIiwgXG4gICAgICBcIm5hbWVcIjogXCJXYWxsaXMgYW5kIEZ1dHVuYSBUaW1lXCJcbiAgICB9XG4gIF0sIFxuICBcIi0xMTAwXCI6IFtcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIlBhY2lmaWNcIiwgXG4gICAgICBcImFiYnJcIjogXCJTU1RcIiwgXG4gICAgICBcIm5hbWVcIjogXCJTYW1vYSBTdGFuZGFyZCBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIlBhY2lmaWNcIiwgXG4gICAgICBcImFiYnJcIjogXCJXU1RcIiwgXG4gICAgICBcIm5hbWVcIjogXCJXZXN0IFNhbW9hIFRpbWVcIlxuICAgIH0gXG4gIF0sIFxuICBcIisxNDAwXCI6IFtcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIlBhY2lmaWNcIiwgXG4gICAgICBcImFiYnJcIjogXCJMSU5UXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiTGluZSBJc2xhbmRzIFRpbWVcIlxuICAgIH1cbiAgXSwgXG4gIFwiLTAyMzBcIjogW1xuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiTm9ydGggQW1lcmljYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIkhBVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIkhldXJlIEF2YW5jXFx1MDBlOWUgZGUgVGVycmUtTmV1dmVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiTm9ydGggQW1lcmljYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIk5EVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIk5ld2ZvdW5kbGFuZCBEYXlsaWdodCBUaW1lXCJcbiAgICB9XG4gIF0sIFxuICBcIi0wMTAwXCI6IFtcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIkFmcmljYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIkNWVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIkNhcGUgVmVyZGUgVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJOb3J0aCBBbWVyaWNhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiRUdUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiRWFzdCBHcmVlbmxhbmQgVGltZVwiXG4gICAgfSBcbiAgXSwgXG4gIFwiLTEyMDBcIjogW1xuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiTWlsaXRhcnlcIiwgXG4gICAgICBcImFiYnJcIjogXCJZXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiWWFua2VlIFRpbWUgWm9uZVwiXG4gICAgfVxuICBdLCBcbiAgXCIrMDgwMFwiOiBbXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJBc2lhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiQ1NUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiQ2hpbmEgU3RhbmRhcmQgVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJBc2lhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiS1JBU1RcIiwgXG4gICAgICBcIm5hbWVcIjogXCJLcmFzbm95YXJzayBTdW1tZXIgVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJBdXN0cmFsaWFcIiwgXG4gICAgICBcImFiYnJcIjogXCJXU1RcIiwgXG4gICAgICBcIm5hbWVcIjogXCJXZXN0ZXJuIFN0YW5kYXJkIFRpbWVcIlxuICAgIH1cbiAgXSwgXG4gIFwiKzA2MzBcIjogW1xuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiQXNpYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIk1NVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIk15YW5tYXIgVGltZVwiXG4gICAgfSxcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIkluZGlhbiBPY2VhblwiLCBcbiAgICAgIFwiYWJiclwiOiBcIkNDVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIkNvY29zIElzbGFuZHMgVGltZVwiXG4gICAgfVxuICBdLCBcbiAgXCItMDQzMFwiOiBbXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJTb3V0aCBBbWVyaWNhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiSExWXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiSG9yYSBMZWdhbCBkZSBWZW5lenVlbGFcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiU291dGggQW1lcmljYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIlZFVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIlZlbmV6dWVsYW4gU3RhbmRhcmQgVGltZVwiXG4gICAgfVxuICBdLCBcbiAgXCItMDcwMFwiOiBbXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJOb3J0aCBBbWVyaWNhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiTVNUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiTW91bnRhaW4gU3RhbmRhcmQgVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJOb3J0aCBBbWVyaWNhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiUERUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiUGFjaWZpYyBEYXlsaWdodCBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIk5vcnRoIEFtZXJpY2FcIiwgXG4gICAgICBcImFiYnJcIjogXCJIQVBcIiwgXG4gICAgICBcIm5hbWVcIjogXCJIZXVyZSBBdmFuY1xcdTAwZTllIGR1IFBhY2lmaXF1ZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJOb3J0aCBBbWVyaWNhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiSE5SXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiSGV1cmUgTm9ybWFsZSBkZXMgUm9jaGV1c2VzXCJcbiAgICB9IFxuICBdLCBcbiAgXCItMDIwMFwiOiBbXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJTb3V0aCBBbWVyaWNhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiRk5UXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiRmVybmFuZG8gZGUgTm9yb25oYSBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIk5vcnRoIEFtZXJpY2FcIiwgXG4gICAgICBcImFiYnJcIjogXCJXR1NUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiV2VzdGVybiBHcmVlbmxhbmQgU3VtbWVyIFRpbWVcIlxuICAgIH0sXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJOb3J0aCBBbWVyaWNhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiUE1EVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIlBpZXJyZSAmIE1pcXVlbG9uIERheWxpZ2h0IFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiU291dGggQW1lcmljYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIlVZU1RcIiwgXG4gICAgICBcIm5hbWVcIjogXCJVcnVndWF5IFN1bW1lciBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIlNvdXRoIEFtZXJpY2FcIiwgXG4gICAgICBcImFiYnJcIjogXCJCUlNUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiQnJhc2lsaWEgU3VtbWVyIFRpbWVcIlxuICAgIH0gXG4gIF0sIFxuICBcIisxMDMwXCI6IFtcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIkF1c3RyYWxpYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIkNEVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIkNlbnRyYWwgRGF5bGlnaHQgVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJBdXN0cmFsaWFcIiwgXG4gICAgICBcImFiYnJcIjogXCJMSFNUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiTG9yZCBIb3dlIFN0YW5kYXJkIFRpbWVcIlxuICAgIH1cbiAgXSwgXG4gIFwiKzAzMDBcIjogW1xuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiRXVyb3BlXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiTVNLXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiTW9zY293IFN0YW5kYXJkIFRpbWVcIlxuICAgIH0sXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJBc2lhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiSURUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiSXNyYWVsIERheWxpZ2h0IFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiQXNpYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIkFTVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIkFyYWJpYSBTdGFuZGFyZCBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIkluZGlhbiBPY2VhblwiLCBcbiAgICAgIFwiYWJiclwiOiBcIkVBVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIkVhc3QgQWZyaWNhIFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiRXVyb3BlXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiRUVTVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIkVhc3Rlcm4gRXVyb3BlYW4gU3VtbWVyIFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiQWZyaWNhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiRUFUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiRWFzdGVybiBBZnJpY2EgVGltZVwiXG4gICAgfSBcbiAgXSwgXG4gIFwiVVRDXCI6IFtcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIkF0bGFudGljXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiQVpPU1RcIiwgXG4gICAgICBcIm5hbWVcIjogXCJBem9yZXMgU3VtbWVyIFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiTm9ydGggQW1lcmljYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIkVHU1RcIiwgXG4gICAgICBcIm5hbWVcIjogXCJFYXN0ZXJuIEdyZWVubGFuZCBTdW1tZXIgVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJBZnJpY2FcIiwgXG4gICAgICBcImFiYnJcIjogXCJHTVRcIiwgXG4gICAgICBcIm5hbWVcIjogXCJHcmVlbndpY2ggTWVhbiBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIkV1cm9wZVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIkdNVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIkdyZWVud2ljaCBNZWFuIFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiQWZyaWNhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiV0VUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiV2VzdGVybiBFdXJvcGVhbiBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIkV1cm9wZVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIldFVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIldlc3Rlcm4gRXVyb3BlYW4gVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJBZnJpY2FcIiwgXG4gICAgICBcImFiYnJcIjogXCJXVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIldlc3Rlcm4gU2FoYXJhIFN0YW5kYXJkIFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiTWlsaXRhcnlcIiwgXG4gICAgICBcImFiYnJcIjogXCJaXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiWnVsdSBUaW1lIFpvbmVcIlxuICAgIH1cbiAgXSwgXG4gIFwiKzA0MDBcIjogW1xuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiQXNpYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIkFNVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIkFybWVuaWEgVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJBc2lhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiQVpUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiQXplcmJhaWphbiBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIk1pbGl0YXJ5XCIsIFxuICAgICAgXCJhYmJyXCI6IFwiRFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIkRlbHRhIFRpbWUgWm9uZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJBc2lhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiR0VUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiR2VvcmdpYSBTdGFuZGFyZCBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIkFzaWFcIiwgXG4gICAgICBcImFiYnJcIjogXCJHU1RcIiwgXG4gICAgICBcIm5hbWVcIjogXCJHdWxmIFN0YW5kYXJkIFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiRXVyb3BlXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiS1VZVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIkt1eWJ5c2hldiBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIkV1cm9wZVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIk1TRFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIk1vc2NvdyBEYXlsaWdodCBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIkFmcmljYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIk1VVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIk1hdXJpdGl1cyBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIkFmcmljYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIlJFVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIlJldW5pb24gVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJFdXJvcGVcIiwgXG4gICAgICBcImFiYnJcIjogXCJTQU1UXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiU2FtYXJhIFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiQWZyaWNhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiU0NUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiU2V5Y2hlbGxlcyBUaW1lXCJcbiAgICB9XG4gIF0sIFxuICBcIiswNzAwXCI6IFtcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIkF1c3RyYWxpYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIkNYVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIkNocmlzdG1hcyBJc2xhbmQgVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJBbnRhcmN0aWNhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiREFWVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIkRhdmlzIFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiTWlsaXRhcnlcIiwgXG4gICAgICBcImFiYnJcIjogXCJHXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiR29sZiBUaW1lIFpvbmVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiQXNpYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIkhPVlRcIiwgXG4gICAgICBcIm5hbWVcIjogXCJIb3ZkIFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiQXNpYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIklDVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIkluZG9jaGluYSBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIkFzaWFcIiwgXG4gICAgICBcImFiYnJcIjogXCJLUkFUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiS3Jhc25veWFyc2sgVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJBc2lhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiTk9WU1RcIiwgXG4gICAgICBcIm5hbWVcIjogXCJOb3Zvc2liaXJzayBTdW1tZXIgVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJBc2lhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiT01TU1RcIiwgXG4gICAgICBcIm5hbWVcIjogXCJPbXNrIFN1bW1lciBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIkFzaWFcIiwgXG4gICAgICBcImFiYnJcIjogXCJXSUJcIiwgXG4gICAgICBcIm5hbWVcIjogXCJXZXN0ZXJuIEluZG9uZXNpYW4gVGltZVwiXG4gICAgfVxuICBdLCBcbiAgXCIrMDIwMFwiOiBbXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJNaWxpdGFyeVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIkJcIiwgXG4gICAgICBcIm5hbWVcIjogXCJCcmF2byBUaW1lIFpvbmVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiQWZyaWNhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiQ0FUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiQ2VudHJhbCBBZnJpY2EgVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJFdXJvcGVcIiwgXG4gICAgICBcImFiYnJcIjogXCJDRVNUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiQ2VudHJhbCBFdXJvcGVhbiBTdW1tZXIgVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJBZnJpY2FcIiwgXG4gICAgICBcImFiYnJcIjogXCJFRVRcIiwgXG4gICAgICBcIm5hbWVcIjogXCJFYXN0ZXJuIEV1cm9wZWFuIFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiQXNpYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIkVFVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIkVhc3Rlcm4gRXVyb3BlYW4gVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJFdXJvcGVcIiwgXG4gICAgICBcImFiYnJcIjogXCJFRVRcIiwgXG4gICAgICBcIm5hbWVcIjogXCJFYXN0ZXJuIEV1cm9wZWFuIFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiQXNpYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIklTVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIklzcmFlbCBTdGFuZGFyZCBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIkFmcmljYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIlNBU1RcIiwgXG4gICAgICBcIm5hbWVcIjogXCJTb3V0aCBBZnJpY2EgU3RhbmRhcmQgVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJBZnJpY2FcIiwgXG4gICAgICBcImFiYnJcIjogXCJXQVNUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiV2VzdCBBZnJpY2EgU3VtbWVyIFRpbWVcIlxuICAgIH1cbiAgXSwgXG4gIFwiLTEwMDBcIjogW1xuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiUGFjaWZpY1wiLCBcbiAgICAgIFwiYWJiclwiOiBcIkNLVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIkNvb2sgSXNsYW5kIFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiTm9ydGggQW1lcmljYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIkhBU1RcIiwgXG4gICAgICBcIm5hbWVcIjogXCJIYXdhaWktQWxldXRpYW4gU3RhbmRhcmQgVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJOb3J0aCBBbWVyaWNhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiSFNUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiSGF3YWlpLUFsZXV0aWFuIFN0YW5kYXJkIFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiUGFjaWZpY1wiLCBcbiAgICAgIFwiYWJiclwiOiBcIlRBSFRcIiwgXG4gICAgICBcIm5hbWVcIjogXCJUYWhpdGkgVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJQYWNpZmljXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiVEtUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiVG9rZWxhdSBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIk1pbGl0YXJ5XCIsIFxuICAgICAgXCJhYmJyXCI6IFwiV1wiLCBcbiAgICAgIFwibmFtZVwiOiBcIldoaXNrZXkgVGltZSBab25lXCJcbiAgICB9XG4gIF0sIFxuICBcIiswOTMwXCI6IFtcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIkF1c3RyYWxpYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIkNTVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIkNlbnRyYWwgU3RhbmRhcmQgVGltZVwiXG4gICAgfVxuICBdLCBcbiAgXCIrMDUzMFwiOiBbXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJBc2lhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiSVNUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiSW5kaWEgU3RhbmRhcmQgVGltZVwiXG4gICAgfVxuICBdLCBcbiAgXCIrMTMwMFwiOiBbXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJQYWNpZmljXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiRkpTVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIkZpamkgU3VtbWVyIFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiQW50YXJjdGljYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIk5aRFRcIiwgXG4gICAgICBcIm5hbWVcIjogXCJOZXcgWmVhbGFuZCBEYXlsaWdodCBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIlBhY2lmaWNcIiwgXG4gICAgICBcImFiYnJcIjogXCJOWkRUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiTmV3IFplYWxhbmQgRGF5bGlnaHQgVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJQYWNpZmljXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiUEhPVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIlBob2VuaXggSXNsYW5kIFRpbWVcIlxuICAgIH1cbiAgXSwgXG4gIFwiKzA1NDVcIjogW1xuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiQXNpYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIk5QVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIk5lcGFsIFRpbWVcIlxuICAgIH1cbiAgXSwgXG4gIFwiKzEwMDBcIjogW1xuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiUGFjaWZpY1wiLCBcbiAgICAgIFwiYWJiclwiOiBcIkNoU1RcIiwgXG4gICAgICBcIm5hbWVcIjogXCJDaGFtb3JybyBTdGFuZGFyZCBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIkF1c3RyYWxpYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIkVTVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIkVhc3Rlcm4gU3RhbmRhcmQgVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJNaWxpdGFyeVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIktcIiwgXG4gICAgICBcIm5hbWVcIjogXCJLaWxvIFRpbWUgWm9uZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJQYWNpZmljXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiUEdUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiUGFwdWEgTmV3IEd1aW5lYSBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIkFzaWFcIiwgXG4gICAgICBcImFiYnJcIjogXCJWTEFUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiVmxhZGl2b3N0b2sgVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJBc2lhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiWUFLU1RcIiwgXG4gICAgICBcIm5hbWVcIjogXCJZYWt1dHNrIFN1bW1lciBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIlBhY2lmaWNcIiwgXG4gICAgICBcImFiYnJcIjogXCJZQVBUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiWWFwIFRpbWVcIlxuICAgIH1cbiAgXSwgXG4gIFwiLTA2MDBcIjogW1xuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiTm9ydGggQW1lcmljYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIkNTVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIkNlbnRyYWwgU3RhbmRhcmQgVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJOb3J0aCBBbWVyaWNhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiTURUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiTW91bnRhaW4gRGF5bGlnaHQgVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJQYWNpZmljXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiR0FMVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIkdhbGFwYWdvcyBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIk5vcnRoIEFtZXJpY2FcIiwgXG4gICAgICBcImFiYnJcIjogXCJIQVJcIiwgXG4gICAgICBcIm5hbWVcIjogXCJIZXVyZSBBdmFuY1xcdTAwZTllIGRlcyBSb2NoZXVzZXNcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiTm9ydGggQW1lcmljYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIkhOQ1wiLCBcbiAgICAgIFwibmFtZVwiOiBcIkhldXJlIE5vcm1hbGUgZHUgQ2VudHJlXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIkNlbnRyYWwgQW1lcmljYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIkhOQ1wiLCBcbiAgICAgIFwibmFtZVwiOiBcIkhldXJlIE5vcm1hbGUgZHUgQ2VudHJlXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIkNlbnRyYWwgQW1lcmljYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIkNTVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIkNlbnRyYWwgU3RhbmRhcmQgVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJQYWNpZmljXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiRUFTVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIkVhc3RlciBJc2xhbmQgU3RhbmRhcmQgVGltZVwiXG4gICAgfVxuICBdLCBcbiAgXCIrMDEwMFwiOiBbXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJFdXJvcGVcIiwgXG4gICAgICBcImFiYnJcIjogXCJDRVRcIiwgXG4gICAgICBcIm5hbWVcIjogXCJDZW50cmFsIEV1cm9wZWFuIFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiRXVyb3BlXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiQlNUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiQnJpdGlzaCBTdW1tZXIgVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJBZnJpY2FcIiwgXG4gICAgICBcImFiYnJcIjogXCJDRVRcIiwgXG4gICAgICBcIm5hbWVcIjogXCJDZW50cmFsIEV1cm9wZWFuIFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiQWZyaWNhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiV0VTVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIldlc3Rlcm4gRXVyb3BlYW4gU3VtbWVyIFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiRXVyb3BlXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiV0VTVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIldlc3Rlcm4gRXVyb3BlYW4gU3VtbWVyIFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiQWZyaWNhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiV1NUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiV2VzdGVybiBTYWhhcmEgU3VtbWVyIFRpbWVcIlxuICAgIH0sXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJBZnJpY2FcIiwgXG4gICAgICBcImFiYnJcIjogXCJXQVRcIiwgXG4gICAgICBcIm5hbWVcIjogXCJXZXN0IEFmcmljYSBUaW1lXCJcbiAgICB9XG4gIF0sIFxuICBcIi0wNDAwXCI6IFtcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIk5vcnRoIEFtZXJpY2FcIiwgXG4gICAgICBcImFiYnJcIjogXCJBU1RcIiwgXG4gICAgICBcIm5hbWVcIjogXCJBdGxhbnRpYyBTdGFuZGFyZCBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIk5vcnRoIEFtZXJpY2FcIiwgXG4gICAgICBcImFiYnJcIjogXCJFRFRcIiwgXG4gICAgICBcIm5hbWVcIjogXCJFYXN0ZXJuIERheWxpZ2h0IFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiU291dGggQW1lcmljYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIkNMVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIkNoaWxlIFN0YW5kYXJkIFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiU291dGggQW1lcmljYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIkZLVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIkZhbGtsYW5kIElzbGFuZCBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIlNvdXRoIEFtZXJpY2FcIiwgXG4gICAgICBcImFiYnJcIjogXCJHWVRcIiwgXG4gICAgICBcIm5hbWVcIjogXCJHdXlhbmEgVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJTb3V0aCBBbWVyaWNhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiUFlUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiUGFyYWd1YXkgVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJTb3V0aCBBbWVyaWNhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiQU1UXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiQW1hem9uIFRpbWVcIlxuICAgIH0gXG4gIF0sIFxuICBcIi0wMzMwXCI6IFtcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIk5vcnRoIEFtZXJpY2FcIiwgXG4gICAgICBcImFiYnJcIjogXCJOU1RcIiwgXG4gICAgICBcIm5hbWVcIjogXCJOZXdmb3VuZGxhbmQgU3RhbmRhcmQgVGltZVwiXG4gICAgfVxuICBdLCBcbiAgXCItMDUwMFwiOiBbXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJOb3J0aCBBbWVyaWNhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiRVNUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiRWFzdGVybiBTdGFuZGFyZCBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIk5vcnRoIEFtZXJpY2FcIiwgXG4gICAgICBcImFiYnJcIjogXCJDRFRcIiwgXG4gICAgICBcIm5hbWVcIjogXCJDZW50cmFsIERheWxpZ2h0IFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiU291dGggQW1lcmljYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIkNPVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIkNvbG9tYmlhIFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiQ2FyaWJiZWFuXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiQ1NUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiQ3ViYSBTdGFuZGFyZCBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIlBhY2lmaWNcIiwgXG4gICAgICBcImFiYnJcIjogXCJFQVNTVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIkVhc3RlciBJc2xhbmQgU3VtbWVyIFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiU291dGggQW1lcmljYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIkVDVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIkVjdWFkb3IgVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJDZW50cmFsIEFtZXJpY2FcIiwgXG4gICAgICBcImFiYnJcIjogXCJFU1RcIiwgXG4gICAgICBcIm5hbWVcIjogXCJFYXN0ZXJuIFN0YW5kYXJkIFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiQ2FyaWJiZWFuXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiRVNUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiRWFzdGVybiBTdGFuZGFyZCBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIkNlbnRyYWwgQW1lcmljYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIkVUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiVGllbXBvIGRlbCBFc3RlXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIkNhcmliYmVhblwiLCBcbiAgICAgIFwiYWJiclwiOiBcIkVUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiVGllbXBvIGRlbCBFc3RlXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIk5vcnRoIEFtZXJpY2FcIiwgXG4gICAgICBcImFiYnJcIjogXCJFVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIlRpZW1wbyBEZWwgRXN0ZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJOb3J0aCBBbWVyaWNhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiSEFDXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiSGV1cmUgQXZhbmNcXHUwMGU5ZSBkdSBDZW50cmVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiU291dGggQW1lcmljYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIlBFVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIlBlcnUgVGltZVwiXG4gICAgfSBcbiAgXSwgXG4gIFwiLTA5MDBcIjogW1xuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiTm9ydGggQW1lcmljYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIkFLU1RcIiwgXG4gICAgICBcIm5hbWVcIjogXCJBbGFza2EgU3RhbmRhcmQgVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJOb3J0aCBBbWVyaWNhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiSEFEVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIkhhd2FpaS1BbGV1dGlhbiBEYXlsaWdodCBUaW1lXCJcbiAgICB9IFxuICBdLCBcbiAgXCItMDMwMFwiOiBbXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJOb3J0aCBBbWVyaWNhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiQURUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiQXRsYW50aWMgRGF5bGlnaHQgVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJTb3V0aCBBbWVyaWNhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiQU1TVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIkFtYXpvbiBTdW1tZXIgVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJTb3V0aCBBbWVyaWNhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiQlJUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiQnJhc1xcdTAwZWRsaWEgdGltZVwiXG4gICAgfSBcbiAgXSwgXG4gIFwiKzEyNDVcIjogW1xuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiUGFjaWZpY1wiLCBcbiAgICAgIFwiYWJiclwiOiBcIkNIQVNUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiQ2hhdGhhbSBJc2xhbmQgU3RhbmRhcmQgVGltZVwiXG4gICAgfVxuICBdLCBcbiAgXCIrMDYwMFwiOiBbXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJBc2lhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiQlNUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiQmFuZ2xhZGVzaCBTdGFuZGFyZCBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIkFzaWFcIiwgXG4gICAgICBcImFiYnJcIjogXCJZRUtTVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIllla2F0ZXJpbmJ1cmcgU3VtbWVyIFRpbWVcIlxuICAgIH0sXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJBc2lhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiQlNUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiQmFuZ2xhZGVzaCBTdGFuZGFyZCBUaW1lXCJcbiAgICB9IFxuICBdLCBcbiAgXCItMDkzMFwiOiBbXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJQYWNpZmljXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiTUFSVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIk1hcnF1ZXNhcyBUaW1lXCJcbiAgICB9XG4gIF0sIFxuICBcIiswMzMwXCI6IFtcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIkFzaWFcIiwgXG4gICAgICBcImFiYnJcIjogXCJJUlNUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiSXJhbiBTdGFuZGFyZCBUaW1lXCJcbiAgICB9XG4gIF0sIFxuICBcIisxMTMwXCI6IFtcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIkF1c3RyYWxpYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIk5GVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIk5vcmZvbGsgVGltZVwiXG4gICAgfVxuICBdLCBcbiAgXCIrMTEwMFwiOiBbXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJBc2lhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiVkxBU1RcIiwgXG4gICAgICBcIm5hbWVcIjogXCJWbGFkaXZvc3RvayBTdW1tZXIgVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJBdXN0cmFsaWFcIiwgXG4gICAgICBcImFiYnJcIjogXCJFRFRcIiwgXG4gICAgICBcIm5hbWVcIjogXCJFYXN0ZXJuIERheWxpZ2h0IFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiUGFjaWZpY1wiLCBcbiAgICAgIFwiYWJiclwiOiBcIk5DVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIk5ldyBDYWxlZG9uaWEgVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJQYWNpZmljXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiUE9OVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIlBvaG5wZWkgU3RhbmRhcmQgVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJQYWNpZmljXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiU0JUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiU29sb21vbiBJc2xhbmRzVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJQYWNpZmljXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiVlVUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiVmFudWF0dSBUaW1lXCJcbiAgICB9XG4gIF0sIFxuICBcIi0wODAwXCI6IFtcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIk5vcnRoIEFtZXJpY2FcIiwgXG4gICAgICBcImFiYnJcIjogXCJQU1RcIiwgXG4gICAgICBcIm5hbWVcIjogXCJQYWNpZmljIFN0YW5kYXJkIFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiTm9ydGggQW1lcmljYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIkFLRFRcIiwgXG4gICAgICBcIm5hbWVcIjogXCJBbGFza2EgRGF5bGlnaHQgVGltZVwiXG4gICAgfSBcbiAgXVxufVxuIl19(1)
});
;