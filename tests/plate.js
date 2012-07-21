var plate = require('../index') || window.plate
  , platelib = require('../lib/libraries') || window.plate.libraries
  , platoon = require('platoon') || window.platoon

exports.TestTemplateAPI = platoon.unit({},
    function(assert) {
        "Test the exception cases of plate.Template.";
        assert.throws(TypeError, function() {
            var tpl = new plate.Template(2);
        });
        assert.throws(TypeError, function() {
            var tpl = new plate.Template();
        });
        
        var tplstr = "random-"+Math.random(),
            tpl = new plate.Template(tplstr);

        assert.throws(Error, function() {
            tpl.render();
        });

        assert.throws(TypeError, function() {
            tpl.render("");
        });

        assert.throws(TypeError, function() {
            tpl.render(Math.random());
        });

        tpl.render({}, function(err, data) {
            assert.fail(err);
            assert.equal(tplstr, data);
        });

        tpl.render(new plate.Context({}), assert.async(function(err, data) {
            assert.fail(err);
            assert.equal(data, tplstr);
        }));
    },
    function(assert) {
        "Test that encountering a {% tag %} will lookup that tag in the provided library";
        var lib = new platelib.Library(),
            name = "random_"+~~Math.random(),
            value = Math.random().toString(),
            creationFunction = function(token, parser) {
                return {
                    render:function(context, callback) {
                        return value
                    }
                };
            };
        lib.register(name, creationFunction);
        var tpl = new plate.Template("{% "+name+" %}", {tag_library:lib});
        tpl.render({}, assert.async(function(err, data) {
            assert.equal(data, value);
        }));
    },
    function(assert) {
        "Test that filter nodes render as expected.";
        var testContext = {
            value:Math.random().toString(),
            deep:{
                value:Math.random().toString(),
                method:function(callback) {
                    return "lobsters";
                },
                delayed:function(callback) {
                    setTimeout(function() {
                        callback(null, "delayed");
                    }, 10);
                }
            }
        };
        var tplValue = new plate.Template("{{ value }}"),
            tplDeep = new plate.Template("{{ deep.value }}"),
            tplMethod = new plate.Template("{{ deep.method }}");
            tplDelayed = new plate.Template("{{ deep.delayed }}");

        tplValue.render(testContext, function(err, data) {
            assert.equal(err, null);
            assert.equal(data, testContext.value);
        });

        tplDeep.render(testContext, function(err, data) {
            assert.equal(err, null);
            assert.equal(data, testContext.deep.value);
        });

        tplMethod.render(testContext, function(err, data) {
            assert.equal(err, null);
            assert.equal(data, testContext.deep.method());
        });

        tplDelayed.render(testContext, assert.async(function(err, data) {
            assert.equal(err, null);
            assert.equal('delayed', data);
        }));
    },
    function(assert) {
        "Test that hitting an unknown tag triggers an error.";
        var tpl = new plate.Template("{% lol dne %}");
        tpl.render({}, assert.async(function(err, data) {
            assert.strictEqual(data, null);
            assert.isInstance(err, Error); 
        }));
    }
);

exports.TestTemplateMetaAPI = platoon.unit({},
    function(assert) {
      "Test that autoregistration of the tag library works as expected.";
      var expected = ~~(Math.random()*100);
      var tag = {
        render:function(context, ready) {
          return expected
        }
      }; 
      plate.Template.Meta.registerTag('lolwut', function() { return tag; });

      assert.doesNotThrow(function() {
        var tpl = new plate.Template('{% lolwut %}');
        tpl.render({}, assert.async(function(err, data) {
          assert.equal(data, ''+expected);
        }));
      });
    },
    function(assert) {
      "Test that autoregistration of the filter library works as expected.";
      var expected = ~~(Math.random()*100);
      var testFilter = function(input) {
        return expected
      };
      plate.Template.Meta.registerFilter('lolol', testFilter);

      assert.doesNotThrow(function() {
        var tpl = new plate.Template('{{ anything|lolol }}');

        tpl.render({anything:1}, assert.async(function(err, data) {
          assert.equal(data, ''+expected);
        }));
      });
    },
    function(assert) {
      "Test that autoregistration of the plugin library works as expected.";
      var expected = ~~(Math.random()*100);
      var plugin = function() {
        return ''+expected;
      };
      plate.Template.Meta.registerPlugin('test_plugin', plugin);

      var test_node = {
        plugin: plugin
      , render: render
      , parse: parse
      }

      function render(context, ready) {
        return this.plugin();
      };
      function parse(contents, parser) {
        return test_node
      };
      plate.Template.Meta.registerTag('test_plugin_tag', parse);

      assert.doesNotThrow(function() {
        var tpl = new plate.Template('{% test_plugin_tag %}');
        tpl.render({}, function(err, data) {
          assert.equal(data, ''+expected);
        });
      });
    }
);

exports.TestFailureCases = platoon.unit({}
  , test_lookup_failure
  , test_lookup_async_failure
  , test_filter_failure
)

function test_lookup_failure(assert) {
  "Test obj.attr lookup failure (synchronous)."

  var tpl = new plate.Template('test {{ obj.attr }}')

  tpl.render({obj:null}, assert.async(function(err, data) {
    assert.ok(!err)

    assert.equal(data, 'test ')
  }))

  tpl.render({obj:{attr:null}}, assert.async(function(err, data) {
    assert.ok(!err)

    assert.equal(data, 'test ')
  }))

  tpl.render({obj:{attr:Function('throw new Error')}}, assert.async(function(err, data) {
    assert.ok(!err)

    assert.equal(data, 'test ')
  }))
}

function test_lookup_async_failure(assert) {
  "Test obj.attr lookup failure (asynchronous)."
  var tpl = new plate.Template('test {{ obj.attr }}')
    , make_return = function(what) {
        return function(ready) { setTimeout(ready, 0, what) }
      }

  tpl.render({obj:make_return(null)}, assert.async(function(err, data) {
    assert.ok(!err)

    assert.equal(data, 'test ')
  }))

  tpl.render({obj:{attr:make_return(null)}}, assert.async(function(err, data) {
    assert.ok(!err)

    assert.equal(data, 'test ')
  }))

}

function test_filter_failure(assert) {
  "Test obj|attr failure (synchronous and async)."
  var library = new platelib.Library
    , sync_filter_tpl
    , async_filter_tpl
    , piped_filter_tpl

  library.register('sync_filter', sync_filter)
  library.register('async_filter', async_filter)
  library.register('okay_filter', okay_filter)

  sync_filter_tpl = new plate.Template('{{ obj|sync_filter }}', {filter_library:library})
  async_filter_tpl = new plate.Template('{{ obj|async_filter }}', {filter_library:library})
  piped_filter_tpl = new plate.Template('{{ obj|sync_filter|okay_filter }}', {filter_library:library})

  sync_filter_tpl.render({obj:null}, assert.async(function(err, data) {
    assert.equal(data, '')
  }))

  piped_filter_tpl.render({obj:null}, assert.async(function(err, data) {
    assert.equal(data, '')
  }))


  function sync_filter(input) {
    return input.try_something_that_doesnt_exist()
  }

  function async_filter(input, ready) {
    setTimeout(function() {
      ready(null, input.try_something_that_doesnt_exist())
    }, 0)
  }

  function okay_filter(input) {
    return input+' okay'
  }
}
