var getGlobalObject, exportsObject;

try {
    exportsObject = exports;
    getGlobalObject = require('../namespace').getGlobalObject;
} catch(err) {}

(function(global) {
    var utils = global.require('utils');

    var safe = function(callback, input) {
        callback(null, new utils.SafeString(input));
    };

    var exporter = global.getExporter('filters.safe');
    exporter("safe", safe);
})(getGlobalObject('plate', exportsObject));
