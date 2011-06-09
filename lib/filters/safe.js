var utils = require('../utils');

exports.safe = function(callback, input) {
    callback(null, new utils.SafeString(input));
};
