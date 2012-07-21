if(typeof window !== 'undefined') {
  return
}

var plate = require('../index'),
    path = require('path'),
    platoon = require('platoon'),
    libraries = require('../lib/libraries'),
    filesystem = require('../lib/plugins/loaders/filesystem');

exports.TestOfFilesystemLoader = platoon.unit({}, 
    function(assert) {
        "Test that the filesystem loader returns templates from filesystem.";
        var loader = new filesystem.Loader(
                [path.join(__dirname, 'templates')]
            );

        var p = loader.lookup('test.html')
        
        p.once('done', assert.async(function(template) {
            assert.isInstance(template, plate.Template);
        }));
    },
    function(assert) {
        "Test that the filesystem loader works with the extends tag";
        var lib = new libraries.Library(),
            loader = new filesystem.Loader( 
                [path.join(__dirname, 'templates')]
            );

        lib.register('loader', loader.getPlugin());
        loader.setTemplateCreation(function(data) {
            return new plate.Template(data, {
                plugin_library:lib
            });
        });

        loader.lookup('test_child.html').once('done', assert.async(function(template) {
            assert.isInstance(template, plate.Template);
            template.render({}, assert.async(function(err, data) {
                assert.equal(data, "hello world!\n");
            }));
        }));
    }
);
