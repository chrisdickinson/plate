if(typeof window === 'undefined') {
  var plate = require('../index')
    , utils = require('../lib/utils')
    , platelib = require('../lib/libraries')
    , platoon = require('platoon')
} else {
  var plate = window.plate
    , platoon = window.platoon
  var platelib = plate.libraries
    , utils = plate.utils
}

var format = utils.format

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
        tpl.render({}, assert.async(function(err, data){
            assert.strictEqual(data, null);
            assert.isInstance(err, Error);
        }));
    }
);

exports.TestIfTag = platoon.unit({},
    function(assert) {
        "Test that if tag is enabled by default";
        var tpl = new plate.Template("{% if x %}{% endif %}");
        assert.doesNotThrow(function() {
            tpl.render({}, function(err, data) {});
        });
    },
    function(assert) {
        "Test that =, ==, and != work";
        var pairs = [[~~(Math.random()*10), ~~(10 + Math.random()*10)],
                    [3, 3],
                    ['string', 'string']],
            context = {
                pairs:pairs
            },
            tpl = new plate.Template("{% for lhs, rhs in pairs %}"+
                                     "{% if lhs = rhs %}={% else %}!={% endif %}\n"+
                                     "{% if lhs == rhs %}={% else %}!={% endif %}\n"+
                                     "{% if lhs != rhs %}!={% else %}={% endif %}\n"+
                                     "{% endfor %}"),
            expect = [
                '!=', '!=', '!=',
                '=', '=', '=',
                '=', '=', '='
            ].join('\n')+'\n';

        tpl.render(context, assert.async(function(err, data) {
            assert.strictEqual(expect, data);
        }));
    },
    function(assert) {
        "Test that in and not in work";
        var tpl = new plate.Template("{% for x,y,z in list %}{% if x in y %}y{% endif %}{% if x not in y %}n{% endif %}:{{ z }}\n{% endfor %}"),
            tests = [
                [[1,2], [1,2,3], 'n'],
                [[1,2], [[1,2],3], 'y'],
                [1, {1:'something'}, 'y'],
                ['hi', 'asahi', 'y'],
                ['no', 'yes', 'n']
            ];
        tpl.render({list:tests}, assert.async(function(err, data) {
            var items = data.split('\n').slice(0, -1);
            while(items.length) {
                var v = items.shift().split(':');
                assert.equal(v[0],v[1]);
            }
        }));
    },
    function(assert) {
        "Test that >, <, <=, and >= work";
        var pairs = [[~~(Math.random()*10), ~~(10 + Math.random()*10)],
                    [3, 3],
                    ['string', 'string']],
            context = {
                pairs:pairs
            },
            tpl = new plate.Template("{% for lhs, rhs in pairs %}"+
                                     "{% if lhs < rhs %}<{% else %}>={% endif %}\n"+
                                     "{% if lhs <= rhs %}<={% else %}>{% endif %}\n"+
                                     "{% if lhs > rhs %}>{% else %}<={% endif %}\n"+
                                     "{% if lhs >= rhs %}>={% else %}<{% endif %}\n"+
                                     "{% endfor %}"),
            expect = [
                '<', '<=', '<=', '<',
                '>=', '<=', '<=', '>=',
                '>=', '<=', '<=', '>='
            ].join('\n')+'\n';

        tpl.render(context, assert.async(function(err, data) {
            assert.strictEqual(expect, data);
        }));
    }
);


exports.TestExtendsAndBlockTags = platoon.unit({},
    function(assert) {
        "Test that extends does not trigger a parser error.";
        var tpl = new plate.Template("{% extends whatever %}");
        assert.doesNotThrow(function() {
            tpl.getNodeList();
        });
    },
    function(assert) {
        "Test that extending a template produces super great results.";
        var base = new plate.Template("hey {% block who %}<b>gary</b>{% endblock %}, how are you?"),
            child = new plate.Template("{% extends base %}{% block who %}{{ block.super }} busey{% endblock %}"),
            ctxt = { base:base };
        child.render(ctxt, function(err, data) {
            assert.equal(data, "hey <b>gary</b> busey, how are you?");
        });
    },
    function(assert) {
        "Test that multilevel extending works";
        var base = new plate.Template("hey {% block firstname %}{% endblock %} {% block lastname %}{% endblock %}"+
                                        ", {% block greeting %}hi there{% endblock %}"),
            child1 = new plate.Template("{% extends base %}{% block firstname %}gary{% endblock %}"),
            child2 = new plate.Template("{% extends child %}{% block firstname %}{{ block.super }} m.{% endblock %}"+
                                        "{% block lastname %}busey{% endblock %}"),
            context = {
                base:base,
                child:child1
            };
        child2.render(context, function(err, data) {
            assert.equal(data, "hey gary m. busey, hi there");
        });
    }
);

exports.TestIncludeTag = platoon.unit({},
    function(assert) {
        "Test that include does not trigger a parser error";
        var tpl = new plate.Template("{% include something %}");
        assert.doesNotThrow(function() {
            tpl.getNodeList();
        });
    },
    function(assert) {
        "Test that include will include the contents of the included template into the includer.";
        var random = "random-"+Math.random(),
            include = new plate.Template(random),
            tpl = new plate.Template("{% include tpl %}"),
            context = { tpl:include };
        tpl.render(context, function(err, data) {
            assert.equal(data, random);
        });
    },
    function(assert) {
        "Test that the loader plugin works with include";
        if(typeof window !== 'undefined')
          return;

        var loader = function(name, callback) {
                setTimeout(function() {
                    callback(null, new plate.Template(name));
                }, ~~(Math.random()*10));
            },
            pluginLib = function() {
                platelib.Library.call(this);
                this.register('loader', loader);
            },
            F = function(){};
        F.prototype = platelib.Library.prototype;
        pluginLib.prototype = new F();

        var name = "name-"+Math.random(),
            tpl = new plate.Template("{% include \""+name+"\" %}", {
                plugin_library:new pluginLib()
            });
        tpl.render({}, assert.async(function(err, data) {
            assert.equal(data, name);
        }));
    }
);

exports.TestCommentTag = platoon.unit({},
    function(assert) {
        "Test that comment does not trigger a parser error";
        var tpl = new plate.Template("{% comment %}{% endcomment %}");
        assert.doesNotThrow(function() {
            tpl.getNodeList();
        });
    },
    function(assert) {
        "Test that comment omits all items wrapped inside the comment block.";
        var tpl = new plate.Template("{% comment %}asdf{% endcomment %}");
        tpl.render({}, assert.async(function(err, data) {
            assert.equal(data, '');
        }));
    }
);

exports.TestNowTag = platoon.unit({},
    function(assert) {
      "test that now defaults to now N y, J"

      var tpl = new plate.Template('{% now %}')
        , now = format(new Date, 'N j, Y')

      tpl.render({}, assert.async(function(err, data) {
        assert.equal(data, now)
      })) 

    },
    function(assert) {
      "test that now can be configured with another argument";

      var tpl = new plate.Template('{% now "jS o\\f F" %}')
        , now = format(new Date, 'jS o\\f F')

      tpl.render({}, assert.async(function(err, data) {
        assert.equal(data, now)
      })) 

    }
);

