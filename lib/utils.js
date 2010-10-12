var getGlobalObject, exportsObject;

try {
    exportsObject = exports;
    getGlobalObject = require('./namespace').getGlobalObject;
} catch(err) {}

(function(global) {
    var SafeString = function(str) {
        this.str = str;
    };

    SafeString.prototype.toString = function() {
        return this.str;
    };

    var escapeHTML = function(data) {
        var html = data.toString();
        html = html.replace(/\&/g, '&amp;').
            replace(/</g, '&lt;').
            replace(/>/g, '&gt;').
            replace(/"/g, '&quot;').
            replace(/'/g, '&#39;');
        html.isSafe = true;
        return html;
    };

    exporter = global.getExporter('utils');
    exporter('escapeHTML', escapeHTML);
    exporter('SafeString', SafeString);
})(getGlobalObject('plate', exportsObject));
