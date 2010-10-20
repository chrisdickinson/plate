var path = require('path'),
    plate = require('plate'),
    fs = require('fs');

var Loader = function(directories) {
    this.directories = directories || [];
    this.cache = {};
    this.createTemplate = function(str) {
        return new plate.Template(str);
    };
};

Loader.prototype.setTemplateCreation = function(creation) {
    this.createTemplate = creation;
};

Loader.prototype.addDirectory = function(dir) {
    this.directories.push(dir);
};

Loader.prototype.lookup = function(name, callback) {
    if(this.cache[name]) {
        callback(null, this.cache[name]);
    } else {
        var length = this.directories.length,
            index = -1,
            self = this,
            eterator = function(err, data) {
                var callee = arguments.callee;
                if(data) {
                    self.cache[name] = self.createTemplate(data.toString('utf8'));
                    callback(null, self.cache[name]);
                } else {
                    ++index;
                    if(index < length) {
                        setTimeout(function() {
                            fs.readFile(path.join(self.directories[index], name), callee);
                        }, 0);
                    } else {
                        callback(new Error("Could not find '"+name+"'"), null);
                    }
                }
            };
        eterator(null, null);
    }
};

Loader.prototype.getPlugin = function() {
    var self = this;
    return function(name, callback) {
        self.lookup(name, callback);
    };
};

exports.Loader = Loader;
