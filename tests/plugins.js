
if(typeof window === 'undefined') {
  var plate = require('plate'),
      path = require('path'),
      platoon = require('platoon'),
      libraries = require('plate/lib/libraries'),
      filesystem = require('plate/lib/plugins/loaders/filesystem');

  exports.TestOfFilesystemLoader = platoon.unit({}, 
      function(assert) {
          "Test that the filesystem loader returns templates from filesystem.";
          var loader = new filesystem.Loader(
                  [path.join(process.cwd(), 'tests', 'templates')]
              );
          loader.lookup('test.html', assert.async(function(err, template) {
              assert.isInstance(template, plate.Template);
          }));
      },
      function(assert) {
          "Test that the filesystem loader works with the extends tag";
          var lib = new libraries.Library(),
              loader = new filesystem.Loader( 
                  [path.join(process.cwd(), 'tests', 'templates')]
              );

          lib.register('loader', loader.getPlugin());
          loader.setTemplateCreation(function(data) {
              return new plate.Template(data, {
                  plugin_library:lib
              });
          });

          loader.lookup('test_child.html', assert.async(function(err, template) {
              assert.isInstance(template, plate.Template);
              template.render({}, assert.async(function(err, data) {
                  assert.equal(data, "hello world!\n");
              }));
          }));
      }
  );
}
