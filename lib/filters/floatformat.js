exports.floatformat = function(callback, input, val) {
    val = val || -1;
    val = parseInt(val, 10);

    var isPositive = val > 0.0,
        asNumber = (new Number(input)).valueOf(),
        absValue = isPositive ? val : val * -1.0,
        pow = Math.pow(10, val),
        asString;

    // basically shift the number left val digits, chop off decimal, shift back
    asNumber = parseInt(pow * asNumber) / pow;      
    asString = asNumber.toString();

    if(isPositive) {
        var split = asString.split('.'),
            decimal = split.length > 1 ? split[1] : '';

        while(decimal.length <= val) {
            decimal += '0';
        }
        asString = [split[0], decimal].join('.');
    }
    callback(null, asString);
};
