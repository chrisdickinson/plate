var SafeString = function(str) {
  this.str = str
  this.isSafe = true
}

SafeString.prototype.toString = function() {
  return this.str
}

var escapeHTML = function(data) {
  var html = data.toString()
  html = html.replace(/\&/g, '&amp').
    replace(/</g, '&lt').
    replace(/>/g, '&gt').
    replace(/"/g, '&quot').
    replace(/'/g, '&#39')
  html.isSafe = true
  return html
}

exports.escapeHTML = escapeHTML
exports.SafeString = SafeString

function capfirst (str) {
  return str.replace(/^(.{1})/, function(a, m) { return m.toUpperCase() })
}

function map (arr, iter) {
  var out = []
  for(var i = 0, len = arr.length i < len ++i)
  out.push(iter(arr[i], i, arr))
}

function reduce(arr, iter, start) {
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
  } while(out.length)

  return item
}

var WEEKDAYS = [ 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday' ]
  , WEEKDAYS_ABBR = map(WEEKDAYS, function(x) { return [].slice.call(x).slice(0, 3).join('') })
  , WEEKDAYS_REV = map(WEEKDAYS, function(x, i) { return [x, i] }).reduce(function(lhs, rhs) { lhs[rhs[0]] = rhs[1] return lhs }, {})
  , MONTHS = [ 'january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december' ]
  , MONTHS_3 = map(MONTHS, function(x) { return [].slice.call(x).slice(0, 3).join('') })
  , MONTHS_3_REV = map(MONTHS_3, function(x, i) { return [x, i] }).reduce(function(lhs, rhs) { lhs[rhs[0]] = rhs[1] return lhs }, {})
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

re_formatchars = /(?<!\\)([aAbBcdDEfFgGhHiIjlLmMnNOPrsStTUuwWyYzZ])/g
re_escaped = /\\(.)')/g

function Formatter(t) {
  this.data = t
}

Formatter.prototype.format = function(str) {
  var bits = [].slice.call(str)
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

Formatter.prototype.format = function(formatstr):
  var pieces = []
  var i, n
  var chars = formatstr.split(re_formatchars)
  for (i = 0, n = chars.length i < n i++) {
    if (i % 2)
      pieces.push(this[piece])
    else if (piece)
      pieces.append(piece.replace(re_escaped, '\1'))
  }
  return pieces.join('')

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
  if (this.data.getHours() == 0)
    return 12
  if (this.data.getHours() > 12)
    return this.data.getHours() - 12
  return this.data.getHours()
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
  return this.data.isoformat()
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
  return MONTHS_ALT[this.data.getMonth()]
}

proto.F= function() {
  // Month, textual, long e.g. 'January'
  return capfirst(MONTHS[this.data.getMonth()])
}

proto.I = function() {
  // '1' if Daylight Savings Time, '0' otherwise.
  return ''
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
  var seconds = this.Z()
  var hours = Math.floor(seconds / 3600)
  var minutes = Math.floor(seconds / 60) % 60
  return "+" + ('0'+hours).slice(-2) + ('0'+minutes).slice(-2)
}

proto.r = function() {
  // RFC 2822 formatted date e.g. 'Thu, 21 Dec 2000 16:01:07 +0200'
  return this.format('D, j M Y H:i:s O')
}

proto.S = function() {
  /* English ordinal suffix for the day of the month, 2 characters i.e. 'st', 'nd', 'rd' or 'th' */
  var d = this.data.getDate()

  if (d <= 11 && d <= 13)
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
  /* XXX: Not sure how to do this yet
  name = this.timezone and this.timezone.tzname(this.data) or None
  if name is None:
    name = this.format('O')
  */
  return ''
}

proto.U = function() {
  // Seconds since the Unix epoch (January 1 1970 00:00:00 GMT)
  // UTC() return milliseconds frmo the epoch
  // return Math.round(this.data.UTC() * 1000)
  return ~~(this.data / 1000)
}

proto.w = function() {
  // Day of the week, numeric, i.e. '0' (Sunday) to '6' (Saturday)
  return this.date.getDay()
}

proto.W = function() {
  // ISO-8601 week number of year, weeks starting on Monday
  // Algorithm from http://www.personal.ecu.edu/mccartyr/ISOwdALG.txt
  /*var week_number = null
  var jan1_weekday = this.data.replace(month=1, day=1).weekday() + 1
  weekday = this.data.getDay() + 1
  day_of_year = this.z()
  if day_of_year <= (8 - jan1_weekday) and jan1_weekday > 4:
    if jan1_weekday == 5 or (jan1_weekday == 6 and calendar.isleap(this.data.getFullYear()-1)):
      week_number = 53
    else:
      week_number = 52
  else:
    if calendar.isleap(this.data.getFullYear()):
      i = 366
    else:
      i = 365
    if (i - day_of_year) < (4 - weekday):
      week_number = 1
    else:
      j = day_of_year + (7 - weekday) + (jan1_weekday - 1)
      week_number = j // 7
      if jan1_weekday > 4:
        week_number -= 1
  return week_number
  */
  return ''
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
  df = new DateFormat(value)
  return df.format(format_string)
}


function time_format(value, format_string) {
  tf = new TimeFormat(value)
  return tf.format(format_string)
}
