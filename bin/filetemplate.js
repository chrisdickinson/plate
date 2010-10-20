(function() {
    var require = function(what) {
        what = what.split('/');
        var where = window;
        while(what.length) {
            where = where[what.shift()];
        };
        return where;
    };
    var getExports = function(file) {
        var where = window,
            what = file == 'index' ? [] : file.split('/'),
            incoming;
        what.unshift('plate');
        while(what.length) {
            incoming = what.shift();
            if(!where[incoming]) {
                where[incoming] = {};
            }
            where = where[incoming];
        }
        return where;
    };

    {% for filename, file in data %}
        (function(exports) {
            {{ file|safe }}
        })(getExports('{{ filename }}'));
    {% endfor %}
})();
