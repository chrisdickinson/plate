var getGlobalObject, exportsObject;

try {
    exportsObject = exports;
    getGlobalObject = require('../namespace').getGlobalObject;
} catch(err) {}

(function(global) {
    var addslashes = function(callback, input) {
        callback(null, input.toString().replace(/'/g, "\\'"));
    };

    var exporter = global.getExporter('filters.addslashes');
    exporter("addslashes", addslashes);
})(getGlobalObject('plate', exportsObject));
