var getGlobalObject, exportsObject;

try {
    exportsObject = exports;
    getGlobalObject = require('../namespace').getGlobalObject;
} catch(err) {}

(function(global) {
    var capfirst = function(callback, input) {
        var str = input.toString();
        callback(null, [str.slice(0,1).toUpperCase(), str.slice(1)].join(''));
    };

    var exporter = global.getExporter('filters.capfirst');
    exporter("capfirst", capfirst);
})(getGlobalObject('plate', exportsObject));
