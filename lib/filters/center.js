exports.center = function(callback, input, len, value) {
    var str = input.toString();
    value = value || ' ';
    len -= str.length;
    if(len < 0) { 
        callback(null, str);
    } else {
        var len_half = len/2.0,
            arr = [],
            idx = Math.floor(len_half);
        while(idx-- > 0) {
            arr.push(value);
        }
        arr = arr.join('');
        str = arr + str + arr;
        if((len_half - Math.floor(len_half)) > 0) {
            str = input.toString().length % 2 == 0 ? value + str : str + value;
        }
        callback(null, str);
    }
};
