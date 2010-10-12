var CommonJSNamespace = function(exportsObject) {
    this.exportsObject = exportsObject;
};

CommonJSNamespace.prototype.require = function(file) {
    file = './' + file.replace(/\./g, '/');
    return require(file);
};

CommonJSNamespace.prototype.getExporter = function(name) {
    var self = this;
    return function(name, obj) {
        self.exportsObject[name] = obj;
    };
};

var BrowserNamespace = function(namespace) {
    window[namespace] = window[namespace] || {};
    this.namespace = namespace;
};

BrowserNamespace.prototype.require = function(file) {
    var parts = file.split('.'),
        part = window[this.namespace];

    if(file && file !== this.namespace) {
        while(parts.length) {
            part = part[parts.shift()];
        }
    }
    return part;
};

BrowserNamespace.prototype.getExporter = function(name) {
    if(!name) {
        var self = this;
        return function(incoming, obj) {
            window[self.namespace][incoming] = obj;
        };
    }
    var parts = name.split('.'),
        part = window[this.namespace],
        incoming;
    while(parts.length) {
        incoming = parts.shift();
        if(incoming.length) {
            if(part[incoming] === undefined) {
                part[incoming] = {};
            }
            part = part[incoming];
        }
    }
    return function(incoming, obj) {
        part[incoming] = obj;
    };
};

getGlobalObject = function(namespace, exportsObject) {
    if(exportsObject) {
        return new CommonJSNamespace(exportsObject);
    }
    return new BrowserNamespace(namespace);
}; 


try {
    exports.getGlobalObject = getGlobalObject;
} catch(err) {
    try {
        window.getGlobalObject = getGlobalObject;
    } catch(err) {

    }
}

