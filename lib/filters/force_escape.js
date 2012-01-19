var utils = require('../utils');

exports.force_escape = function(callback, input) {
    callback(null, utils.escapeHTML(''+input))
};
