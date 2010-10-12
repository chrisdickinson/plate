var getGlobalObject, exportsObject;

try {
    exportsObject = exports;
    getGlobalObject = require('../namespace').getGlobalObject;
} catch(err) {}

(function(global) {
    var cut = function(callback, input, value) {
        var str = input.toString();
        callback(null, str.replace(new RegExp(value, "g"), ''));
    };

    var exporter = global.getExporter('filters.cut');
    exporter("cut", cut);
})(getGlobalObject('plate', exportsObject));
