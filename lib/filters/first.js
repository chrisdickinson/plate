var getGlobalObject, exportsObject;

try {
    exportsObject = exports;
    getGlobalObject = require('../namespace').getGlobalObject;
} catch(err) {}

(function(global) {
    var first = function(callback, input) {
        callback(null, input[0]);
    };
    var exporter = global.getExporter('filters.first');
    exporter("first", first);
})(getGlobalObject('plate', exportsObject));
