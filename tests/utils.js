var plate = require('../index')
  , utils = require('../lib/date')
  , test = require('tape')

Function.prototype.bind = Function.prototype.bind || function(obj) {
  var self = this
    , args = [].slice.call(arguments, 1)

  return function() {
    return self.apply(obj, args.concat([].slice.call(arguments)))
  }
}

Array.prototype.forEach = [].forEach || function(fn) {
  for(var i = 0, len = this.length; i < len; ++i) {
    fn(this[i], i, this)
  }
}

function make_format_equiv(method, for_date, should_equal) {
  return test("test of '"+method+"'", function(assert) {
    var fmt = new utils.DateFormat(for_date)
    assert.equal(''+fmt[method](), ''+should_equal)
    assert.end()     
  })
}

test("test that the formatter works as expected", function(assert) {
    var strtoarr = function(str) {
        var arr = [];
        for(var i = 0; i < str.length; ++i) {
          arr.push(str.charAt(i));
        }
        return arr 
      }

    var format    = strtoarr("aAbcdDEfFgGhHiIjlLmMnNOPrsStTUuwWyYzZ")
      , datetime  = new Date
      , result    = utils.date(datetime, format.join('\n'))
      , formatter = new utils.DateFormat(datetime)

    result = result.split('\n')
    result.forEach(function(item, idx) {
      assert.equal(item, ''+formatter[format[idx]]())
    })

    assert.end()
  }
)

// a.m. / p.m. format
make_format_equiv('a', new Date(2010, 0, 1, 23, 0),   'p.m.')
make_format_equiv('a', new Date(2010, 0, 1, 1, 0),    'a.m.')

// AM / PM format
make_format_equiv('A', new Date(2010, 0, 1, 1, 0),    'AM')
make_format_equiv('A', new Date(2010, 0, 1, 23, 0),   'PM')

// time in 12-hour, omit minutes if 0
make_format_equiv('f', new Date(2010, 0, 1, 23, 0),   '11')
make_format_equiv('f', new Date(2010, 0, 1, 11, 0),   '11')
make_format_equiv('f', new Date(2010, 0, 1, 18, 30),  '6:30')
make_format_equiv('f', new Date(2010, 0, 1, 8, 30),   '8:30')

// 12-hour format, no leading zeros
make_format_equiv('g', new Date(2010, 0, 1, 23, 0),   '11')
make_format_equiv('g', new Date(2010, 0, 1, 11, 0),   '11')
make_format_equiv('g', new Date(2010, 0, 1, 18, 30),  '6')
make_format_equiv('g', new Date(2010, 0, 1, 8, 30),   '8')

// hour, 24 hour format, no leading zeros
make_format_equiv('G', new Date(2010, 0, 1, 18, 30),  '18')
make_format_equiv('G', new Date(2010, 0, 1, 8, 30),   '8')

// hour, 12-hour format, leading zeros
make_format_equiv('h', new Date(2010, 0, 1, 18, 30),  '06')
make_format_equiv('h', new Date(2010, 0, 1, 8, 30),   '08')

// hour, 24-hour format, leading zeros
make_format_equiv('H', new Date(2010, 0, 1, 18, 30),  '18')
make_format_equiv('H', new Date(2010, 0, 1, 8, 30),   '08')

// minutes, leading zeros
make_format_equiv('i', new Date(2010, 0, 1, 18, 5),   '05')
make_format_equiv('i', new Date(2010, 0, 1, 8, 30),   '30')

// time, 12 hours, minutes, 'a.m.', 'p.m.', sans minutes if zero, midnight or noon if appropriate
make_format_equiv('P', new Date(2010, 0, 1, 12, 0),   'noon')
make_format_equiv('P', new Date(2010, 0, 0, 0, 0),    'midnight')
make_format_equiv('P', new Date(2010, 0, 1, 8, 30),   '8:30 a.m.')
make_format_equiv('P', new Date(2010, 0, 1, 18, 3),   '6:03 p.m.')
make_format_equiv('P', new Date(2010, 0, 1, 18, 0),   '6 p.m.')

// seconds, 00-59
make_format_equiv('s', new Date(2010, 0, 1, 18, 3, 0),  '00')
make_format_equiv('s', new Date(2010, 0, 1, 18, 3, 3),  '03')
make_format_equiv('s', new Date(2010, 0, 1, 18, 3, 30), '30')
make_format_equiv('s', new Date(2010, 0, 1, 18, 3, 59), '59')

// milliseconds
make_format_equiv('u', new Date(2010, 0, 1, 18, 3, 59, 888), '888')
make_format_equiv('u', new Date(2010, 0, 1, 18, 3, 59, 5), '5')

// month, 3 letters, lowercase
make_format_equiv('b', new Date(2010, 0, 1, 18, 3, 59, 888), 'jan')
make_format_equiv('b', new Date(2010, 1, 1, 18, 3, 59, 888), 'feb')
make_format_equiv('b', new Date(2010, 2, 1, 18, 3, 59, 888), 'mar')
make_format_equiv('b', new Date(2010, 3, 1, 18, 3, 59, 888), 'apr')
make_format_equiv('b', new Date(2010, 4, 1, 18, 3, 59, 888), 'may')
make_format_equiv('b', new Date(2010, 5, 1, 18, 3, 59, 888), 'jun')
make_format_equiv('b', new Date(2010, 6, 1, 18, 3, 59, 888), 'jul')
make_format_equiv('b', new Date(2010, 7, 1, 18, 3, 59, 888), 'aug')
make_format_equiv('b', new Date(2010, 8, 1, 18, 3, 59, 888), 'sep')
make_format_equiv('b', new Date(2010, 9, 1, 18, 3, 59, 888), 'oct')
make_format_equiv('b', new Date(2010,10, 1, 18, 3, 59, 888), 'nov')
make_format_equiv('b', new Date(2010,11, 1, 18, 3, 59, 888), 'dec')

// iso format
Date.prototype.toISOString ? make_format_equiv('c', new Date(2010,11, 1, 18, 3, 59, 888), (new Date(2010,11, 1, 18, 3, 59, 888)).toISOString()) : Function()

// day of month, 2 digits, leading zeros
make_format_equiv('d', new Date(2010,11, 2, 5, 3, 59, 888), '02')
make_format_equiv('d', new Date(2010,11,22, 5, 3, 59, 888), '22')

// day of week, three letters, capfirst
make_format_equiv('D', new Date(2012, 0,15, 5, 3, 59, 888), 'Sun')
make_format_equiv('D', new Date(2012, 0,16, 5, 3, 59, 888), 'Mon')
make_format_equiv('D', new Date(2012, 0,17, 5, 3, 59, 888), 'Tue')
make_format_equiv('D', new Date(2012, 0,18, 5, 3, 59, 888), 'Wed')
make_format_equiv('D', new Date(2012, 0,19, 5, 3, 59, 888), 'Thu')
make_format_equiv('D', new Date(2012, 0,20, 5, 3, 59, 888), 'Fri')
make_format_equiv('D', new Date(2012, 0,21, 5, 3, 59, 888), 'Sat')

// month, long, capfirst
make_format_equiv('F', new Date(2010, 0, 1, 18, 3, 59, 888), 'January')
make_format_equiv('F', new Date(2010, 1, 1, 18, 3, 59, 888), 'February')
make_format_equiv('F', new Date(2010, 2, 1, 18, 3, 59, 888), 'March')
make_format_equiv('F', new Date(2010, 3, 1, 18, 3, 59, 888), 'April')
make_format_equiv('F', new Date(2010, 4, 1, 18, 3, 59, 888), 'May')
make_format_equiv('F', new Date(2010, 5, 1, 18, 3, 59, 888), 'June')
make_format_equiv('F', new Date(2010, 6, 1, 18, 3, 59, 888), 'July')
make_format_equiv('F', new Date(2010, 7, 1, 18, 3, 59, 888), 'August')
make_format_equiv('F', new Date(2010, 8, 1, 18, 3, 59, 888), 'September')
make_format_equiv('F', new Date(2010, 9, 1, 18, 3, 59, 888), 'October')
make_format_equiv('F', new Date(2010,10, 1, 18, 3, 59, 888), 'November')
make_format_equiv('F', new Date(2010,11, 1, 18, 3, 59, 888), 'December')

// 1 if DST, 0 if not -- omitted for now.
// make_format_equiv('I', new Date(2010,1, 1, 18, 3, 59, 888), '0')
// make_format_equiv('I', new Date(2010,8, 1, 18, 3, 59, 888), '1')

// day of month, no leading zeros
make_format_equiv('j', new Date(2010,8, 5, 18, 3, 59, 888), '5')
make_format_equiv('j', new Date(2010,8,30, 18, 3, 59, 888), '30')

// day of the week, textual, long
make_format_equiv('l', new Date(2012, 0,15, 5, 3, 59, 888), 'Sunday')
make_format_equiv('l', new Date(2012, 0,16, 5, 3, 59, 888), 'Monday')
make_format_equiv('l', new Date(2012, 0,17, 5, 3, 59, 888), 'Tuesday')
make_format_equiv('l', new Date(2012, 0,18, 5, 3, 59, 888), 'Wednesday')
make_format_equiv('l', new Date(2012, 0,19, 5, 3, 59, 888), 'Thursday')
make_format_equiv('l', new Date(2012, 0,20, 5, 3, 59, 888), 'Friday')
make_format_equiv('l', new Date(2012, 0,21, 5, 3, 59, 888), 'Saturday')

// is leap year
make_format_equiv('L', new Date(2012, 0,20, 5, 3, 59, 888), true)
make_format_equiv('L', new Date(2011, 0,21, 5, 3, 59, 888), false)

// month, digit, leading zeros
make_format_equiv('m', new Date(2010, 0, 1, 18, 3, 59, 888), '01')
make_format_equiv('m', new Date(2010, 1, 1, 18, 3, 59, 888), '02')
make_format_equiv('m', new Date(2010, 2, 1, 18, 3, 59, 888), '03')
make_format_equiv('m', new Date(2010, 3, 1, 18, 3, 59, 888), '04')
make_format_equiv('m', new Date(2010, 4, 1, 18, 3, 59, 888), '05')
make_format_equiv('m', new Date(2010, 5, 1, 18, 3, 59, 888), '06')
make_format_equiv('m', new Date(2010, 6, 1, 18, 3, 59, 888), '07')
make_format_equiv('m', new Date(2010, 7, 1, 18, 3, 59, 888), '08')
make_format_equiv('m', new Date(2010, 8, 1, 18, 3, 59, 888), '09')
make_format_equiv('m', new Date(2010, 9, 1, 18, 3, 59, 888), '10')
make_format_equiv('m', new Date(2010,10, 1, 18, 3, 59, 888), '11')
make_format_equiv('m', new Date(2010,11, 1, 18, 3, 59, 888), '12')

// month, 3 letters, capfirst
make_format_equiv('M', new Date(2010, 0, 1, 18, 3, 59, 888), 'Jan')
make_format_equiv('M', new Date(2010, 1, 1, 18, 3, 59, 888), 'Feb')
make_format_equiv('M', new Date(2010, 2, 1, 18, 3, 59, 888), 'Mar')
make_format_equiv('M', new Date(2010, 3, 1, 18, 3, 59, 888), 'Apr')
make_format_equiv('M', new Date(2010, 4, 1, 18, 3, 59, 888), 'May')
make_format_equiv('M', new Date(2010, 5, 1, 18, 3, 59, 888), 'Jun')
make_format_equiv('M', new Date(2010, 6, 1, 18, 3, 59, 888), 'Jul')
make_format_equiv('M', new Date(2010, 7, 1, 18, 3, 59, 888), 'Aug')
make_format_equiv('M', new Date(2010, 8, 1, 18, 3, 59, 888), 'Sep')
make_format_equiv('M', new Date(2010, 9, 1, 18, 3, 59, 888), 'Oct')
make_format_equiv('M', new Date(2010,10, 1, 18, 3, 59, 888), 'Nov')
make_format_equiv('M', new Date(2010,11, 1, 18, 3, 59, 888), 'Dec')

// month, digit, no leading zeros
make_format_equiv('n', new Date(2010, 0, 1, 18, 3, 59, 888), '1')
make_format_equiv('n', new Date(2010, 1, 1, 18, 3, 59, 888), '2')
make_format_equiv('n', new Date(2010, 2, 1, 18, 3, 59, 888), '3')
make_format_equiv('n', new Date(2010, 3, 1, 18, 3, 59, 888), '4')
make_format_equiv('n', new Date(2010, 4, 1, 18, 3, 59, 888), '5')
make_format_equiv('n', new Date(2010, 5, 1, 18, 3, 59, 888), '6')
make_format_equiv('n', new Date(2010, 6, 1, 18, 3, 59, 888), '7')
make_format_equiv('n', new Date(2010, 7, 1, 18, 3, 59, 888), '8')
make_format_equiv('n', new Date(2010, 8, 1, 18, 3, 59, 888), '9')
make_format_equiv('n', new Date(2010, 9, 1, 18, 3, 59, 888), '10')
make_format_equiv('n', new Date(2010,10, 1, 18, 3, 59, 888), '11')
make_format_equiv('n', new Date(2010,11, 1, 18, 3, 59, 888), '12')

// month, AP format.
make_format_equiv('N', new Date(2010, 0, 1, 18, 3, 59, 888), 'Jan.')
make_format_equiv('N', new Date(2010, 1, 1, 18, 3, 59, 888), 'Feb.')
make_format_equiv('N', new Date(2010, 2, 1, 18, 3, 59, 888), 'March')
make_format_equiv('N', new Date(2010, 3, 1, 18, 3, 59, 888), 'April')
make_format_equiv('N', new Date(2010, 4, 1, 18, 3, 59, 888), 'May')
make_format_equiv('N', new Date(2010, 5, 1, 18, 3, 59, 888), 'June')
make_format_equiv('N', new Date(2010, 6, 1, 18, 3, 59, 888), 'July')
make_format_equiv('N', new Date(2010, 7, 1, 18, 3, 59, 888), 'Aug.')
make_format_equiv('N', new Date(2010, 8, 1, 18, 3, 59, 888), 'Sept.')
make_format_equiv('N', new Date(2010, 9, 1, 18, 3, 59, 888), 'Oct.')
make_format_equiv('N', new Date(2010,10, 1, 18, 3, 59, 888), 'Nov.')
make_format_equiv('N', new Date(2010,11, 1, 18, 3, 59, 888), 'Dec.')

// difference to greenwich time in hours (+0200)
make_format_equiv('O', {getTimezoneOffset:Function('return 0')}, '+0000')
make_format_equiv('O', {getTimezoneOffset:Function('return -10')}, '+0010')
make_format_equiv('O', {getTimezoneOffset:Function('return 10')}, '-0010')

// D, j M Y H:i:s O
make_format_equiv('r', new Date(2010,11, 1, 18, 3, 59, 888), utils.date(new Date(2010,11, 1, 18, 3, 59, 888), 'D, j M Y H:i:s O'))

// ordinal suffix for day of month, 2 chars, st, nd, rd, th
make_format_equiv('S', new Date(2010,11, 1, 18, 3, 59, 888), 'st')
make_format_equiv('S', new Date(2010,11, 2, 18, 3, 59, 888), 'nd')
make_format_equiv('S', new Date(2010,11, 3, 18, 3, 59, 888), 'rd')
make_format_equiv('S', new Date(2010,11, 4, 18, 3, 59, 888), 'th')
make_format_equiv('S', new Date(2010,11,11, 18, 3, 59, 888), 'th')
make_format_equiv('S', new Date(2010,11,21, 18, 3, 59, 888), 'st')

// number of days in a given month
make_format_equiv('t', new Date(2010, 0, 1, 18, 3, 59, 888), 31)
make_format_equiv('t', new Date(2010, 1, 1, 18, 3, 59, 888), 28)
make_format_equiv('t', new Date(2012, 1, 1, 18, 3, 59, 888), 29)  // <-- leap year!
make_format_equiv('t', new Date(2010, 2, 1, 18, 3, 59, 888), 31)
make_format_equiv('t', new Date(2010, 3, 1, 18, 3, 59, 888), 30)
make_format_equiv('t', new Date(2010, 4, 1, 18, 3, 59, 888), 31)
make_format_equiv('t', new Date(2010, 5, 1, 18, 3, 59, 888), 30)
make_format_equiv('t', new Date(2010, 6, 1, 18, 3, 59, 888), 31)
make_format_equiv('t', new Date(2010, 7, 1, 18, 3, 59, 888), 31)
make_format_equiv('t', new Date(2010, 8, 1, 18, 3, 59, 888), 30)
make_format_equiv('t', new Date(2010, 9, 1, 18, 3, 59, 888), 31)
make_format_equiv('t', new Date(2010,10, 1, 18, 3, 59, 888), 30)
make_format_equiv('t', new Date(2010,11, 1, 18, 3, 59, 888), 31)

// tzinfo
make_format_equiv('T', new Date(2010,11, 1, 18, 3, 59, 888), Date.prototype.tzinfo ? new Date(2010,11, 1, 18, 3, 59, 888).tzinfo().abbr || '???' : '???')

// seconds since the unix epoch
make_format_equiv('U', new Date(2010,11, 1, 18, 3, 59, 888), ~~(new Date(2010,11, 1, 18, 3, 59, 888)/1000))

// day of week, number, awesome
make_format_equiv('w', new Date(2012, 0,15, 5, 3, 59, 888), 0)
make_format_equiv('w', new Date(2012, 0,16, 5, 3, 59, 888), 1)
make_format_equiv('w', new Date(2012, 0,17, 5, 3, 59, 888), 2)
make_format_equiv('w', new Date(2012, 0,18, 5, 3, 59, 888), 3)
make_format_equiv('w', new Date(2012, 0,19, 5, 3, 59, 888), 4)
make_format_equiv('w', new Date(2012, 0,20, 5, 3, 59, 888), 5)
make_format_equiv('w', new Date(2012, 0,21, 5, 3, 59, 888), 6)

// ISO-8601 week number of year
test("test ISO-8601 week number of year", function(assert) {
  var first_day = +new Date(2012, 0, 1, 12, 30)
    , week = 1000 * 60 * 60 * 24 * 7


  for(var i = 0; i < 52; ++i) {
    assert.equal(utils.date(new Date(first_day + week * i), 'W'), ''+(i+1))
  }

  assert.end()
})


// year, 2 digits
make_format_equiv('y', new Date(1986, 0, 3, 5, 3, 59, 888), 86)
make_format_equiv('y', new Date(2000, 0, 3, 5, 3, 59, 888), '00')
make_format_equiv('y', new Date(2012, 0, 3, 5, 3, 59, 888), 12)

// year, 4 digits
make_format_equiv('Y', new Date(1986, 0, 3, 5, 3, 59, 888), 1986)
make_format_equiv('Y', new Date(2000, 0, 3, 5, 3, 59, 888), 2000)
make_format_equiv('Y', new Date(2012, 0, 3, 5, 3, 59, 888), 2012)

// day of year, 0-365
test("test day of year", function(assert) {
  var year = +new Date(new Date().getFullYear(), 0, 1, 0, 0)
    , day = 1000 * 60 * 60 * 24

  for(var i = 0; i < 365; ++i) { 
    assert.equal(utils.date(new Date(year + (day * i) + 1000), 'z'), ''+(i + 1))
  }

  assert.end()
})

// timezone offset in seconds (-43200 to 43200)
make_format_equiv('Z', new Date(2012, 0, 3, 5, 3, 59, 888), new Date(2012, 0, 3, 5, 3, 59, 888).getTimezoneOffset() * -60)
