;(function(e,t,n){function i(n,s){if(!t[n]){if(!e[n]){var o=typeof require=="function"&&require;if(!s&&o)return o(n,!0);if(r)return r(n,!0);throw new Error("Cannot find module '"+n+"'")}var u=t[n]={exports:{}};e[n][0].call(u.exports,function(t){var r=e[n][1][t];return i(r?r:t)},u,u.exports)}return t[n].exports}var r=typeof require=="function"&&require;for(var s=0;s<n.length;s++)i(n[s]);return i})({1:[function(require,module,exports){
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
    var word = bits.pop()
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


},{}],68:[function(require,module,exports){
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
//@ sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIgcGxhdGUvYnJvd3Nlci5qcyIsIiBwbGF0ZS9saWIvYmxvY2tfY29udGV4dC5qcyIsIiBwbGF0ZS9saWIvY29tbWVudF90b2tlbi5qcyIsIiBwbGF0ZS9saWIvY29udGV4dC5qcyIsIiBwbGF0ZS9saWIvZGF0ZS5qcyIsIiBwbGF0ZS9saWIvZGVidWcuanMiLCIgcGxhdGUvbGliL2RlZmF1bHRmaWx0ZXJzLmpzIiwiIHBsYXRlL2xpYi9kZWZhdWx0dGFncy5qcyIsIiBwbGF0ZS9saWIvZmlsdGVyX2FwcGxpY2F0aW9uLmpzIiwiIHBsYXRlL2xpYi9maWx0ZXJfY2hhaW4uanMiLCIgcGxhdGUvbGliL2ZpbHRlcl9sb29rdXAuanMiLCIgcGxhdGUvbGliL2ZpbHRlcl9ub2RlLmpzIiwiIHBsYXRlL2xpYi9maWx0ZXJfdG9rZW4uanMiLCIgcGxhdGUvbGliL2ZpbHRlcnMvYWRkLmpzIiwiIHBsYXRlL2xpYi9maWx0ZXJzL2FkZHNsYXNoZXMuanMiLCIgcGxhdGUvbGliL2ZpbHRlcnMvY2FwZmlyc3QuanMiLCIgcGxhdGUvbGliL2ZpbHRlcnMvY2VudGVyLmpzIiwiIHBsYXRlL2xpYi9maWx0ZXJzL2N1dC5qcyIsIiBwbGF0ZS9saWIvZmlsdGVycy9kYXRlLmpzIiwiIHBsYXRlL2xpYi9maWx0ZXJzL2RlZmF1bHQuanMiLCIgcGxhdGUvbGliL2ZpbHRlcnMvZGljdHNvcnQuanMiLCIgcGxhdGUvbGliL2ZpbHRlcnMvZGljdHNvcnRyZXZlcnNlZC5qcyIsIiBwbGF0ZS9saWIvZmlsdGVycy9kaXZpc2libGVieS5qcyIsIiBwbGF0ZS9saWIvZmlsdGVycy9lc2NhcGUuanMiLCIgcGxhdGUvbGliL2ZpbHRlcnMvZmlsZXNpemVmb3JtYXQuanMiLCIgcGxhdGUvbGliL2ZpbHRlcnMvZmlyc3QuanMiLCIgcGxhdGUvbGliL2ZpbHRlcnMvZmxvYXRmb3JtYXQuanMiLCIgcGxhdGUvbGliL2ZpbHRlcnMvZm9yY2VfZXNjYXBlLmpzIiwiIHBsYXRlL2xpYi9maWx0ZXJzL2dldF9kaWdpdC5qcyIsIiBwbGF0ZS9saWIvZmlsdGVycy9pbmRleC5qcyIsIiBwbGF0ZS9saWIvZmlsdGVycy9pcmllbmNvZGUuanMiLCIgcGxhdGUvbGliL2ZpbHRlcnMvaXRlcml0ZW1zLmpzIiwiIHBsYXRlL2xpYi9maWx0ZXJzL2pvaW4uanMiLCIgcGxhdGUvbGliL2ZpbHRlcnMvbGFzdC5qcyIsIiBwbGF0ZS9saWIvZmlsdGVycy9sZW5ndGguanMiLCIgcGxhdGUvbGliL2ZpbHRlcnMvbGVuZ3RoX2lzLmpzIiwiIHBsYXRlL2xpYi9maWx0ZXJzL2xpbmVicmVha3MuanMiLCIgcGxhdGUvbGliL2ZpbHRlcnMvbGluZWJyZWFrc2JyLmpzIiwiIHBsYXRlL2xpYi9maWx0ZXJzL2xpbmVudW1iZXJzLmpzIiwiIHBsYXRlL2xpYi9maWx0ZXJzL2xqdXN0LmpzIiwiIHBsYXRlL2xpYi9maWx0ZXJzL2xvd2VyLmpzIiwiIHBsYXRlL2xpYi9maWx0ZXJzL21ha2VfbGlzdC5qcyIsIiBwbGF0ZS9saWIvZmlsdGVycy9waG9uZTJudW1lcmljLmpzIiwiIHBsYXRlL2xpYi9maWx0ZXJzL3BsdXJhbGl6ZS5qcyIsIiBwbGF0ZS9saWIvZmlsdGVycy9yYW5kb20uanMiLCIgcGxhdGUvbGliL2ZpbHRlcnMvcmp1c3QuanMiLCIgcGxhdGUvbGliL2ZpbHRlcnMvc2FmZS5qcyIsIiBwbGF0ZS9saWIvZmlsdGVycy9zbGljZS5qcyIsIiBwbGF0ZS9saWIvZmlsdGVycy9zbHVnaWZ5LmpzIiwiIHBsYXRlL2xpYi9maWx0ZXJzL3NwbGl0LmpzIiwiIHBsYXRlL2xpYi9maWx0ZXJzL3N0cmlwdGFncy5qcyIsIiBwbGF0ZS9saWIvZmlsdGVycy90aW1lc2luY2UuanMiLCIgcGxhdGUvbGliL2ZpbHRlcnMvdGltZXVudGlsLmpzIiwiIHBsYXRlL2xpYi9maWx0ZXJzL3RpdGxlLmpzIiwiIHBsYXRlL2xpYi9maWx0ZXJzL3RydW5jYXRlY2hhcnMuanMiLCIgcGxhdGUvbGliL2ZpbHRlcnMvdHJ1bmNhdGV3b3Jkcy5qcyIsIiBwbGF0ZS9saWIvZmlsdGVycy91bm9yZGVyZWRfbGlzdC5qcyIsIiBwbGF0ZS9saWIvZmlsdGVycy91cHBlci5qcyIsIiBwbGF0ZS9saWIvZmlsdGVycy91cmxlbmNvZGUuanMiLCIgcGxhdGUvbGliL2ZpbHRlcnMvdXJsaXplLmpzIiwiIHBsYXRlL2xpYi9maWx0ZXJzL3VybGl6ZXRydW5jLmpzIiwiIHBsYXRlL2xpYi9maWx0ZXJzL3dvcmRjb3VudC5qcyIsIiBwbGF0ZS9saWIvZmlsdGVycy93b3Jkd3JhcC5qcyIsIiBwbGF0ZS9saWIvZmlsdGVycy95ZXNuby5qcyIsIiBwbGF0ZS9saWIvaW5kZXguanMiLCIgcGxhdGUvbGliL2xpYnJhcmllcy5qcyIsIiBwbGF0ZS9saWIvbGlicmFyeS5qcyIsIiBwbGF0ZS9saWIvbWV0YS5qcyIsIiBwbGF0ZS9saWIvbm9kZV9saXN0LmpzIiwiIHBsYXRlL2xpYi9wYXJzZXIuanMiLCIgcGxhdGUvbGliL3Byb21pc2UuanMiLCIgcGxhdGUvbGliL3RhZ190b2tlbi5qcyIsIiBwbGF0ZS9saWIvdGFncy9ibG9jay5qcyIsIiBwbGF0ZS9saWIvdGFncy9jb21tZW50LmpzIiwiIHBsYXRlL2xpYi90YWdzL2RlYnVnLmpzIiwiIHBsYXRlL2xpYi90YWdzL2V4dGVuZHMuanMiLCIgcGxhdGUvbGliL3RhZ3MvZm9yLmpzIiwiIHBsYXRlL2xpYi90YWdzL2lmL2VuZC5qcyIsIiBwbGF0ZS9saWIvdGFncy9pZi9pbmZpeC5qcyIsIiBwbGF0ZS9saWIvdGFncy9pZi9saXRlcmFsLmpzIiwiIHBsYXRlL2xpYi90YWdzL2lmL25vZGUuanMiLCIgcGxhdGUvbGliL3RhZ3MvaWYvb3BlcmF0b3JzLmpzIiwiIHBsYXRlL2xpYi90YWdzL2lmL3BhcnNlci5qcyIsIiBwbGF0ZS9saWIvdGFncy9pZi9wcmVmaXguanMiLCIgcGxhdGUvbGliL3RhZ3MvaW5jbHVkZS5qcyIsIiBwbGF0ZS9saWIvdGFncy9ub3cuanMiLCIgcGxhdGUvbGliL3RhZ3Mvd2l0aC5qcyIsIiBwbGF0ZS9saWIvdGV4dF9ub2RlLmpzIiwiIHBsYXRlL2xpYi90ZXh0X3Rva2VuLmpzIiwiIHBsYXRlL2xpYi90b2tlbi5qcyIsIiBwbGF0ZS9ub2RlX21vZHVsZXMvZHN0L2luZGV4LmpzIiwiIHBsYXRlL25vZGVfbW9kdWxlcy90ei9pbmRleC5qcyIsIiBwbGF0ZS9ub2RlX21vZHVsZXMvdHovdHouanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdlpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25FQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsQkE7QUFDQTtBQUNBO0FBQ0E7O0FDSEE7QUFDQTtBQUNBO0FBQ0E7O0FDSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ0pBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNSQTtBQUNBO0FBQ0E7QUFDQTs7QUNIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1BBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNMQTtBQUNBO0FBQ0E7QUFDQTs7QUNIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDWEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNiQTtBQUNBO0FBQ0E7QUFDQTs7QUNIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1BBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1pBOztBQ0FBO0FBQ0E7QUFDQTtBQUNBOztBQ0hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDUEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDWkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNiQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNOQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNaQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDWEE7QUFDQTtBQUNBO0FBQ0E7O0FDSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ0xBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNiQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1BBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1pBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDUEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ0pBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1pBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekJBO0FBQ0E7QUFDQTtBQUNBOztBQ0hBO0FBQ0E7QUFDQTtBQUNBOztBQ0hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNSQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ05BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNYQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDZEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2SkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25DQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuUEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbEZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1SEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ0xBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUlBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDWkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwic291cmNlc0NvbnRlbnQiOlsicmVxdWlyZSgnZHN0JylcblxudmFyIHBsYXRlID0gcmVxdWlyZSgnLi9saWIvaW5kZXgnKVxuaWYodHlwZW9mIGRlZmluZSAhPT0gJ3VuZGVmaW5lZCcgJiYgZGVmaW5lLmFtZCkge1xuICBkZWZpbmUoJ3BsYXRlJywgW10sIGZ1bmN0aW9uKCkgeyByZXR1cm4gcGxhdGUgfSlcbn0gZWxzZSB7XG4gIHdpbmRvdy5wbGF0ZSA9IHBsYXRlXG59XG5cbnBsYXRlLmRlYnVnID0gcmVxdWlyZSgnLi9saWIvZGVidWcnKVxucGxhdGUudXRpbHMgPSBwbGF0ZS5kYXRlID0gcmVxdWlyZSgnLi9saWIvZGF0ZScpXG5wbGF0ZS51dGlscy5Qcm9taXNlID0gcmVxdWlyZSgnLi9saWIvcHJvbWlzZScpXG5wbGF0ZS51dGlscy5TYWZlU3RyaW5nID0gZnVuY3Rpb24oc3RyKSB7XG4gIHN0ciA9IG5ldyBTdHJpbmcoc3RyKVxuICBzdHIuc2FmZSA9IHRydWVcbiAgcmV0dXJuIHN0clxufVxucGxhdGUubGlicmFyaWVzID0gcmVxdWlyZSgnLi9saWIvbGlicmFyaWVzJylcbiIsIm1vZHVsZS5leHBvcnRzID0gQmxvY2tDb250ZXh0XG5cbmZ1bmN0aW9uIEJsb2NrQ29udGV4dCgpIHtcbiAgdGhpcy5ibG9ja3MgPSB7fVxufVxuXG52YXIgY29ucyA9IEJsb2NrQ29udGV4dFxuICAsIHByb3RvID0gY29ucy5wcm90b3R5cGVcblxuY29ucy5LRVkgPSAnX19CTE9DS19DT05URVhUX18nXG5cbmNvbnMuZnJvbSA9IGZ1bmN0aW9uKGNvbnRleHQpIHtcbiAgcmV0dXJuIGNvbnRleHRbdGhpcy5LRVldXG59XG5cbmNvbnMuaW50byA9IGZ1bmN0aW9uKGNvbnRleHQpIHtcbiAgcmV0dXJuIGNvbnRleHRbdGhpcy5LRVldID0gbmV3IHRoaXMoKVxufVxuXG5wcm90by5hZGQgPSBmdW5jdGlvbihibG9ja3MpIHtcbiAgZm9yKHZhciBuYW1lIGluIGJsb2Nrcykge1xuICAgICh0aGlzLmJsb2Nrc1tuYW1lXSA9IHRoaXMuYmxvY2tzW25hbWVdIHx8IFtdKS51bnNoaWZ0KGJsb2Nrc1tuYW1lXSlcbiAgfVxufVxuXG5wcm90by5nZXQgPSBmdW5jdGlvbihuYW1lKSB7XG4gIHZhciBsaXN0ID0gdGhpcy5ibG9ja3NbbmFtZV0gfHwgW11cblxuICByZXR1cm4gbGlzdFtsaXN0Lmxlbmd0aCAtIDFdXG59XG5cbnByb3RvLnB1c2ggPSBmdW5jdGlvbihuYW1lLCBibG9jaykge1xuICAodGhpcy5ibG9ja3NbbmFtZV0gPSB0aGlzLmJsb2Nrc1tuYW1lXSB8fCBbXSkucHVzaChibG9jaylcbn1cblxucHJvdG8ucG9wID0gZnVuY3Rpb24obmFtZSkge1xuICByZXR1cm4gKHRoaXMuYmxvY2tzW25hbWVdID0gdGhpcy5ibG9ja3NbbmFtZV0gfHwgW10pLnBvcCgpXG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IENvbW1lbnRUb2tlblxuXG52YXIgVG9rZW4gPSByZXF1aXJlKCcuL3Rva2VuJylcblxuZnVuY3Rpb24gQ29tbWVudFRva2VuKGNvbnRlbnQsIGxpbmUpIHtcbiAgVG9rZW4uY2FsbCh0aGlzLCBjb250ZW50LCBsaW5lKVxufVxuXG52YXIgY29ucyA9IENvbW1lbnRUb2tlblxuICAsIHByb3RvID0gY29ucy5wcm90b3R5cGUgPSBuZXcgVG9rZW5cblxucHJvdG8uY29uc3RydWN0b3IgPSBjb25zXG5cbnByb3RvLm5vZGUgPSBmdW5jdGlvbihwYXJzZXIpIHtcbiAgLy8gbm8tb3BlcmF0aW9uXG4gIHJldHVybiBudWxsXG59XG5cbiIsIm1vZHVsZS5leHBvcnRzID0gQ29udGV4dFxuXG5mdW5jdGlvbiBDb250ZXh0KGZyb20pIHtcbiAgaWYoZnJvbSAmJiBmcm9tLmNvbnN0cnVjdG9yID09PSBDb250ZXh0KSB7XG4gICAgcmV0dXJuIGZyb21cbiAgfVxuXG4gIGZyb20gPSBmcm9tIHx8IHt9XG4gIGZvcih2YXIga2V5IGluIGZyb20pIGlmKGZyb20uaGFzT3duUHJvcGVydHkoa2V5KSkge1xuICAgIHRoaXNba2V5XSA9IGZyb21ba2V5XVxuICB9XG59XG5cbnZhciBjb25zID0gQ29udGV4dFxuICAsIHByb3RvID0gY29ucy5wcm90b3R5cGVcblxucHJvdG8uY29weSA9IGZ1bmN0aW9uKCkge1xuICB2YXIgRiA9IEZ1bmN0aW9uKClcbiAgRi5uYW1lID0gY29ucy5uYW1lXG4gIEYucHJvdG90eXBlID0gdGhpc1xuICByZXR1cm4gbmV3IEZcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0geyB0aW1lOiB0aW1lX2Zvcm1hdCwgZGF0ZTogZm9ybWF0LCBEYXRlRm9ybWF0OiBEYXRlRm9ybWF0IH1cblxudHJ5IHsgcmVxdWlyZSgndHonKSB9IGNhdGNoKGUpIHsgfVxuXG5mdW5jdGlvbiBjYXBmaXJzdCAoc3RyKSB7XG4gIHJldHVybiBzdHIucmVwbGFjZSgvXiguezF9KS8sIGZ1bmN0aW9uKGEsIG0pIHsgcmV0dXJuIG0udG9VcHBlckNhc2UoKSB9KVxufVxuXG5mdW5jdGlvbiBtYXAgKGFyciwgaXRlcikge1xuICB2YXIgb3V0ID0gW11cbiAgZm9yKHZhciBpID0gMCwgbGVuID0gYXJyLmxlbmd0aDsgaSA8IGxlbjsgKytpKVxuICAgIG91dC5wdXNoKGl0ZXIoYXJyW2ldLCBpLCBhcnIpKVxuICByZXR1cm4gb3V0XG59XG5cbmZ1bmN0aW9uIHJlZHVjZShhcnIsIGl0ZXIsIHN0YXJ0KSB7XG4gIGFyciA9IGFyci5zbGljZSgpXG4gIGlmKHN0YXJ0ICE9PSB1bmRlZmluZWQpXG4gICAgYXJyLnVuc2hpZnQoc3RhcnQpXG5cbiAgaWYoYXJyLmxlbmd0aCA9PT0gMClcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3JlZHVjZSBvZiBlbXB0eSBhcnJheScpXG5cbiAgaWYoYXJyLmxlbmd0aCA9PT0gMSlcbiAgICByZXR1cm4gYXJyWzBdXG5cbiAgdmFyIG91dCA9IGFyci5zbGljZSgpXG4gICAgLCBpdGVtID0gYXJyLnNoaWZ0KClcblxuICBkbyB7XG4gICAgaXRlbSA9IGl0ZXIoaXRlbSwgYXJyLnNoaWZ0KCkpXG4gIH0gd2hpbGUoYXJyLmxlbmd0aClcblxuICByZXR1cm4gaXRlbVxufVxuXG5mdW5jdGlvbiBzdHJ0b2FycmF5KHN0cikge1xuICB2YXIgYXJyID0gW11cbiAgZm9yKHZhciBpID0gMCwgbGVuID0gc3RyLmxlbmd0aDsgaSA8IGxlbjsgKytpKVxuICAgIGFyci5wdXNoKHN0ci5jaGFyQXQoaSkpXG4gIHJldHVybiBhcnJcbn1cblxudmFyIFdFRUtEQVlTID0gWyAnc3VuZGF5JywgJ21vbmRheScsICd0dWVzZGF5JywgJ3dlZG5lc2RheScsICd0aHVyc2RheScsICdmcmlkYXknLCAnc2F0dXJkYXknIF1cbiAgLCBXRUVLREFZU19BQkJSID0gbWFwKFdFRUtEQVlTLCBmdW5jdGlvbih4KSB7IHJldHVybiBzdHJ0b2FycmF5KHgpLnNsaWNlKDAsIDMpLmpvaW4oJycpIH0pXG4gICwgV0VFS0RBWVNfUkVWID0gcmVkdWNlKG1hcChXRUVLREFZUywgZnVuY3Rpb24oeCwgaSkgeyByZXR1cm4gW3gsIGldIH0pLCBmdW5jdGlvbihsaHMsIHJocykgeyBsaHNbcmhzWzBdXSA9IHJoc1sxXTsgcmV0dXJuIGxocyB9LCB7fSlcbiAgLCBNT05USFMgPSBbICdqYW51YXJ5JywgJ2ZlYnJ1YXJ5JywgJ21hcmNoJywgJ2FwcmlsJywgJ21heScsICdqdW5lJywgJ2p1bHknLCAnYXVndXN0JywgJ3NlcHRlbWJlcicsICdvY3RvYmVyJywgJ25vdmVtYmVyJywgJ2RlY2VtYmVyJyBdXG4gICwgTU9OVEhTXzMgPSBtYXAoTU9OVEhTLCBmdW5jdGlvbih4KSB7IHJldHVybiBzdHJ0b2FycmF5KHgpLnNsaWNlKDAsIDMpLmpvaW4oJycpIH0pXG4gICwgTU9OVEhTXzNfUkVWID0gcmVkdWNlKG1hcChNT05USFNfMywgZnVuY3Rpb24oeCwgaSkgeyByZXR1cm4gW3gsIGldIH0pLCBmdW5jdGlvbihsaHMsIHJocykgeyBsaHNbcmhzWzBdXSA9IHJoc1sxXTsgcmV0dXJuIGxocyB9LCB7fSlcbiAgLCBNT05USFNfQVAgPSBbXG4gICAgJ0phbi4nXG4gICwgJ0ZlYi4nXG4gICwgJ01hcmNoJ1xuICAsICdBcHJpbCdcbiAgLCAnTWF5J1xuICAsICdKdW5lJ1xuICAsICdKdWx5J1xuICAsICdBdWcuJ1xuICAsICdTZXB0LidcbiAgLCAnT2N0LidcbiAgLCAnTm92LidcbiAgLCAnRGVjLidcbiAgXVxuXG5cbnZhciBNT05USFNfQUxUID0ge1xuICAxOiAnSmFudWFyeScsXG4gIDI6ICdGZWJydWFyeScsXG4gIDM6ICdNYXJjaCcsXG4gIDQ6ICdBcHJpbCcsXG4gIDU6ICdNYXknLFxuICA2OiAnSnVuZScsXG4gIDc6ICdKdWx5JyxcbiAgODogJ0F1Z3VzdCcsXG4gIDk6ICdTZXB0ZW1iZXInLFxuICAxMDogJ09jdG9iZXInLFxuICAxMTogJ05vdmVtYmVyJyxcbiAgMTI6ICdEZWNlbWJlcidcbn1cblxuZnVuY3Rpb24gRm9ybWF0dGVyKHQpIHtcbiAgdGhpcy5kYXRhID0gdFxufVxuXG5Gb3JtYXR0ZXIucHJvdG90eXBlLmZvcm1hdCA9IGZ1bmN0aW9uKHN0cikge1xuICB2YXIgYml0cyA9IHN0cnRvYXJyYXkoc3RyKVxuICAsIGVzYyA9IGZhbHNlXG4gICwgb3V0ID0gW11cbiAgLCBiaXRcblxuICB3aGlsZShiaXRzLmxlbmd0aCkge1xuICAgIGJpdCA9IGJpdHMuc2hpZnQoKVxuXG4gICAgaWYoZXNjKSB7XG4gICAgICBvdXQucHVzaChiaXQpXG4gICAgICBlc2MgPSBmYWxzZVxuICAgIH0gZWxzZSBpZihiaXQgPT09ICdcXFxcJykge1xuICAgICAgZXNjID0gdHJ1ZVxuICAgIH0gZWxzZSBpZih0aGlzW2JpdF0pIHtcbiAgICAgIG91dC5wdXNoKHRoaXNbYml0XSgpKVxuICAgIH0gZWxzZSB7XG4gICAgICBvdXQucHVzaChiaXQpXG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIG91dC5qb2luKCcnKVxufVxuXG5mdW5jdGlvbiBUaW1lRm9ybWF0KHQpIHtcbiAgRm9ybWF0dGVyLmNhbGwodGhpcywgdClcbn1cblxudmFyIHByb3RvID0gVGltZUZvcm1hdC5wcm90b3R5cGUgPSBuZXcgRm9ybWF0dGVyKClcblxucHJvdG8uYSA9IGZ1bmN0aW9uKCkge1xuICAvLyAnYS5tLicgb3IgJ3AubS4nXG4gIGlmICh0aGlzLmRhdGEuZ2V0SG91cnMoKSA+IDExKVxuICAgIHJldHVybiAncC5tLidcbiAgcmV0dXJuICdhLm0uJ1xufVxuXG5wcm90by5BID0gZnVuY3Rpb24oKSB7XG4gIC8vICdBTScgb3IgJ1BNJ1xuICBpZiAodGhpcy5kYXRhLmdldEhvdXJzKCkgPiAxMSlcbiAgICByZXR1cm4gJ1BNJ1xuICByZXR1cm4gJ0FNJ1xufVxuXG5wcm90by5mID0gZnVuY3Rpb24oKSB7XG4gIC8qXG4gIFRpbWUsIGluIDEyLWhvdXIgaG91cnMgYW5kIG1pbnV0ZXMsIHdpdGggbWludXRlcyBsZWZ0IG9mZiBpZiB0aGV5J3JlXG4gIHplcm8uXG4gIEV4YW1wbGVzOiAnMScsICcxOjMwJywgJzI6MDUnLCAnMidcbiAgUHJvcHJpZXRhcnkgZXh0ZW5zaW9uLlxuICAqL1xuICBpZiAodGhpcy5kYXRhLmdldE1pbnV0ZXMoKSA9PSAwKVxuICAgIHJldHVybiB0aGlzLmcoKVxuICByZXR1cm4gdGhpcy5nKCkgKyBcIjpcIiArIHRoaXMuaSgpXG59XG5cbnByb3RvLmcgPSBmdW5jdGlvbigpIHtcbiAgLy8gSG91ciwgMTItaG91ciBmb3JtYXQgd2l0aG91dCBsZWFkaW5nIHplcm9zIGkuZS4gJzEnIHRvICcxMidcbiAgdmFyIGggPSB0aGlzLmRhdGEuZ2V0SG91cnMoKVxuXG4gIHJldHVybiB0aGlzLmRhdGEuZ2V0SG91cnMoKSAlIDEyIHx8IDEyXG59XG5cbnByb3RvLkcgPSBmdW5jdGlvbigpIHtcbiAgLy8gSG91ciwgMjQtaG91ciBmb3JtYXQgd2l0aG91dCBsZWFkaW5nIHplcm9zIGkuZS4gJzAnIHRvICcyMydcbiAgcmV0dXJuIHRoaXMuZGF0YS5nZXRIb3VycygpXG59XG5cbnByb3RvLmggPSBmdW5jdGlvbigpIHtcbiAgLy8gSG91ciwgMTItaG91ciBmb3JtYXQgaS5lLiAnMDEnIHRvICcxMidcbiAgcmV0dXJuICgnMCcrdGhpcy5nKCkpLnNsaWNlKC0yKVxufVxuXG5wcm90by5IID0gZnVuY3Rpb24oKSB7XG4gIC8vIEhvdXIsIDI0LWhvdXIgZm9ybWF0IGkuZS4gJzAwJyB0byAnMjMnXG4gIHJldHVybiAoJzAnK3RoaXMuRygpKS5zbGljZSgtMilcbn1cblxucHJvdG8uaSA9IGZ1bmN0aW9uKCkge1xuICAvLyBNaW51dGVzIGkuZS4gJzAwJyB0byAnNTknXG4gIHJldHVybiAoJzAnICsgdGhpcy5kYXRhLmdldE1pbnV0ZXMoKSkuc2xpY2UoLTIpXG59XG5cbnByb3RvLlAgPSBmdW5jdGlvbigpIHtcbiAgLypcbiAgVGltZSwgaW4gMTItaG91ciBob3VycywgbWludXRlcyBhbmQgJ2EubS4nLydwLm0uJywgd2l0aCBtaW51dGVzIGxlZnQgb2ZmXG4gIGlmIHRoZXkncmUgemVybyBhbmQgdGhlIHN0cmluZ3MgJ21pZG5pZ2h0JyBhbmQgJ25vb24nIGlmIGFwcHJvcHJpYXRlLlxuICBFeGFtcGxlczogJzEgYS5tLicsICcxOjMwIHAubS4nLCAnbWlkbmlnaHQnLCAnbm9vbicsICcxMjozMCBwLm0uJ1xuICBQcm9wcmlldGFyeSBleHRlbnNpb24uXG4gICovXG4gIHZhciBtID0gdGhpcy5kYXRhLmdldE1pbnV0ZXMoKVxuICAgICwgaCA9IHRoaXMuZGF0YS5nZXRIb3VycygpXG5cbiAgaWYgKG0gPT0gMCAmJiBoID09IDApXG4gICAgcmV0dXJuICdtaWRuaWdodCdcbiAgaWYgKG0gPT0gMCAmJiBoID09IDEyKVxuICAgIHJldHVybiAnbm9vbidcbiAgcmV0dXJuIHRoaXMuZigpICsgXCIgXCIgKyB0aGlzLmEoKVxufVxuXG5wcm90by5zID0gZnVuY3Rpb24oKSB7XG4gIC8vIFNlY29uZHMgaS5lLiAnMDAnIHRvICc1OSdcbiAgcmV0dXJuICgnMCcrdGhpcy5kYXRhLmdldFNlY29uZHMoKSkuc2xpY2UoLTIpXG59XG5cbnByb3RvLnUgPSBmdW5jdGlvbigpIHtcbiAgLy8gTWljcm9zZWNvbmRzXG4gIHJldHVybiB0aGlzLmRhdGEuZ2V0TWlsbGlzZWNvbmRzKClcbn1cblxuLy8gRGF0ZUZvcm1hdFxuXG5mdW5jdGlvbiBEYXRlRm9ybWF0KHQpIHtcbiAgdGhpcy5kYXRhID0gdFxuICB0aGlzLnllYXJfZGF5cyA9IFswLCAzMSwgNTksIDkwLCAxMjAsIDE1MSwgMTgxLCAyMTIsIDI0MywgMjczLCAzMDQsIDMzNF1cbn1cblxucHJvdG8gPSBEYXRlRm9ybWF0LnByb3RvdHlwZSA9IG5ldyBUaW1lRm9ybWF0KClcblxucHJvdG8uY29udHJ1Y3RvciA9IERhdGVGb3JtYXRcblxucHJvdG8uYiA9IGZ1bmN0aW9uKCkge1xuICAvLyBNb250aCwgdGV4dHVhbCwgMyBsZXR0ZXJzLCBsb3dlcmNhc2UgZS5nLiAnamFuJ1xuICByZXR1cm4gTU9OVEhTXzNbdGhpcy5kYXRhLmdldE1vbnRoKCldXG59XG5cbnByb3RvLmM9IGZ1bmN0aW9uKCkge1xuICAvKlxuICBJU08gODYwMSBGb3JtYXRcbiAgRXhhbXBsZSA6ICcyMDA4LTAxLTAyVDEwOjMwOjAwLjAwMDEyMydcbiAgKi9cbiAgcmV0dXJuIHRoaXMuZGF0YS50b0lTT1N0cmluZyA/IHRoaXMuZGF0YS50b0lTT1N0cmluZygpIDogJydcbn1cblxucHJvdG8uZCA9IGZ1bmN0aW9uKCkge1xuICAvLyBEYXkgb2YgdGhlIG1vbnRoLCAyIGRpZ2l0cyB3aXRoIGxlYWRpbmcgemVyb3MgaS5lLiAnMDEnIHRvICczMSdcbiAgcmV0dXJuICgnMCcrdGhpcy5kYXRhLmdldERhdGUoKSkuc2xpY2UoLTIpXG59XG5cbnByb3RvLkQgPSBmdW5jdGlvbigpIHtcbiAgLy8gRGF5IG9mIHRoZSB3ZWVrLCB0ZXh0dWFsLCAzIGxldHRlcnMgZS5nLiAnRnJpJ1xuICByZXR1cm4gY2FwZmlyc3QoV0VFS0RBWVNfQUJCUlt0aGlzLmRhdGEuZ2V0RGF5KCldKVxufVxuXG5wcm90by5FID0gZnVuY3Rpb24oKSB7XG4gIC8vIEFsdGVybmF0aXZlIG1vbnRoIG5hbWVzIGFzIHJlcXVpcmVkIGJ5IHNvbWUgbG9jYWxlcy4gUHJvcHJpZXRhcnkgZXh0ZW5zaW9uLlxuICByZXR1cm4gTU9OVEhTX0FMVFt0aGlzLmRhdGEuZ2V0TW9udGgoKSsxXVxufVxuXG5wcm90by5GPSBmdW5jdGlvbigpIHtcbiAgLy8gTW9udGgsIHRleHR1YWwsIGxvbmcgZS5nLiAnSmFudWFyeSdcbiAgcmV0dXJuIGNhcGZpcnN0KE1PTlRIU1t0aGlzLmRhdGEuZ2V0TW9udGgoKV0pXG59XG5cbnByb3RvLkkgPSBmdW5jdGlvbigpIHtcbiAgLy8gJzEnIGlmIERheWxpZ2h0IFNhdmluZ3MgVGltZSwgJzAnIG90aGVyd2lzZS5cbiAgcmV0dXJuIHRoaXMuZGF0YS5pc0RTVCgpID8gJzEnIDogJzAnXG59XG5cbnByb3RvLmogPSBmdW5jdGlvbigpIHtcbiAgLy8gRGF5IG9mIHRoZSBtb250aCB3aXRob3V0IGxlYWRpbmcgemVyb3MgaS5lLiAnMScgdG8gJzMxJ1xuICByZXR1cm4gdGhpcy5kYXRhLmdldERhdGUoKVxufVxuXG5wcm90by5sID0gZnVuY3Rpb24oKSB7XG4gIC8vIERheSBvZiB0aGUgd2VlaywgdGV4dHVhbCwgbG9uZyBlLmcuICdGcmlkYXknXG4gIHJldHVybiBjYXBmaXJzdChXRUVLREFZU1t0aGlzLmRhdGEuZ2V0RGF5KCldKVxufVxuXG5wcm90by5MID0gZnVuY3Rpb24oKSB7XG4gIC8vIEJvb2xlYW4gZm9yIHdoZXRoZXIgaXQgaXMgYSBsZWFwIHllYXIgaS5lLiBUcnVlIG9yIEZhbHNlXG4gIC8vIFNlbGVjdHMgdGhpcyB5ZWFyJ3MgRmVicnVhcnkgMjl0aCBhbmQgY2hlY2tzIGlmIHRoZSBtb250aFxuICAvLyBpcyBzdGlsbCBGZWJydWFyeS5cbiAgcmV0dXJuIChuZXcgRGF0ZSh0aGlzLmRhdGEuZ2V0RnVsbFllYXIoKSwgMSwgMjkpLmdldE1vbnRoKCkpID09PSAxXG59XG5cbnByb3RvLm0gPSBmdW5jdGlvbigpIHtcbiAgLy8gTW9udGggaS5lLiAnMDEnIHRvICcxMidcIlxuICByZXR1cm4gKCcwJysodGhpcy5kYXRhLmdldE1vbnRoKCkrMSkpLnNsaWNlKC0yKVxufVxuXG5wcm90by5NID0gZnVuY3Rpb24oKSB7XG4gIC8vIE1vbnRoLCB0ZXh0dWFsLCAzIGxldHRlcnMgZS5nLiAnSmFuJ1xuICByZXR1cm4gY2FwZmlyc3QoTU9OVEhTXzNbdGhpcy5kYXRhLmdldE1vbnRoKCldKVxufVxuXG5wcm90by5uID0gZnVuY3Rpb24oKSB7XG4gIC8vIE1vbnRoIHdpdGhvdXQgbGVhZGluZyB6ZXJvcyBpLmUuICcxJyB0byAnMTInXG4gIHJldHVybiB0aGlzLmRhdGEuZ2V0TW9udGgoKSArIDFcbn1cblxucHJvdG8uTiA9IGZ1bmN0aW9uKCkge1xuICAvLyBNb250aCBhYmJyZXZpYXRpb24gaW4gQXNzb2NpYXRlZCBQcmVzcyBzdHlsZS4gUHJvcHJpZXRhcnkgZXh0ZW5zaW9uLlxuICByZXR1cm4gTU9OVEhTX0FQW3RoaXMuZGF0YS5nZXRNb250aCgpXVxufVxuXG5wcm90by5PID0gZnVuY3Rpb24oKSB7XG4gIC8vIERpZmZlcmVuY2UgdG8gR3JlZW53aWNoIHRpbWUgaW4gaG91cnMgZS5nLiAnKzAyMDAnXG5cbiAgdmFyIHR6b2ZmcyA9IHRoaXMuZGF0YS5nZXRUaW1lem9uZU9mZnNldCgpXG4gICAgLCBvZmZzID0gfn4odHpvZmZzIC8gNjApXG4gICAgLCBtaW5zID0gKCcwMCcgKyB+fk1hdGguYWJzKHR6b2ZmcyAlIDYwKSkuc2xpY2UoLTIpXG4gIFxuICByZXR1cm4gKCh0em9mZnMgPiAwKSA/ICctJyA6ICcrJykgKyAoJzAwJyArIE1hdGguYWJzKG9mZnMpKS5zbGljZSgtMikgKyBtaW5zXG59XG5cbnByb3RvLnIgPSBmdW5jdGlvbigpIHtcbiAgLy8gUkZDIDI4MjIgZm9ybWF0dGVkIGRhdGUgZS5nLiAnVGh1LCAyMSBEZWMgMjAwMCAxNjowMTowNyArMDIwMCdcbiAgcmV0dXJuIHRoaXMuZm9ybWF0KCdELCBqIE0gWSBIOmk6cyBPJylcbn1cblxucHJvdG8uUyA9IGZ1bmN0aW9uKCkge1xuICAvKiBFbmdsaXNoIG9yZGluYWwgc3VmZml4IGZvciB0aGUgZGF5IG9mIHRoZSBtb250aCwgMiBjaGFyYWN0ZXJzIGkuZS4gJ3N0JywgJ25kJywgJ3JkJyBvciAndGgnICovXG4gIHZhciBkID0gdGhpcy5kYXRhLmdldERhdGUoKVxuXG4gIGlmIChkID49IDExICYmIGQgPD0gMTMpXG4gICAgcmV0dXJuICd0aCdcbiAgdmFyIGxhc3QgPSBkICUgMTBcblxuICBpZiAobGFzdCA9PSAxKVxuICAgIHJldHVybiAnc3QnXG4gIGlmIChsYXN0ID09IDIpXG4gICAgcmV0dXJuICduZCdcbiAgaWYgKGxhc3QgPT0gMylcbiAgICByZXR1cm4gJ3JkJ1xuICByZXR1cm4gJ3RoJ1xufVxuXG5wcm90by50ID0gZnVuY3Rpb24oKSB7XG4gIC8vIE51bWJlciBvZiBkYXlzIGluIHRoZSBnaXZlbiBtb250aCBpLmUuICcyOCcgdG8gJzMxJ1xuICAvLyBVc2UgYSBqYXZhc2NyaXB0IHRyaWNrIHRvIGRldGVybWluZSB0aGUgZGF5cyBpbiBhIG1vbnRoXG4gIHJldHVybiAzMiAtIG5ldyBEYXRlKHRoaXMuZGF0YS5nZXRGdWxsWWVhcigpLCB0aGlzLmRhdGEuZ2V0TW9udGgoKSwgMzIpLmdldERhdGUoKVxufVxuXG5wcm90by5UID0gZnVuY3Rpb24oKSB7XG4gIC8vIFRpbWUgem9uZSBvZiB0aGlzIG1hY2hpbmUgZS5nLiAnRVNUJyBvciAnTURUJ1xuICBpZih0aGlzLmRhdGEudHppbmZvKSB7XG4gICAgcmV0dXJuIHRoaXMuZGF0YS50emluZm8oKS5hYmJyIHx8ICc/Pz8nXG4gIH1cbiAgcmV0dXJuICc/Pz8nXG59XG5cbnByb3RvLlUgPSBmdW5jdGlvbigpIHtcbiAgLy8gU2Vjb25kcyBzaW5jZSB0aGUgVW5peCBlcG9jaCAoSmFudWFyeSAxIDE5NzAgMDA6MDA6MDAgR01UKVxuICAvLyBVVEMoKSByZXR1cm4gbWlsbGlzZWNvbmRzIGZybW8gdGhlIGVwb2NoXG4gIC8vIHJldHVybiBNYXRoLnJvdW5kKHRoaXMuZGF0YS5VVEMoKSAqIDEwMDApXG4gIHJldHVybiB+fih0aGlzLmRhdGEgLyAxMDAwKVxufVxuXG5wcm90by53ID0gZnVuY3Rpb24oKSB7XG4gIC8vIERheSBvZiB0aGUgd2VlaywgbnVtZXJpYywgaS5lLiAnMCcgKFN1bmRheSkgdG8gJzYnIChTYXR1cmRheSlcbiAgcmV0dXJuIHRoaXMuZGF0YS5nZXREYXkoKVxufVxuXG5wcm90by5XID0gZnVuY3Rpb24oKSB7XG4gIC8vIElTTy04NjAxIHdlZWsgbnVtYmVyIG9mIHllYXIsIHdlZWtzIHN0YXJ0aW5nIG9uIE1vbmRheVxuICAvLyBBbGdvcml0aG0gZnJvbSBodHRwOi8vd3d3LnBlcnNvbmFsLmVjdS5lZHUvbWNjYXJ0eXIvSVNPd2RBTEcudHh0XG4gIHZhciBqYW4xX3dlZWtkYXkgPSBuZXcgRGF0ZSh0aGlzLmRhdGEuZ2V0RnVsbFllYXIoKSwgMCwgMSkuZ2V0RGF5KCkgXG4gICAgLCB3ZWVrZGF5ID0gdGhpcy5kYXRhLmdldERheSgpXG4gICAgLCBkYXlfb2ZfeWVhciA9IHRoaXMueigpXG4gICAgLCB3ZWVrX251bWJlclxuICAgICwgaSA9IDM2NVxuXG4gIGlmKGRheV9vZl95ZWFyIDw9ICg4IC0gamFuMV93ZWVrZGF5KSAmJiBqYW4xX3dlZWtkYXkgPiA0KSB7XG4gICAgaWYoamFuMV93ZWVrZGF5ID09PSA1IHx8IChqYW4xX3dlZWtkYXkgPT09IDYgJiYgdGhpcy5MLmNhbGwoe2RhdGE6bmV3IERhdGUodGhpcy5kYXRhLmdldEZ1bGxZZWFyKCktMSwgMCwgMSl9KSkpIHtcbiAgICAgIHdlZWtfbnVtYmVyID0gNTNcbiAgICB9IGVsc2Uge1xuICAgICAgd2Vla19udW1iZXIgPSA1MlxuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBpZih0aGlzLkwoKSkge1xuICAgICAgaSA9IDM2NlxuICAgIH1cbiAgICBpZigoaSAtIGRheV9vZl95ZWFyKSA8ICg0IC0gd2Vla2RheSkpIHtcbiAgICAgIHdlZWtfbnVtYmVyID0gMVxuICAgIH0gZWxzZSB7XG4gICAgICB3ZWVrX251bWJlciA9IH5+KChkYXlfb2ZfeWVhciArICg3IC0gd2Vla2RheSkgKyAoamFuMV93ZWVrZGF5IC0gMSkpIC8gNylcbiAgICAgIGlmKGphbjFfd2Vla2RheSA+IDQpXG4gICAgICAgIHdlZWtfbnVtYmVyIC09IDFcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHdlZWtfbnVtYmVyXG59XG5cbnByb3RvLnkgPSBmdW5jdGlvbigpIHtcbiAgLy8gWWVhciwgMiBkaWdpdHMgZS5nLiAnOTknXG4gIHJldHVybiAoJycrdGhpcy5kYXRhLmdldEZ1bGxZZWFyKCkpLnNsaWNlKC0yKVxufVxuXG5wcm90by5ZID0gZnVuY3Rpb24oKSB7XG4gIC8vIFllYXIsIDQgZGlnaXRzIGUuZy4gJzE5OTknXG4gIHJldHVybiB0aGlzLmRhdGEuZ2V0RnVsbFllYXIoKVxufVxuXG5wcm90by56ID0gZnVuY3Rpb24oKSB7XG4gIC8vIERheSBvZiB0aGUgeWVhciBpLmUuICcwJyB0byAnMzY1J1xuXG4gIGRveSA9IHRoaXMueWVhcl9kYXlzW3RoaXMuZGF0YS5nZXRNb250aCgpXSArIHRoaXMuZGF0YS5nZXREYXRlKClcbiAgaWYgKHRoaXMuTCgpICYmIHRoaXMuZGF0YS5nZXRNb250aCgpID4gMSlcbiAgICBkb3kgKz0gMVxuICByZXR1cm4gZG95XG59XG5cbnByb3RvLlogPSBmdW5jdGlvbigpIHtcbiAgLypcbiAgVGltZSB6b25lIG9mZnNldCBpbiBzZWNvbmRzIChpLmUuICctNDMyMDAnIHRvICc0MzIwMCcpLiBUaGUgb2Zmc2V0IGZvclxuICB0aW1lem9uZXMgd2VzdCBvZiBVVEMgaXMgYWx3YXlzIG5lZ2F0aXZlLCBhbmQgZm9yIHRob3NlIGVhc3Qgb2YgVVRDIGlzXG4gIGFsd2F5cyBwb3NpdGl2ZS5cbiAgKi9cbiAgcmV0dXJuIHRoaXMuZGF0YS5nZXRUaW1lem9uZU9mZnNldCgpICogLTYwXG59XG5cblxuZnVuY3Rpb24gZm9ybWF0KHZhbHVlLCBmb3JtYXRfc3RyaW5nKSB7XG4gIHZhciBkZiA9IG5ldyBEYXRlRm9ybWF0KHZhbHVlKVxuICByZXR1cm4gZGYuZm9ybWF0KGZvcm1hdF9zdHJpbmcpXG59XG5cblxuZnVuY3Rpb24gdGltZV9mb3JtYXQodmFsdWUsIGZvcm1hdF9zdHJpbmcpIHtcbiAgdmFyIHRmID0gbmV3IFRpbWVGb3JtYXQodmFsdWUpXG4gIHJldHVybiB0Zi5mb3JtYXQoZm9ybWF0X3N0cmluZylcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGxvZzogZnVuY3Rpb24odmFsdWUpIHsgY29uc29sZS5sb2codmFsdWUpIH1cbiAgLCBlcnJvcjogZnVuY3Rpb24oZXJyKSB7IGNvbnNvbGUuZXJyb3IoZXJyLCBlcnIgJiYgZXJyLnN0YWNrKSB9XG4gICwgaW5mbzogZnVuY3Rpb24odmFsdWUpIHsgfSBcbn1cbiIsInZhciBMaWJyYXJ5ID0gcmVxdWlyZSgnLi9saWJyYXJ5JylcblxubW9kdWxlLmV4cG9ydHMgPSBEZWZhdWx0RmlsdGVyc1xuXG5mdW5jdGlvbiBEZWZhdWx0RmlsdGVycygpIHtcbiAgTGlicmFyeS5jYWxsKHRoaXMsIHRoaXMuYnVpbHRpbnMpXG59XG5cbnZhciBjb25zID0gRGVmYXVsdEZpbHRlcnNcbiAgLCBwcm90byA9IGNvbnMucHJvdG90eXBlID0gbmV3IExpYnJhcnlcblxucHJvdG8uY29uc3RydWN0b3IgPSBjb25zXG5cbnByb3RvLmJ1aWx0aW5zID0ge1xuICAgICdhZGQnOiByZXF1aXJlKCcuL2ZpbHRlcnMvYWRkJylcbiAgLCAnYWRkc2xhc2hlcyc6IHJlcXVpcmUoJy4vZmlsdGVycy9hZGRzbGFzaGVzJylcbiAgLCAnY2FwZmlyc3QnOiByZXF1aXJlKCcuL2ZpbHRlcnMvY2FwZmlyc3QnKVxuICAsICdjZW50ZXInOiByZXF1aXJlKCcuL2ZpbHRlcnMvY2VudGVyJylcbiAgLCAnY3V0JzogcmVxdWlyZSgnLi9maWx0ZXJzL2N1dCcpXG4gICwgJ2RhdGUnOiByZXF1aXJlKCcuL2ZpbHRlcnMvZGF0ZScpXG4gICwgJ2RlZmF1bHQnOiByZXF1aXJlKCcuL2ZpbHRlcnMvZGVmYXVsdCcpXG4gICwgJ2RpY3Rzb3J0JzogcmVxdWlyZSgnLi9maWx0ZXJzL2RpY3Rzb3J0JylcbiAgLCAnZGljdHNvcnRyZXZlcnNlZCc6IHJlcXVpcmUoJy4vZmlsdGVycy9kaWN0c29ydHJldmVyc2VkJylcbiAgLCAnZGl2aXNpYmxlYnknOiByZXF1aXJlKCcuL2ZpbHRlcnMvZGl2aXNpYmxlYnknKVxuICAsICdlc2NhcGUnOiByZXF1aXJlKCcuL2ZpbHRlcnMvZXNjYXBlJylcbiAgLCAnZmlsZXNpemVmb3JtYXQnOiByZXF1aXJlKCcuL2ZpbHRlcnMvZmlsZXNpemVmb3JtYXQnKVxuICAsICdmaXJzdCc6IHJlcXVpcmUoJy4vZmlsdGVycy9maXJzdCcpXG4gICwgJ2Zsb2F0Zm9ybWF0JzogcmVxdWlyZSgnLi9maWx0ZXJzL2Zsb2F0Zm9ybWF0JylcbiAgLCAnZm9yY2VfZXNjYXBlJzogcmVxdWlyZSgnLi9maWx0ZXJzL2ZvcmNlX2VzY2FwZScpXG4gICwgJ2dldF9kaWdpdCc6IHJlcXVpcmUoJy4vZmlsdGVycy9nZXRfZGlnaXQnKVxuICAsICdpbmRleCc6IHJlcXVpcmUoJy4vZmlsdGVycy9pbmRleCcpXG4gICwgJ2l0ZXJpdGVtcyc6IHJlcXVpcmUoJy4vZmlsdGVycy9pdGVyaXRlbXMnKVxuICAsICdpcmllbmNvZGUnOiByZXF1aXJlKCcuL2ZpbHRlcnMvaXJpZW5jb2RlJylcbiAgLCAnam9pbic6IHJlcXVpcmUoJy4vZmlsdGVycy9qb2luJylcbiAgLCAnbGFzdCc6IHJlcXVpcmUoJy4vZmlsdGVycy9sYXN0JylcbiAgLCAnbGVuZ3RoJzogcmVxdWlyZSgnLi9maWx0ZXJzL2xlbmd0aCcpXG4gICwgJ2xlbmd0aF9pcyc6IHJlcXVpcmUoJy4vZmlsdGVycy9sZW5ndGhfaXMnKVxuICAsICdsaW5lYnJlYWtzJzogcmVxdWlyZSgnLi9maWx0ZXJzL2xpbmVicmVha3MnKVxuICAsICdsaW5lYnJlYWtzYnInOiByZXF1aXJlKCcuL2ZpbHRlcnMvbGluZWJyZWFrc2JyJylcbiAgLCAnbGluZW51bWJlcnMnOiByZXF1aXJlKCcuL2ZpbHRlcnMvbGluZW51bWJlcnMnKVxuICAsICdsanVzdCc6IHJlcXVpcmUoJy4vZmlsdGVycy9sanVzdCcpXG4gICwgJ2xvd2VyJzogcmVxdWlyZSgnLi9maWx0ZXJzL2xvd2VyJylcbiAgLCAnbWFrZV9saXN0JzogcmVxdWlyZSgnLi9maWx0ZXJzL21ha2VfbGlzdCcpXG4gICwgJ3Bob25lMm51bWVyaWMnOiByZXF1aXJlKCcuL2ZpbHRlcnMvcGhvbmUybnVtZXJpYycpXG4gICwgJ3BsdXJhbGl6ZSc6IHJlcXVpcmUoJy4vZmlsdGVycy9wbHVyYWxpemUnKVxuICAsICdyYW5kb20nOiByZXF1aXJlKCcuL2ZpbHRlcnMvcmFuZG9tJylcbiAgLCAncmp1c3QnOiByZXF1aXJlKCcuL2ZpbHRlcnMvcmp1c3QnKVxuICAsICdzYWZlJzogcmVxdWlyZSgnLi9maWx0ZXJzL3NhZmUnKVxuICAsICdzbGljZSc6IHJlcXVpcmUoJy4vZmlsdGVycy9zbGljZScpXG4gICwgJ3NsdWdpZnknOiByZXF1aXJlKCcuL2ZpbHRlcnMvc2x1Z2lmeScpXG4gICwgJ3NwbGl0JzogcmVxdWlyZSgnLi9maWx0ZXJzL3NwbGl0JylcbiAgLCAnc3RyaXB0YWdzJzogcmVxdWlyZSgnLi9maWx0ZXJzL3N0cmlwdGFncycpXG4gICwgJ3RpbWVzaW5jZSc6IHJlcXVpcmUoJy4vZmlsdGVycy90aW1lc2luY2UnKVxuICAsICd0aW1ldW50aWwnOiByZXF1aXJlKCcuL2ZpbHRlcnMvdGltZXVudGlsJylcbiAgLCAndGl0bGUnOiByZXF1aXJlKCcuL2ZpbHRlcnMvdGl0bGUnKVxuICAsICd0cnVuY2F0ZWNoYXJzJzogcmVxdWlyZSgnLi9maWx0ZXJzL3RydW5jYXRlY2hhcnMnKVxuICAsICd0cnVuY2F0ZXdvcmRzJzogcmVxdWlyZSgnLi9maWx0ZXJzL3RydW5jYXRld29yZHMnKVxuICAsICd1bm9yZGVyZWRfbGlzdCc6IHJlcXVpcmUoJy4vZmlsdGVycy91bm9yZGVyZWRfbGlzdCcpXG4gICwgJ3VwcGVyJzogcmVxdWlyZSgnLi9maWx0ZXJzL3VwcGVyJylcbiAgLCAndXJsZW5jb2RlJzogcmVxdWlyZSgnLi9maWx0ZXJzL3VybGVuY29kZScpXG4gICwgJ3VybGl6ZSc6IHJlcXVpcmUoJy4vZmlsdGVycy91cmxpemUnKVxuICAsICd1cmxpemV0cnVuYyc6IHJlcXVpcmUoJy4vZmlsdGVycy91cmxpemV0cnVuYycpXG4gICwgJ3dvcmRjb3VudCc6IHJlcXVpcmUoJy4vZmlsdGVycy93b3JkY291bnQnKVxuICAsICd3b3Jkd3JhcCc6IHJlcXVpcmUoJy4vZmlsdGVycy93b3Jkd3JhcCcpXG4gICwgJ3llc25vJzogcmVxdWlyZSgnLi9maWx0ZXJzL3llc25vJylcbn1cblxuIiwidmFyIExpYnJhcnkgPSByZXF1aXJlKCcuL2xpYnJhcnknKVxuXG5tb2R1bGUuZXhwb3J0cyA9IERlZmF1bHRUYWdzXG5cbmZ1bmN0aW9uIERlZmF1bHRUYWdzKCkge1xuICBMaWJyYXJ5LmNhbGwodGhpcywgdGhpcy5idWlsdGlucylcbn1cblxudmFyIGNvbnMgPSBEZWZhdWx0VGFnc1xuICAsIHByb3RvID0gY29ucy5wcm90b3R5cGUgPSBuZXcgTGlicmFyeVxuXG5wcm90by5jb25zdHJ1Y3RvciA9IGNvbnNcblxucHJvdG8uYnVpbHRpbnMgPSB7XG4gICAgJ2Jsb2NrJzogcmVxdWlyZSgnLi90YWdzL2Jsb2NrJykucGFyc2VcbiAgLCAnY29tbWVudCc6IHJlcXVpcmUoJy4vdGFncy9jb21tZW50JykucGFyc2VcbiAgLCAnZGVidWcnOiByZXF1aXJlKCcuL3RhZ3MvZGVidWcnKS5wYXJzZVxuICAsICdleHRlbmRzJzogcmVxdWlyZSgnLi90YWdzL2V4dGVuZHMnKS5wYXJzZVxuICAsICdmb3InOiByZXF1aXJlKCcuL3RhZ3MvZm9yJykucGFyc2VcbiAgLCAnaWYnOiByZXF1aXJlKCcuL3RhZ3MvaWYvbm9kZScpLnBhcnNlXG4gICwgJ2luY2x1ZGUnOiByZXF1aXJlKCcuL3RhZ3MvaW5jbHVkZScpLnBhcnNlXG4gICwgJ25vdyc6IHJlcXVpcmUoJy4vdGFncy9ub3cnKS5wYXJzZVxuICAsICd3aXRoJzogcmVxdWlyZSgnLi90YWdzL3dpdGgnKS5wYXJzZVxufVxuIiwibW9kdWxlLmV4cG9ydHMgPSBGaWx0ZXJBcHBsaWNhdGlvblxuXG52YXIgUHJvbWlzZSA9IHJlcXVpcmUoJy4vcHJvbWlzZScpXG5cbmZ1bmN0aW9uIEZpbHRlckFwcGxpY2F0aW9uKG5hbWUsIGJpdHMpIHtcbiAgdGhpcy5uYW1lID0gbmFtZVxuICB0aGlzLmFyZ3MgPSBiaXRzXG4gIHRoaXMuZmlsdGVyID0gbnVsbFxufVxuXG52YXIgY29ucyA9IEZpbHRlckFwcGxpY2F0aW9uXG4gICwgcHJvdG8gPSBjb25zLnByb3RvdHlwZVxuXG5wcm90by5hdHRhY2ggPSBmdW5jdGlvbihwYXJzZXIpIHtcbiAgdGhpcy5maWx0ZXIgPSBwYXJzZXIuZmlsdGVycy5sb29rdXAodGhpcy5uYW1lKVxufVxuXG5wcm90by5yZXNvbHZlID0gZnVuY3Rpb24oY29udGV4dCwgdmFsdWUsIGZyb21JRFgsIGFyZ1ZhbHVlcykge1xuICB2YXIgc2VsZiA9IHRoaXNcbiAgICAsIHByb21pc2VcbiAgICAsIHN0YXJ0ID0gZnJvbUlEWCB8fCAwXG4gICAgLCByZXN1bHRcbiAgICAsIHRtcFxuXG4gIGFyZ1ZhbHVlcyA9IGFyZ1ZhbHVlcyB8fCBbXVxuXG4gIGlmKHZhbHVlID09PSB1bmRlZmluZWQpIHtcbiAgICByZXR1cm5cbiAgfVxuXG4gIGlmKHZhbHVlICYmIHZhbHVlLmNvbnN0cnVjdG9yID09PSBQcm9taXNlKSB7XG4gICAgcHJvbWlzZSA9IG5ldyBQcm9taXNlXG4gICAgdmFsdWUub25jZSgnZG9uZScsIGZ1bmN0aW9uKHZhbCkge1xuICAgICAgcHJvbWlzZS5yZXNvbHZlKHNlbGYucmVzb2x2ZShjb250ZXh0LCB2YWwpKVxuICAgIH0pXG5cbiAgICAvLyBzdGFydCBvdmVyIG9uY2Ugd2UndmUgcmVzb2x2ZWQgdGhlIGJhc2UgdmFsdWVcbiAgICByZXR1cm4gcHJvbWlzZVxuICB9XG5cbiAgZm9yKHZhciBpID0gc3RhcnQsIGxlbiA9IHNlbGYuYXJncy5sZW5ndGg7IGkgPCBsZW47ICsraSkge1xuICAgIHZhciBhcmdWYWx1ZSA9IHNlbGYuYXJnc1tpXS5yZXNvbHZlID8gXG4gICAgICAgIHNlbGYuYXJnc1tpXS5yZXNvbHZlKGNvbnRleHQpIDpcbiAgICAgICAgc2VsZi5hcmdzW2ldXG5cbiAgICBpZihhcmdWYWx1ZSA9PT0gdW5kZWZpbmVkIHx8IGFyZ1ZhbHVlID09PSBudWxsKSB7XG4gICAgICBhcmdWYWx1ZXNbaV0gPSBhcmdWYWx1ZVxuICAgICAgY29udGludWVcbiAgICB9XG5cbiAgICBpZihhcmdWYWx1ZS5jb25zdHJ1Y3RvciA9PT0gUHJvbWlzZSkge1xuICAgICAgcHJvbWlzZSA9IG5ldyBQcm9taXNlXG5cbiAgICAgIGFyZ1ZhbHVlLm9uY2UoJ2RvbmUnLCBmdW5jdGlvbih2YWwpIHtcbiAgICAgICAgYXJnVmFsdWVzW2ldID0gdmFsXG4gICAgICAgIHByb21pc2UucmVzb2x2ZShzZWxmLnJlc29sdmUoIFxuICAgICAgICAgICAgY29udGV4dFxuICAgICAgICAgICwgdmFsdWVcbiAgICAgICAgICAsIGlcbiAgICAgICAgICAsIGFyZ1ZhbHVlc1xuICAgICAgICApKVxuICAgICAgfSlcblxuICAgICAgcmV0dXJuIHByb21pc2VcbiAgICB9XG5cbiAgICBhcmdWYWx1ZXNbaV0gPSBhcmdWYWx1ZVxuICB9XG5cbiAgcHJvbWlzZSA9IG5ldyBQcm9taXNlXG4gIHRtcCA9IHNlbGYuZmlsdGVyLmFwcGx5KG51bGwsIFt2YWx1ZV0uY29uY2F0KGFyZ1ZhbHVlcykuY29uY2F0KFtyZWFkeV0pKVxuXG4gIGlmKHRtcCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgcmVzdWx0ID0gdG1wXG4gIH1cblxuICBpZihyZXN1bHQgPT09IHVuZGVmaW5lZCkge1xuICAgIHJldHVybiBwcm9taXNlXG4gIH1cblxuICByZXR1cm4gcmVzdWx0XG5cbiAgZnVuY3Rpb24gcmVhZHkoZXJyLCBkYXRhKSB7XG4gICAgaWYocHJvbWlzZS50cmlnZ2VyKSBcbiAgICAgIHJldHVybiBwcm9taXNlLnJlc29sdmUoZXJyID8gZXJyIDogZGF0YSlcblxuICAgIHJlc3VsdCA9IGRhdGFcbiAgfVxufVxuIiwibW9kdWxlLmV4cG9ydHMgPSBGaWx0ZXJDaGFpblxuXG5mdW5jdGlvbiBGaWx0ZXJDaGFpbihiaXRzKSB7XG4gIHRoaXMuYml0cyA9IGJpdHNcbn1cblxudmFyIGNvbnMgPSBGaWx0ZXJDaGFpblxuICAsIHByb3RvID0gY29ucy5wcm90b3R5cGVcblxucHJvdG8uYXR0YWNoID0gZnVuY3Rpb24ocGFyc2VyKSB7XG4gIGZvcih2YXIgaSA9IDAsIGxlbiA9IHRoaXMuYml0cy5sZW5ndGg7IGkgPCBsZW47ICsraSkge1xuICAgIGlmKHRoaXMuYml0c1tpXSAmJiB0aGlzLmJpdHNbaV0uYXR0YWNoKSB7IFxuICAgICAgdGhpcy5iaXRzW2ldLmF0dGFjaChwYXJzZXIpXG4gICAgfVxuICB9XG59XG5cbnByb3RvLnJlc29sdmUgPSBmdW5jdGlvbihjb250ZXh0KSB7XG4gIHZhciByZXN1bHQgPSB0aGlzLmJpdHNbMF0ucmVzb2x2ZSA/XG4gICAgICB0aGlzLmJpdHNbMF0ucmVzb2x2ZShjb250ZXh0KSA6XG4gICAgICB0aGlzLmJpdHNbMF1cblxuICBmb3IodmFyIGkgPSAxLCBsZW4gPSB0aGlzLmJpdHMubGVuZ3RoOyBpIDwgbGVuOyArK2kpIHtcbiAgICByZXN1bHQgPSB0aGlzLmJpdHNbaV0ucmVzb2x2ZShjb250ZXh0LCByZXN1bHQpXG4gIH1cblxuICByZXR1cm4gcmVzdWx0XG59XG5cbiIsIm1vZHVsZS5leHBvcnRzID0gRmlsdGVyTG9va3VwXG5cbnZhciBQcm9taXNlID0gcmVxdWlyZSgnLi9wcm9taXNlJylcblxuZnVuY3Rpb24gRmlsdGVyTG9va3VwKGJpdHMpIHtcbiAgdGhpcy5iaXRzID0gYml0c1xufVxuXG52YXIgY29ucyA9IEZpbHRlckxvb2t1cFxuICAsIHByb3RvID0gY29ucy5wcm90b3R5cGVcblxucHJvdG8ucmVzb2x2ZSA9IGZ1bmN0aW9uKGNvbnRleHQsIGZyb21JRFgpIHtcbiAgZnJvbUlEWCA9IGZyb21JRFggfHwgMFxuXG4gIHZhciBzZWxmID0gdGhpc1xuICAgICwgYml0cyA9IHNlbGYuYml0c1xuICAgICwgY3VycmVudCA9IGNvbnRleHRcbiAgICAsIHRlbXBvcmFyeSA9IG51bGxcbiAgICAsIHByb21pc2VcbiAgICAsIHJlc3VsdFxuICAgICwgbmV4dFxuXG4gIGZvcih2YXIgaSA9IGZyb21JRFgsIGxlbiA9IGJpdHMubGVuZ3RoOyBpIDwgbGVuOyArK2kpIHtcbiAgICBpZihjdXJyZW50ID09PSB1bmRlZmluZWQgfHwgY3VycmVudCA9PT0gbnVsbCkge1xuICAgICAgYnJlYWtcbiAgICB9XG5cbiAgICAvLyBmaXggZm9yIElFOlxuICAgIGlmKGJpdHNbaV0gPT09ICdzdXBlcicpIHtcbiAgICAgIGJpdHNbaV0gPSAnX3N1cGVyJ1xuICAgIH1cblxuICAgIG5leHQgPSBjdXJyZW50W2JpdHNbaV1dXG5cbiAgICAvLyBjb3VsZCBiZSBhc3luYywgY291bGQgYmUgc3luYy5cbiAgICBpZih0eXBlb2YgbmV4dCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgcHJvbWlzZSA9IG5ldyBQcm9taXNlXG5cbiAgICAgIHByb21pc2Uub25jZSgnZG9uZScsIGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgdGVtcG9yYXJ5ID0gZGF0YVxuICAgICAgfSlcblxuICAgICAgY3VycmVudCA9IG5leHQuY2FsbChjdXJyZW50LCBmdW5jdGlvbihlcnIsIGRhdGEpIHtcbiAgICAgICAgcHJvbWlzZS5yZXNvbHZlKGVyciA/IG51bGwgOiBzZWxmLnJlc29sdmUoZGF0YSwgaSsxKSlcbiAgICAgIH0pXG5cbiAgICAgIGlmKHRlbXBvcmFyeSAhPT0gbnVsbClcbiAgICAgICAgY3VycmVudCA9IHRlbXBvcmFyeVxuXG4gICAgICBwcm9taXNlLnRyaWdnZXIgPSB0ZW1wb3JhcnkgPSBudWxsXG5cbiAgICAgIGlmKGN1cnJlbnQgPT09IHVuZGVmaW5lZClcbiAgICAgICAgcmV0dXJuIHByb21pc2VcblxuICAgIH0gZWxzZSB7XG4gICAgICBjdXJyZW50ID0gbmV4dFxuICAgIH1cblxuICB9IFxuXG4gIHJldHVybiBjdXJyZW50XG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IEZpbHRlck5vZGVcblxudmFyIFByb21pc2UgPSByZXF1aXJlKCcuL3Byb21pc2UnKVxuICAsIGRlYnVnID0gcmVxdWlyZSgnLi9kZWJ1ZycpXG5cbmZ1bmN0aW9uIEZpbHRlck5vZGUoZmlsdGVyKSB7XG4gIHRoaXMuZmlsdGVyID0gZmlsdGVyXG59XG5cbnZhciBjb25zID0gRmlsdGVyTm9kZVxuICAsIHByb3RvID0gY29ucy5wcm90b3R5cGVcblxuY29ucy5lc2NhcGUgPSBlc2NhcGVIVE1MXG5cbnByb3RvLnJlbmRlciA9IHNhZmVseShmdW5jdGlvbihjb250ZXh0KSB7XG4gIHZhciBzZWxmID0gdGhpc1xuICAgICwgcmVzdWx0ID0gc2VsZi5maWx0ZXIucmVzb2x2ZShjb250ZXh0KVxuICAgICwgcHJvbWlzZVxuXG4gIGlmKHJlc3VsdCA9PT0gdW5kZWZpbmVkKVxuICAgIHJldHVybiAnJ1xuXG4gIGlmKHJlc3VsdCAmJiByZXN1bHQuY29uc3RydWN0b3IgPT09IFByb21pc2UpIHtcbiAgICBwcm9taXNlID0gbmV3IFByb21pc2VcblxuICAgIHJlc3VsdC5vbmNlKCdkb25lJywgZnVuY3Rpb24ocmVzdWx0KSB7XG4gICAgICBwcm9taXNlLnJlc29sdmUoc2VsZi5mb3JtYXQocmVzdWx0KSlcbiAgICB9KVxuXG4gICAgcmV0dXJuIHByb21pc2VcbiAgfVxuXG4gIHJldHVybiBzZWxmLmZvcm1hdChyZXN1bHQpXG59KVxuXG5wcm90by5mb3JtYXQgPSBmdW5jdGlvbihyZXN1bHQpIHtcbiAgaWYocmVzdWx0ICYmIHJlc3VsdC5zYWZlKSB7XG4gICAgcmV0dXJuIHJlc3VsdC50b1N0cmluZygpXG4gIH1cblxuICBpZihyZXN1bHQgPT09IG51bGwgfHwgcmVzdWx0ID09PSB1bmRlZmluZWQpXG4gICAgcmV0dXJuICcnXG5cbiAgcmV0dXJuIGVzY2FwZUhUTUwocmVzdWx0KycnKVxufVxuXG5mdW5jdGlvbiBzYWZlbHkoZm4pIHtcbiAgcmV0dXJuIGZ1bmN0aW9uKGNvbnRleHQpIHtcbiAgICB0cnkge1xuICAgICAgcmV0dXJuIGZuLmNhbGwodGhpcywgY29udGV4dClcbiAgICB9IGNhdGNoKGVycikge1xuICAgICAgZGVidWcuaW5mbyhlcnIpIFxuICAgICAgcmV0dXJuICcnXG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIGVzY2FwZUhUTUwoc3RyKSB7XG4gIHJldHVybiBzdHJcbiAgICAucmVwbGFjZSgvXFwmL2csICcmYW1wOycpXG4gICAgLnJlcGxhY2UoLzwvZywgJyZsdDsnKVxuICAgIC5yZXBsYWNlKC8+L2csICcmZ3Q7JylcbiAgICAucmVwbGFjZSgvXCIvZywgJyZxdW90OycpXG4gICAgLnJlcGxhY2UoLycvZywgJyYjMzk7Jylcbn1cbiIsInZhciBUb2tlbiA9IHJlcXVpcmUoJy4vdG9rZW4nKVxuICAsIEZpbHRlck5vZGUgPSByZXF1aXJlKCcuL2ZpbHRlcl9ub2RlJylcblxubW9kdWxlLmV4cG9ydHMgPSBGaWx0ZXJUb2tlblxuXG5mdW5jdGlvbiBGaWx0ZXJUb2tlbihjb250ZW50LCBsaW5lKSB7XG4gIFRva2VuLmNhbGwodGhpcywgY29udGVudCwgbGluZSlcbn1cblxudmFyIGNvbnMgPSBGaWx0ZXJUb2tlblxuICAsIHByb3RvID0gY29ucy5wcm90b3R5cGUgPSBuZXcgVG9rZW5cblxucHJvdG8uY29uc3RydWN0b3IgPSBjb25zXG5cbnByb3RvLm5vZGUgPSBmdW5jdGlvbihwYXJzZXIpIHtcbiAgcmV0dXJuIG5ldyBGaWx0ZXJOb2RlKHBhcnNlci5jb21waWxlKHRoaXMuY29udGVudCkpXG59XG5cbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oaW5wdXQsIHZhbHVlKSB7XG4gIHJldHVybiBwYXJzZUludChpbnB1dCwgMTApICsgcGFyc2VJbnQodmFsdWUsIDEwKVxufVxuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihpbnB1dCkge1xuICByZXR1cm4gaW5wdXQudG9TdHJpbmcoKS5yZXBsYWNlKC8nL2csIFwiXFxcXCdcIilcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oaW5wdXQpIHtcbiAgdmFyIHN0ciA9IGlucHV0LnRvU3RyaW5nKCk7XG4gIHJldHVybiBbc3RyLnNsaWNlKDAsMSkudG9VcHBlckNhc2UoKSwgc3RyLnNsaWNlKDEpXS5qb2luKCcnKVxufVxuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihpbnB1dCwgbGVuLCByZWFkeSkge1xuICBpZihyZWFkeSA9PT0gdW5kZWZpbmVkKVxuICAgIGxlbiA9IDBcblxuICB2YXIgc3RyID0gaW5wdXQudG9TdHJpbmcoKVxuICAgICwgdmFsdWUgPSAnICdcblxuICBsZW4gLT0gc3RyLmxlbmd0aFxuICBpZihsZW4gPCAwKSB7IFxuICAgIHJldHVybiBzdHJcbiAgfVxuXG4gIHZhciBsZW5faGFsZiA9IGxlbi8yLjBcbiAgICAsIGFyciA9IFtdXG4gICAgLCBpZHggPSBNYXRoLmZsb29yKGxlbl9oYWxmKVxuXG4gIHdoaWxlKGlkeC0tID4gMCkge1xuICAgIGFyci5wdXNoKHZhbHVlKVxuICB9XG5cbiAgYXJyID0gYXJyLmpvaW4oJycpXG4gIHN0ciA9IGFyciArIHN0ciArIGFyclxuICBpZigobGVuX2hhbGYgLSBNYXRoLmZsb29yKGxlbl9oYWxmKSkgPiAwKSB7XG4gICAgc3RyID0gaW5wdXQudG9TdHJpbmcoKS5sZW5ndGggJSAyID09IDAgPyB2YWx1ZSArIHN0ciA6IHN0ciArIHZhbHVlXG4gIH1cbiAgXG4gIHJldHVybiBzdHJcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oaW5wdXQsIHZhbHVlKSB7XG4gIHZhciBzdHIgPSBpbnB1dC50b1N0cmluZygpXG4gIHJldHVybiBzdHIucmVwbGFjZShuZXcgUmVnRXhwKHZhbHVlLCBcImdcIiksICcnKVxufVxuIiwidmFyIGZvcm1hdCA9IHJlcXVpcmUoJy4uL2RhdGUnKS5kYXRlXG4gIFxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihpbnB1dCwgdmFsdWUsIHJlYWR5KSB7XG4gIGlmIChyZWFkeSA9PT0gdW5kZWZpbmVkKVxuICAgIHZhbHVlID0gJ04gaiwgWSdcblxuICByZXR1cm4gZm9ybWF0KGlucHV0LmdldEZ1bGxZZWFyID8gaW5wdXQgOiBuZXcgRGF0ZShpbnB1dCksIHZhbHVlKVxufVxuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihpbnB1dCwgZGVmLCByZWFkeSkge1xuICByZXR1cm4gaW5wdXQgPyBpbnB1dCA6IGRlZlxufVxuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihpbnB1dCwga2V5KSB7XG4gIHJldHVybiBpbnB1dC5zb3J0KGZ1bmN0aW9uKHgsIHkpIHtcbiAgICBpZih4W2tleV0gPiB5W2tleV0pIHJldHVybiAxXG4gICAgaWYoeFtrZXldID09IHlba2V5XSkgcmV0dXJuIDBcbiAgICBpZih4W2tleV0gPCB5W2tleV0pIHJldHVybiAtMVxuICB9KVxufVxuIiwidmFyIGRpY3Rzb3J0ID0gcmVxdWlyZSgnLi9kaWN0c29ydCcpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGlucHV0LCBrZXkpIHtcbiAgcmV0dXJuIGRpY3Rzb3J0KGlucHV0LCBrZXkpLnJldmVyc2UoKVxufVxuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihpbnB1dCwgbnVtKSB7XG4gIHJldHVybiBpbnB1dCAlIHBhcnNlSW50KG51bSwgMTApID09IDBcbn1cbiIsInZhciBGaWx0ZXJOb2RlID0gcmVxdWlyZSgnLi4vZmlsdGVyX25vZGUnKVxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGlucHV0KSB7XG4gIGlmKGlucHV0ICYmIGlucHV0LnNhZmUpIHtcbiAgICByZXR1cm4gaW5wdXRcbiAgfVxuXG4gIGlucHV0ID0gbmV3IFN0cmluZyhGaWx0ZXJOb2RlLmVzY2FwZShpbnB1dCkpXG4gIGlucHV0LnNhZmUgPSB0cnVlXG4gIHJldHVybiBpbnB1dFxufVxuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihpbnB1dCkge1xuICB2YXIgbnVtID0gKG5ldyBOdW1iZXIoaW5wdXQpKS52YWx1ZU9mKClcbiAgICAsIHNpbmd1bGFyID0gbnVtID09IDEgPyAnJyA6ICdzJ1xuICAgICwgdmFsdWUgXG4gICAgXG4gIHZhbHVlID1cbiAgICBudW0gPCAxMDI0ID8gbnVtICsgJyBieXRlJytzaW5ndWxhciA6XG4gICAgbnVtIDwgKDEwMjQqMTAyNCkgPyAobnVtLzEwMjQpKycgS0InIDpcbiAgICBudW0gPCAoMTAyNCoxMDI0KjEwMjQpID8gKG51bSAvICgxMDI0KjEwMjQpKSArICcgTUInIDpcbiAgICBudW0gLyAoMTAyNCoxMDI0KjEwMjQpICsgJyBHQidcblxuICByZXR1cm4gdmFsdWVcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oaW5wdXQpIHtcbiAgcmV0dXJuIGlucHV0WzBdXG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGlucHV0LCB2YWwpIHtcbiAgdmFsID0gcGFyc2VJbnQodmFsLCAxMClcbiAgdmFsID0gaXNOYU4odmFsKSA/IC0xIDogdmFsXG5cbiAgdmFyIGlzUG9zaXRpdmUgPSB2YWwgPj0gMFxuICAgICwgYXNOdW1iZXIgPSBwYXJzZUZsb2F0KGlucHV0KVxuICAgICwgYWJzVmFsdWUgPSBNYXRoLmFicyh2YWwpXG4gICAgLCBwb3cgPSBNYXRoLnBvdygxMCwgYWJzVmFsdWUpXG4gICAgLCBwb3dfbWludXNfb25lID0gTWF0aC5wb3coMTAsIE1hdGgubWF4KGFic1ZhbHVlLTEsIDApKVxuICAgICwgYXNTdHJpbmdcblxuICBhc051bWJlciA9IE1hdGgucm91bmQoKHBvdyAqIGFzTnVtYmVyKSAvIHBvd19taW51c19vbmUpXG5cbiAgaWYodmFsICE9PSAwKVxuICAgIGFzTnVtYmVyIC89IDEwXG5cbiAgYXNTdHJpbmcgPSBhc051bWJlci50b1N0cmluZygpXG5cbiAgaWYoaXNQb3NpdGl2ZSkge1xuICAgIHZhciBzcGxpdCA9IGFzU3RyaW5nLnNwbGl0KCcuJylcbiAgICAgICwgZGVjaW1hbCA9IHNwbGl0Lmxlbmd0aCA+IDEgPyBzcGxpdFsxXSA6ICcnXG5cbiAgICB3aGlsZShkZWNpbWFsLmxlbmd0aCA8IHZhbCkge1xuICAgICAgZGVjaW1hbCArPSAnMCdcbiAgICB9XG5cbiAgICBhc1N0cmluZyA9IGRlY2ltYWwubGVuZ3RoID8gW3NwbGl0WzBdLCBkZWNpbWFsXS5qb2luKCcuJykgOiBzcGxpdFswXVxuICB9XG5cbiAgcmV0dXJuIGFzU3RyaW5nXG59XG4iLCJ2YXIgRmlsdGVyTm9kZSA9IHJlcXVpcmUoJy4uL2ZpbHRlcl9ub2RlJylcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihpbnB1dCkge1xuICB2YXIgeCA9IG5ldyBTdHJpbmcoRmlsdGVyTm9kZS5lc2NhcGUoaW5wdXQrJycpKVxuICB4LnNhZmUgPSB0cnVlXG4gIHJldHVybiB4XG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGlucHV0LCBkaWdpdCkge1xuICB2YXIgaXNOdW0gPSAhaXNOYU4ocGFyc2VJbnQoaW5wdXQsIDEwKSlcbiAgICAsIHN0ciA9IGlucHV0LnRvU3RyaW5nKClcbiAgICAsIGxlbiA9IHN0ci5zcGxpdCgnJykubGVuZ3RoXG5cbiAgZGlnaXQgPSBwYXJzZUludChkaWdpdCwgMTApXG4gIGlmKGlzTnVtICYmICFpc05hTihkaWdpdCkgJiYgZGlnaXQgPD0gbGVuKSB7XG4gICAgcmV0dXJuIHN0ci5jaGFyQXQobGVuIC0gZGlnaXQpXG4gIH1cblxuICByZXR1cm4gaW5wdXRcbn1cbiIsbnVsbCwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihpbnB1dCkge1xuICByZXR1cm4gaW5wdXRcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oaW5wdXQpIHtcbiAgdmFyIG91dHB1dCA9IFtdXG4gIGZvcih2YXIgbmFtZSBpbiBpbnB1dCkgaWYoaW5wdXQuaGFzT3duUHJvcGVydHkobmFtZSkpIHtcbiAgICBvdXRwdXQucHVzaChbbmFtZSwgaW5wdXRbbmFtZV1dKVxuICB9XG4gIHJldHVybiBvdXRwdXRcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oaW5wdXQsIGdsdWUpIHtcbiAgaW5wdXQgPSBpbnB1dCBpbnN0YW5jZW9mIEFycmF5ID8gaW5wdXQgOiBpbnB1dC50b1N0cmluZygpLnNwbGl0KCcnKVxuICByZXR1cm4gaW5wdXQuam9pbihnbHVlKVxufVxuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihpbnB1dCkge1xuICB2YXIgY2IgPSBpbnB1dC5jaGFyQXQgfHwgZnVuY3Rpb24oaW5kKSB7IHJldHVybiBpbnB1dFtpbmRdOyB9XG5cbiAgcmV0dXJuIGNiLmNhbGwoaW5wdXQsIGlucHV0Lmxlbmd0aC0xKTtcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oaW5wdXQsIHJlYWR5KSB7XG4gIGlmKGlucHV0ICYmIHR5cGVvZiBpbnB1dC5sZW5ndGggPT09ICdmdW5jdGlvbicpIHtcbiAgICByZXR1cm4gaW5wdXQubGVuZ3RoKHJlYWR5KVxuICB9XG4gIHJldHVybiBpbnB1dC5sZW5ndGhcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oaW5wdXQsIGV4cGVjdGVkLCByZWFkeSkge1xuICB2YXIgdG1wXG4gIGlmKGlucHV0ICYmIHR5cGVvZiBpbnB1dC5sZW5ndGggPT09ICdmdW5jdGlvbicpIHtcbiAgICB0bXAgPSBpbnB1dC5sZW5ndGgoZnVuY3Rpb24oZXJyLCBsZW4pIHtcbiAgICAgIHJlYWR5KGVyciwgZXJyID8gbnVsbCA6IGxlbiA9PT0gZXhwZWN0ZWQpXG4gICAgfSlcblxuICAgIHJldHVybiB0bXAgPT09IHVuZGVmaW5lZCA/IHVuZGVmaW5lZCA6IHRtcCA9PT0gZXhwZWN0ZWRcbiAgfVxuXG4gIHJldHVybiBpbnB1dC5sZW5ndGggPT09IGV4cGVjdGVkXG59XG4iLCJ2YXIgc2FmZSA9IHJlcXVpcmUoJy4vc2FmZScpXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oaW5wdXQpIHtcbiAgdmFyIHN0ciA9IGlucHV0LnRvU3RyaW5nKClcbiAgICAsIHBhcmFzID0gc3RyLnNwbGl0KCdcXG5cXG4nKVxuICAgICwgb3V0ID0gW11cblxuICB3aGlsZShwYXJhcy5sZW5ndGgpIHtcbiAgICBvdXQudW5zaGlmdChwYXJhcy5wb3AoKS5yZXBsYWNlKC9cXG4vZywgJzxiciAvPicpKVxuICB9XG5cbiAgcmV0dXJuIHNhZmUoJzxwPicrb3V0LmpvaW4oJzwvcD48cD4nKSsnPC9wPicpXG59XG4iLCJ2YXIgc2FmZSA9IHJlcXVpcmUoJy4vc2FmZScpXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oaW5wdXQpIHtcbiAgdmFyIHN0ciA9IGlucHV0LnRvU3RyaW5nKClcbiAgcmV0dXJuIHNhZmUoc3RyLnJlcGxhY2UoL1xcbi9nLCAnPGJyIC8+JykpXG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGlucHV0KSB7XG4gIHZhciBzdHIgPSBpbnB1dC50b1N0cmluZygpXG4gICAgLCBiaXRzID0gc3RyLnNwbGl0KCdcXG4nKVxuICAgICwgb3V0ID0gW11cbiAgICAsIGxlbiA9IGJpdHMubGVuZ3RoXG5cbiAgd2hpbGUoYml0cy5sZW5ndGgpIHtcbiAgICBvdXQudW5zaGlmdChsZW4gLSBvdXQubGVuZ3RoICsgJy4gJyArIGJpdHMucG9wKCkpXG4gIH1cblxuICByZXR1cm4gb3V0LmpvaW4oJ1xcbicpXG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGlucHV0LCBudW0pIHtcbiAgdmFyIGJpdHMgPSAoaW5wdXQgPT09IG51bGwgfHwgaW5wdXQgPT09IHVuZGVmaW5lZCA/ICcnIDogaW5wdXQpLnRvU3RyaW5nKCkuc3BsaXQoJycpXG4gICAgLCBkaWZmZXJlbmNlID0gbnVtIC0gYml0cy5sZW5ndGhcblxuICAvLyBwdXNoIHJldHVybnMgbmV3IGxlbmd0aCBvZiBhcnJheS5cbiAgd2hpbGUoZGlmZmVyZW5jZSA+IDApIHtcbiAgICBkaWZmZXJlbmNlID0gbnVtIC0gYml0cy5wdXNoKCcgJylcbiAgfVxuXG4gIHJldHVybiBiaXRzLmpvaW4oJycpXG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGlucHV0KSB7XG4gIHJldHVybiBpbnB1dC50b1N0cmluZygpLnRvTG93ZXJDYXNlKClcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oaW5wdXQpIHtcbiAgaW5wdXQgPSBpbnB1dCBpbnN0YW5jZW9mIEFycmF5ID8gaW5wdXQgOiBpbnB1dC50b1N0cmluZygpLnNwbGl0KCcnKVxuXG4gIHJldHVybiBpbnB1dFxufVxuIiwiXG52YXIgTEVUVEVSUyA9IHtcbidhJzogJzInLCAnYic6ICcyJywgJ2MnOiAnMicsICdkJzogJzMnLCAnZSc6ICczJyxcbidmJzogJzMnLCAnZyc6ICc0JywgJ2gnOiAnNCcsICdpJzogJzQnLCAnaic6ICc1JywgJ2snOiAnNScsICdsJzogJzUnLFxuJ20nOiAnNicsICduJzogJzYnLCAnbyc6ICc2JywgJ3AnOiAnNycsICdxJzogJzcnLCAncic6ICc3JywgJ3MnOiAnNycsXG4ndCc6ICc4JywgJ3UnOiAnOCcsICd2JzogJzgnLCAndyc6ICc5JywgJ3gnOiAnOScsICd5JzogJzknLCAneic6ICc5J1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihpbnB1dCkge1xuICB2YXIgc3RyID0gaW5wdXQudG9TdHJpbmcoKS50b0xvd2VyQ2FzZSgpLnNwbGl0KCcnKVxuICAgICwgb3V0ID0gW11cbiAgICAsIGx0clxuXG4gIHdoaWxlKHN0ci5sZW5ndGgpIHtcbiAgICBsdHIgPSBzdHIucG9wKClcbiAgICBvdXQudW5zaGlmdChMRVRURVJTW2x0cl0gPyBMRVRURVJTW2x0cl0gOiBsdHIpXG4gIH1cblxuICByZXR1cm4gb3V0LmpvaW4oJycpXG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGlucHV0LCBwbHVyYWwpIHtcbiAgcGx1cmFsID0gKHR5cGVvZiBwbHVyYWwgPT09ICdzdHJpbmcnID8gcGx1cmFsIDogJ3MnKS5zcGxpdCgnLCcpXG5cbiAgdmFyIHZhbCA9IE51bWJlcihpbnB1dClcbiAgICAsIHN1ZmZpeFxuXG4gIHN1ZmZpeCA9IHBsdXJhbFtwbHVyYWwubGVuZ3RoLTFdO1xuICBpZih2YWwgPT09IDEpIHtcbiAgICBzdWZmaXggPSBwbHVyYWwubGVuZ3RoID4gMSA/IHBsdXJhbFswXSA6ICcnOyAgICBcbiAgfVxuXG4gIHJldHVybiBzdWZmaXhcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oaW5wdXQpIHtcbiAgdmFyIGNiID0gaW5wdXQuY2hhckF0IHx8IGZ1bmN0aW9uKGlkeCkge1xuICAgIHJldHVybiB0aGlzW2lkeF07XG4gIH07XG5cbiAgcmV0dXJuIGNiLmNhbGwoaW5wdXQsIE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIGlucHV0Lmxlbmd0aCkpXG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGlucHV0LCBudW0pIHtcbiAgdmFyIGJpdHMgPSAoaW5wdXQgPT09IG51bGwgfHwgaW5wdXQgPT09IHVuZGVmaW5lZCA/ICcnIDogaW5wdXQpLnRvU3RyaW5nKCkuc3BsaXQoJycpXG4gICAgLCBkaWZmZXJlbmNlID0gbnVtIC0gYml0cy5sZW5ndGhcblxuICAvLyBwdXNoIHJldHVybnMgbmV3IGxlbmd0aCBvZiBhcnJheS5cbiAgLy8gTkI6IFtdLnVuc2hpZnQgcmV0dXJucyBgdW5kZWZpbmVkYCBpbiBJRTw5LlxuICB3aGlsZShkaWZmZXJlbmNlID4gMCkge1xuICAgIGRpZmZlcmVuY2UgPSAoYml0cy51bnNoaWZ0KCcgJyksIG51bSAtIGJpdHMubGVuZ3RoKVxuICB9XG5cbiAgcmV0dXJuIGJpdHMuam9pbignJylcbn1cbiIsInZhciBGaWx0ZXJOb2RlID0gcmVxdWlyZSgnLi4vZmlsdGVyX25vZGUnKVxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGlucHV0KSB7XG4gIGlucHV0ID0gbmV3IFN0cmluZyhpbnB1dClcbiAgaW5wdXQuc2FmZSA9IHRydWVcbiAgcmV0dXJuIGlucHV0XG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGlucHV0LCBieSkge1xuICBieSA9IGJ5LnRvU3RyaW5nKClcbiAgaWYoYnkuY2hhckF0KDApID09PSAnOicpIHtcbiAgICBieSA9ICcwJytieVxuICB9XG5cbiAgaWYoYnkuY2hhckF0KGJ5Lmxlbmd0aC0xKSA9PT0gJzonKSB7XG4gICAgYnkgPSBieS5zbGljZSgwLCAtMSlcbiAgfVxuXG4gIHZhciBzcGxpdEJ5ID0gYnkuc3BsaXQoJzonKVxuICAgICwgc2xpY2UgPSBpbnB1dC5zbGljZSB8fCAoZnVuY3Rpb24oKSB7XG4gICAgICAgIGlucHV0ID0gdGhpcy50b1N0cmluZygpXG4gICAgICAgIHJldHVybiBpbnB1dC5zbGljZVxuICAgICAgfSkoKVxuXG4gIHJldHVybiBzbGljZS5hcHBseShpbnB1dCwgc3BsaXRCeSlcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oaW5wdXQpIHtcbiAgaW5wdXQgPSBpbnB1dC50b1N0cmluZygpXG4gIHJldHVybiBpbnB1dFxuICAgICAgICAucmVwbGFjZSgvW15cXHdcXHNcXGRcXC1dL2csICcnKVxuICAgICAgICAucmVwbGFjZSgvXlxccyovLCAnJylcbiAgICAgICAgLnJlcGxhY2UoL1xccyokLywgJycpXG4gICAgICAgIC5yZXBsYWNlKC9bXFwtXFxzXSsvZywgJy0nKVxuICAgICAgICAudG9Mb3dlckNhc2UoKVxufVxuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihpbnB1dCwgYnksIHJlYWR5KSB7XG4gIGJ5ID0gYXJndW1lbnRzLmxlbmd0aCA9PT0gMiA/ICcsJyA6IGJ5XG4gIGlucHV0ID0gJycraW5wdXRcbiAgcmV0dXJuIGlucHV0LnNwbGl0KGJ5KVxufVxuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihpbnB1dCkge1xuICB2YXIgc3RyID0gaW5wdXQudG9TdHJpbmcoKVxuICByZXR1cm4gc3RyLnJlcGxhY2UoLzxbXj5dKj8+L2csICcnKVxufVxuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihpbnB1dCwgbiwgcmVhZHkpIHtcbiAgdmFyIGlucHV0ID0gbmV3IERhdGUoaW5wdXQpXG4gICAgLCBub3cgICA9IHJlYWR5ID09PSB1bmRlZmluZWQgPyBuZXcgRGF0ZSgpIDogbmV3IERhdGUobilcbiAgICAsIGRpZmYgID0gaW5wdXQgLSBub3dcbiAgICAsIHNpbmNlID0gTWF0aC5hYnMoZGlmZilcblxuICBpZihkaWZmID4gMClcbiAgICByZXR1cm4gJzAgbWludXRlcydcblxuICAvLyAzNjUuMjUgKiAyNCAqIDYwICogNjAgKiAxMDAwID09PSB5ZWFyc1xuICB2YXIgeWVhcnMgPSAgIH5+KHNpbmNlIC8gMzE1NTc2MDAwMDApXG4gICAgLCBtb250aHMgPSAgfn4oKHNpbmNlIC0gKHllYXJzKjMxNTU3NjAwMDAwKSkgLyAyNTkyMDAwMDAwKVxuICAgICwgZGF5cyA9ICAgIH5+KChzaW5jZSAtICh5ZWFycyAqIDMxNTU3NjAwMDAwICsgbW9udGhzICogMjU5MjAwMDAwMCkpIC8gODY0MDAwMDApXG4gICAgLCBob3VycyA9ICAgfn4oKHNpbmNlIC0gKHllYXJzICogMzE1NTc2MDAwMDAgKyBtb250aHMgKiAyNTkyMDAwMDAwICsgZGF5cyAqIDg2NDAwMDAwKSkgLyAzNjAwMDAwKVxuICAgICwgbWludXRlcyA9IH5+KChzaW5jZSAtICh5ZWFycyAqIDMxNTU3NjAwMDAwICsgbW9udGhzICogMjU5MjAwMDAwMCArIGRheXMgKiA4NjQwMDAwMCArIGhvdXJzICogMzYwMDAwMCkpIC8gNjAwMDApXG4gICAgLCByZXN1bHQgPSBbXG4gICAgICAgIHllYXJzICAgPyBwbHVyYWxpemUoeWVhcnMsICAgICd5ZWFyJykgOiBudWxsXG4gICAgICAsIG1vbnRocyAgPyBwbHVyYWxpemUobW9udGhzLCAgICdtb250aCcpIDogbnVsbFxuICAgICAgLCBkYXlzICAgID8gcGx1cmFsaXplKGRheXMsICAgICAnZGF5JykgOiBudWxsXG4gICAgICAsIGhvdXJzICAgPyBwbHVyYWxpemUoaG91cnMsICAgICdob3VyJykgOiBudWxsXG4gICAgICAsIG1pbnV0ZXMgPyBwbHVyYWxpemUobWludXRlcywgICdtaW51dGUnKSA6IG51bGxcbiAgICBdXG4gICAgLCBvdXQgPSBbXVxuXG4gIGZvcih2YXIgaSA9IDAsIGxlbiA9IHJlc3VsdC5sZW5ndGg7IGkgPCBsZW47ICsraSkge1xuICAgIHJlc3VsdFtpXSAhPT0gbnVsbCAmJiBvdXQucHVzaChyZXN1bHRbaV0pXG4gIH1cblxuICBpZighb3V0Lmxlbmd0aCkge1xuICAgIHJldHVybiAnMCBtaW51dGVzJ1xuICB9XG5cbiAgcmV0dXJuIG91dFswXSArIChvdXRbMV0gPyAnLCAnICsgb3V0WzFdIDogJycpXG5cbiAgZnVuY3Rpb24gcGx1cmFsaXplKHgsIHN0cikge1xuICAgIHJldHVybiB4ICsgJyAnICsgc3RyICsgKHggPT09IDEgPyAnJyA6ICdzJylcbiAgfVxufVxuIiwidmFyIHRpbWVzaW5jZSA9IHJlcXVpcmUoJy4vdGltZXNpbmNlJykudGltZXNpbmNlXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oaW5wdXQsIG4pIHtcbiAgdmFyIG5vdyA9IG4gPyBuZXcgRGF0ZShuKSA6IG5ldyBEYXRlKClcbiAgcmV0dXJuIHRpbWVzaW5jZShub3csIGlucHV0KVxufVxuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihpbnB1dCkge1xuICB2YXIgc3RyID0gaW5wdXQudG9TdHJpbmcoKVxuICAgICwgYml0cyA9IHN0ci5zcGxpdCgvXFxzezF9L2cpXG4gICAgLCBvdXQgPSBbXVxuICBcbiAgd2hpbGUoYml0cy5sZW5ndGgpIHtcbiAgICB2YXIgd29yZCA9IGJpdHMucG9wKClcbiAgICB3b3JkID0gd29yZC5jaGFyQXQoMCkudG9VcHBlckNhc2UoKSArIHdvcmQuc2xpY2UoMSlcbiAgICBvdXQucHVzaCh3b3JkKVxuICB9XG5cbiAgb3V0ID0gb3V0LmpvaW4oJyAnKVxuICByZXR1cm4gb3V0LnJlcGxhY2UoLyhbYS16XSknKFtBLVpdKS9nLCBmdW5jdGlvbihhLCBtLCB4KSB7IHJldHVybiB4LnRvTG93ZXJDYXNlKCkgfSlcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oaW5wdXQsIG4pIHtcbiAgdmFyIHN0ciA9IGlucHV0LnRvU3RyaW5nKClcbiAgICAsIG51bSA9IHBhcnNlSW50KG4sIDEwKVxuXG4gIGlmKGlzTmFOKG51bSkpXG4gICAgcmV0dXJuIGlucHV0XG5cbiAgaWYoaW5wdXQubGVuZ3RoIDw9IG51bSlcbiAgICByZXR1cm4gaW5wdXRcblxuICByZXR1cm4gaW5wdXQuc2xpY2UoMCwgbnVtKSsnLi4uJ1xufVxuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihpbnB1dCwgbikge1xuICB2YXIgc3RyID0gaW5wdXQudG9TdHJpbmcoKVxuICAgICwgbnVtID0gcGFyc2VJbnQobiwgMTApXG4gICAgLCB3b3Jkc1xuXG4gIGlmKGlzTmFOKG51bSkpXG4gICAgcmV0dXJuIGlucHV0XG5cbiAgd29yZHMgPSBpbnB1dC5zcGxpdCgvXFxzKy8pXG5cbiAgaWYod29yZHMubGVuZ3RoIDw9IG51bSlcbiAgICByZXR1cm4gaW5wdXRcblxuICByZXR1cm4gd29yZHMuc2xpY2UoMCwgbnVtKS5qb2luKCcgJykrJy4uLidcbn1cbiIsInZhciBzYWZlID0gcmVxdWlyZSgnLi9zYWZlJyk7XG5cbnZhciB1bHBhcnNlciA9IGZ1bmN0aW9uKGxpc3QpIHtcbiAgdmFyIG91dCA9IFtdXG4gICAgLCBsID0gbGlzdC5zbGljZSgpXG4gICAgLCBpdGVtXG5cbiAgd2hpbGUobC5sZW5ndGgpIHtcbiAgICBpdGVtID0gbC5wb3AoKVxuXG4gICAgaWYoaXRlbSBpbnN0YW5jZW9mIEFycmF5KVxuICAgICAgb3V0LnVuc2hpZnQoJzx1bD4nK3VscGFyc2VyKGl0ZW0pKyc8L3VsPicpXG4gICAgZWxzZVxuICAgICAgb3V0LnVuc2hpZnQoJzwvbGk+PGxpPicraXRlbSlcbiAgfVxuXG4gIC8vIGdldCByaWQgb2YgdGhlIGxlYWRpbmcgPC9saT4sIGlmIGFueS4gYWRkIHRyYWlsaW5nIDwvbGk+LlxuICByZXR1cm4gb3V0LmpvaW4oJycpLnJlcGxhY2UoL148XFwvbGk+LywgJycpICsgJzwvbGk+J1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGlucHV0KSB7XG4gIHJldHVybiBpbnB1dCBpbnN0YW5jZW9mIEFycmF5ID9cbiAgICBzYWZlKHVscGFyc2VyKGlucHV0KSkgOlxuICAgIGlucHV0XG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGlucHV0KSB7XG4gIHJldHVybiBpbnB1dC50b1N0cmluZygpLnRvVXBwZXJDYXNlKClcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oaW5wdXQpIHtcbiAgcmV0dXJuIGVzY2FwZShpbnB1dC50b1N0cmluZygpKVxufVxuIiwidmFyIHNhZmUgPSByZXF1aXJlKCcuL3NhZmUnKVxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGlucHV0KSB7XG4gIHZhciBzdHIgPSBpbnB1dC50b1N0cmluZygpXG4gIHJldHVybiBzYWZlKHN0ci5yZXBsYWNlKC8oKChodHRwKHMpPzpcXC9cXC8pfChtYWlsdG86KSkoW1xcd1xcZFxcLVxcLjpAXFwvXSkrKS9nLCBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gJzxhIGhyZWY9XCInK2FyZ3VtZW50c1swXSsnXCI+Jythcmd1bWVudHNbMF0rJzwvYT4nOyBcbiAgfSkpXG59XG4iLCJ2YXIgc2FmZSA9IHJlcXVpcmUoJy4vc2FmZScpXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oaW5wdXQsIGxlbikge1xuICB2YXIgc3RyID0gaW5wdXQudG9TdHJpbmcoKVxuICBsZW4gPSBwYXJzZUludChsZW4sIDEwKSB8fCAxMDAwXG4gIHJldHVybiBzYWZlKHN0ci5yZXBsYWNlKC8oKChodHRwKHMpPzpcXC9cXC8pfChtYWlsdG86KSkoW1xcd1xcZFxcLVxcLjpAXSkrKS9nLCBmdW5jdGlvbigpIHtcbiAgICB2YXIgbHRyID0gYXJndW1lbnRzWzBdLmxlbmd0aCA+IGxlbiA/IGFyZ3VtZW50c1swXS5zbGljZSgwLCBsZW4pICsgJy4uLicgOiBhcmd1bWVudHNbMF07XG4gICAgcmV0dXJuICc8YSBocmVmPVwiJythcmd1bWVudHNbMF0rJ1wiPicrbHRyKyc8L2E+JzsgXG4gIH0pKVxufVxuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihpbnB1dCkge1xuICB2YXIgc3RyID0gaW5wdXQudG9TdHJpbmcoKVxuICAgICwgYml0cyA9IHN0ci5zcGxpdCgvXFxzKy9nKVxuXG4gIHJldHVybiBiaXRzLmxlbmd0aFxufVxuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihpbnB1dCwgbGVuKSB7XG4gIHZhciB3b3JkcyA9IGlucHV0LnRvU3RyaW5nKCkuc3BsaXQoL1xccysvZylcbiAgICAsIG91dCA9IFtdXG4gICAgLCBsZW4gPSBwYXJzZUludChsZW4sIDEwKSB8fCB3b3Jkcy5sZW5ndGhcblxuICB3aGlsZSh3b3Jkcy5sZW5ndGgpIHtcbiAgICBvdXQudW5zaGlmdCh3b3Jkcy5zcGxpY2UoMCwgbGVuKS5qb2luKCcgJykpXG4gIH1cblxuICByZXR1cm4gb3V0LmpvaW4oJ1xcbicpXG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGlucHV0LCBtYXApIHtcbiAgdmFyIG91ck1hcCA9IG1hcC50b1N0cmluZygpLnNwbGl0KCcsJylcbiAgICAsIHZhbHVlXG5cbiAgb3VyTWFwLmxlbmd0aCA8IDMgJiYgb3VyTWFwLnB1c2gob3VyTWFwWzFdKVxuXG4gIHZhbHVlID0gb3VyTWFwW1xuICAgIGlucHV0ID8gMCA6XG4gICAgaW5wdXQgPT09IGZhbHNlID8gMSA6XG4gICAgMlxuICBdXG5cbiAgcmV0dXJuIHZhbHVlXG59XG4iLCIoZnVuY3Rpb24oZ2xvYmFsKXt2YXIgRmlsdGVyVG9rZW4gPSByZXF1aXJlKCcuL2ZpbHRlcl90b2tlbicpXG4gICwgVGFnVG9rZW4gPSByZXF1aXJlKCcuL3RhZ190b2tlbicpXG4gICwgQ29tbWVudFRva2VuID0gcmVxdWlyZSgnLi9jb21tZW50X3Rva2VuJylcbiAgLCBUZXh0VG9rZW4gPSByZXF1aXJlKCcuL3RleHRfdG9rZW4nKSBcbiAgLCBsaWJyYXJpZXMgPSByZXF1aXJlKCcuL2xpYnJhcmllcycpXG4gICwgUGFyc2VyID0gcmVxdWlyZSgnLi9wYXJzZXInKVxuICAsIENvbnRleHQgPSByZXF1aXJlKCcuL2NvbnRleHQnKVxuICAsIE1ldGEgPSByZXF1aXJlKCcuL21ldGEnKVxuICAsIFByb21pc2UgPSByZXF1aXJlKCcuL3Byb21pc2UnKVxuXG5tb2R1bGUuZXhwb3J0cyA9IFRlbXBsYXRlXG5cbi8vIGNpcmN1bGFyIGFsaWFzIHRvIHN1cHBvcnQgb2xkXG4vLyB2ZXJzaW9ucyBvZiBwbGF0ZS5cblRlbXBsYXRlLlRlbXBsYXRlID0gVGVtcGxhdGVcblRlbXBsYXRlLkNvbnRleHQgPSBDb250ZXh0XG5cbnZhciBsYXRlciA9IHR5cGVvZiBnbG9iYWwgIT09ICd1bmRlZmluZWQnID8gXG4gICAgZnVuY3Rpb24oZm4pIHsgZ2xvYmFsLnNldFRpbWVvdXQoZm4sIDApIH0gOlxuICAgIGZ1bmN0aW9uKGZuKSB7IHRoaXMuc2V0VGltZW91dChmbiwgMCkgfVxuXG5mdW5jdGlvbiBUZW1wbGF0ZShyYXcsIGxpYnJhcmllcywgcGFyc2VyKSB7XG4gIGlmKHR5cGVvZiByYXcgIT09ICdzdHJpbmcnKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcignaW5wdXQgc2hvdWxkIGJlIGEgc3RyaW5nJylcbiAgfVxuXG4gIHRoaXMucmF3ID0gcmF3XG5cbiAgbGlicmFyaWVzID0gbGlicmFyaWVzIHx8IHt9XG5cbiAgdGhpcy50YWdMaWJyYXJ5ID1cbiAgICBsaWJyYXJpZXMudGFnX2xpYnJhcnkgfHwgVGVtcGxhdGUuTWV0YS5jcmVhdGVUYWdMaWJyYXJ5KClcblxuICB0aGlzLmZpbHRlckxpYnJhcnkgPSBcbiAgICBsaWJyYXJpZXMuZmlsdGVyX2xpYnJhcnkgfHwgVGVtcGxhdGUuTWV0YS5jcmVhdGVGaWx0ZXJMaWJyYXJ5KClcblxuICB0aGlzLnBsdWdpbkxpYnJhcnkgPSBcbiAgICBsaWJyYXJpZXMucGx1Z2luX2xpYnJhcnkgfHwgVGVtcGxhdGUuTWV0YS5jcmVhdGVQbHVnaW5MaWJyYXJ5KClcblxuICB0aGlzLnBhcnNlciA9IHBhcnNlciB8fCBQYXJzZXJcblxuICB0aGlzLnRva2VucyA9IG51bGxcbn1cblxudmFyIGNvbnMgPSBUZW1wbGF0ZVxuICAsIHByb3RvID0gY29ucy5wcm90b3R5cGVcbiAgLCBtZXRhID0gY29ucy5NZXRhID0gbmV3IE1ldGFcblxuY29ucy5jcmVhdGVQbHVnaW5MaWJyYXJ5ID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiBuZXcgbGlicmFyaWVzLkRlZmF1bHRQbHVnaW5MaWJyYXJ5KClcbn1cblxucHJvdG8uZ2V0Tm9kZUxpc3QgPSBmdW5jdGlvbigpIHtcbiAgdGhpcy5ub2RlbGlzdCA9IHRoaXMubm9kZWxpc3QgfHwgdGhpcy5wYXJzZSgpXG5cbiAgcmV0dXJuIHRoaXMubm9kZWxpc3Rcbn1cblxucHJvdG8ucGFyc2UgPSBmdW5jdGlvbigpIHtcbiAgdmFyIHBhcnNlclxuXG4gIHRoaXMudG9rZW5zID0gdGhpcy50b2tlbnMgfHwgY29ucy50b2tlbml6ZSh0aGlzLnJhdylcblxuICBwYXJzZXIgPSBuZXcgdGhpcy5wYXJzZXIoXG4gICAgICB0aGlzLnRva2Vuc1xuICAgICwgdGhpcy50YWdMaWJyYXJ5XG4gICAgLCB0aGlzLmZpbHRlckxpYnJhcnlcbiAgICAsIHRoaXMucGx1Z2luTGlicmFyeVxuICAgICwgdGhpc1xuICApXG5cbiAgcmV0dXJuIHBhcnNlci5wYXJzZSgpXG59XG5cbnByb3RvLnJlbmRlciA9IHByb3RlY3QoZnVuY3Rpb24oY29udGV4dCwgcmVhZHkpIHtcbiAgY29udGV4dCA9IG5ldyBDb250ZXh0KGNvbnRleHQpXG5cbiAgdmFyIHJlc3VsdFxuXG4gIHJlc3VsdCA9IFxuICB0aGlzXG4gICAgLmdldE5vZGVMaXN0KClcbiAgICAucmVuZGVyKGNvbnRleHQpXG5cbiAgaWYocmVzdWx0LmNvbnN0cnVjdG9yID09PSBQcm9taXNlKSB7XG4gICAgcmVzdWx0Lm9uY2UoJ2RvbmUnLCBmdW5jdGlvbihkYXRhKSB7XG4gICAgICByZWFkeShudWxsLCBkYXRhKVxuICAgIH0pXG4gIH0gZWxzZSB7XG4gICAgbGF0ZXIoZnVuY3Rpb24oKSB7XG4gICAgICByZWFkeShudWxsLCByZXN1bHQpXG4gICAgfSwgMClcbiAgfVxuXG59KVxuXG5mdW5jdGlvbiBwcm90ZWN0KGZuKSB7XG4gIHJldHVybiBmdW5jdGlvbihjb250ZXh0LCByZWFkeSkge1xuICAgIGlmKCFjb250ZXh0IHx8ICFyZWFkeSkge1xuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcigpXG4gICAgfVxuXG4gICAgdHJ5IHtcbiAgICAgIHJldHVybiBmbi5jYWxsKHRoaXMsIGNvbnRleHQsIHJlYWR5KVxuICAgIH0gY2F0Y2goZSkge1xuICAgICAgbGF0ZXIoZnVuY3Rpb24oKSB7XG4gICAgICAgIHJlYWR5KGUsIG51bGwpXG4gICAgICB9LCAwKVxuICAgIH1cbiAgfVxufVxuXG5jb25zLk1BVENIX1JFID0gL1xce1slI1xce10oLio/KVtcXH0jJV1cXH0vXG5cbmNvbnMudG9rZW5pemUgPSBmdW5jdGlvbihjb250ZW50KSB7XG4gIHZhciBtYXRjaCA9IG51bGxcbiAgICAsIHRva2VucyA9IFtdXG4gICAgLCBsaW5lTm8gPSAxXG4gICAgLCBpbmNMaW5lTm8gPSBmdW5jdGlvbihzdHIpIHsgbGluZU5vICs9IHN0ci5zcGxpdCgnXFxuJykubGVuZ3RoIH1cbiAgICAsIG1hcCA9IHtcbiAgICAgICAgICAnJSc6IFRhZ1Rva2VuXG4gICAgICAgICwgJyMnOiBDb21tZW50VG9rZW5cbiAgICAgICAgLCAneyc6IEZpbHRlclRva2VuXG4gICAgICB9XG4gICAgLCByZXggPSB0aGlzLk1BVENIX1JFXG4gICAgLCBsaXRlcmFsXG5cbiAgZG8ge1xuICAgIG1hdGNoID0gcmV4LmV4ZWMoY29udGVudClcbiAgICBpZighbWF0Y2gpXG4gICAgICBjb250aW51ZVxuXG4gICAgbGl0ZXJhbCA9IGNvbnRlbnQuc2xpY2UoMCwgbWF0Y2guaW5kZXgpXG4gICAgaW5jTGluZU5vKGxpdGVyYWwpXG4gICAgaWYobWF0Y2guaW5kZXgpXG4gICAgICB0b2tlbnMucHVzaChuZXcgVGV4dFRva2VuKGxpdGVyYWwuc2xpY2UoMCwgbWF0Y2guaW5kZXgsIGxpbmVObykpKVxuXG4gICAgbWF0Y2hbMV0gPSBtYXRjaFsxXVxuICAgICAgLnJlcGxhY2UoL15cXHMrLywgJycpXG4gICAgICAucmVwbGFjZSgvXFxzKyQvLCAnJylcblxuICAgIHRva2Vucy5wdXNoKG5ldyBtYXBbbWF0Y2hbMF0uY2hhckF0KDEpXShtYXRjaFsxXSwgbGluZU5vKSlcblxuICAgIGNvbnRlbnQgPSBjb250ZW50LnNsaWNlKG1hdGNoLmluZGV4ICsgbWF0Y2hbMF0ubGVuZ3RoKVxuICB9IHdoaWxlKGNvbnRlbnQubGVuZ3RoICYmIG1hdGNoKVxuXG4gIHRva2Vucy5wdXNoKG5ldyBUZXh0VG9rZW4oY29udGVudCkpXG5cbiAgcmV0dXJuIHRva2Vuc1xufVxuXG59KShzZWxmKSIsIm1vZHVsZS5leHBvcnRzID0ge1xuICAgIExpYnJhcnk6IHJlcXVpcmUoJy4vbGlicmFyeScpXG4gICwgRGVmYXVsdFBsdWdpbkxpYnJhcnk6IHJlcXVpcmUoJy4vbGlicmFyeScpXG4gICwgRGVmYXVsdFRhZ0xpYnJhcnk6IHJlcXVpcmUoJy4vZGVmYXVsdHRhZ3MnKVxuICAsIERlZmF1bHRGaWx0ZXJMaWJyYXJ5OiByZXF1aXJlKCcuL2RlZmF1bHRmaWx0ZXJzJylcbn0gXG4iLCJtb2R1bGUuZXhwb3J0cyA9IExpYnJhcnlcblxuZnVuY3Rpb24gTGlicmFyeShsaWIpIHtcbiAgdGhpcy5yZWdpc3RyeSA9IGxpYiB8fCB7fVxufVxuXG52YXIgY29ucyA9IExpYnJhcnlcbiAgLCBwcm90byA9IGNvbnMucHJvdG90eXBlXG5cbnByb3RvLmxvb2t1cCA9IGVycm9yT25OdWxsKGZ1bmN0aW9uKG5hbWUpIHtcbiAgcmV0dXJuIHRoaXMucmVnaXN0cnlbbmFtZV0gfHwgbnVsbCAgXG59LCBcIkNvdWxkIG5vdCBmaW5kIHswfSFcIilcblxucHJvdG8ucmVnaXN0ZXIgPSBlcnJvck9uTnVsbChmdW5jdGlvbihuYW1lLCBpdGVtKSB7XG4gIGlmKHRoaXMucmVnaXN0cnlbbmFtZV0pXG4gICAgcmV0dXJuIG51bGxcblxuICB0aGlzLnJlZ2lzdHJ5W25hbWVdID0gaXRlbVxufSwgXCJ7MH0gaXMgYWxyZWFkeSByZWdpc3RlcmVkIVwiKVxuXG5cbmZ1bmN0aW9uIGVycm9yT25OdWxsKGZuLCBtc2cpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgIHZhciByZXN1bHQgPSBmbi5jYWxsKHRoaXMsIGFyZ3VtZW50c1swXSwgYXJndW1lbnRzWzFdKVxuICAgICAgLCBhcmdzID0gYXJndW1lbnRzXG5cbiAgICBpZihyZXN1bHQgPT09IG51bGwpXG4gICAgICB0aHJvdyBuZXcgRXJyb3IobXNnLnJlcGxhY2UoL1xceyhcXGQrPylcXH0vZywgZnVuY3Rpb24oYSwgbSkge1xuICAgICAgICByZXR1cm4gYXJnc1srbV1cbiAgICAgIH0pKVxuXG4gICAgcmV0dXJuIHJlc3VsdFxuICB9XG59XG5cbiIsInZhciBsaWJyYXJpZXMgPSByZXF1aXJlKCcuL2xpYnJhcmllcycpXG5cbm1vZHVsZS5leHBvcnRzID0gTWV0YVxuXG5mdW5jdGlvbiBNZXRhKCkge1xuICB0aGlzLl9hdXRvcmVnaXN0ZXIgPSB7XG4gICAgICBwbHVnaW46IHt9XG4gICAgLCB0YWc6IHt9XG4gICAgLCBmaWx0ZXI6IHt9XG4gIH1cblxuICB0aGlzLl9jYWNoZSA9IHt9XG5cbiAgdGhpcy5fY2xhc3NlcyA9IHtcbiAgICAgIGZpbHRlcjogbGlicmFyaWVzLkRlZmF1bHRGaWx0ZXJMaWJyYXJ5XG4gICAgLCBwbHVnaW46IGxpYnJhcmllcy5EZWZhdWx0UGx1Z2luTGlicmFyeVxuICAgICwgdGFnOiBsaWJyYXJpZXMuRGVmYXVsdFRhZ0xpYnJhcnlcbiAgfVxufVxuXG52YXIgY29ucyA9IE1ldGFcbiAgLCBwcm90byA9IGNvbnMucHJvdG90eXBlXG5cbnByb3RvLmNyZWF0ZVBsdWdpbkxpYnJhcnkgPSBjcmVhdGVMaWJyYXJ5KCdwbHVnaW4nKVxucHJvdG8uY3JlYXRlRmlsdGVyTGlicmFyeSA9IGNyZWF0ZUxpYnJhcnkoJ2ZpbHRlcicpXG5wcm90by5jcmVhdGVUYWdMaWJyYXJ5ID0gY3JlYXRlTGlicmFyeSgndGFnJylcblxucHJvdG8ucmVnaXN0ZXJQbHVnaW4gPSBjcmVhdGVBdXRvcmVnaXN0ZXIoJ3BsdWdpbicpXG5wcm90by5yZWdpc3RlckZpbHRlciA9IGNyZWF0ZUF1dG9yZWdpc3RlcignZmlsdGVyJylcbnByb3RvLnJlZ2lzdGVyVGFnID0gY3JlYXRlQXV0b3JlZ2lzdGVyKCd0YWcnKVxuXG5mdW5jdGlvbiBjcmVhdGVBdXRvcmVnaXN0ZXIobmFtZSkge1xuICByZXR1cm4gZnVuY3Rpb24oa2V5LCBpdGVtKSB7XG4gICAgaWYodGhpcy5fY2FjaGVbbmFtZV0pXG4gICAgICB0aGlzLl9jYWNoZVtuYW1lXS5yZWdpc3RlcihrZXksIGl0ZW0pO1xuICAgIGVsc2VcbiAgICAgIHRoaXMuX2F1dG9yZWdpc3RlcltuYW1lXVtrZXldID0gaXRlbTtcbiAgfVxufVxuXG5mdW5jdGlvbiBjcmVhdGVMaWJyYXJ5KG5hbWUpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgIGlmKHRoaXMuX2NhY2hlW25hbWVdKVxuICAgICAgcmV0dXJuIHRoaXMuX2NhY2hlW25hbWVdOyBcblxuICAgIHZhciBsaWIgPSBuZXcgdGhpcy5fY2xhc3Nlc1tuYW1lXVxuXG4gICAgZm9yKHZhciBrZXkgaW4gdGhpcy5fYXV0b3JlZ2lzdGVyW25hbWVdKSB7XG4gICAgICBsaWIucmVnaXN0ZXIoa2V5LCB0aGlzLl9hdXRvcmVnaXN0ZXJbbmFtZV1ba2V5XSlcbiAgICB9XG5cbiAgICB0aGlzLl9jYWNoZVtuYW1lXSA9IGxpYlxuICAgIHJldHVybiBsaWJcbiAgfVxufVxuXG4iLCJtb2R1bGUuZXhwb3J0cyA9IE5vZGVMaXN0XG5cbnZhciBQcm9taXNlID0gcmVxdWlyZSgnLi9wcm9taXNlJylcblxuZnVuY3Rpb24gTm9kZUxpc3Qobm9kZXMpIHtcbiAgdGhpcy5ub2RlcyA9IG5vZGVzXG59XG5cbnZhciBjb25zID0gTm9kZUxpc3RcbiAgLCBwcm90byA9IGNvbnMucHJvdG90eXBlXG5cbnByb3RvLnJlbmRlciA9IGZ1bmN0aW9uKGNvbnRleHQpIHtcbiAgdmFyIHByb21pc2VzID0gW11cbiAgICAsIHJlc3VsdHMgPSBbXVxuICAgICwgbm9kZXMgPSB0aGlzLm5vZGVzXG4gICAgLCByZXN1bHRcblxuICBmb3IodmFyIGkgPSAwLCBsZW4gPSBub2Rlcy5sZW5ndGg7IGkgPCBsZW47ICsraSkge1xuICAgIHJlc3VsdHNbaV0gPSByZXN1bHQgPSBub2Rlc1tpXS5yZW5kZXIoY29udGV4dClcblxuICAgIGlmKHJlc3VsdC5jb25zdHJ1Y3RvciA9PT0gUHJvbWlzZSkge1xuICAgICAgcHJvbWlzZXMucHVzaChyZXN1bHQpXG4gICAgfVxuICB9XG5cbiAgaWYocHJvbWlzZXMubGVuZ3RoKSB7XG4gICAgcmV0dXJuIHRoaXMucmVzb2x2ZVByb21pc2VzKHJlc3VsdHMsIHByb21pc2VzKSBcbiAgfVxuXG4gIHJldHVybiByZXN1bHRzLmpvaW4oJycpXG59XG5cbnByb3RvLnJlc29sdmVQcm9taXNlcyA9IGZ1bmN0aW9uKHJlc3VsdHMsIHByb21pc2VzKSB7XG4gIHZhciBzZWxmID0gdGhpc1xuICAgICwgcHJvbWlzZSA9IG5ldyBQcm9taXNlXG4gICAgLCB0b3RhbCA9IHByb21pc2VzLmxlbmd0aFxuXG4gIGZvcih2YXIgaSA9IDAsIHAgPSAwLCBsZW4gPSByZXN1bHRzLmxlbmd0aDsgaSA8IGxlbjsgKytpKSB7XG4gICAgaWYocmVzdWx0c1tpXS5jb25zdHJ1Y3RvciAhPT0gUHJvbWlzZSkgXG4gICAgICBjb250aW51ZVxuXG4gICAgcHJvbWlzZXNbcCsrXS5vbmNlKCdkb25lJywgYmluZChpLCBmdW5jdGlvbihpZHgsIHJlc3VsdCkge1xuICAgICAgcmVzdWx0c1tpZHhdID0gcmVzdWx0XG5cbiAgICAgIGlmKCEtLXRvdGFsKVxuICAgICAgICBwcm9taXNlLnJlc29sdmUocmVzdWx0cy5qb2luKCcnKSlcbiAgICB9KSlcbiAgfVxuXG4gIHJldHVybiBwcm9taXNlXG59XG5cbmZ1bmN0aW9uIGJpbmQobnVtLCBmbikge1xuICByZXR1cm4gZnVuY3Rpb24ocmVzdWx0KSB7XG4gICAgcmV0dXJuIGZuKG51bSwgcmVzdWx0KVxuICB9XG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IFBhcnNlclxuXG52YXIgTm9kZUxpc3QgPSByZXF1aXJlKCcuL25vZGVfbGlzdCcpXG5cbnZhciBGaWx0ZXJBcHBsaWNhdGlvbiA9IHJlcXVpcmUoJy4vZmlsdGVyX2FwcGxpY2F0aW9uJylcbiAgLCBGaWx0ZXJMb29rdXAgPSByZXF1aXJlKCcuL2ZpbHRlcl9sb29rdXAnKVxuICAsIEZpbHRlckNoYWluID0gcmVxdWlyZSgnLi9maWx0ZXJfY2hhaW4nKVxuICAsIFRhZ1Rva2VuID0gcmVxdWlyZSgnLi90YWdfdG9rZW4nKVxuXG5mdW5jdGlvbiBQYXJzZXIodG9rZW5zLCB0YWdzLCBmaWx0ZXJzLCBwbHVnaW5zKSB7XG4gIHRoaXMudG9rZW5zID0gdG9rZW5zXG4gIHRoaXMudGFncyA9IHRhZ3NcbiAgdGhpcy5maWx0ZXJzID0gZmlsdGVyc1xuICB0aGlzLnBsdWdpbnMgPSBwbHVnaW5zXG5cbiAgLy8gZm9yIHVzZSB3aXRoIGV4dGVuZHMgLyBibG9jayB0YWdzXG4gIHRoaXMubG9hZGVkQmxvY2tzID0gW11cbn1cblxudmFyIGNvbnMgPSBQYXJzZXJcbiAgLCBwcm90byA9IGNvbnMucHJvdG90eXBlXG5cbnByb3RvLmNhY2hlID0ge31cblxucHJvdG8ucGFyc2UgPSBmdW5jdGlvbih1bnRpbCkge1xuICB2YXIgb2theSA9ICF1bnRpbFxuICAgICwgdG9rZW4gPSBudWxsXG4gICAgLCBvdXRwdXQgPSBbXVxuICAgICwgbm9kZVxuXG4gIHdoaWxlKHRoaXMudG9rZW5zLmxlbmd0aCA+IDApIHtcbiAgICB0b2tlbiA9IHRoaXMudG9rZW5zLnNoaWZ0KClcblxuICAgIGlmKHVudGlsICYmIHRva2VuLmlzKHVudGlsKSAmJiB0b2tlbi5jb25zdHJ1Y3RvciA9PT0gVGFnVG9rZW4pIHtcbiAgICAgIHRoaXMudG9rZW5zLnVuc2hpZnQodG9rZW4pXG4gICAgICBva2F5ID0gdHJ1ZVxuXG4gICAgICBicmVha1xuICAgIH1cblxuICAgIGlmKG5vZGUgPSB0b2tlbi5ub2RlKHRoaXMpKSB7XG4gICAgICBvdXRwdXQucHVzaChub2RlKVxuICAgIH1cbiAgfVxuXG4gIGlmKCFva2F5KSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdleHBlY3RlZCBvbmUgb2YgJyArIHVudGlsKVxuICB9XG5cbiAgcmV0dXJuIG5ldyBOb2RlTGlzdChvdXRwdXQpXG59XG5cbnByb3RvLmNvbXBpbGVOdW1iZXIgPSBmdW5jdGlvbihjb250ZW50LCBpZHgsIG91dHB1dCkge1xuICB2YXIgZGVjaW1hbCA9IGNvbnRlbnQuY2hhckF0KGlkeCkgPT09ICcuJ1xuICAgICwgYml0cyA9IGRlY2ltYWwgPyBbJzAuJ10gOiBbXVxuICAgICwgcGFyc2VcbiAgICAsIGNcblxuICBkbyB7XG4gICAgYyA9IGNvbnRlbnQuY2hhckF0KGlkeClcblxuICAgIGlmKGMgPT09ICcuJykge1xuICAgICAgaWYoZGVjaW1hbCkge1xuICAgICAgICBicmVha1xuICAgICAgfVxuXG4gICAgICBkZWNpbWFsID0gdHJ1ZVxuICAgICAgYml0cy5wdXNoKCcuJylcbiAgICB9IGVsc2UgaWYoL1xcZC8udGVzdChjKSkge1xuICAgICAgYml0cy5wdXNoKGMpXG4gICAgfVxuICB9IHdoaWxlKCsraWR4IDwgY29udGVudC5sZW5ndGgpXG5cbiAgcGFyc2UgPSBkZWNpbWFsID8gcGFyc2VGbG9hdCA6IHBhcnNlSW50XG4gIG91dHB1dC5wdXNoKHBhcnNlKGJpdHMuam9pbignJyksIDEwKSlcblxuICByZXR1cm4gaWR4XG59XG5cbnByb3RvLmNvbXBpbGVTdHJpbmcgPSBmdW5jdGlvbihjb250ZW50LCBpZHgsIG91dHB1dCkge1xuICB2YXIgdHlwZSA9IGNvbnRlbnQuY2hhckF0KGlkeClcbiAgICAsIGVzY2FwZWQgPSBmYWxzZVxuICAgICwgYml0cyA9IFtdXG4gICAgLCBjXG5cbiAgKytpZHhcblxuICBkbyB7XG4gICAgYyA9IGNvbnRlbnQuY2hhckF0KGlkeClcblxuICAgIGlmKCFlc2NhcGVkKSB7XG4gICAgICBpZihjID09PSAnXFxcXCcpIHtcbiAgICAgICAgZXNjYXBlZCA9IHRydWVcblxuICAgICAgICBjb250aW51ZVxuICAgICAgfVxuXG4gICAgICBpZihjID09PSB0eXBlKSB7XG4gICAgICAgIGJyZWFrXG4gICAgICB9XG5cbiAgICAgIGJpdHMucHVzaChjKVxuICAgIH0gZWxzZSB7XG4gICAgICBpZighL1snXCJcXFxcXS8udGVzdChjKSkge1xuICAgICAgICBiaXRzLnB1c2goJ1xcXFwnKVxuICAgICAgfVxuXG4gICAgICBiaXRzLnB1c2goYylcbiAgICAgIGVzY2FwZWQgPSBmYWxzZVxuICAgIH1cblxuICB9IHdoaWxlKCsraWR4IDwgY29udGVudC5sZW5ndGgpXG5cbiAgb3V0cHV0LnB1c2goYml0cy5qb2luKCcnKSlcblxuICByZXR1cm4gaWR4XG59XG5cbnByb3RvLmNvbXBpbGVOYW1lID0gZnVuY3Rpb24oY29udGVudCwgaWR4LCBvdXRwdXQpIHtcbiAgdmFyIG91dCA9IFtdXG4gICAgLCBjXG5cbiAgZG8ge1xuICAgIGMgPSBjb250ZW50LmNoYXJBdChpZHgpXG5cbiAgICBpZigvW15cXHdcXGRcXF9dLy50ZXN0KGMpKSB7XG4gICAgICBicmVha1xuICAgIH1cblxuICAgIG91dC5wdXNoKGMpXG4gIH0gd2hpbGUoKytpZHggPCBjb250ZW50Lmxlbmd0aClcblxuICBvdXRwdXQucHVzaChvdXQuam9pbignJykpXG5cbiAgcmV0dXJuIGlkeFxufVxuXG5wcm90by5jb21waWxlRmlsdGVyID0gZnVuY3Rpb24oY29udGVudCwgaWR4LCBvdXRwdXQpIHtcbiAgdmFyIGZpbHRlck5hbWVcbiAgICAsIG9sZExlblxuICAgICwgYml0c1xuXG4gICsraWR4XG5cbiAgaWR4ID0gdGhpcy5jb21waWxlTmFtZShjb250ZW50LCBpZHgsIG91dHB1dClcbiAgZmlsdGVyTmFtZSA9IG91dHB1dC5wb3AoKVxuXG4gIGlmKGNvbnRlbnQuY2hhckF0KGlkeCkgIT09ICc6Jykge1xuICAgIG91dHB1dC5wdXNoKG5ldyBGaWx0ZXJBcHBsaWNhdGlvbihmaWx0ZXJOYW1lLCBbXSkpXG5cbiAgICByZXR1cm4gaWR4IC0gMVxuICB9XG5cbiAgKytpZHhcblxuICBvbGRMZW4gPSBvdXRwdXQubGVuZ3RoXG4gIGlkeCA9IHRoaXMuY29tcGlsZUZ1bGwoY29udGVudCwgaWR4LCBvdXRwdXQsIHRydWUpXG4gIGJpdHMgPSBvdXRwdXQuc3BsaWNlKG9sZExlbiwgb3V0cHV0Lmxlbmd0aCAtIG9sZExlbilcblxuICBvdXRwdXQucHVzaChuZXcgRmlsdGVyQXBwbGljYXRpb24oZmlsdGVyTmFtZSwgYml0cykpXG5cbiAgcmV0dXJuIGlkeFxufVxuXG5wcm90by5jb21waWxlTG9va3VwID0gZnVuY3Rpb24oY29udGVudCwgaWR4LCBvdXRwdXQpIHtcbiAgdmFyIGJpdHMgPSBbXVxuXG4gIGRvIHtcbiAgICBpZHggPSB0aGlzLmNvbXBpbGVOYW1lKGNvbnRlbnQsIGlkeCwgb3V0cHV0KVxuICAgIGJpdHMucHVzaChvdXRwdXQucG9wKCkpXG5cbiAgICBpZihjb250ZW50LmNoYXJBdChpZHgpICE9PSAnLicpIHtcbiAgICAgIGJyZWFrXG4gICAgfVxuICB9IHdoaWxlKCsraWR4IDwgY29udGVudC5sZW5ndGgpXG5cbiAgb3V0cHV0LnB1c2gobmV3IEZpbHRlckxvb2t1cChiaXRzKSlcblxuICByZXR1cm4gaWR4IC0gMVxufVxuXG5wcm90by5jb21waWxlRnVsbCA9IGZ1bmN0aW9uKGNvbnRlbnQsIGlkeCwgb3V0cHV0LCBvbWl0UGlwZSkge1xuICB2YXIgY1xuXG4gIG91dHB1dCA9IG91dHB1dCB8fCBbXVxuICBpZHggPSBpZHggfHwgMFxuICAvLyBzb21ldGhpbmd8ZmlsdGVybmFtZVs6YXJnLCBhcmddXG4gIC8vIFwicXVvdGVzXCJcbiAgLy8gMVxuICAvLyAxLjJcbiAgLy8gdHJ1ZSB8IGZhbHNlXG4gIC8vIHN3YWxsb3cgbGVhZGluZyB3aGl0ZXNwYWNlLlxuXG4gIHdoaWxlKC9cXHMvLnRlc3QoY29udGVudC5jaGFyQXQoaWR4KSkpIHtcbiAgICArK2lkeFxuICB9XG5cbiAgZG8ge1xuICAgIGMgPSBjb250ZW50LmNoYXJBdChpZHgpXG5cbiAgICBpZigvWyxcXHNdLy50ZXN0KGMpKSB7XG4gICAgICBicmVha1xuICAgIH1cblxuICAgIGlmKG9taXRQaXBlICYmIGMgPT09ICd8Jykge1xuICAgICAgLS1pZHhcblxuICAgICAgYnJlYWtcbiAgICB9XG5cbiAgICBzd2l0Y2godHJ1ZSkge1xuICAgICAgY2FzZSAvW1xcZFxcLl0vLnRlc3QoYyk6XG4gICAgICAgIGlkeCA9IHRoaXMuY29tcGlsZU51bWJlcihjb250ZW50LCBpZHgsIG91dHB1dClcbiAgICAgICAgYnJlYWtcbiAgICAgIGNhc2UgL1snXCJdLy50ZXN0KGMpOlxuICAgICAgICBpZHggPSB0aGlzLmNvbXBpbGVTdHJpbmcoY29udGVudCwgaWR4LCBvdXRwdXQpXG4gICAgICAgIGJyZWFrXG4gICAgICBjYXNlIGMgPT09ICd8JzpcbiAgICAgICAgaWR4ID0gdGhpcy5jb21waWxlRmlsdGVyKGNvbnRlbnQsIGlkeCwgb3V0cHV0KVxuICAgICAgICBicmVha1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgaWR4ID0gdGhpcy5jb21waWxlTG9va3VwKGNvbnRlbnQsIGlkeCwgb3V0cHV0KVxuICAgICAgICBicmVha1xuICAgIH1cbiAgfSB3aGlsZSgrK2lkeCA8IGNvbnRlbnQubGVuZ3RoKVxuXG4gIHJldHVybiBpZHhcbn1cblxucHJvdG8uY29tcGlsZSA9IGZ1bmN0aW9uKGNvbnRlbnQpIHtcbiAgdmFyIG91dHB1dCA9IFtdXG5cbiAgaWYodGhpcy5jYWNoZVtjb250ZW50XSkge1xuICAgIHJldHVybiB0aGlzLmNhY2hlW2NvbnRlbnRdXG4gIH1cblxuICB0aGlzLmNvbXBpbGVGdWxsKGNvbnRlbnQsIDAsIG91dHB1dClcblxuICBvdXRwdXQgPSB0aGlzLmNhY2hlW2NvbnRlbnRdID0gbmV3IEZpbHRlckNoYWluKG91dHB1dCwgdGhpcylcbiAgb3V0cHV0LmF0dGFjaCh0aGlzKVxuXG4gIHJldHVybiBvdXRwdXRcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gUHJvbWlzZVxuXG5mdW5jdGlvbiBQcm9taXNlKCkge1xuICB0aGlzLnRyaWdnZXIgPSBudWxsXG59XG5cbnZhciBjb25zID0gUHJvbWlzZVxuICAsIHByb3RvID0gY29ucy5wcm90b3R5cGVcblxucHJvdG8ucmVzb2x2ZSA9IGZ1bmN0aW9uKHZhbHVlKSB7XG4gIHZhciB0cmlnZ2VyID0gdGhpcy50cmlnZ2VyXG5cbiAgaWYoIXZhbHVlIHx8IHZhbHVlLmNvbnN0cnVjdG9yICE9PSBjb25zKSB7XG4gICAgcmV0dXJuIHRyaWdnZXIodmFsdWUpXG4gIH1cblxuICB2YWx1ZS5vbmNlKCdkb25lJywgdHJpZ2dlcilcbn1cblxucHJvdG8ub25jZSA9IGZ1bmN0aW9uKGV2LCBmbikge1xuICB0aGlzLnRyaWdnZXIgPSBmbiAgXG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IFRhZ1Rva2VuXG5cbnZhciBUb2tlbiA9IHJlcXVpcmUoJy4vdG9rZW4nKVxuXG5mdW5jdGlvbiBUYWdUb2tlbihjb250ZW50LCBsaW5lKSB7XG4gIFRva2VuLmNhbGwodGhpcywgY29udGVudCwgbGluZSlcbn1cblxudmFyIGNvbnMgPSBUYWdUb2tlblxuICAsIHByb3RvID0gY29ucy5wcm90b3R5cGUgPSBuZXcgVG9rZW5cblxucHJvdG8uY29uc3RydWN0b3IgPSBjb25zXG5cbnByb3RvLm5vZGUgPSBmdW5jdGlvbihwYXJzZXIpIHtcbiAgdmFyIHRhZyA9IHBhcnNlci50YWdzLmxvb2t1cCh0aGlzLm5hbWUpXG5cbiAgcmV0dXJuIHRhZyh0aGlzLmNvbnRlbnQsIHBhcnNlcilcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gQmxvY2tOb2RlXG5cbnZhciBQcm9taXNlID0gcmVxdWlyZSgnLi4vcHJvbWlzZScpXG4gICwgQmxvY2tDb250ZXh0ID0gcmVxdWlyZSgnLi4vYmxvY2tfY29udGV4dCcpXG5cbmZ1bmN0aW9uIEJsb2NrTm9kZShuYW1lLCBub2Rlcykge1xuICB0aGlzLm5hbWUgPSBuYW1lXG4gIHRoaXMubm9kZXMgPSBub2Rlc1xuXG4gIHRoaXMuY29udGV4dCA9IG51bGxcbn1cblxudmFyIGNvbnMgPSBCbG9ja05vZGVcbiAgLCBwcm90byA9IGNvbnMucHJvdG90eXBlXG5cbnByb3RvLnJlbmRlciA9IGZ1bmN0aW9uKGNvbnRleHQpIHtcbiAgdmFyIHNlbGYgPSB0aGlzXG4gICAgLCBibG9ja0NvbnRleHQgPSBCbG9ja0NvbnRleHQuZnJvbShjb250ZXh0KVxuICAgICwgcmVzdWx0XG4gICAgLCBibG9ja1xuICAgICwgcHVzaFxuXG4gIGlmKCFibG9ja0NvbnRleHQpIHtcbiAgICBjb250ZXh0LmJsb2NrID0gc2VsZlxuICAgIHJldHVybiBzZWxmLm5vZGVzLnJlbmRlcihjb250ZXh0KVxuICB9XG5cbiAgYmxvY2sgPSBwdXNoID0gYmxvY2tDb250ZXh0LnBvcChzZWxmLm5hbWUpXG5cbiAgaWYoIWJsb2NrKSB7IFxuICAgIGJsb2NrID0gc2VsZlxuICB9IFxuXG4gIGJsb2NrID0gbmV3IEJsb2NrTm9kZShibG9jay5uYW1lLCBibG9jay5ub2RlcylcblxuICBibG9jay5jb250ZXh0ID0gY29udGV4dFxuICBibG9jay5jb250ZXh0LmJsb2NrID0gYmxvY2tcbiAgY29udGV4dC5ibG9jayA9IGJsb2NrXG5cbiAgcmVzdWx0ID0gYmxvY2subm9kZXMucmVuZGVyKGNvbnRleHQpXG5cbiAgaWYocHVzaCkge1xuICAgIGJsb2NrQ29udGV4dC5wdXNoKHNlbGYubmFtZSwgcHVzaClcbiAgfVxuXG4gIHJldHVybiByZXN1bHRcblxufVxuXG5wcm90by5pc0Jsb2NrTm9kZSA9IHRydWVcblxucHJvdG8uX3N1cGVyID0gZnVuY3Rpb24oKSB7XG4gIHZhciBibG9ja0NvbnRleHQgPSBCbG9ja0NvbnRleHQuZnJvbSh0aGlzLmNvbnRleHQpXG4gICAgLCBibG9ja1xuICAgICwgc3RyXG5cbiAgaWYoYmxvY2tDb250ZXh0ICYmIChibG9jayA9IGJsb2NrQ29udGV4dC5nZXQodGhpcy5uYW1lKSkpIHtcbiAgICBzdHIgPSBuZXcgU3RyaW5nKGJsb2NrLnJlbmRlcih0aGlzLmNvbnRleHQpKVxuICAgIHN0ci5zYWZlID0gdHJ1ZVxuICAgIHJldHVybiBzdHIgXG4gIH1cblxuICByZXR1cm4gJydcbn1cblxuY29ucy5wYXJzZSA9IGZ1bmN0aW9uKGNvbnRlbnRzLCBwYXJzZXIpIHtcbiAgdmFyIGJpdHMgPSBjb250ZW50cy5zcGxpdCgnICcpXG4gICAgLCBuYW1lID0gYml0c1sxXVxuICAgICwgbG9hZGVkID0gcGFyc2VyLmxvYWRlZEJsb2Nrc1xuICAgICwgbm9kZXNcblxuICBmb3IodmFyIGkgPSAwLCBsZW4gPSBsb2FkZWQubGVuZ3RoOyBpIDwgbGVuOyArK2kpXG4gICAgaWYobG9hZGVkW2ldID09PSBuYW1lKVxuICAgICAgdGhyb3cgbmV3IEVycm9yKCdibG9jayB0YWcgd2l0aCB0aGUgbmFtZSBcIicrbmFtZSsnXCIgYXBwZWFycyBtb3JlIHRoYW4gb25jZScpXG5cbiAgbG9hZGVkLnB1c2gobmFtZSlcblxuICBub2RlcyA9IHBhcnNlci5wYXJzZShbJ2VuZGJsb2NrJ10pXG4gIHBhcnNlci50b2tlbnMuc2hpZnQoKVxuXG4gIHJldHVybiBuZXcgY29ucyhuYW1lLCBub2RlcykgIFxufVxuIiwibW9kdWxlLmV4cG9ydHMgPSBDb21tZW50Tm9kZVxuXG5mdW5jdGlvbiBDb21tZW50Tm9kZSgpIHtcbiAgLy8gbm8tb3AuXG59XG5cbnZhciBjb25zID0gQ29tbWVudE5vZGVcbiAgLCBwcm90byA9IGNvbnMucHJvdG90eXBlXG5cbnByb3RvLnJlbmRlciA9IGZ1bmN0aW9uKGNvbnRleHQpIHtcbiAgcmV0dXJuICcnXG59XG5cbmNvbnMucGFyc2UgPSBmdW5jdGlvbihjb250ZW50cywgcGFyc2VyKSB7XG4gIG5sID0gcGFyc2VyLnBhcnNlKFsnZW5kY29tbWVudCddKVxuICBwYXJzZXIudG9rZW5zLnNoaWZ0KClcblxuICByZXR1cm4gbmV3IGNvbnNcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gRGVidWdOb2RlXG5cbnZhciBQcm9taXNlID0gcmVxdWlyZSgnLi4vcHJvbWlzZScpXG4gICwgQ29udGV4dCA9IHJlcXVpcmUoJy4uL2NvbnRleHQnKVxuICAsIGRlYnVnID0gcmVxdWlyZSgnLi4vZGVidWcnKVxuXG5mdW5jdGlvbiBEZWJ1Z05vZGUodmFybmFtZSkge1xuICB0aGlzLnZhcm5hbWUgPSB2YXJuYW1lXG59XG5cbnZhciBjb25zID0gRGVidWdOb2RlXG4gICwgcHJvdG8gPSBjb25zLnByb3RvdHlwZVxuXG5wcm90by5yZW5kZXIgPSBmdW5jdGlvbihjb250ZXh0LCB2YWx1ZSkge1xuICB2YXIgc2VsZiA9IHRoaXNcbiAgICAsIHRhcmdldCA9IGNvbnRleHRcbiAgICAsIHByb21pc2VcblxuICBpZihzZWxmLnZhcm5hbWUgIT09IG51bGwpIHtcbiAgICB2YWx1ZSA9IGFyZ3VtZW50cy5sZW5ndGggPT09IDIgPyB2YWx1ZSA6IHNlbGYudmFybmFtZS5yZXNvbHZlKGNvbnRleHQpXG4gICAgaWYodmFsdWUgJiYgdmFsdWUuY29uc3RydWN0b3IgPT09IFByb21pc2UpIHtcbiAgICAgIHByb21pc2UgPSBuZXcgUHJvbWlzZVxuICAgICAgdmFsdWUub25jZSgnZG9uZScsIGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgcHJvbWlzZS5yZXNvbHZlKHNlbGYucmVuZGVyKGNvbnRleHQsIGRhdGEpKVxuICAgICAgfSlcbiAgICAgIHJldHVybiBwcm9taXNlXG4gICAgfVxuICAgIHRhcmdldCA9IHZhbHVlXG4gIH1cblxuICBpZih0YXJnZXQgPT09IGNvbnRleHQpIHtcbiAgICB3aGlsZSh0YXJnZXQgIT09IENvbnRleHQucHJvdG90eXBlKSB7XG4gICAgICBkZWJ1Zy5sb2codGFyZ2V0KVxuICAgICAgdGFyZ2V0ID0gT2JqZWN0LmdldFByb3RvdHlwZU9mKHRhcmdldClcbiAgICB9XG4gICAgcmV0dXJuICcnXG4gIH1cbiAgZGVidWcubG9nKHRhcmdldClcbiAgcmV0dXJuICcnXG59XG5cbmNvbnMucGFyc2UgPSBmdW5jdGlvbihjb250ZW50cywgcGFyc2VyKSB7XG4gIHZhciBiaXRzID0gY29udGVudHMuc3BsaXQoJyAnKVxuXG4gIHJldHVybiBuZXcgRGVidWdOb2RlKGJpdHNbMV0gPyBwYXJzZXIuY29tcGlsZShiaXRzWzFdKSA6IG51bGwpXG59XG5cbiIsIm1vZHVsZS5leHBvcnRzID0gRXh0ZW5kc05vZGVcblxudmFyIFByb21pc2UgPSByZXF1aXJlKCcuLi9wcm9taXNlJylcbiAgLCBCbG9ja0NvbnRleHQgPSByZXF1aXJlKCcuLi9ibG9ja19jb250ZXh0JylcblxuXG5mdW5jdGlvbiBFeHRlbmRzTm9kZShwYXJlbnQsIG5vZGVzLCBsb2FkZXIpIHtcbiAgdGhpcy5wYXJlbnQgPSBwYXJlbnRcbiAgdGhpcy5sb2FkZXIgPSBsb2FkZXJcblxuICB0aGlzLmJsb2NrcyA9IHt9XG5cbiAgZm9yKHZhciBpID0gMCwgbGVuID0gbm9kZXMubm9kZXMubGVuZ3RoOyBpIDwgbGVuOyArK2kpIHtcbiAgICBpZighbm9kZXMubm9kZXNbaV0uaXNCbG9ja05vZGUpXG4gICAgICBjb250aW51ZVxuXG4gICAgdGhpcy5ibG9ja3Nbbm9kZXMubm9kZXNbaV0ubmFtZV0gPSBub2Rlcy5ub2Rlc1tpXVxuICB9XG59XG5cbnZhciBjb25zID0gRXh0ZW5kc05vZGVcbiAgLCBwcm90byA9IGNvbnMucHJvdG90eXBlXG5cbnByb3RvLmlzRXh0ZW5kc05vZGUgPSB0cnVlXG5cbnByb3RvLnJlbmRlciA9IGZ1bmN0aW9uKGNvbnRleHQsIHBhcmVudCkge1xuICB2YXIgc2VsZiA9IHRoaXNcbiAgICAsIHByb21pc2VcblxuICBwYXJlbnQgPSBwYXJlbnQgfHwgdGhpcy5wYXJlbnQucmVzb2x2ZShjb250ZXh0KVxuXG4gIGlmKHBhcmVudC5jb25zdHJ1Y3RvciA9PT0gUHJvbWlzZSkge1xuICAgIHByb21pc2UgPSBuZXcgUHJvbWlzZVxuXG4gICAgcGFyZW50Lm9uY2UoJ2RvbmUnLCBmdW5jdGlvbihkYXRhKSB7XG4gICAgICBwcm9taXNlLnJlc29sdmUoc2VsZi5yZW5kZXIoY29udGV4dCwgZGF0YSkpXG4gICAgfSlcblxuICAgIHJldHVybiBwcm9taXNlXG4gIH1cblxuICBwYXJlbnQgPSBzZWxmLmdldF90ZW1wbGF0ZShwYXJlbnQpXG5cbiAgaWYocGFyZW50LmNvbnN0cnVjdG9yID09PSBQcm9taXNlKSB7XG4gICAgcHJvbWlzZSA9IG5ldyBQcm9taXNlXG5cbiAgICBwYXJlbnQub25jZSgnZG9uZScsIGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgIHByb21pc2UucmVzb2x2ZShzZWxmLnJlbmRlcihjb250ZXh0LCBkYXRhKSlcbiAgICB9KSAgXG5cbiAgICByZXR1cm4gcHJvbWlzZVxuICB9XG5cbiAgdmFyIGJsb2NrQ29udGV4dCA9IEJsb2NrQ29udGV4dC5mcm9tKGNvbnRleHQpIHx8IEJsb2NrQ29udGV4dC5pbnRvKGNvbnRleHQpXG4gICAgLCBibG9ja3MgPSB7fVxuICAgICwgbm9kZUxpc3QgPSBwYXJlbnQuZ2V0Tm9kZUxpc3QoKVxuICAgICwgZXh0ZW5kc0lEWCA9IGZhbHNlXG5cbiAgYmxvY2tDb250ZXh0LmFkZChzZWxmLmJsb2NrcylcblxuICBmb3IodmFyIGkgPSAwLCBsZW4gPSBub2RlTGlzdC5ub2Rlcy5sZW5ndGg7IGkgPCBsZW47ICsraSkge1xuICAgIGlmKG5vZGVMaXN0Lm5vZGVzW2ldLmlzRXh0ZW5kc05vZGUpIHtcbiAgICAgIGV4dGVuZHNJRFggPSB0cnVlXG4gICAgICBicmVha1xuICAgIH1cblxuICAgIGlmKG5vZGVMaXN0Lm5vZGVzW2ldLmlzQmxvY2tOb2RlKSB7XG4gICAgICBibG9ja3Nbbm9kZUxpc3Qubm9kZXNbaV0ubmFtZV0gPSBub2RlTGlzdC5ub2Rlc1tpXVxuICAgIH1cbiAgfVxuXG4gIGlmKCFleHRlbmRzSURYKSB7XG4gICAgYmxvY2tDb250ZXh0LmFkZChibG9ja3MpXG4gIH1cblxuICBwcm9taXNlID0gbmV3IFByb21pc2VcblxuICBwYXJlbnQucmVuZGVyKGNvbnRleHQsIGZ1bmN0aW9uKGVyciwgZGF0YSkge1xuICAgIHByb21pc2UucmVzb2x2ZShkYXRhKVxuICB9KVxuXG4gIHJldHVybiBwcm9taXNlXG59XG5cbnByb3RvLmdldF90ZW1wbGF0ZSA9IGZ1bmN0aW9uKHBhcmVudCkge1xuICBpZih0eXBlb2YgcGFyZW50ICE9PSAnc3RyaW5nJykge1xuICAgIHJldHVybiBwYXJlbnRcbiAgfVxuXG4gIHJldHVybiB0aGlzLmxvYWRlcihwYXJlbnQpXG59XG5cbmNvbnMucGFyc2UgPSBmdW5jdGlvbihjb250ZW50cywgcGFyc2VyKSB7XG4gIHZhciBiaXRzID0gY29udGVudHMuc3BsaXQoJyAnKVxuICAgICwgcGFyZW50ID0gcGFyc2VyLmNvbXBpbGUoYml0cy5zbGljZSgxKS5qb2luKCcgJykpXG4gICAgLCBub2RlcyA9IHBhcnNlci5wYXJzZSgpXG4gICAgLCBsb2FkZXIgPSBwYXJzZXIucGx1Z2lucy5sb29rdXAoJ2xvYWRlcicpXG5cbiAgcmV0dXJuIG5ldyBjb25zKHBhcmVudCwgbm9kZXMsIGxvYWRlcilcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gRm9yTm9kZVxuXG52YXIgTm9kZUxpc3QgPSByZXF1aXJlKCcuLi9ub2RlX2xpc3QnKVxuICAsIFByb21pc2UgPSByZXF1aXJlKCcuLi9wcm9taXNlJylcblxuZnVuY3Rpb24gRm9yTm9kZSh0YXJnZXQsIHVucGFjaywgbG9vcCwgZW1wdHksIHJldmVyc2VkKSB7XG4gIHRoaXMudGFyZ2V0ID0gdGFyZ2V0XG4gIHRoaXMudW5wYWNrID0gdW5wYWNrXG4gIHRoaXMubG9vcCA9IGxvb3BcbiAgdGhpcy5lbXB0eSA9IGVtcHR5XG4gIHRoaXMucmV2ZXJzZWQgPSByZXZlcnNlZFxufVxuXG52YXIgY29ucyA9IEZvck5vZGVcbiAgLCBwcm90byA9IGNvbnMucHJvdG90eXBlXG5cbmZ1bmN0aW9uIGdldEluSW5kZXgoYml0cykge1xuICBmb3IodmFyIGkgPSAwLCBsZW4gPSBiaXRzLmxlbmd0aDsgaSA8IGxlbjsgKytpKVxuICAgIGlmKGJpdHNbaV0gPT09ICdpbicpXG4gICAgICByZXR1cm4gaVxuXG4gIHJldHVybiAtMSBcbn1cblxucHJvdG8ucmVuZGVyID0gZnVuY3Rpb24oY29udGV4dCwgdmFsdWUpIHtcbiAgdmFyIHNlbGYgPSB0aGlzXG4gICAgLCBhcnIgPSB2YWx1ZSB8fCBzZWxmLnRhcmdldC5yZXNvbHZlKGNvbnRleHQpXG4gICAgLCBwcm9taXNlXG5cblxuICBpZihhcnIgJiYgYXJyLmNvbnN0cnVjdG9yID09PSBQcm9taXNlKSB7XG4gICAgcHJvbWlzZSA9IG5ldyBQcm9taXNlXG4gICAgYXJyLm9uY2UoJ2RvbmUnLCBmdW5jdGlvbihkYXRhKSB7XG4gICAgICBwcm9taXNlLnJlc29sdmUoc2VsZi5yZW5kZXIoY29udGV4dCwgZGF0YSkpXG4gICAgfSlcblxuICAgIHJldHVybiBwcm9taXNlXG4gIH1cblxuICBpZihhcnIgPT09IHVuZGVmaW5lZCB8fCBhcnIgPT09IG51bGwpIHtcbiAgICBhcnIgPSBbXVxuICB9XG5cbiAgdmFyIGJpdHMgPSBbXVxuICAgICwgcHJvbWlzZXMgPSBbXVxuICAgICwgcGFyZW50ID0gY29udGV4dC5mb3Jsb29wXG4gICAgLCBsb29wID0ge31cbiAgICAsIHJlc3VsdFxuICAgICwgY3R4dFxuICAgICwgc3ViXG5cbiAgaWYoISgnbGVuZ3RoJyBpbiBhcnIpKSB7XG4gICAgZm9yKHZhciBrZXkgaW4gYXJyKSBpZihhcnIuaGFzT3duUHJvcGVydHkoa2V5KSkge1xuICAgICAgYml0cy5wdXNoKGtleSlcbiAgICB9XG5cbiAgICBhcnIgPSBiaXRzLnNsaWNlKClcbiAgICBiaXRzLmxlbmd0aCA9IDBcbiAgfVxuXG4gIGlmKCFhcnIubGVuZ3RoKSB7XG4gICAgcmV0dXJuIHNlbGYuZW1wdHkucmVuZGVyKGNvbnRleHQpXG4gIH1cblxuICBzdWIgPSBzZWxmLnJldmVyc2VkID8gYXJyLmxlbmd0aCAtIDEgOiAwXG5cbiAgZm9yKHZhciBpID0gMCwgbGVuID0gYXJyLmxlbmd0aCwgaWR4OyBpIDwgbGVuOyArK2kpIHtcbiAgICBjdHh0ID0gY29udGV4dC5jb3B5KClcbiAgICBpZHggPSBNYXRoLmFicyhzdWIgLSBpKVxuICAgIGxvb3AuY291bnRlciA9IGkgKyAxXG4gICAgbG9vcC5jb3VudGVyMCA9IGlcbiAgICBsb29wLnJldmNvdW50ZXIgPSBsZW4gLSBpXG4gICAgbG9vcC5yZXZjb3VudGVyMCA9IGxlbiAtIChpICsgMSlcbiAgICBsb29wLmZpcnN0ID0gaSA9PT0gMFxuICAgIGxvb3AubGFzdCA9IGkgPT09IGxlbiAtIDFcbiAgICBsb29wLnBhcmVudGxvb3AgPSBwYXJlbnQgXG4gICAgY3R4dC5mb3Jsb29wID0gbG9vcFxuXG4gICAgaWYoc2VsZi51bnBhY2subGVuZ3RoID09PSAxKVxuICAgICAgY3R4dFtzZWxmLnVucGFja1swXV0gPSBhcnJbaWR4XVxuICAgIGVsc2UgZm9yKHZhciB1ID0gMDsgdSA8IHNlbGYudW5wYWNrLmxlbmd0aDsgKyt1KVxuICAgICAgY3R4dFtzZWxmLnVucGFja1t1XV0gPSBhcnJbaWR4XVt1XVxuXG4gICAgcmVzdWx0ID0gc2VsZi5sb29wLnJlbmRlcihjdHh0KVxuICAgIGlmKHJlc3VsdC5jb25zdHJ1Y3RvciA9PT0gUHJvbWlzZSlcbiAgICAgIHByb21pc2VzLnB1c2gocmVzdWx0KVxuICAgICBcbiAgICBiaXRzLnB1c2gocmVzdWx0KSBcbiAgfVxuXG4gIGlmKHByb21pc2VzLmxlbmd0aCkge1xuICAgIHJldHVybiBzZWxmLmxvb3AucmVzb2x2ZVByb21pc2VzKGJpdHMsIHByb21pc2VzKVxuICB9XG5cbiAgcmV0dXJuIGJpdHMuam9pbignJylcbn1cblxuY29ucy5wYXJzZSA9IGZ1bmN0aW9uKGNvbnRlbnRzLCBwYXJzZXIpIHtcbiAgdmFyIGJpdHMgPSBjb250ZW50cy5zcGxpdCgvXFxzKy8pXG4gICAgLCByZXZlcnNlZCA9IGJpdHNbYml0cy5sZW5ndGgtMV0gPT09ICdyZXZlcnNlZCdcbiAgICAsIGlkeEluID0gZ2V0SW5JbmRleChiaXRzKVxuICAgICwgdmFyaWFibGVzID0gYml0cy5zbGljZSgxLCBpZHhJbilcbiAgICAsIHRhcmdldCA9IHBhcnNlci5jb21waWxlKGJpdHNbaWR4SW4rMV0pXG4gICAgLCBub2RlbGlzdCA9IHBhcnNlci5wYXJzZShbJ2VtcHR5JywgJ2VuZGZvciddKVxuICAgICwgdW5wYWNrID0gW11cbiAgICAsIGVtcHR5XG5cblxuICBpZihwYXJzZXIudG9rZW5zLnNoaWZ0KCkuaXMoWydlbXB0eSddKSkge1xuICAgIGVtcHR5ID0gcGFyc2VyLnBhcnNlKFsnZW5kZm9yJ10pXG4gICAgcGFyc2VyLnRva2Vucy5zaGlmdCgpXG4gIH0gZWxzZSB7XG4gICAgZW1wdHkgPSBuZXcgTm9kZUxpc3QoW10pXG4gIH1cblxuICB2YXJpYWJsZXMgPSB2YXJpYWJsZXMuam9pbignICcpLnNwbGl0KCcsJylcbiAgZm9yKHZhciBpID0gMCwgbGVuID0gdmFyaWFibGVzLmxlbmd0aDsgaSA8IGxlbjsgKytpKSB7XG4gICAgdmFyaWFibGVzW2ldID0gdmFyaWFibGVzW2ldLnJlcGxhY2UoLyheXFxzK3xcXHMrJCkvLCAnJylcbiAgICBpZih2YXJpYWJsZXNbaV0pXG4gICAgICB1bnBhY2sucHVzaCh2YXJpYWJsZXNbaV0pXG4gIH1cblxuICByZXR1cm4gbmV3IGNvbnModGFyZ2V0LCB1bnBhY2ssIG5vZGVsaXN0LCBlbXB0eSwgcmV2ZXJzZWQpO1xufVxuIiwibW9kdWxlLmV4cG9ydHMgPSBFbmRUb2tlblxuXG5mdW5jdGlvbiBFbmRUb2tlbigpIHtcbiAgdGhpcy5sYnAgPSAwXG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IEluZml4T3BlcmF0b3JcblxudmFyIFByb21pc2UgPSByZXF1aXJlKCcuLi8uLi9wcm9taXNlJylcblxuZnVuY3Rpb24gSW5maXhPcGVyYXRvcihicCwgY21wKSB7XG4gIHRoaXMubGJwID0gYnBcbiAgdGhpcy5jbXAgPSBjbXBcblxuICB0aGlzLmZpcnN0ID0gXG4gIHRoaXMuc2Vjb25kID0gbnVsbFxufSBcblxudmFyIGNvbnMgPSBJbmZpeE9wZXJhdG9yXG4gICwgcHJvdG8gPSBjb25zLnByb3RvdHlwZVxuXG5wcm90by5udWQgPSBmdW5jdGlvbihwYXJzZXIpIHtcbiAgdGhyb3cgbmV3IEVycm9yKFwiVW5leHBlY3RlZCB0b2tlblwiKVxufVxuXG5wcm90by5sZWQgPSBmdW5jdGlvbihsaHMsIHBhcnNlcikge1xuICB0aGlzLmZpcnN0ID0gbGhzXG4gIHRoaXMuc2Vjb25kID0gcGFyc2VyLmV4cHJlc3Npb24odGhpcy5sYnApXG4gIHJldHVybiB0aGlzXG59XG5cbnByb3RvLmV2YWx1YXRlID0gZnVuY3Rpb24oY29udGV4dCwgZmlyc3QsIHNlY29uZCwgc2VudEZpcnN0LCBzZW50U2Vjb25kKSB7XG4gIHZhciBzZWxmID0gdGhpc1xuICAgICwgcHJvbWlzZVxuXG4gIGZpcnN0ID0gc2VudEZpcnN0ID8gZmlyc3QgOiBzZWxmLmZpcnN0LmV2YWx1YXRlKGNvbnRleHQpXG5cbiAgaWYoZmlyc3QgJiYgZmlyc3QuY29uc3RydWN0b3IgPT09IFByb21pc2UpIHtcbiAgICBwcm9taXNlID0gbmV3IFByb21pc2VcblxuICAgIGZpcnN0Lm9uY2UoJ2RvbmUnLCBmdW5jdGlvbihkYXRhKSB7XG4gICAgICBwcm9taXNlLnJlc29sdmUoc2VsZi5ldmFsdWF0ZShjb250ZXh0LCBkYXRhLCBudWxsLCB0cnVlLCBmYWxzZSkpXG4gICAgfSlcblxuICAgIHJldHVybiBwcm9taXNlXG4gIH1cblxuICBzZWNvbmQgPSBzZW50U2Vjb25kID8gc2Vjb25kIDogc2VsZi5zZWNvbmQuZXZhbHVhdGUoY29udGV4dClcblxuICBpZihzZWNvbmQgJiYgc2Vjb25kLmNvbnN0cnVjdG9yID09PSBQcm9taXNlKSB7XG4gICAgcHJvbWlzZSA9IG5ldyBQcm9taXNlXG5cbiAgICBzZWNvbmQub25jZSgnZG9uZScsIGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgIHByb21pc2UucmVzb2x2ZShzZWxmLmV2YWx1YXRlKGNvbnRleHQsIGZpcnN0LCBkYXRhLCB0cnVlLCB0cnVlKSlcbiAgICB9KVxuXG4gICAgcmV0dXJuIHByb21pc2VcbiAgfVxuXG4gIHJldHVybiBzZWxmLmNtcChmaXJzdCwgc2Vjb25kKVxufVxuXG4iLCJtb2R1bGUuZXhwb3J0cyA9IExpdGVyYWxUb2tlblxuXG5mdW5jdGlvbiBMaXRlcmFsVG9rZW4odmFsdWUsIG9yaWdpbmFsKSB7XG4gIHRoaXMubGJwID0gMFxuICB0aGlzLnZhbHVlID0gdmFsdWVcbn1cblxudmFyIGNvbnMgPSBMaXRlcmFsVG9rZW5cbiAgLCBwcm90byA9IGNvbnMucHJvdG90eXBlXG5cbnByb3RvLm51ZCA9IGZ1bmN0aW9uKHBhcnNlcikge1xuICByZXR1cm4gdGhpc1xufVxuXG5wcm90by5sZWQgPSBmdW5jdGlvbigpIHtcbiAgdGhyb3cgbmV3IEVycm9yKClcbn1cblxucHJvdG8uZXZhbHVhdGUgPSBmdW5jdGlvbihjb250ZXh0KSB7XG4gIGlmKCF0aGlzLnZhbHVlKVxuICAgIHJldHVybiB0aGlzLnZhbHVlXG5cbiAgaWYoIXRoaXMudmFsdWUucmVzb2x2ZSlcbiAgICByZXR1cm4gdGhpcy52YWx1ZVxuXG4gIHJldHVybiB0aGlzLnZhbHVlLnJlc29sdmUoY29udGV4dClcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gSWZOb2RlXG5cbnZhciBQcm9taXNlID0gcmVxdWlyZSgnLi4vLi4vcHJvbWlzZScpXG4gICwgTm9kZUxpc3QgPSByZXF1aXJlKCcuLi8uLi9ub2RlX2xpc3QnKVxuICAsIFBhcnNlciA9IHJlcXVpcmUoJy4vcGFyc2VyJylcblxuZnVuY3Rpb24gSWZOb2RlKHByZWRpY2F0ZSwgd2hlbl90cnVlLCB3aGVuX2ZhbHNlKSB7XG4gIHRoaXMucHJlZGljYXRlID0gcHJlZGljYXRlXG4gIHRoaXMud2hlbl90cnVlID0gd2hlbl90cnVlXG4gIHRoaXMud2hlbl9mYWxzZSA9IHdoZW5fZmFsc2Vcbn1cblxudmFyIGNvbnMgPSBJZk5vZGVcbiAgLCBwcm90byA9IGNvbnMucHJvdG90eXBlXG5cbnByb3RvLnJlbmRlciA9IGZ1bmN0aW9uKGNvbnRleHQsIHJlc3VsdCwgdGltZXMpIHtcbiAgdmFyIHNlbGYgPSB0aGlzXG4gICAgLCBwcm9taXNlXG5cbiAgcmVzdWx0ID0gdGltZXMgPT09IDEgPyByZXN1bHQgOiB0aGlzLnByZWRpY2F0ZS5ldmFsdWF0ZShjb250ZXh0KVxuXG4gIGlmKHJlc3VsdCAmJiByZXN1bHQuY29uc3RydWN0b3IgPT09IFByb21pc2UpIHtcbiAgICBwcm9taXNlID0gbmV3IFByb21pc2VcblxuICAgIHJlc3VsdC5vbmNlKCdkb25lJywgZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgIHByb21pc2UucmVzb2x2ZShzZWxmLnJlbmRlcihjb250ZXh0LCB2YWx1ZSwgMSkpXG4gICAgfSlcblxuICAgIHJldHVybiBwcm9taXNlXG4gIH1cblxuICBpZihyZXN1bHQpIHtcbiAgICByZXR1cm4gdGhpcy53aGVuX3RydWUucmVuZGVyKGNvbnRleHQpXG4gIH1cbiAgcmV0dXJuIHRoaXMud2hlbl9mYWxzZS5yZW5kZXIoY29udGV4dClcbn1cblxuY29ucy5wYXJzZSA9IGZ1bmN0aW9uKGNvbnRlbnRzLCBwYXJzZXIpIHtcbiAgdmFyIGJpdHMgPSBjb250ZW50cy5zcGxpdCgnICcpLnNsaWNlKDEpXG4gICAgLCBpZnAgPSBuZXcgUGFyc2VyKGJpdHMsIHBhcnNlcilcbiAgICAsIHByZWRpY2F0ZVxuICAgICwgd2hlbl90cnVlXG4gICAgLCB3aGVuX2ZhbHNlXG4gICAgLCBuZXh0XG5cbiAgcHJlZGljYXRlID0gaWZwLnBhcnNlKClcblxuICB3aGVuX3RydWUgPSBwYXJzZXIucGFyc2UoWydlbHNlJywgJ2VuZGlmJ10pXG5cbiAgbmV4dCA9IHBhcnNlci50b2tlbnMuc2hpZnQoKVxuXG4gIGlmKCFuZXh0LmlzKFsnZWxzZSddKSkge1xuICAgIHdoZW5fZmFsc2UgPSBuZXcgTm9kZUxpc3QoW10pXG4gIH0gZWxzZSB7XG4gICAgd2hlbl9mYWxzZSA9IHBhcnNlci5wYXJzZShbJ2VuZGlmJ10pXG4gICAgcGFyc2VyLnRva2Vucy5zaGlmdCgpXG4gIH1cblxuICByZXR1cm4gbmV3IGNvbnMocHJlZGljYXRlLCB3aGVuX3RydWUsIHdoZW5fZmFsc2UpXG59XG4iLCJ2YXIgSW5maXhPcGVyYXRvciA9IHJlcXVpcmUoJy4vaW5maXgnKVxuICAsIFByZWZpeE9wZXJhdG9yID0gcmVxdWlyZSgnLi9wcmVmaXgnKVxuXG52YXIga2V5c1xuXG5rZXlzID0gT2JqZWN0LmtleXMgfHwga2V5c2hpbVxuXG5mdW5jdGlvbiBrZXlzaGltKG9iaikge1xuICB2YXIgYWNjdW0gPSBbXVxuXG4gIGZvcih2YXIgbiBpbiBvYmopIGlmKG9iai5oYXNPd25Qcm9wZXJ0eShuKSkge1xuICAgIGFjY3VtLnB1c2gobilcbiAgfVxuXG4gIHJldHVybiBhY2N1bVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICAnb3InOiBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBuZXcgSW5maXhPcGVyYXRvcig2LCBmdW5jdGlvbih4LCB5KSB7XG4gICAgICAgICAgcmV0dXJuIHggfHwgeVxuICAgICAgfSlcbiAgICB9XG5cbiAgLCAnYW5kJzogZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gbmV3IEluZml4T3BlcmF0b3IoNywgZnVuY3Rpb24oeCwgeSkge1xuICAgICAgICAgIHJldHVybiB4ICYmIHlcbiAgICAgIH0pXG4gICAgfVxuXG4gICwgJ25vdCc6IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIG5ldyBQcmVmaXhPcGVyYXRvcig4LCBmdW5jdGlvbih4KSB7XG4gICAgICAgIHJldHVybiAheFxuICAgICAgfSlcbiAgICB9XG5cbiAgLCAnaW4nOiBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBuZXcgSW5maXhPcGVyYXRvcig5LCBpbl9vcGVyYXRvcilcbiAgICB9XG5cbiAgLCAnbm90IGluJzogZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIG5ldyBJbmZpeE9wZXJhdG9yKDksIGZ1bmN0aW9uKHgsIHkpIHtcbiAgICAgIHJldHVybiAhaW5fb3BlcmF0b3IoeCx5KVxuICAgIH0pXG4gIH1cblxuICAsICc9JzogZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIG5ldyBJbmZpeE9wZXJhdG9yKDEwLCBmdW5jdGlvbih4LCB5KSB7IFxuICAgICAgcmV0dXJuIHggPT0geVxuICAgIH0pXG4gIH1cblxuICAsICc9PSc6IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIG5ldyBJbmZpeE9wZXJhdG9yKDEwLCBmdW5jdGlvbih4LCB5KSB7IFxuICAgICAgICByZXR1cm4geCA9PSB5XG4gICAgICB9KVxuICAgIH1cblxuICAsICchPSc6IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIG5ldyBJbmZpeE9wZXJhdG9yKDEwLCBmdW5jdGlvbih4LCB5KSB7IFxuICAgICAgICByZXR1cm4geCAhPT0geVxuICAgICAgfSlcbiAgICB9XG5cbiAgLCAnPic6IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIG5ldyBJbmZpeE9wZXJhdG9yKDEwLCBmdW5jdGlvbih4LCB5KSB7IFxuICAgICAgICByZXR1cm4geCA+IHlcbiAgICAgIH0pXG4gICAgfVxuXG4gICwgJz49JzogZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gbmV3IEluZml4T3BlcmF0b3IoMTAsIGZ1bmN0aW9uKHgsIHkpIHsgXG4gICAgICAgIHJldHVybiB4ID49IHlcbiAgICAgIH0pXG4gICAgfVxuXG4gICwgJzwnOiBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBuZXcgSW5maXhPcGVyYXRvcigxMCwgZnVuY3Rpb24oeCwgeSkgeyBcbiAgICAgICAgcmV0dXJuIHggPCB5XG4gICAgICB9KVxuICAgIH1cblxuICAsICc8PSc6IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIG5ldyBJbmZpeE9wZXJhdG9yKDEwLCBmdW5jdGlvbih4LCB5KSB7IFxuICAgICAgICByZXR1cm4geCA8PSB5XG4gICAgICB9KVxuICAgIH1cbn1cblxuZnVuY3Rpb24gaW5fb3BlcmF0b3IoeCwgeSkge1xuICBpZighKHggaW5zdGFuY2VvZiBPYmplY3QpICYmIHkgaW5zdGFuY2VvZiBPYmplY3QpIHtcbiAgICBpZighKHkgJiYgJ2xlbmd0aCcgaW4geSkpIHtcbiAgICAgIHkgPSBrZXlzKHkpXG4gICAgfVxuICB9XG5cbiAgaWYodHlwZW9mKHgpID09ICdzdHJpbmcnICYmIHR5cGVvZih5KSA9PSdzdHJpbmcnKSB7XG4gICAgcmV0dXJuIHkuaW5kZXhPZih4KSAhPT0gLTFcbiAgfVxuXG4gIGlmKHggPT09IHVuZGVmaW5lZCB8fCB4ID09PSBudWxsKVxuICAgIHJldHVybiBmYWxzZVxuXG4gIGlmKHkgPT09IHVuZGVmaW5lZCB8fCB5ID09PSBudWxsKVxuICAgIHJldHVybiBmYWxzZVxuXG4gIGZvcih2YXIgZm91bmQgPSBmYWxzZSwgaSA9IDAsIGxlbiA9IHkubGVuZ3RoOyBpIDwgbGVuICYmICFmb3VuZDsgKytpKSB7XG4gICAgdmFyIHJocyA9IHlbaV1cbiAgICBpZih4IGluc3RhbmNlb2YgQXJyYXkpIHtcbiAgICAgIGZvcih2YXIgaWR4ID0gMCxcbiAgICAgICAgZXF1YWwgPSB4Lmxlbmd0aCA9PSByaHMubGVuZ3RoLFxuICAgICAgICB4bGVuID0geC5sZW5ndGg7XG4gICAgICAgIGlkeCA8IHhsZW4gJiYgZXF1YWw7ICsraWR4KSB7XG5cbiAgICAgICAgZXF1YWwgPSAoeFtpZHhdID09PSByaHNbaWR4XSlcbiAgICAgIH1cbiAgICAgIGZvdW5kID0gZXF1YWxcblxuICAgIH0gZWxzZSBpZih4IGluc3RhbmNlb2YgT2JqZWN0KSB7XG4gICAgICBpZih4ID09PSByaHMpIHtcbiAgICAgICAgcmV0dXJuIHRydWVcbiAgICAgIH1cbiAgICAgIHZhciB4a2V5cyA9IGtleXMoeCksXG4gICAgICAgIHJrZXlzID0ga2V5cyhyaHMpXG5cbiAgICAgIGlmKHhrZXlzLmxlbmd0aCA9PT0gcmtleXMubGVuZ3RoKSB7IFxuICAgICAgICBmb3IodmFyIGkgPSAwLCBsZW4gPSB4a2V5cy5sZW5ndGgsIGVxdWFsID0gdHJ1ZTtcbiAgICAgICAgICBpIDwgbGVuICYmIGVxdWFsO1xuICAgICAgICAgICsraSkge1xuICAgICAgICAgIGVxdWFsID0geGtleXNbaV0gPT09IHJrZXlzW2ldICYmXG4gICAgICAgICAgICAgIHhbeGtleXNbaV1dID09PSByaHNbcmtleXNbaV1dXG4gICAgICAgIH1cbiAgICAgICAgZm91bmQgPSBlcXVhbFxuICAgICAgfSBcbiAgICB9IGVsc2Uge1xuICAgICAgZm91bmQgPSB4ID09IHJoc1xuICAgIH1cbiAgfVxuICByZXR1cm4gZm91bmRcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gSWZQYXJzZXJcblxudmFyIExpdGVyYWxUb2tlbiA9IHJlcXVpcmUoJy4vbGl0ZXJhbCcpXG4gICwgRW5kVG9rZW4gPSByZXF1aXJlKCcuL2VuZCcpXG4gICwgb3BlcmF0b3JzID0gcmVxdWlyZSgnLi9vcGVyYXRvcnMnKVxuXG5mdW5jdGlvbiBJZlBhcnNlcih0b2tlbnMsIHBhcnNlcikge1xuICB0aGlzLmNyZWF0ZVZhcmlhYmxlID0gZnVuY3Rpb24odG9rZW4pIHtcbiAgICByZXR1cm4gbmV3IExpdGVyYWxUb2tlbihwYXJzZXIuY29tcGlsZSh0b2tlbiksIHRva2VuKVxuICB9XG5cbiAgdmFyIGxlbiA9IHRva2Vucy5sZW5ndGhcbiAgICAsIGkgPSAwXG4gICAgLCBtYXBwZWRUb2tlbnMgPSBbXVxuICAgICwgdG9rZW5cblxuICB3aGlsZShpIDwgbGVuKSB7XG4gICAgdG9rZW4gPSB0b2tlbnNbaV1cbiAgICBpZih0b2tlbiA9PSAnbm90JyAmJiB0b2tlbnNbaSsxXSA9PSAnaW4nKSB7XG4gICAgICArK2lcbiAgICAgIHRva2VuID0gJ25vdCBpbidcbiAgICB9XG4gICAgbWFwcGVkVG9rZW5zLnB1c2godGhpcy50cmFuc2xhdGVUb2tlbih0b2tlbikpXG4gICAgKytpXG4gIH1cblxuICB0aGlzLnBvcyA9IDBcbiAgdGhpcy50b2tlbnMgPSBtYXBwZWRUb2tlbnNcbiAgdGhpcy5jdXJyZW50VG9rZW4gPSB0aGlzLm5leHQoKVxufVxuXG52YXIgY29ucyA9IElmUGFyc2VyXG4gICwgcHJvdG8gPSBjb25zLnByb3RvdHlwZVxuXG5wcm90by50cmFuc2xhdGVUb2tlbiA9IGZ1bmN0aW9uKHRva2VuKSB7XG4gIHZhciBvcCA9IG9wZXJhdG9yc1t0b2tlbl1cblxuICBpZihvcCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgcmV0dXJuIHRoaXMuY3JlYXRlVmFyaWFibGUodG9rZW4pXG4gIH1cblxuICByZXR1cm4gb3AoKVxufVxuXG5wcm90by5uZXh0ID0gZnVuY3Rpb24oKSB7XG4gIGlmKHRoaXMucG9zID49IHRoaXMudG9rZW5zLmxlbmd0aCkge1xuICAgIHJldHVybiBuZXcgRW5kVG9rZW4oKVxuICB9XG4gIHJldHVybiB0aGlzLnRva2Vuc1t0aGlzLnBvcysrXVxufVxuXG5wcm90by5wYXJzZSA9IGZ1bmN0aW9uKCkge1xuICB2YXIgcmV0dmFsID0gdGhpcy5leHByZXNzaW9uKClcblxuICBpZighKHRoaXMuY3VycmVudFRva2VuLmNvbnN0cnVjdG9yID09PSBFbmRUb2tlbikpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJVbnVzZWQgXCIrdGhpcy5jdXJyZW50VG9rZW4rXCIgYXQgZW5kIG9mIGlmIGV4cHJlc3Npb24uXCIpXG4gIH1cblxuICByZXR1cm4gcmV0dmFsXG59XG5cbnByb3RvLmV4cHJlc3Npb24gPSBmdW5jdGlvbihyYnApIHtcbiAgcmJwID0gcmJwIHx8IDBcblxuICB2YXIgdCA9IHRoaXMuY3VycmVudFRva2VuXG4gICAgLCBsZWZ0XG5cbiAgdGhpcy5jdXJyZW50VG9rZW4gPSB0aGlzLm5leHQoKVxuXG4gIGxlZnQgPSB0Lm51ZCh0aGlzKVxuICB3aGlsZShyYnAgPCB0aGlzLmN1cnJlbnRUb2tlbi5sYnApIHtcbiAgICB0ID0gdGhpcy5jdXJyZW50VG9rZW5cblxuICAgIHRoaXMuY3VycmVudFRva2VuID0gdGhpcy5uZXh0KClcblxuICAgIGxlZnQgPSB0LmxlZChsZWZ0LCB0aGlzKVxuICB9XG5cbiAgcmV0dXJuIGxlZnRcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gUHJlZml4T3BlcmF0b3JcblxudmFyIFByb21pc2UgPSByZXF1aXJlKCcuLi8uLi9wcm9taXNlJylcblxuZnVuY3Rpb24gUHJlZml4T3BlcmF0b3IoYnAsIGNtcCkge1xuICB0aGlzLmxicCA9IGJwXG4gIHRoaXMuY21wID0gY21wXG5cbiAgdGhpcy5maXJzdCA9IFxuICB0aGlzLnNlY29uZCA9IG51bGxcbn1cblxudmFyIGNvbnMgPSBQcmVmaXhPcGVyYXRvclxuICAsIHByb3RvID0gY29ucy5wcm90b3R5cGVcblxucHJvdG8ubnVkID0gZnVuY3Rpb24ocGFyc2VyKSB7XG4gIHRoaXMuZmlyc3QgPSBwYXJzZXIuZXhwcmVzc2lvbih0aGlzLmxicClcbiAgdGhpcy5zZWNvbmQgPSBudWxsXG4gIHJldHVybiB0aGlzXG59XG5cbnByb3RvLmxlZCA9IGZ1bmN0aW9uKGZpcnN0LCBwYXJzZXIpIHtcbiAgdGhyb3cgbmV3IEVycm9yKFwiVW5leHBlY3RlZCB0b2tlblwiKVxufVxuXG5wcm90by5ldmFsdWF0ZSA9IGZ1bmN0aW9uKGNvbnRleHQsIGZpcnN0LCB0aW1lcykge1xuICB2YXIgc2VsZiA9IHRoaXNcbiAgICAsIHByb21pc2VcblxuICBmaXJzdCA9IHRpbWVzID09PSAxID8gZmlyc3QgOiBzZWxmLmZpcnN0LmV2YWx1YXRlKGNvbnRleHQpXG5cbiAgaWYoZmlyc3QgJiYgZmlyc3QuY29uc3RydWN0b3IgPT09IFByb21pc2UpIHtcbiAgICBwcm9taXNlID0gbmV3IFByb21pc2VcblxuICAgIGZpcnN0Lm9uY2UoJ2RvbmUnLCBmdW5jdGlvbihkYXRhKSB7XG4gICAgICBwcm9taXNlLnJlc29sdmUoc2VsZi5ldmFsdWF0ZShjb250ZXh0LCBkYXRhLCAxKSlcbiAgICB9KVxuXG4gICAgcmV0dXJuIHByb21pc2VcbiAgfVxuXG4gIHJldHVybiBzZWxmLmNtcChmaXJzdClcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gSW5jbHVkZU5vZGVcblxudmFyIFByb21pc2UgPSByZXF1aXJlKCcuLi9wcm9taXNlJylcblxuZnVuY3Rpb24gSW5jbHVkZU5vZGUodGFyZ2V0X3ZhciwgbG9hZGVyKSB7XG4gIHRoaXMudGFyZ2V0X3ZhciA9IHRhcmdldF92YXJcbiAgdGhpcy5sb2FkZXIgPSBsb2FkZXJcbn1cblxudmFyIGNvbnMgPSBJbmNsdWRlTm9kZVxuICAsIHByb3RvID0gY29ucy5wcm90b3R5cGVcblxuY29ucy5wYXJzZSA9IGZ1bmN0aW9uKGNvbnRlbnRzLCBwYXJzZXIpIHtcbiAgdmFyIGJpdHMgPSBjb250ZW50cy5zcGxpdCgnICcpXG4gICAgLCB2YXJuYW1lID0gcGFyc2VyLmNvbXBpbGUoYml0cy5zbGljZSgxKS5qb2luKCcgJykpXG4gICAgLCBsb2FkZXIgPSBwYXJzZXIucGx1Z2lucy5sb29rdXAoJ2xvYWRlcicpXG5cbiAgcmV0dXJuIG5ldyBjb25zKHZhcm5hbWUsIGxvYWRlcikgXG59XG5cbnByb3RvLnJlbmRlciA9IGZ1bmN0aW9uKGNvbnRleHQsIHRhcmdldCkge1xuICB2YXIgc2VsZiA9IHRoaXNcbiAgICAsIHByb21pc2VcblxuICB0YXJnZXQgPSB0YXJnZXQgfHwgdGhpcy50YXJnZXRfdmFyLnJlc29sdmUoY29udGV4dClcblxuICBpZih0YXJnZXQgJiYgdGFyZ2V0LmNvbnN0cnVjdG9yID09PSBQcm9taXNlKSB7XG4gICAgcHJvbWlzZSA9IG5ldyBQcm9taXNlXG5cbiAgICB0YXJnZXQub25jZSgnZG9uZScsIGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgIHByb21pc2UucmVzb2x2ZShzZWxmLnJlbmRlcihjb250ZXh0LCBkYXRhKSlcbiAgICB9KVxuXG4gICAgcmV0dXJuIHByb21pc2VcbiAgfVxuXG4gIHRhcmdldCA9IHNlbGYuZ2V0X3RlbXBsYXRlKHRhcmdldClcblxuICBpZih0YXJnZXQgJiYgdGFyZ2V0LmNvbnN0cnVjdG9yID09PSBQcm9taXNlKSB7XG4gICAgcHJvbWlzZSA9IG5ldyBQcm9taXNlXG5cbiAgICB0YXJnZXQub25jZSgnZG9uZScsIGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgIHByb21pc2UucmVzb2x2ZShzZWxmLnJlbmRlcihjb250ZXh0LCBkYXRhKSlcbiAgICB9KSAgXG5cbiAgICByZXR1cm4gcHJvbWlzZVxuICB9XG5cbiAgcHJvbWlzZSA9IG5ldyBQcm9taXNlXG5cbiAgdGFyZ2V0LnJlbmRlcihjb250ZXh0LmNvcHkoKSwgZnVuY3Rpb24oZXJyLCBkYXRhKSB7XG4gICAgcHJvbWlzZS5yZXNvbHZlKGRhdGEpXG4gIH0pXG5cbiAgcmV0dXJuIHByb21pc2Vcbn1cblxucHJvdG8uZ2V0X3RlbXBsYXRlID0gZnVuY3Rpb24odGFyZ2V0KSB7XG4gIGlmKHR5cGVvZiB0YXJnZXQgPT09ICdzdHJpbmcnKSB7XG4gICAgcmV0dXJuIHRoaXMubG9hZGVyKHRhcmdldClcbiAgfVxuXG4gIC8vIG9rYXksIGl0J3MgcHJvYmFibHkgYSB0ZW1wbGF0ZSBvYmplY3RcbiAgcmV0dXJuIHRhcmdldFxufVxuIiwibW9kdWxlLmV4cG9ydHMgPSBOb3dOb2RlXG5cbnZhciBmb3JtYXQgPSByZXF1aXJlKCcuLi9kYXRlJykuZGF0ZVxuXG5mdW5jdGlvbiBOb3dOb2RlKGZvcm1hdFN0cmluZykge1xuICB0aGlzLmZvcm1hdCA9IGZvcm1hdFN0cmluZ1xufVxuXG52YXIgY29ucyA9IE5vd05vZGVcbiAgLCBwcm90byA9IGNvbnMucHJvdG90eXBlXG5cbnByb3RvLnJlbmRlciA9IGZ1bmN0aW9uKGNvbnRleHQpIHtcbiAgcmV0dXJuIGZvcm1hdChuZXcgRGF0ZSwgdGhpcy5mb3JtYXQpXG59XG5cbmNvbnMucGFyc2UgPSBmdW5jdGlvbihjb250ZW50cywgcGFyc2VyKSB7XG4gIHZhciBiaXRzID0gY29udGVudHMuc3BsaXQoJyAnKVxuICAgICwgZm10ID0gYml0cy5zbGljZSgxKS5qb2luKCcgJylcblxuICBmbXQgPSBmbXRcbiAgICAucmVwbGFjZSgvXlxccysvLCAnJylcbiAgICAucmVwbGFjZSgvXFxzKyQvLCAnJylcblxuICBpZigvWydcIl0vLnRlc3QoZm10LmNoYXJBdCgwKSkpIHtcbiAgICBmbXQgPSBmbXQuc2xpY2UoMSwgLTEpXG4gIH1cblxuICByZXR1cm4gbmV3IE5vd05vZGUoZm10IHx8ICdOIGosIFknKVxufVxuIiwibW9kdWxlLmV4cG9ydHMgPSBXaXRoTm9kZVxuXG52YXIgUHJvbWlzZSA9IHJlcXVpcmUoJy4uL3Byb21pc2UnKVxuXG5mdW5jdGlvbiBXaXRoTm9kZSh3aXRoX3ZhciwgYXNfdmFyLCBub2Rlcykge1xuICB0aGlzLndpdGhfdmFyID0gd2l0aF92YXJcbiAgdGhpcy5hc192YXIgPSBhc192YXJcbiAgdGhpcy5ub2RlcyA9IG5vZGVzXG59XG5cbnZhciBjb25zID0gV2l0aE5vZGVcbiAgLCBwcm90byA9IGNvbnMucHJvdG90eXBlXG5cbmNvbnMucGFyc2UgPSBmdW5jdGlvbihjb250ZW50cywgcGFyc2VyKSB7XG4gIHZhciBiaXRzID0gY29udGVudHMuc3BsaXQoL1xccysvZylcbiAgICAsIHdpdGh2YXIgPSBwYXJzZXIuY29tcGlsZShiaXRzWzFdKVxuICAgICwgYXN2YXIgPSBiaXRzWzNdXG4gICAgLCBub2RlbGlzdCA9IHBhcnNlci5wYXJzZShbJ2VuZHdpdGgnXSlcblxuICBwYXJzZXIudG9rZW5zLnNoaWZ0KClcbiAgcmV0dXJuIG5ldyBjb25zKHdpdGh2YXIsIGFzdmFyLCBub2RlbGlzdClcbn1cblxucHJvdG8ucmVuZGVyID0gZnVuY3Rpb24oY29udGV4dCwgdmFsdWUpIHtcbiAgdmFyIHNlbGYgPSB0aGlzIFxuICAgICwgcmVzdWx0XG4gICAgLCBwcm9taXNlXG5cbiAgdmFsdWUgPSB2YWx1ZSB8fCBzZWxmLndpdGhfdmFyLnJlc29sdmUoY29udGV4dClcblxuICBpZih2YWx1ZS5jb25zdHJ1Y3RvciA9PT0gUHJvbWlzZSkge1xuICAgIHByb21pc2UgPSBuZXcgUHJvbWlzZVxuXG4gICAgdmFsdWUub25jZSgnZG9uZScsIGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgIHByb21pc2UucmVzb2x2ZShzZWxmLnJlbmRlcihjb250ZXh0LCBkYXRhKSlcbiAgICB9KVxuXG4gICAgcmV0dXJuIHByb21pc2VcbiAgfVxuXG4gIGNvbnRleHQgPSBjb250ZXh0LmNvcHkoKVxuICBjb250ZXh0W3NlbGYuYXNfdmFyXSA9IHZhbHVlXG5cbiAgcmVzdWx0ID0gc2VsZi5ub2Rlcy5yZW5kZXIoY29udGV4dClcblxuICByZXR1cm4gcmVzdWx0XG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IFRleHROb2RlXG5cbmZ1bmN0aW9uIFRleHROb2RlKGNvbnRlbnQpIHtcbiAgdGhpcy5jb250ZW50ID0gY29udGVudFxufVxuXG52YXIgY29ucyA9IFRleHROb2RlXG4gICwgcHJvdG8gPSBjb25zLnByb3RvdHlwZVxuXG5wcm90by5yZW5kZXIgPSBmdW5jdGlvbihjb250ZXh0KSB7XG4gIHJldHVybiB0aGlzLmNvbnRlbnRcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gVGV4dFRva2VuXG5cbnZhciBUb2tlbiA9IHJlcXVpcmUoJy4vdG9rZW4nKVxuICAsIFRleHROb2RlID0gcmVxdWlyZSgnLi90ZXh0X25vZGUnKVxuXG5mdW5jdGlvbiBUZXh0VG9rZW4oY29udGVudCwgbGluZSkge1xuICBUb2tlbi5jYWxsKHRoaXMsIGNvbnRlbnQsIGxpbmUpXG59XG5cbnZhciBjb25zID0gVGV4dFRva2VuXG4gICwgcHJvdG8gPSBjb25zLnByb3RvdHlwZSA9IG5ldyBUb2tlblxuXG5wcm90by5jb25zdHJ1Y3RvciA9IGNvbnNcblxucHJvdG8ubm9kZSA9IGZ1bmN0aW9uKHBhcnNlcikge1xuICByZXR1cm4gbmV3IFRleHROb2RlKHRoaXMuY29udGVudClcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gVG9rZW5cblxuZnVuY3Rpb24gVG9rZW4oY29udGVudCwgbGluZSkge1xuICB0aGlzLmNvbnRlbnQgPSBjb250ZW50XG4gIHRoaXMubGluZSA9IGxpbmVcblxuICB0aGlzLm5hbWUgPSBjb250ZW50ICYmIGNvbnRlbnQuc3BsaXQoJyAnKVswXVxufVxuXG52YXIgY29ucyA9IFRva2VuXG4gICwgcHJvdG8gPSBjb25zLnByb3RvdHlwZVxuXG5wcm90by50b1N0cmluZyA9IGZ1bmN0aW9uKCkge1xuICAvLyBOQjogdGhpcyBzaG91bGQgb25seSBiZVxuICAvLyBkZWJ1ZyBvdXRwdXQsIHNvIGl0J3NcbiAgLy8gcHJvYmFibHkgc2FmZSB0byB1c2VcbiAgLy8gSlNPTi5zdHJpbmdpZnkgaGVyZS5cbiAgcmV0dXJuICc8Jyt0aGlzLmNvbnN0cnVjdG9yLm5hbWUrJzogJytKU09OLnN0cmluZ2lmeSh0aGlzLmNvbnRlbnQpKyc+J1xufVxuXG5wcm90by5pcyA9IGZ1bmN0aW9uKG5hbWVzKSB7XG4gIGZvcih2YXIgaSA9IDAsIGxlbiA9IG5hbWVzLmxlbmd0aDsgaSA8IGxlbjsgKytpKVxuICAgIGlmKG5hbWVzW2ldID09PSB0aGlzLm5hbWUpXG4gICAgICByZXR1cm4gdHJ1ZVxuICByZXR1cm4gZmFsc2Vcbn1cbiIsIjsoZnVuY3Rpb24oKSB7XG5cbi8vIHNvLCB0aGUgb25seSB3YXkgd2UgKHJlbGlhYmx5KSBnZXQgYWNjZXNzIHRvIERTVCBpbiBqYXZhc2NyaXB0XG4vLyBpcyB2aWEgYERhdGUjZ2V0VGltZXpvbmVPZmZzZXRgLlxuLy9cbi8vIHRoaXMgdmFsdWUgd2lsbCBzd2l0Y2ggZm9yIGEgZ2l2ZW4gZGF0ZSBiYXNlZCBvbiB0aGUgcHJlc2VuY2Ugb3IgYWJzZW5jZVxuLy8gb2YgRFNUIGF0IHRoYXQgZGF0ZS5cblxuZnVuY3Rpb24gZmluZF9kc3RfdGhyZXNob2xkIChuZWFyLCBmYXIpIHtcbiAgdmFyIG5lYXJfZGF0ZSA9IG5ldyBEYXRlKG5lYXIpXG4gICAgLCBmYXJfZGF0ZSA9IG5ldyBEYXRlKGZhcilcbiAgICAsIG5lYXJfb2ZmcyA9IG5lYXJfZGF0ZS5nZXRUaW1lem9uZU9mZnNldCgpXG4gICAgLCBmYXJfb2ZmcyA9IGZhcl9kYXRlLmdldFRpbWV6b25lT2Zmc2V0KClcblxuICBpZihuZWFyX29mZnMgPT09IGZhcl9vZmZzKSByZXR1cm4gMFxuXG4gIGlmKE1hdGguYWJzKG5lYXJfZGF0ZSAtIGZhcl9kYXRlKSA8IDEwMDApIHJldHVybiBuZWFyX2RhdGVcblxuICByZXR1cm4gZmluZF9kc3RfdGhyZXNob2xkKG5lYXIsIG5lYXIrKGZhci1uZWFyKS8yKSB8fCBmaW5kX2RzdF90aHJlc2hvbGQobmVhcisoZmFyLW5lYXIpLzIsIGZhcilcbn1cblxuXG5mdW5jdGlvbiBmaW5kX2RzdF90aHJlc2hvbGRzKCkge1xuICB2YXIgZCA9IG5ldyBEYXRlKClcbiAgICAsIGQgPSBuZXcgRGF0ZShkLmdldEZ1bGxZZWFyKCksIDAsIDEpXG4gICAgLCBmID0gbmV3IERhdGUoZC5nZXRGdWxsWWVhcigpLCAxMSwgMzEpXG4gICAgLCB4XG4gICAgLCBmaXJzdFxuICAgICwgc2Vjb25kXG5cbiAgeCA9IChmIC0gZCkgLyAtMlxuICBmaXJzdCA9IGZpbmRfZHN0X3RocmVzaG9sZCgrZCwgZCAtIHgpXG4gIHNlY29uZCA9IGZpbmRfZHN0X3RocmVzaG9sZChkIC0geCwgK2YpXG5cbiAgcmV0dXJuIHtcbiAgICBzcHJpbmdfZm9yd2FyZCAgOiBmaXJzdCA/IChmaXJzdC5nZXRUaW1lem9uZU9mZnNldCgpIDwgc2Vjb25kLmdldFRpbWV6b25lT2Zmc2V0KCkgPyBzZWNvbmQgOiBmaXJzdCkgLSBuZXcgRGF0ZShkLmdldEZ1bGxZZWFyKCksIDAsIDEsIDAsIDApIDogMFxuICAsIGZhbGxfYmFjayAgICAgICA6IGZpcnN0ID8gKGZpcnN0LmdldFRpbWV6b25lT2Zmc2V0KCkgPCBzZWNvbmQuZ2V0VGltZXpvbmVPZmZzZXQoKSA/IGZpcnN0IDogc2Vjb25kKSAtIG5ldyBEYXRlKGQuZ2V0RnVsbFllYXIoKSwgMCwgMSwgMCwgMCkgOiAwXG4gIH1cbn1cblxudmFyIFRIUkVTSE9MRFMgPSBmaW5kX2RzdF90aHJlc2hvbGRzKClcblxuZnVuY3Rpb24gaXNfZHN0KGRhdGV0aW1lLCB0aHJlc2hvbGRzKSB7XG5cbiAgdGhyZXNob2xkcyA9IHRocmVzaG9sZHMgfHwgVEhSRVNIT0xEU1xuXG4gIGlmKHRocmVzaG9sZHMuc3ByaW5nX2ZvcndhcmQgPT09IHRocmVzaG9sZHMuZmFsbF9iYWNrKVxuICAgIHJldHVybiBmYWxzZVxuXG4gIHZhciBvZmZzZXQgPSBkYXRldGltZSAtIG5ldyBEYXRlKGRhdGV0aW1lLmdldEZ1bGxZZWFyKCksIDAsIDEsIDAsIDApXG4gICAgLCBkc3RfaXNfcmV2ZXJzZWQgPSB0aHJlc2hvbGRzLnNwcmluZ19mb3J3YXJkID4gdGhyZXNob2xkcy5mYWxsX2JhY2tcbiAgICAsIG1heCA9IE1hdGgubWF4KHRocmVzaG9sZHMuZmFsbF9iYWNrLCB0aHJlc2hvbGRzLnNwcmluZ19mb3J3YXJkKVxuICAgICwgbWluID0gTWF0aC5taW4odGhyZXNob2xkcy5mYWxsX2JhY2ssIHRocmVzaG9sZHMuc3ByaW5nX2ZvcndhcmQpXG5cbiAgaWYobWluIDwgb2Zmc2V0ICYmIG9mZnNldCA8IG1heClcbiAgICByZXR1cm4gIWRzdF9pc19yZXZlcnNlZFxuICByZXR1cm4gZHN0X2lzX3JldmVyc2VkXG59XG5cbkRhdGUucHJvdG90eXBlLmlzRFNUID0gZnVuY3Rpb24odGhyZXNob2xkcykge1xuICByZXR1cm4gaXNfZHN0KHRoaXMsIHRocmVzaG9sZHMpIFxufVxuXG5pc19kc3QuZmluZF90aHJlc2hvbGRzID0gZmluZF9kc3RfdGhyZXNob2xkc1xuXG5pZih0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJykge1xuICBtb2R1bGUuZXhwb3J0cyA9IGlzX2RzdFxufSBlbHNlIHtcbiAgd2luZG93LmlzX2RzdCA9IGlzX2RzdCBcbn1cblxufSkoKVxuIiwidmFyIHR6ID0gcmVxdWlyZSgnLi90eicpXG4gICwgaXNEU1QgPSByZXF1aXJlKCdkc3QnKVxuXG5tb2R1bGUuZXhwb3J0cyA9IHR6aW5mb1xuXG5mdW5jdGlvbiBnZXRfb2Zmc2V0X2ZtdCh0em9mZnMpIHtcbiAgdmFyIG9mZnMgPSB+fih0em9mZnMgLyA2MClcbiAgICAsIG1pbnMgPSAoJzAwJyArIH5+TWF0aC5hYnModHpvZmZzICUgNjApKS5zbGljZSgtMilcblxuICBvZmZzID0gKCh0em9mZnMgPiAwKSA/ICctJyA6ICcrJykgKyAoJzAwJyArIE1hdGguYWJzKG9mZnMpKS5zbGljZSgtMikgKyBtaW5zXG5cbiAgcmV0dXJuIG9mZnNcbn1cblxuZnVuY3Rpb24gdHppbmZvKGRhdGUsIHR6X2xpc3QsIGRldGVybWluZV9kc3QsIFRaKSB7XG5cbiAgdmFyIGZtdCA9IGdldF9vZmZzZXRfZm10KGRhdGUuZ2V0VGltZXpvbmVPZmZzZXQoKSlcblxuICBUWiA9IFRaIHx8IHR6XG4gIHR6X2xpc3QgPSB0el9saXN0IHx8IFRaW2ZtdF1cbiAgZGV0ZXJtaW5lX2RzdCA9IGRldGVybWluZV9kc3QgfHwgaXNEU1RcblxuICB2YXIgZGF0ZV9pc19kc3QgPSBkZXRlcm1pbmVfZHN0KGRhdGUpXG4gICAgLCBkYXRlX2RzdF90aHJlc2hvbGRzID0gZGV0ZXJtaW5lX2RzdC5maW5kX3RocmVzaG9sZHMoKVxuICAgICwgaGFzX2RzdCA9IGRhdGVfZHN0X3RocmVzaG9sZHMuc3ByaW5nX2ZvcndhcmQgIT09IGRhdGVfZHN0X3RocmVzaG9sZHMuZmFsbF9iYWNrXG4gICAgLCBpc19ub3J0aCA9IGhhc19kc3QgJiYgZGF0ZV9kc3RfdGhyZXNob2xkcy5zcHJpbmdfZm9yd2FyZCA8IGRhdGVfZHN0X3RocmVzaG9sZHMuZmFsbF9iYWNrIFxuICAgICwgbGlzdCA9ICh0el9saXN0IHx8IFtdKS5zbGljZSgpXG4gICAgLCBmaWx0ZXJlZCA9IFtdXG5cbiAgaWYoIWlzX25vcnRoKVxuICAgIGxpc3QgPSBsaXN0LnJldmVyc2UoKVxuXG4gIGZvcih2YXIgaSA9IDAsIGxlbiA9IGxpc3QubGVuZ3RoOyBpIDwgbGVuOyArK2kpIHtcbiAgICBpZihkYXRlX2lzX2RzdCA9PT0gLyhbRGRdYXlsaWdodHxbU3NddW1tZXIpLy50ZXN0KGxpc3RbaV0ubmFtZSkpIHtcbiAgICAgIGZpbHRlcmVkLnB1c2gobGlzdFtpXSlcbiAgICB9XG4gIH1cbiAgbGlzdCA9IGZpbHRlcmVkXG4gIGlmKCFsaXN0Lmxlbmd0aCkgcmV0dXJuIHt9XG5cbiAgcmV0dXJuIHtcbiAgICAgICduYW1lJzogICAgIGxpc3RbMF0ubmFtZVxuICAgICwgJ2xvYyc6ICAgICAgbGlzdFswXS5sb2NcbiAgICAsICdhYmJyJzogICAgIGxpc3RbMF0uYWJiclxuICAgICwgJ29mZnNldCc6ICAgZm10XG4gIH1cbn0gXG5cbnR6aW5mby5nZXRfb2Zmc2V0X2Zvcm1hdCA9IGdldF9vZmZzZXRfZm10XG50emluZm8udHpfbGlzdCA9IHR6XG5cbkRhdGUucHJvdG90eXBlLnR6aW5mbyA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gdHppbmZvKHRoaXMpXG59XG5cbkRhdGUucHJvdG90eXBlLnR6b2Zmc2V0ID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiAnR01UJytnZXRfb2Zmc2V0X2ZtdCh0aGlzLmdldFRpbWV6b25lT2Zmc2V0KCkpXG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IHtcbiAgXCIrMDkwMFwiOiBbXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJBc2lhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiSlNUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiSmFwYW4gU3RhbmRhcmQgVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJBdXN0cmFsaWFcIiwgXG4gICAgICBcImFiYnJcIjogXCJXRFRcIiwgXG4gICAgICBcIm5hbWVcIjogXCJXZXN0ZXJuIERheWxpZ2h0IFRpbWVcIlxuICAgIH0gXG4gIF0sIFxuICBcIisxMzQ1XCI6IFtcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIlBhY2lmaWNcIiwgXG4gICAgICBcImFiYnJcIjogXCJDSEFEVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIkNoYXRoYW0gSXNsYW5kIERheWxpZ2h0IFRpbWVcIlxuICAgIH1cbiAgXSwgXG4gIFwiKzA1MDBcIjogW1xuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiQXNpYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIlBLVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIlBha2lzdGFuIFN0YW5kYXJkIFRpbWVcIlxuICAgIH0gXG4gIF0sIFxuICBcIiswNDMwXCI6IFtcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIkFzaWFcIiwgXG4gICAgICBcImFiYnJcIjogXCJBRlRcIiwgXG4gICAgICBcIm5hbWVcIjogXCJBZmdoYW5pc3RhbiBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIkFzaWFcIiwgXG4gICAgICBcImFiYnJcIjogXCJJUkRUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiSXJhbiBEYXlsaWdodCBUaW1lXCJcbiAgICB9XG4gIF0sIFxuICBcIisxMjAwXCI6IFtcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIkFzaWFcIiwgXG4gICAgICBcImFiYnJcIjogXCJBTkFTVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIkFuYWR5ciBTdW1tZXIgVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJBc2lhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiQU5BVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIkFuYWR5ciBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIlBhY2lmaWNcIiwgXG4gICAgICBcImFiYnJcIjogXCJGSlRcIiwgXG4gICAgICBcIm5hbWVcIjogXCJGaWppIFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiUGFjaWZpY1wiLCBcbiAgICAgIFwiYWJiclwiOiBcIkdJTFRcIiwgXG4gICAgICBcIm5hbWVcIjogXCJHaWxiZXJ0IElzbGFuZCBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIkFzaWFcIiwgXG4gICAgICBcImFiYnJcIjogXCJNQUdTVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIk1hZ2FkYW4gU3VtbWVyIFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiUGFjaWZpY1wiLCBcbiAgICAgIFwiYWJiclwiOiBcIk1IVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIk1hcnNoYWxsIElzbGFuZHMgVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJQYWNpZmljXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiTlpTVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIk5ldyBaZWFsYW5kIFN0YW5kYXJkIFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiQXNpYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIlBFVFNUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiS2FtY2hhdGthIFN1bW1lciBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIkFzaWFcIiwgXG4gICAgICBcImFiYnJcIjogXCJQRVRUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiS2FtY2hhdGthIFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiUGFjaWZpY1wiLCBcbiAgICAgIFwiYWJiclwiOiBcIlRWVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIlR1dmFsdSBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIlBhY2lmaWNcIiwgXG4gICAgICBcImFiYnJcIjogXCJXRlRcIiwgXG4gICAgICBcIm5hbWVcIjogXCJXYWxsaXMgYW5kIEZ1dHVuYSBUaW1lXCJcbiAgICB9XG4gIF0sIFxuICBcIi0xMTAwXCI6IFtcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIlBhY2lmaWNcIiwgXG4gICAgICBcImFiYnJcIjogXCJTU1RcIiwgXG4gICAgICBcIm5hbWVcIjogXCJTYW1vYSBTdGFuZGFyZCBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIlBhY2lmaWNcIiwgXG4gICAgICBcImFiYnJcIjogXCJXU1RcIiwgXG4gICAgICBcIm5hbWVcIjogXCJXZXN0IFNhbW9hIFRpbWVcIlxuICAgIH0gXG4gIF0sIFxuICBcIisxNDAwXCI6IFtcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIlBhY2lmaWNcIiwgXG4gICAgICBcImFiYnJcIjogXCJMSU5UXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiTGluZSBJc2xhbmRzIFRpbWVcIlxuICAgIH1cbiAgXSwgXG4gIFwiLTAyMzBcIjogW1xuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiTm9ydGggQW1lcmljYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIkhBVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIkhldXJlIEF2YW5jXFx1MDBlOWUgZGUgVGVycmUtTmV1dmVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiTm9ydGggQW1lcmljYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIk5EVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIk5ld2ZvdW5kbGFuZCBEYXlsaWdodCBUaW1lXCJcbiAgICB9XG4gIF0sIFxuICBcIi0wMTAwXCI6IFtcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIkFmcmljYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIkNWVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIkNhcGUgVmVyZGUgVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJOb3J0aCBBbWVyaWNhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiRUdUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiRWFzdCBHcmVlbmxhbmQgVGltZVwiXG4gICAgfSBcbiAgXSwgXG4gIFwiLTEyMDBcIjogW1xuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiTWlsaXRhcnlcIiwgXG4gICAgICBcImFiYnJcIjogXCJZXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiWWFua2VlIFRpbWUgWm9uZVwiXG4gICAgfVxuICBdLCBcbiAgXCIrMDgwMFwiOiBbXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJBc2lhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiQ1NUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiQ2hpbmEgU3RhbmRhcmQgVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJBc2lhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiS1JBU1RcIiwgXG4gICAgICBcIm5hbWVcIjogXCJLcmFzbm95YXJzayBTdW1tZXIgVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJBdXN0cmFsaWFcIiwgXG4gICAgICBcImFiYnJcIjogXCJXU1RcIiwgXG4gICAgICBcIm5hbWVcIjogXCJXZXN0ZXJuIFN0YW5kYXJkIFRpbWVcIlxuICAgIH1cbiAgXSwgXG4gIFwiKzA2MzBcIjogW1xuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiQXNpYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIk1NVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIk15YW5tYXIgVGltZVwiXG4gICAgfSxcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIkluZGlhbiBPY2VhblwiLCBcbiAgICAgIFwiYWJiclwiOiBcIkNDVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIkNvY29zIElzbGFuZHMgVGltZVwiXG4gICAgfVxuICBdLCBcbiAgXCItMDQzMFwiOiBbXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJTb3V0aCBBbWVyaWNhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiSExWXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiSG9yYSBMZWdhbCBkZSBWZW5lenVlbGFcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiU291dGggQW1lcmljYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIlZFVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIlZlbmV6dWVsYW4gU3RhbmRhcmQgVGltZVwiXG4gICAgfVxuICBdLCBcbiAgXCItMDcwMFwiOiBbXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJOb3J0aCBBbWVyaWNhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiTVNUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiTW91bnRhaW4gU3RhbmRhcmQgVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJOb3J0aCBBbWVyaWNhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiUERUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiUGFjaWZpYyBEYXlsaWdodCBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIk5vcnRoIEFtZXJpY2FcIiwgXG4gICAgICBcImFiYnJcIjogXCJIQVBcIiwgXG4gICAgICBcIm5hbWVcIjogXCJIZXVyZSBBdmFuY1xcdTAwZTllIGR1IFBhY2lmaXF1ZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJOb3J0aCBBbWVyaWNhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiSE5SXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiSGV1cmUgTm9ybWFsZSBkZXMgUm9jaGV1c2VzXCJcbiAgICB9IFxuICBdLCBcbiAgXCItMDIwMFwiOiBbXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJTb3V0aCBBbWVyaWNhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiRk5UXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiRmVybmFuZG8gZGUgTm9yb25oYSBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIk5vcnRoIEFtZXJpY2FcIiwgXG4gICAgICBcImFiYnJcIjogXCJXR1NUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiV2VzdGVybiBHcmVlbmxhbmQgU3VtbWVyIFRpbWVcIlxuICAgIH0sXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJOb3J0aCBBbWVyaWNhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiUE1EVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIlBpZXJyZSAmIE1pcXVlbG9uIERheWxpZ2h0IFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiU291dGggQW1lcmljYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIlVZU1RcIiwgXG4gICAgICBcIm5hbWVcIjogXCJVcnVndWF5IFN1bW1lciBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIlNvdXRoIEFtZXJpY2FcIiwgXG4gICAgICBcImFiYnJcIjogXCJCUlNUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiQnJhc2lsaWEgU3VtbWVyIFRpbWVcIlxuICAgIH0gXG4gIF0sIFxuICBcIisxMDMwXCI6IFtcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIkF1c3RyYWxpYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIkNEVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIkNlbnRyYWwgRGF5bGlnaHQgVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJBdXN0cmFsaWFcIiwgXG4gICAgICBcImFiYnJcIjogXCJMSFNUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiTG9yZCBIb3dlIFN0YW5kYXJkIFRpbWVcIlxuICAgIH1cbiAgXSwgXG4gIFwiKzAzMDBcIjogW1xuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiRXVyb3BlXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiTVNLXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiTW9zY293IFN0YW5kYXJkIFRpbWVcIlxuICAgIH0sXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJBc2lhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiSURUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiSXNyYWVsIERheWxpZ2h0IFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiQXNpYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIkFTVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIkFyYWJpYSBTdGFuZGFyZCBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIkluZGlhbiBPY2VhblwiLCBcbiAgICAgIFwiYWJiclwiOiBcIkVBVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIkVhc3QgQWZyaWNhIFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiRXVyb3BlXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiRUVTVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIkVhc3Rlcm4gRXVyb3BlYW4gU3VtbWVyIFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiQWZyaWNhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiRUFUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiRWFzdGVybiBBZnJpY2EgVGltZVwiXG4gICAgfSBcbiAgXSwgXG4gIFwiVVRDXCI6IFtcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIkF0bGFudGljXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiQVpPU1RcIiwgXG4gICAgICBcIm5hbWVcIjogXCJBem9yZXMgU3VtbWVyIFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiTm9ydGggQW1lcmljYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIkVHU1RcIiwgXG4gICAgICBcIm5hbWVcIjogXCJFYXN0ZXJuIEdyZWVubGFuZCBTdW1tZXIgVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJBZnJpY2FcIiwgXG4gICAgICBcImFiYnJcIjogXCJHTVRcIiwgXG4gICAgICBcIm5hbWVcIjogXCJHcmVlbndpY2ggTWVhbiBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIkV1cm9wZVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIkdNVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIkdyZWVud2ljaCBNZWFuIFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiQWZyaWNhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiV0VUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiV2VzdGVybiBFdXJvcGVhbiBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIkV1cm9wZVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIldFVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIldlc3Rlcm4gRXVyb3BlYW4gVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJBZnJpY2FcIiwgXG4gICAgICBcImFiYnJcIjogXCJXVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIldlc3Rlcm4gU2FoYXJhIFN0YW5kYXJkIFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiTWlsaXRhcnlcIiwgXG4gICAgICBcImFiYnJcIjogXCJaXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiWnVsdSBUaW1lIFpvbmVcIlxuICAgIH1cbiAgXSwgXG4gIFwiKzA0MDBcIjogW1xuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiQXNpYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIkFNVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIkFybWVuaWEgVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJBc2lhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiQVpUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiQXplcmJhaWphbiBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIk1pbGl0YXJ5XCIsIFxuICAgICAgXCJhYmJyXCI6IFwiRFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIkRlbHRhIFRpbWUgWm9uZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJBc2lhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiR0VUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiR2VvcmdpYSBTdGFuZGFyZCBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIkFzaWFcIiwgXG4gICAgICBcImFiYnJcIjogXCJHU1RcIiwgXG4gICAgICBcIm5hbWVcIjogXCJHdWxmIFN0YW5kYXJkIFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiRXVyb3BlXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiS1VZVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIkt1eWJ5c2hldiBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIkV1cm9wZVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIk1TRFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIk1vc2NvdyBEYXlsaWdodCBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIkFmcmljYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIk1VVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIk1hdXJpdGl1cyBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIkFmcmljYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIlJFVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIlJldW5pb24gVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJFdXJvcGVcIiwgXG4gICAgICBcImFiYnJcIjogXCJTQU1UXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiU2FtYXJhIFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiQWZyaWNhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiU0NUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiU2V5Y2hlbGxlcyBUaW1lXCJcbiAgICB9XG4gIF0sIFxuICBcIiswNzAwXCI6IFtcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIkF1c3RyYWxpYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIkNYVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIkNocmlzdG1hcyBJc2xhbmQgVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJBbnRhcmN0aWNhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiREFWVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIkRhdmlzIFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiTWlsaXRhcnlcIiwgXG4gICAgICBcImFiYnJcIjogXCJHXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiR29sZiBUaW1lIFpvbmVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiQXNpYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIkhPVlRcIiwgXG4gICAgICBcIm5hbWVcIjogXCJIb3ZkIFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiQXNpYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIklDVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIkluZG9jaGluYSBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIkFzaWFcIiwgXG4gICAgICBcImFiYnJcIjogXCJLUkFUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiS3Jhc25veWFyc2sgVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJBc2lhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiTk9WU1RcIiwgXG4gICAgICBcIm5hbWVcIjogXCJOb3Zvc2liaXJzayBTdW1tZXIgVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJBc2lhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiT01TU1RcIiwgXG4gICAgICBcIm5hbWVcIjogXCJPbXNrIFN1bW1lciBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIkFzaWFcIiwgXG4gICAgICBcImFiYnJcIjogXCJXSUJcIiwgXG4gICAgICBcIm5hbWVcIjogXCJXZXN0ZXJuIEluZG9uZXNpYW4gVGltZVwiXG4gICAgfVxuICBdLCBcbiAgXCIrMDIwMFwiOiBbXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJNaWxpdGFyeVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIkJcIiwgXG4gICAgICBcIm5hbWVcIjogXCJCcmF2byBUaW1lIFpvbmVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiQWZyaWNhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiQ0FUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiQ2VudHJhbCBBZnJpY2EgVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJFdXJvcGVcIiwgXG4gICAgICBcImFiYnJcIjogXCJDRVNUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiQ2VudHJhbCBFdXJvcGVhbiBTdW1tZXIgVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJBZnJpY2FcIiwgXG4gICAgICBcImFiYnJcIjogXCJFRVRcIiwgXG4gICAgICBcIm5hbWVcIjogXCJFYXN0ZXJuIEV1cm9wZWFuIFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiQXNpYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIkVFVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIkVhc3Rlcm4gRXVyb3BlYW4gVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJFdXJvcGVcIiwgXG4gICAgICBcImFiYnJcIjogXCJFRVRcIiwgXG4gICAgICBcIm5hbWVcIjogXCJFYXN0ZXJuIEV1cm9wZWFuIFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiQXNpYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIklTVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIklzcmFlbCBTdGFuZGFyZCBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIkFmcmljYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIlNBU1RcIiwgXG4gICAgICBcIm5hbWVcIjogXCJTb3V0aCBBZnJpY2EgU3RhbmRhcmQgVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJBZnJpY2FcIiwgXG4gICAgICBcImFiYnJcIjogXCJXQVNUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiV2VzdCBBZnJpY2EgU3VtbWVyIFRpbWVcIlxuICAgIH1cbiAgXSwgXG4gIFwiLTEwMDBcIjogW1xuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiUGFjaWZpY1wiLCBcbiAgICAgIFwiYWJiclwiOiBcIkNLVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIkNvb2sgSXNsYW5kIFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiTm9ydGggQW1lcmljYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIkhBU1RcIiwgXG4gICAgICBcIm5hbWVcIjogXCJIYXdhaWktQWxldXRpYW4gU3RhbmRhcmQgVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJQYWNpZmljXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiVEFIVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIlRhaGl0aSBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIlBhY2lmaWNcIiwgXG4gICAgICBcImFiYnJcIjogXCJUS1RcIiwgXG4gICAgICBcIm5hbWVcIjogXCJUb2tlbGF1IFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiTWlsaXRhcnlcIiwgXG4gICAgICBcImFiYnJcIjogXCJXXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiV2hpc2tleSBUaW1lIFpvbmVcIlxuICAgIH1cbiAgXSwgXG4gIFwiKzA5MzBcIjogW1xuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiQXVzdHJhbGlhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiQ1NUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiQ2VudHJhbCBTdGFuZGFyZCBUaW1lXCJcbiAgICB9XG4gIF0sIFxuICBcIiswNTMwXCI6IFtcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIkFzaWFcIiwgXG4gICAgICBcImFiYnJcIjogXCJJU1RcIiwgXG4gICAgICBcIm5hbWVcIjogXCJJbmRpYSBTdGFuZGFyZCBUaW1lXCJcbiAgICB9XG4gIF0sIFxuICBcIisxMzAwXCI6IFtcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIlBhY2lmaWNcIiwgXG4gICAgICBcImFiYnJcIjogXCJGSlNUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiRmlqaSBTdW1tZXIgVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJBbnRhcmN0aWNhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiTlpEVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIk5ldyBaZWFsYW5kIERheWxpZ2h0IFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiUGFjaWZpY1wiLCBcbiAgICAgIFwiYWJiclwiOiBcIk5aRFRcIiwgXG4gICAgICBcIm5hbWVcIjogXCJOZXcgWmVhbGFuZCBEYXlsaWdodCBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIlBhY2lmaWNcIiwgXG4gICAgICBcImFiYnJcIjogXCJQSE9UXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiUGhvZW5peCBJc2xhbmQgVGltZVwiXG4gICAgfVxuICBdLCBcbiAgXCIrMDU0NVwiOiBbXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJBc2lhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiTlBUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiTmVwYWwgVGltZVwiXG4gICAgfVxuICBdLCBcbiAgXCIrMTAwMFwiOiBbXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJQYWNpZmljXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiQ2hTVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIkNoYW1vcnJvIFN0YW5kYXJkIFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiQXVzdHJhbGlhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiRVNUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiRWFzdGVybiBTdGFuZGFyZCBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIk1pbGl0YXJ5XCIsIFxuICAgICAgXCJhYmJyXCI6IFwiS1wiLCBcbiAgICAgIFwibmFtZVwiOiBcIktpbG8gVGltZSBab25lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIlBhY2lmaWNcIiwgXG4gICAgICBcImFiYnJcIjogXCJQR1RcIiwgXG4gICAgICBcIm5hbWVcIjogXCJQYXB1YSBOZXcgR3VpbmVhIFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiQXNpYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIlZMQVRcIiwgXG4gICAgICBcIm5hbWVcIjogXCJWbGFkaXZvc3RvayBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIkFzaWFcIiwgXG4gICAgICBcImFiYnJcIjogXCJZQUtTVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIllha3V0c2sgU3VtbWVyIFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiUGFjaWZpY1wiLCBcbiAgICAgIFwiYWJiclwiOiBcIllBUFRcIiwgXG4gICAgICBcIm5hbWVcIjogXCJZYXAgVGltZVwiXG4gICAgfVxuICBdLCBcbiAgXCItMDYwMFwiOiBbXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJOb3J0aCBBbWVyaWNhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiQ1NUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiQ2VudHJhbCBTdGFuZGFyZCBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIk5vcnRoIEFtZXJpY2FcIiwgXG4gICAgICBcImFiYnJcIjogXCJNRFRcIiwgXG4gICAgICBcIm5hbWVcIjogXCJNb3VudGFpbiBEYXlsaWdodCBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIlBhY2lmaWNcIiwgXG4gICAgICBcImFiYnJcIjogXCJHQUxUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiR2FsYXBhZ29zIFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiTm9ydGggQW1lcmljYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIkhBUlwiLCBcbiAgICAgIFwibmFtZVwiOiBcIkhldXJlIEF2YW5jXFx1MDBlOWUgZGVzIFJvY2hldXNlc1wiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJOb3J0aCBBbWVyaWNhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiSE5DXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiSGV1cmUgTm9ybWFsZSBkdSBDZW50cmVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiQ2VudHJhbCBBbWVyaWNhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiSE5DXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiSGV1cmUgTm9ybWFsZSBkdSBDZW50cmVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiQ2VudHJhbCBBbWVyaWNhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiQ1NUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiQ2VudHJhbCBTdGFuZGFyZCBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIlBhY2lmaWNcIiwgXG4gICAgICBcImFiYnJcIjogXCJFQVNUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiRWFzdGVyIElzbGFuZCBTdGFuZGFyZCBUaW1lXCJcbiAgICB9XG4gIF0sIFxuICBcIiswMTAwXCI6IFtcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIkV1cm9wZVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIkNFVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIkNlbnRyYWwgRXVyb3BlYW4gVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJFdXJvcGVcIiwgXG4gICAgICBcImFiYnJcIjogXCJCU1RcIiwgXG4gICAgICBcIm5hbWVcIjogXCJCcml0aXNoIFN1bW1lciBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIkFmcmljYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIkNFVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIkNlbnRyYWwgRXVyb3BlYW4gVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJBZnJpY2FcIiwgXG4gICAgICBcImFiYnJcIjogXCJXRVNUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiV2VzdGVybiBFdXJvcGVhbiBTdW1tZXIgVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJFdXJvcGVcIiwgXG4gICAgICBcImFiYnJcIjogXCJXRVNUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiV2VzdGVybiBFdXJvcGVhbiBTdW1tZXIgVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJBZnJpY2FcIiwgXG4gICAgICBcImFiYnJcIjogXCJXU1RcIiwgXG4gICAgICBcIm5hbWVcIjogXCJXZXN0ZXJuIFNhaGFyYSBTdW1tZXIgVGltZVwiXG4gICAgfSxcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIkFmcmljYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIldBVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIldlc3QgQWZyaWNhIFRpbWVcIlxuICAgIH1cbiAgXSwgXG4gIFwiLTA0MDBcIjogW1xuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiTm9ydGggQW1lcmljYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIkFTVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIkF0bGFudGljIFN0YW5kYXJkIFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiTm9ydGggQW1lcmljYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIkVEVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIkVhc3Rlcm4gRGF5bGlnaHQgVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJTb3V0aCBBbWVyaWNhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiQ0xUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiQ2hpbGUgU3RhbmRhcmQgVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJTb3V0aCBBbWVyaWNhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiRktUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiRmFsa2xhbmQgSXNsYW5kIFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiU291dGggQW1lcmljYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIkdZVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIkd1eWFuYSBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIlNvdXRoIEFtZXJpY2FcIiwgXG4gICAgICBcImFiYnJcIjogXCJQWVRcIiwgXG4gICAgICBcIm5hbWVcIjogXCJQYXJhZ3VheSBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIlNvdXRoIEFtZXJpY2FcIiwgXG4gICAgICBcImFiYnJcIjogXCJBTVRcIiwgXG4gICAgICBcIm5hbWVcIjogXCJBbWF6b24gVGltZVwiXG4gICAgfSBcbiAgXSwgXG4gIFwiLTAzMzBcIjogW1xuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiTm9ydGggQW1lcmljYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIk5TVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIk5ld2ZvdW5kbGFuZCBTdGFuZGFyZCBUaW1lXCJcbiAgICB9XG4gIF0sIFxuICBcIi0wNTAwXCI6IFtcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIk5vcnRoIEFtZXJpY2FcIiwgXG4gICAgICBcImFiYnJcIjogXCJFU1RcIiwgXG4gICAgICBcIm5hbWVcIjogXCJFYXN0ZXJuIFN0YW5kYXJkIFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiTm9ydGggQW1lcmljYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIkNEVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIkNlbnRyYWwgRGF5bGlnaHQgVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJTb3V0aCBBbWVyaWNhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiQ09UXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiQ29sb21iaWEgVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJDYXJpYmJlYW5cIiwgXG4gICAgICBcImFiYnJcIjogXCJDU1RcIiwgXG4gICAgICBcIm5hbWVcIjogXCJDdWJhIFN0YW5kYXJkIFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiUGFjaWZpY1wiLCBcbiAgICAgIFwiYWJiclwiOiBcIkVBU1NUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiRWFzdGVyIElzbGFuZCBTdW1tZXIgVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJTb3V0aCBBbWVyaWNhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiRUNUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiRWN1YWRvciBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIkNlbnRyYWwgQW1lcmljYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIkVTVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIkVhc3Rlcm4gU3RhbmRhcmQgVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJDYXJpYmJlYW5cIiwgXG4gICAgICBcImFiYnJcIjogXCJFU1RcIiwgXG4gICAgICBcIm5hbWVcIjogXCJFYXN0ZXJuIFN0YW5kYXJkIFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiQ2VudHJhbCBBbWVyaWNhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiRVRcIiwgXG4gICAgICBcIm5hbWVcIjogXCJUaWVtcG8gZGVsIEVzdGVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiQ2FyaWJiZWFuXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiRVRcIiwgXG4gICAgICBcIm5hbWVcIjogXCJUaWVtcG8gZGVsIEVzdGVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiTm9ydGggQW1lcmljYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIkVUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiVGllbXBvIERlbCBFc3RlXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIk5vcnRoIEFtZXJpY2FcIiwgXG4gICAgICBcImFiYnJcIjogXCJIQUNcIiwgXG4gICAgICBcIm5hbWVcIjogXCJIZXVyZSBBdmFuY1xcdTAwZTllIGR1IENlbnRyZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJTb3V0aCBBbWVyaWNhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiUEVUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiUGVydSBUaW1lXCJcbiAgICB9IFxuICBdLCBcbiAgXCItMDkwMFwiOiBbXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJOb3J0aCBBbWVyaWNhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiQUtTVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIkFsYXNrYSBTdGFuZGFyZCBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIk5vcnRoIEFtZXJpY2FcIiwgXG4gICAgICBcImFiYnJcIjogXCJIQURUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiSGF3YWlpLUFsZXV0aWFuIERheWxpZ2h0IFRpbWVcIlxuICAgIH0gXG4gIF0sIFxuICBcIi0wMzAwXCI6IFtcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIk5vcnRoIEFtZXJpY2FcIiwgXG4gICAgICBcImFiYnJcIjogXCJBRFRcIiwgXG4gICAgICBcIm5hbWVcIjogXCJBdGxhbnRpYyBEYXlsaWdodCBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIlNvdXRoIEFtZXJpY2FcIiwgXG4gICAgICBcImFiYnJcIjogXCJBTVNUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiQW1hem9uIFN1bW1lciBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIlNvdXRoIEFtZXJpY2FcIiwgXG4gICAgICBcImFiYnJcIjogXCJCUlRcIiwgXG4gICAgICBcIm5hbWVcIjogXCJCcmFzXFx1MDBlZGxpYSB0aW1lXCJcbiAgICB9IFxuICBdLCBcbiAgXCIrMTI0NVwiOiBbXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJQYWNpZmljXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiQ0hBU1RcIiwgXG4gICAgICBcIm5hbWVcIjogXCJDaGF0aGFtIElzbGFuZCBTdGFuZGFyZCBUaW1lXCJcbiAgICB9XG4gIF0sIFxuICBcIiswNjAwXCI6IFtcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIkFzaWFcIiwgXG4gICAgICBcImFiYnJcIjogXCJCU1RcIiwgXG4gICAgICBcIm5hbWVcIjogXCJCYW5nbGFkZXNoIFN0YW5kYXJkIFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiQXNpYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIllFS1NUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiWWVrYXRlcmluYnVyZyBTdW1tZXIgVGltZVwiXG4gICAgfSxcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIkFzaWFcIiwgXG4gICAgICBcImFiYnJcIjogXCJCU1RcIiwgXG4gICAgICBcIm5hbWVcIjogXCJCYW5nbGFkZXNoIFN0YW5kYXJkIFRpbWVcIlxuICAgIH0gXG4gIF0sIFxuICBcIi0wOTMwXCI6IFtcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIlBhY2lmaWNcIiwgXG4gICAgICBcImFiYnJcIjogXCJNQVJUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiTWFycXVlc2FzIFRpbWVcIlxuICAgIH1cbiAgXSwgXG4gIFwiKzAzMzBcIjogW1xuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiQXNpYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIklSU1RcIiwgXG4gICAgICBcIm5hbWVcIjogXCJJcmFuIFN0YW5kYXJkIFRpbWVcIlxuICAgIH1cbiAgXSwgXG4gIFwiKzExMzBcIjogW1xuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiQXVzdHJhbGlhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiTkZUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiTm9yZm9sayBUaW1lXCJcbiAgICB9XG4gIF0sIFxuICBcIisxMTAwXCI6IFtcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIkFzaWFcIiwgXG4gICAgICBcImFiYnJcIjogXCJWTEFTVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIlZsYWRpdm9zdG9rIFN1bW1lciBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIkF1c3RyYWxpYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIkVEVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIkVhc3Rlcm4gRGF5bGlnaHQgVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJQYWNpZmljXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiTkNUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiTmV3IENhbGVkb25pYSBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIlBhY2lmaWNcIiwgXG4gICAgICBcImFiYnJcIjogXCJQT05UXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiUG9obnBlaSBTdGFuZGFyZCBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIlBhY2lmaWNcIiwgXG4gICAgICBcImFiYnJcIjogXCJTQlRcIiwgXG4gICAgICBcIm5hbWVcIjogXCJTb2xvbW9uIElzbGFuZHNUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIlBhY2lmaWNcIiwgXG4gICAgICBcImFiYnJcIjogXCJWVVRcIiwgXG4gICAgICBcIm5hbWVcIjogXCJWYW51YXR1IFRpbWVcIlxuICAgIH1cbiAgXSwgXG4gIFwiLTA4MDBcIjogW1xuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiTm9ydGggQW1lcmljYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIlBTVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIlBhY2lmaWMgU3RhbmRhcmQgVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJOb3J0aCBBbWVyaWNhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiQUtEVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIkFsYXNrYSBEYXlsaWdodCBUaW1lXCJcbiAgICB9IFxuICBdXG59XG4iXX0=
;