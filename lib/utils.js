var SafeString = function(str) {
    this.str = str;
    this.isSafe = true;
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

exports.escapeHTML = escapeHTML;
exports.SafeString = SafeString;
