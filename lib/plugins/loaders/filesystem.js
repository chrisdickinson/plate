var path = require('path')
  , fs = require('fs')
  , plate = require('../..')
  , Promise = require('../../promise')

var Loader = function(directories) {
  this.directories = directories || []
  this.cache = {}
  this.createTemplate = function(str) {
    return new plate.Template(str)
  }
}

Loader.prototype.setTemplateCreation = function(creation) {
  this.createTemplate = creation
}

Loader.prototype.addDirectory = function(dir) {
  this.directories.push(dir)
}

Loader.prototype.lookup = function(name, dirs) {
  var self = this
    , length = self.directories.length
    , promise
    , dir

  dirs = dirs || self.directories.slice()

  if(self.cache[name]) {
    return self.cache[name]
  } 

  // XXX: should throw error here.
  if(!dirs.length)
    return null

  promise = new Promise

  dir = path.join(dirs.shift(), name)

  fs.readFile(dir, 'utf8', gotDirectory)

  return promise

  function gotDirectory(err, data) {
    promise.resolve(err ? self.lookup(name, dirs) : self.cache[name] = self.createTemplate(data)) 
  }

}

Loader.prototype.getPlugin = function() {
  var self = this

  return function(name) {
    return self.lookup(name)
  }
}

exports.Loader = Loader
