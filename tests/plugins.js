if(typeof window === 'undefined') {

var plate = require('../index'),
    path = require('path'),
    test = require('tape'),
    libraries = require('../lib/libraries'),
    filesystem = require('../lib/plugins/loaders/filesystem'),
    mocktimeout = require('./mocktimeout')

test("Test that the filesystem loader returns templates from filesystem.", function(assert) {
        
        var loader = new filesystem.Loader(
                [path.join(__dirname, 'templates')]
            );

        var p = loader.lookup('test.html')
        
        p.once('done', function(template) {
            assert.ok(template instanceof plate.Template);
            assert.end()
        });
    }
)

test("Test that the filesystem loader works with the extends tag", function(assert) {
        
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

        loader.lookup('test_child.html').once('done', function(template) {
            assert.ok(template instanceof plate.Template);
            template.render({}, function(err, data) {
                assert.equal(data, "hello world!\n");

                assert.end()
            });
        });
    }
)

}
