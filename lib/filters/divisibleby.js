var getGlobalObject, exportsObject;

try {
    exportsObject = exports;
    getGlobalObject = require('../namespace').getGlobalObject;
} catch(err) {}

(function(global) {
    var divisibleby = function(callback, input, num) {
        callback(null, input % parseInt(num, 10) == 0);
    };

    var exporter = global.getExporter('filters.divisibleby');
    exporter("divisibleby", divisibleby);
})(getGlobalObject('plate', exportsObject));
