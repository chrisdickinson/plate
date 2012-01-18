var format = require('../utils').format
  
exports.date = function(callback, input, value) {
    if (value === undefined)
        value = 'N j, Y';
    callback(null, format(input.getFullYear ? input : new Date(input), value));
}
