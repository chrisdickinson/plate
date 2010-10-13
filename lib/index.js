exports.libraries = require('./libraries');

var main = require('./plate');

for(var name in main) if(main.hasOwnProperty(name)) { 
    exports[name] = main[name];
}

exports.plugins = {};
exports.plugins.loaders = {};
exports.plugins.loaders.filesystem = require('./plugins/loaders/filesystem');

