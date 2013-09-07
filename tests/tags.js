var plate = require('../index')
  , utils = require('../lib/date')
  , platelib = require('../lib/libraries')
  , library = require('../lib/library')
  , test = require('tape')
  , mocktimeout = require('./mocktimeout')

var format = utils.date

test("Test malformed {% if %} tag", mocktimeout(function(assert) {
  var tpl = new plate.Template('{% if x %}1{{ endif }}')

  tpl.render('anything', function(err, html) {
    assert.ok(err)
  })

}))

test("Test that for is enabled by default", mocktimeout(function(assert) {
        
        var tpl = new plate.Template("{% for x in y %}{% empty %}{% endfor %}");

        assert.doesNotThrow(function() {
            tpl.render({}, function(err, data) {});
        });
    })
)

test("Test that for - empty works", mocktimeout(function(assert) {
  var tpl = new plate.Template('{% for x in y %}{% empty %}ok{% endfor %}')

  tpl.render({y:null}, function(err, data) {
    assert.equal(data, 'ok')
  })
}))

test("Test that for does not bubble errors if it cannot find the appropriate arrayVar", mocktimeout(function(assert) {
        
        var tpl = new plate.Template("{% for x in y %}{% endfor %}");

        tpl.render({}, function(err, data) {
            assert.strictEqual(err, null);
        });
    })
)

test("Test that entering a for loop provides the forloop.counter", mocktimeout(function(assert) {
        
        var size = ~~(Math.random()*10)+1,
            arr = [],
            context = {};
        for(var i = 0; i < size; ++i) {
            arr.push(~~(Math.random()*10));
        }
        var tpl = new plate.Template("{% for x in y %}{{ forloop.counter }}\n{% endfor %}");
        context.y = arr;
        tpl.render(context, function(err, data) {
            var items = data.split('\n').slice(0,-1);
            assert.equal(items.length, size);
            for(var j = 0; j < size; ++j) {
                assert.equal(items[j], ''+(j+1));
            }
        });
    })
)

test("Test that entering a for loop provides the forloop.counter0", mocktimeout(function(assert) {
        
        var size = ~~(Math.random()*10)+1,
            arr = [],
            context = {};
        for(var i = 0; i < size; ++i) {
            arr.push(~~(Math.random()*10));
        }
        var tpl = new plate.Template("{% for x in y %}{{ forloop.counter0 }}\n{% endfor %}");
        context.y = arr;
        tpl.render(context, function(err, data) {
            var items = data.split('\n').slice(0,-1);
            assert.equal(items.length, size);
            for(var j = 0; j < size; ++j) {
                assert.equal(items[j], ''+j);
            }
        });
    })
)

test("Test that entering a for loop provides the forloop.revcounter", mocktimeout(function(assert) {
        
        var size = ~~(Math.random()*10)+1,
            arr = [],
            context = {};
        for(var i = 0; i < size; ++i) {
            arr.push(~~(Math.random()*10));
        }
        var tpl = new plate.Template("{% for x in y %}{{ forloop.revcounter }}\n{% endfor %}");
        context.y = arr;
        tpl.render(context, function(err, data) {
            var items = data.split('\n').slice(0,-1);
            assert.equal(items.length, size);
            for(var j = 0; j < size; ++j) {
                assert.equal(items[j], ''+(size-j));
            }
        });
    })
)

test("Test that entering a for loop provides the forloop.revcounter0", mocktimeout(function(assert) {
        
        var size = ~~(Math.random()*10)+1,
            arr = [],
            context = {};
        for(var i = 0; i < size; ++i) {
            arr.push(~~(Math.random()*10));
        }
        var tpl = new plate.Template("{% for x in y %}{{ forloop.revcounter0 }}\n{% endfor %}");
        context.y = arr;
        tpl.render(context, function(err, data) {
            var items = data.split('\n').slice(0,-1);
            assert.equal(items.length, size);
            for(var j = 0; j < size; ++j) {
                assert.equal(items[j], ''+(size-(j+1)));
            }
        });
    })
)

test("Test that entering a for loop provides the forloop.first", mocktimeout(function(assert) {
        
        var size = ~~(Math.random()*10)+1,
            arr = [],
            context = {};
        for(var i = 0; i < size; ++i) {
            arr.push(~~(Math.random()*10));
        }
        var tpl = new plate.Template("{% for x in y %}{{ forloop.first }}\n{% endfor %}");
        context.y = arr;
        tpl.render(context, function(err, data) {
            var items = data.split('\n').slice(0,-1);
            assert.equal(items.length, size);
            for(var j = 0; j < size; ++j) {
                assert.equal(items[j], j === 0 ? 'true' : 'false');
            }
        });
    })
)

test("Test that entering a for loop provides the forloop.last", mocktimeout(function(assert) {
        
        var size = ~~(Math.random()*10)+1,
            arr = [],
            context = {};
        for(var i = 0; i < size; ++i) {
            arr.push(~~(Math.random()*10));
        }
        var tpl = new plate.Template("{% for x in y %}{{ forloop.last }}\n{% endfor %}");
        context.y = arr;
        tpl.render(context, function(err, data) {
            var items = data.split('\n').slice(0,-1);
            assert.equal(items.length, size);
            for(var j = 0; j < size; ++j) {
                assert.equal(items[j], j === size-1 ? 'true' : 'false');
            }
        });
    })
)

test("Test that entering a nested forloop provides forloop.parentloop", mocktimeout(function(assert) {
        
        var size = ~~(Math.random()*10)+1,
            arr = [],
            context = {};
        for(var i = 0; i < size; ++i) {
            arr.push(~~(Math.random()*10));
        }
        var tpl = new plate.Template("{% for x in y %}{% for a in b %}{{ forloop.parentloop.counter }}:{{ forloop.counter }}\n{% endfor %}{% endfor %}");
        context.y = arr;
        context.b = arr;
        tpl.render(context, function(err, data) {
            var items = data.split('\n').slice(0,-1);
            assert.equal(items.length, size*size);
            for(var x = 0; x < size; ++x) {
                for(var y = 0; y < size; ++y) {
                    assert.equal(items[x*size + y], [x+1,y+1].join(':'));
                }
            }
        });
    })
)

test("Test that for unpacks variables as needed", mocktimeout(function(assert) {
        
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

        tpl.render(context, function(err, data) {
            var items = data.split('\n').slice(0,-1);

            assert.strictEqual(err, null);
            assert.equal(items.length, size);
            
            for(i = 0; i < size; ++i) {
                assert.equal(items[i], arr[i].join(','));
            }
        });
    })
)

test("Test that for can reverse the contents of an array prior to iteration", mocktimeout(function(assert) {
        
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

        tpl.render(context, function(err, data) {
            var items = data.split('\n').slice(0,-1);

            assert.strictEqual(err, null);
            assert.equal(items.length, size);
 
            for(i = 0; i < size; ++i) {
                assert.equal(items[i], arr[(size-1)-i].join(','));
            }
        });
    })
)

test("Test that the with is enabled by default", mocktimeout(function(assert) {
        
        assert.doesNotThrow(function() {
            var tpl = new plate.Template("{% with x as y %}\n\n{% endwith %}");
            tpl.render({}, function(){});
        });
    })
)

test("Test that with adds the variable into context", mocktimeout(function(assert) {
        
        var context = {
            'value':~~(Math.random()*10)
        };
        var tpl = new plate.Template("{% with value as othervalue %}{{ othervalue }}{% endwith %}");
        tpl.render(context, function(err, data) {
            assert.strictEqual(err, null);
            assert.equal(data, context.value.toString());
        });
    })
)

test("Test that with does not leak context variables", mocktimeout(function(assert) {
        
        var context = {
            'value':'hi'+~~(Math.random()*10),
            'othervalue':~~(Math.random()*10)+'yeah'
        };
        var tpl = new plate.Template("{% with value as othervalue %}{{ othervalue }}{% endwith %}{{ othervalue }}");
        tpl.render(context, function(err, data) {
            assert.strictEqual(err, null);
            assert.equal(data, context.value.toString()+context.othervalue.toString());
        });
    })
)

test("Test that an unclosed with statement throws an error", mocktimeout(function(assert) {
        
        var tpl = new plate.Template("{% with x as y %}\n\n yeahhhhh");
        tpl.render({}, function(err, data){
            assert.strictEqual(data, null);
            assert.ok(err instanceof Error);
        });
    })
)

test("Test that if tag is enabled by default", mocktimeout(function(assert) {
        
        var tpl = new plate.Template("{% if x %}{% endif %}");
        assert.doesNotThrow(function() {
            tpl.render({}, function(err, data) {});
        });
    })
)

test("Test that =, ==, and != work", mocktimeout(function(assert) {
        
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

        tpl.render(context, function(err, data) {
            assert.strictEqual(expect, data);
        });
    })
)

test("Test that in and not in work", mocktimeout(function(assert) {
        
        var tpl = new plate.Template("{% for x,y,z in list %}{% if x in y %}y{% endif %}{% if x not in y %}n{% endif %}:{{ z }}\n{% endfor %}"),
            tests = [
                [[1,2], [1,2,3], 'n'],
                [[1,2], [[1,2],3], 'y'],
                [1, {1:'something'}, 'y'],
                ['hi', 'asahi', 'y'],
                ['no', 'yes', 'n']
            ];
        tpl.render({list:tests}, function(err, data) {
            var items = data.split('\n').slice(0, -1);
            while(items.length) {
                var v = items.shift().split(':');
                assert.equal(v[0],v[1]);
            }
        });
    })
)

test("Test that >, <, <=, and >= work", mocktimeout(function(assert) {
        
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

        tpl.render(context, function(err, data) {
            assert.strictEqual(expect, data);
        });
    })
)


test("Test that extends does not trigger a parser error.", mocktimeout(function(assert) {
        
        var tpl = new plate.Template("{% extends whatever %}");
        plate.Template.Meta.registerPlugin('loader', function() {})
        assert.doesNotThrow(function() {
            tpl.getNodeList();
        });
    })
)

test("Test that extending a template produces super great results.", function(assert) {
        
        var base = new plate.Template("hey {% block who %}<b>gary</b>{% endblock %}, how are you?"),
            child = new plate.Template("{% extends base %}{% block who %}{{ block.super }} busey{% endblock %}"),
            ctxt = { base:base };

        assert.plan(2)
        child.render(ctxt, function(err, data) {
            assert.equal(err, null)
            assert.equal(data, "hey <b>gary</b> busey, how are you?");
        });
    }
)

test("Test that multilevel extending works", function(assert) {
        
        var base = new plate.Template("hey {% block firstname %}{% endblock %} {% block lastname %}{% endblock %}"+
                                        ", {% block greeting %}hi there{% endblock %}"),
            child1 = new plate.Template("{% extends base %}{% block firstname %}gary{% endblock %}"),
            child2 = new plate.Template("{% extends child %}{% block firstname %}{{ block.super }} m.{% endblock %}"+
                                        "{% block lastname %}busey{% endblock %}"),
            context = {
                base:base,
                child:child1
            };

        assert.plan(2)
        child2.render(context, function(err, data) {
            assert.equal(err, null)
            assert.equal(data, "hey gary m. busey, hi there");
        });
    }
)

test("Test that include does not trigger a parser error", mocktimeout(function(assert) {
        
        var tpl = new plate.Template("{% include something %}");


        assert.doesNotThrow(function() {
            tpl.getNodeList();
        });
    })
)

test("Test that include will include the contents of the included template into the includer.", function(assert) {
        
        var random = "random-"+Math.random(),
            include = new plate.Template(random),
            tpl = new plate.Template("{% include tpl %}"),
            context = { tpl:include };

        tpl.render(context, function(err, data) {
            assert.equal(err, null)
            assert.equal(data, random);
            assert.end()
        });
    }
)

test("Test that the loader plugin works with include", function(assert) {
        var Promise = require('../lib/promise')

        var loader = function(name) {
              var promise = new Promise
                  setTimeout(function() {
                      promise.resolve(new plate.Template(name))
                  }, ~~(Math.random()*10))
              return promise
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

        tpl.render({}, function(err, data) {
            assert.equal(err, null);
            assert.equal(data, name);
            assert.end()
        });
    }
)

test("Test that comment does not trigger a parser error", mocktimeout(function(assert) {
        
        var tpl = new plate.Template("{% comment %}{% endcomment %}");
        assert.doesNotThrow(function() {
            tpl.getNodeList();
        });
    })
)

test("Test that comment omits all items wrapped inside the comment block.", mocktimeout(function(assert) {
        
        var tpl = new plate.Template("{% comment %}asdf{% endcomment %}");
        tpl.render({}, function(err, data) {
            assert.equal(data, '');
        });
    })
)

test("test that now defaults to now N y, J", mocktimeout(function(assert) {
      var tpl = new plate.Template('{% now %}')
        , now = format(new Date, 'N j, Y')

      tpl.render({}, function(err, data) {
        assert.equal(data, now)
      }) 

    })
)

test("test that now can be configured with another argument", mocktimeout(function(assert) {
      

      var tpl = new plate.Template('{% now "jS o\\f F" %}')
        , now = format(new Date, 'jS o\\f F')

      tpl.render({}, function(err, data) {
        assert.equal(data, now)
      }) 

    })
)

test("test that olde-style loader plugins work", function(assert) {
  var lib = new library() 
  lib.register('loader', olde_loader)

  var tpl = new plate.Template('{% include "xxx" %}', {plugin_library: lib})


  tpl.render({}, function(err, data) {
    assert.equal(data, 'ok')
    assert.end()
  })

  function olde_loader(name, ready) {
    setTimeout(function() {
      ready(null, new plate.Template('ok'))
    })
  }
}) 
