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
        var tpl = new plate.Template("{% "+name+" %}", lib);
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

exports.TestWithTag = platoon.unit({},
    function(assert) {
        "Test that the with is enabled by default";
        assert.doesNotThrow(function() {
            var tpl = new plate.Template("{% with x as y %}\n\n{% endwith %}");
            tpl.render({}, function(){});
        });
    },
    function(assert) {
        "Test that with adds the variable into context";
        var context = {
            'value':~~(Math.random()*10)
        };
        var tpl = new plate.Template("{% with value as othervalue %}{{ othervalue }}{% endwith %}");
        tpl.render(context, assert.async(function(err, data) {
            assert.strictEqual(err, null);
            assert.equal(data, context.value.toString());
        }));
    },
    function(assert) {
        "Test that with does not leak context variables";
        var context = {
            'value':'hi'+~~(Math.random()*10),
            'othervalue':~~(Math.random()*10)+'yeah'
        };
        var tpl = new plate.Template("{% with value as othervalue %}{{ othervalue }}{% endwith %}{{ othervalue }}");
        tpl.render(context, assert.async(function(err, data) {
            assert.strictEqual(err, null);
            assert.equal(data, context.value.toString()+context.othervalue.toString());
        }));
    },
    function(assert) {
        "Test that an unclosed with statement throws an error";
        var tpl = new plate.Template("{% with x as y %}\n\n yeahhhhh");
        assert.throws(Error, function() {
            tpl.render({}, function(){});
        });
    }
);

exports.TestForTag = platoon.unit({},
    function(assert) {
        "Test that for is enabled by default";
        var tpl = new plate.Template("{% for x in y %}{% empty %}{% endfor %}");

        assert.doesNotThrow(function() {
            tpl.render({}, function(err, data) {});
        });
    },
    function(assert) {
        "Test that for does not bubble errors if it cannot find the appropriate arrayVar";
        var tpl = new plate.Template("{% for x in y %}{% endfor %}");

        tpl.render({}, assert.async(function(err, data) {
            assert.strictEqual(err, null);
        }));
    },
    function(assert) {
        "Test that entering a for loop provides the forloop.counter";
        var size = ~~(Math.random()*10)+1,
            arr = [],
            context = {};
        for(var i = 0; i < size; ++i) {
            arr.push(~~(Math.random()*10));
        }
        var tpl = new plate.Template("{% for x in y %}{{ forloop.counter }}\n{% endfor %}");
        context.y = arr;
        tpl.render(context, assert.async(function(err, data) {
            var items = data.split('\n').slice(0,-1);
            assert.equal(items.length, size);
            for(var j = 0; j < size; ++j) {
                assert.equal(items[j], j+1);
            }
        }));
    },
    function(assert) {
        "Test that entering a for loop provides the forloop.counter0";
        var size = ~~(Math.random()*10)+1,
            arr = [],
            context = {};
        for(var i = 0; i < size; ++i) {
            arr.push(~~(Math.random()*10));
        }
        var tpl = new plate.Template("{% for x in y %}{{ forloop.counter0 }}\n{% endfor %}");
        context.y = arr;
        tpl.render(context, assert.async(function(err, data) {
            var items = data.split('\n').slice(0,-1);
            assert.equal(items.length, size);
            for(var j = 0; j < size; ++j) {
                assert.equal(items[j], j);
            }
        }));
    },
    function(assert) {
        "Test that entering a for loop provides the forloop.revcounter";
        var size = ~~(Math.random()*10)+1,
            arr = [],
            context = {};
        for(var i = 0; i < size; ++i) {
            arr.push(~~(Math.random()*10));
        }
        var tpl = new plate.Template("{% for x in y %}{{ forloop.revcounter }}\n{% endfor %}");
        context.y = arr;
        tpl.render(context, assert.async(function(err, data) {
            var items = data.split('\n').slice(0,-1);
            assert.equal(items.length, size);
            for(var j = 0; j < size; ++j) {
                assert.equal(items[j], size-j);
            }
        }));
    },
    function(assert) {
        "Test that entering a for loop provides the forloop.revcounter0";
        var size = ~~(Math.random()*10)+1,
            arr = [],
            context = {};
        for(var i = 0; i < size; ++i) {
            arr.push(~~(Math.random()*10));
        }
        var tpl = new plate.Template("{% for x in y %}{{ forloop.revcounter0 }}\n{% endfor %}");
        context.y = arr;
        tpl.render(context, assert.async(function(err, data) {
            var items = data.split('\n').slice(0,-1);
            assert.equal(items.length, size);
            for(var j = 0; j < size; ++j) {
                assert.equal(items[j], size-(j+1));
            }
        }));
    },
    function(assert) {
        "Test that entering a for loop provides the forloop.first";
        var size = ~~(Math.random()*10)+1,
            arr = [],
            context = {};
        for(var i = 0; i < size; ++i) {
            arr.push(~~(Math.random()*10));
        }
        var tpl = new plate.Template("{% for x in y %}{{ forloop.first }}\n{% endfor %}");
        context.y = arr;
        tpl.render(context, assert.async(function(err, data) {
            var items = data.split('\n').slice(0,-1);
            assert.equal(items.length, size);
            for(var j = 0; j < size; ++j) {
                assert.equal(items[j], j === 0 ? 'true' : 'false');
            }
        }));
    },
    function(assert) {
        "Test that entering a for loop provides the forloop.last";
        var size = ~~(Math.random()*10)+1,
            arr = [],
            context = {};
        for(var i = 0; i < size; ++i) {
            arr.push(~~(Math.random()*10));
        }
        var tpl = new plate.Template("{% for x in y %}{{ forloop.last }}\n{% endfor %}");
        context.y = arr;
        tpl.render(context, assert.async(function(err, data) {
            var items = data.split('\n').slice(0,-1);
            assert.equal(items.length, size);
            for(var j = 0; j < size; ++j) {
                assert.equal(items[j], j === size-1 ? 'true' : 'false');
            }
        }));
    },
    function(assert) {
        "Test that entering a nested forloop provides forloop.parentloop";
        var size = ~~(Math.random()*10)+1,
            arr = [],
            context = {};
        for(var i = 0; i < size; ++i) {
            arr.push(~~(Math.random()*10));
        }
        var tpl = new plate.Template("{% for x in y %}{% for a in b %}{{ forloop.parentloop.counter }}:{{ forloop.counter }}\n{% endfor %}{% endfor %}");
        context.y = arr;
        context.b = arr;
        tpl.render(context, assert.async(function(err, data) {
            var items = data.split('\n').slice(0,-1);
            assert.equal(items.length, size*size);
            for(var x = 0; x < size; ++x) {
                for(var y = 0; y < size; ++y) {
                    assert.equal(items[x*size + y], [x+1,y+1].join(':'));
                }
            }
        }));
    },
    function(assert) {
        "Test that for unpacks variables as needed";
        var size = ~~(Math.random()*10)+1,
            arr = [],
            context = {};
        for(var i = 0; i < size; ++i) {
            arr.push([~~(Math.random()*10), ~~(Math.random()*10)]);
        }
        var tpl = new plate.Template("{% for x, y in z %}{{ x }},{{ y }}\n{% endfor %}"),
            context = {
                z:arr
            };

        tpl.render(context, assert.async(function(err, data) {
            var items = data.split('\n').slice(0,-1);

            assert.strictEqual(err, null);
            assert.equal(items.length, size);
            
            for(i = 0; i < size; ++i) {
                assert.equal(items[i], arr[i].join(','));
            }
        }));
    },
    function(assert) {
        "Test that for can reverse the contents of an array prior to iteration";
        var size = ~~(Math.random()*10)+1,
            arr = [],
            context = {};
        for(var i = 0; i < size; ++i) {
            arr.push([~~(Math.random()*10), ~~(Math.random()*10)]);
        }
        var tpl = new plate.Template("{% for x, y in z reversed %}{{ x }},{{ y }}\n{% endfor %}"),
            context = {
                z:arr
            };

        tpl.render(context, assert.async(function(err, data) {
            var items = data.split('\n').slice(0,-1);

            assert.strictEqual(err, null);
            assert.equal(items.length, size);
 
            for(i = 0; i < size; ++i) {
                assert.equal(items[i], arr[(size-1)-i].join(','));
            }
        }));
    }
);
