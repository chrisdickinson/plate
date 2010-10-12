var getGlobalObject, exportsObject;

try {
    exportsObject = exports;
    getGlobalObject = require('../namespace').getGlobalObject;
} catch(err) {}

(function(global) {
    var _default = function(callback, input, def) {
        input ? callback(null, input) : callback(null, def);
    };

    var exporter = global.getExporter('filters.default');
    exporter("_default", _default);
})(getGlobalObject('plate', exportsObject));
