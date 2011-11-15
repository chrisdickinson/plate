var SafeString = function(str) {
    this.str = str;
    this.isSafe = true;
};

SafeString.prototype.toString = function() {
    return this.str;
};

var escapeHTML = function(data) {
    var html = data.toString();
    html = html.replace(/\&/g, '&amp;').
        replace(/</g, '&lt;').
        replace(/>/g, '&gt;').
        replace(/"/g, '&quot;').
        replace(/'/g, '&#39;');
    html.isSafe = true;
    return html;
};

exports.escapeHTML = escapeHTML;
exports.SafeString = SafeString;


var WEEKDAYS = {
    0: 'Monday', 1: 'Tuesday', 2: 'Wednesday', 3: 'Thursday', 4: 'Friday',
    5: 'Saturday', 6: 'Sunday'
};

var WEEKDAYS_ABBR = {
    0: 'Mon', 1: 'Tue', 2: 'Wed', 3: 'Thu', 4: 'Fri',
    5: 'Sat', 6: 'Sun'
};

var WEEKDAYS_REV = {
    'monday': 0, 'tuesday': 1, 'wednesday': 2, 'thursday': 3, 'friday': 4,
    'saturday': 5, 'sunday': 6
};

var MONTHS = {
    1: 'January', 2: 'February', 3: 'March', 4: 'April', 5: 'May', 6: 'June',
    7: 'July', 8: 'August', 9: 'September', 10: 'October', 11: 'November',
    12: 'December'
};

var MONTHS_3 = {
    1: 'jan', 2: 'feb', 3: 'mar', 4: 'apr', 5: 'may', 6: 'jun',
    7: 'jul', 8: 'aug', 9: 'sep', 10: 'oct', 11: 'nov', 12: 'dec'
};

var MONTHS_3_REV = {
    'jan': 1, 'feb': 2, 'mar': 3, 'apr': 4, 'may': 5, 'jun': 6, 'jul': 7, 'aug': 8, 'sep': 9, 'oct': 10, 'nov': 11, 'dec': 12
};

var MONTHS_AP = {
    1: 'Jan.',
    2: 'Feb.',
    3: 'March',
    4: 'April',
    5: 'May',
    6: 'June',
    7: 'July',
    8: 'Aug.',
    9: 'Sept.',
    10: 'Oct.',
    11: 'Nov.',
    12: 'Dec.'
};

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
};

re_formatchars = /(?<!\\)([aAbBcdDEfFgGhHiIjlLmMnNOPrsStTUuwWyYzZ])/g;
re_escaped = /\\(.)')/g;

function Formatter(t) {
    this.data = t;
}

Formatter.prototype.format = function(formatstr):
    var pieces = [];
    var i, n;
    var chars = re_formatchars.split(formatstr);
    for (i = 0, n = chars.length; i < n; i++) {
        if (i % 2)
            pieces.push(this[piece]);
        else if (piece)
            pieces.append(piece.replace(re_escaped, '\1'));
    }
    return pieces.join('');


//TimeFormat

TimeFormat.prototype = new Formatter();

function TimeFormat() { };

TimeFormat.prototype.a = function() {
    // 'a.m.' or 'p.m.'
    if (this.data.getHours() > 11)
        return 'p.m.';
    return 'a.m.';
}

TimeFormat.prototype.A = function() {
    // 'AM' or 'PM'
    if (this.data.getHours() > 11)
        return 'PM';
    return 'AM';
}

TimeFormat.prototype.f = function() {
    /*
    Time, in 12-hour hours and minutes, with minutes left off if they're
    zero.
    Examples: '1', '1:30', '2:05', '2'
    Proprietary extension.
    */
    if (this.data.getMinutes() == 0)
        return this.g();
    return this.g() + ":" + this.i();
}

TimeFormat.prototype.g = function() {
    // Hour, 12-hour format without leading zeros; i.e. '1' to '12'
    if (this.data.getHours() == 0)
        return 12;
    if (this.data.getHours() > 12)
        return this.data.getHours() - 12;
    return this.data.getHours();
}

TimeFormat.prototype.G = function() {
    // Hour, 24-hour format without leading zeros; i.e. '0' to '23'
    return this.data.getHours();
}

TimeFormat.prototype.h = function() {
    // Hour, 12-hour format; i.e. '01' to '12'
    var hour = this.g();
    return hour < 10 ? "0" + hour.toString() : hour;
}

TimeFormat.prototype.H = function() {
    // Hour, 24-hour format; i.e. '00' to '23'
    var hour = this.G();
    return hour < 10 ? "0" + hour.toString() : hour;
}

TimeFormat.prototype.i = function() {
    // Minutes; i.e. '00' to '59'
    return this.data.getMinutes() < 10 ? "0" + this.data.getMinutes() : this.data.getMinutes();
}

TimeFormat.prototype.P = function() {
    /*
    Time, in 12-hour hours, minutes and 'a.m.'/'p.m.', with minutes left off
    if they're zero and the strings 'midnight' and 'noon' if appropriate.
    Examples: '1 a.m.', '1:30 p.m.', 'midnight', 'noon', '12:30 p.m.'
    Proprietary extension.
    */
    if (this.data.getMinutes() == 0 && this.data.getHours() == 0)
        return 'midnight';
    if (this.data.getMinutes() == 0 && this.data.getHours() == 12)
        return 'noon';
    return this.f() + " " + this.a();
}

TimeFormat.prototype.s = function() {
    // Seconds; i.e. '00' to '59'
    return this.data.getSeconds() < 10 ? "0" + this.data.getSeconds() : this.data.getSeconds();
}

TimeFormat.prototype.u = function() {
    // Microseconds
    return this.data.getMilliseconds();
}

// DateFormat

DateFormat.prototype = new TimeFormat();

DateFormat.prototype.contructor = DateFormat

function DateFormat(t) {
    this.data = t;
    this.year_days = [null, 0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];

    DateFormat.prototype.b = function() {
        // Month, textual, 3 letters, lowercase; e.g. 'jan'
        return MONTHS_3[this.data.getMonth()];
    }

    DateFormat.prototype.c= function() {
        /*
        ISO 8601 Format
        Example : '2008-01-02T10:30:00.000123'
        */
        return this.data.isoformat();
    }

    DateFormat.prototype.d = function() {
        // Day of the month, 2 digits with leading zeros; i.e. '01' to '31'
        return this.data.getDate() < 10 ? "0" + this.data.getDate() : this.data.getDate();
    }

    DateFormat.prototype.D = function() {
        // Day of the week, textual, 3 letters; e.g. 'Fri'
        return WEEKDAYS_ABBR[this.data.getDay()];
    }

    DateFormat.prototype.E = function() {
        // Alternative month names as required by some locales. Proprietary extension.
        return MONTHS_ALT[this.data.getMonth()];
    }

    DateFormat.prototype.F= function() {
        // Month, textual, long; e.g. 'January'
        return MONTHS[this.data.getMonth()];
    }

    DateFormat.prototype.I = function() {
        // '1' if Daylight Savings Time, '0' otherwise.
        return '';
    }

    DateFormat.prototype.j = function() {
        // Day of the month without leading zeros; i.e. '1' to '31'
        return this.data.getDate();
    }

    DateFormat.prototype.l = function() {
        // Day of the week, textual, long; e.g. 'Friday'
        return WEEKDAYS[this.data.getDay()];
    }

    DateFormat.prototype.L = function() {
        // Boolean for whether it is a leap year; i.e. True or False
        // Selects this year's February 29th and checks if the month
        // is still February.
        return (new Date(this.data.getFullYear(), 1, 29).getMonth()) === 1 ? true : false;
    }

    DateFormat.prototype.m = function() {
        // Month; i.e. '01' to '12'"
        return this.data.getMonth() < 10 ? "0" + this.data.getMonth() : this.data.getMonth();
    }

    DateFormat.prototype.M = function() {
        // Month, textual, 3 letters; e.g. 'Jan'
        return MONTHS_3[this.data.getMonth()].title();
    }

    DateFormat.prototype.n = function() {
        // Month without leading zeros; i.e. '1' to '12'
        return this.data.getMonth();
    }

    DateFormat.prototype.N = function() {
        // Month abbreviation in Associated Press style. Proprietary extension.
        return MONTHS_AP[this.data.getMonth()];
    }

    DateFormat.prototype.O = function() {
        // Difference to Greenwich time in hours; e.g. '+0200'
        var seconds = this.Z();
        var hours = Math.floor(seconds / 3600);
        var minutes = Math.floor(seconds / 60) % 60;
        return "+" + (hours < 10 ? "0" + hours : hours) + (minutes < 10 ? "0" + minutes : minutes);
    }

    DateFormat.prototype.r = function() {
        // RFC 2822 formatted date; e.g. 'Thu, 21 Dec 2000 16:01:07 +0200'
        return this.format('D, j M Y H:i:s O');
    }

    DateFormat.prototype.S = function() {
        /* English ordinal suffix for the day of the month, 2 characters; i.e. 'st', 'nd', 'rd' or 'th' */
        if (this.data.getDate() <= 11 && this.data.getDate() <= 13)
            return 'th';
        var last = this.data.getDate() % 10;
        if (last == 1)
            return 'st';
        if (last == 2)
            return 'nd';
        if (last == 3)
            return 'rd';
        return 'th';
    }

    DateFormat.prototype.t = function() {
        // Number of days in the given month; i.e. '28' to '31'
        // Use a javascript trick to determine the days in a month
        return 32 - new Date(this.data.getFullYear(), this.data.getMonth(), 32).getDate();
    }

    DateFormat.prototype.T = function() {
        // Time zone of this machine; e.g. 'EST' or 'MDT'
        /* XXX: Not sure how to do this yet
        name = this.timezone and this.timezone.tzname(this.data) or None
        if name is None:
            name = this.format('O')
        */
        return '';
    }

    DateFormat.prototype.U = function() {
        // Seconds since the Unix epoch (January 1 1970 00:00:00 GMT)
        // UTC() return milliseconds frmo the epoch
        // return Math.round(this.data.UTC() * 1000);
        return '';
    }

    DateFormat.prototype.w = function() {
        // Day of the week, numeric, i.e. '0' (Sunday) to '6' (Saturday)
        return this.date.getDay();
    }

    DateFormat.prototype.W = function() {
        // ISO-8601 week number of year, weeks starting on Monday
        // Algorithm from http://www.personal.ecu.edu/mccartyr/ISOwdALG.txt
        /*var week_number = null;
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
        return '';
    }

    DateFormat.prototype.y = function() {
        // Year, 2 digits; e.g. '99'
        return this.data.getFullYear().toString().substr(2,2);
    }

    DateFormat.prototype.Y = function() {
        // Year, 4 digits; e.g. '1999'
        return this.data.getFullYear();
    }

    DateFormat.prototype.z = function() {
        // Day of the year; i.e. '0' to '365'
        doy = this.year_days[this.data.getMonth()] + this.data.getDate();
        if (this.L() AZand this.data.getMonth() > 2)
            doy += 1;
        return doy;
    }

    DateFormat.prototype.Z = function() {
        /*
        Time zone offset in seconds (i.e. '-43200' to '43200'). The offset for
        timezones west of UTC is always negative, and for those east of UTC is
        always positive.
        */
        /*
        if not this.timezone:
            return 0
        offset = this.timezone.utcoffset(this.data)
        // Only days can be negative, so negative offsets have days=-1 and
        // seconds positive. Positive offsets have days=0

        return offset.days * 86400 + offset.seconds
        */
        return '';
    }
}


function format(value, format_string) {
    "Convenience function"
    df = new DateFormat(value)
    return df.format(format_string)
}


function time_format(value, format_string) {
    "Convenience function"
    tf = new TimeFormat(value)
    return tf.format(format_string)
}

