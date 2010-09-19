var plate = require('plate'),
    platelib = plate.libraries, 
    platoon = require('platoon');

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

        assert.throws(TypeError, function() {
            tpl.render();
        });

        assert.throws(TypeError, function() {
            tpl.render("");
        });

        assert.throws(TypeError, function() {
            tpl.render(Math.random());
        });

        tpl.render({}, function(err, data) {
            assert.ok(!err);
            assert.equal(tplstr, data);
        });

        tpl.render(new plate.Context({}), assert.async(function(err, data) {
            assert.ok(!err);
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
                        callback(null, value);
                    }
                };
            };
        lib.register(name, creationFunction);
        var tpl = new plate.Template("{% "+name+" %}", {tag_library:lib});
        tpl.render({}, function(err, data) {
            assert.equal(data, value);
        });
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
        assert.throws(Error, function() {
            tpl.render({}, function(err, data) {
                
            });
        });
    }
);
