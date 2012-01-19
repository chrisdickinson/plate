var utils = require('../utils');

exports.escape = function(callback, input) {
    callback(null, utils.escapeHTML(input))
};
