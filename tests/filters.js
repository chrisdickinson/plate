var plate = require('../index')
  , utils = require('../lib/date')
  , test = require('tape')
  , mocktimeout = require('./mocktimeout')

test("Test that the add filter works as expected", mocktimeout(function(assert) {
        
        var tpl = new plate.Template("{{ test|add:3 }}"),
            rnd = ~~(Math.random()*10);

        tpl.render({'test':rnd}, function(err, data) {
            assert.equal((rnd+3), parseInt(data, 10));
        });
    })
)

test("test that the split filter works as expected", mocktimeout(function(assert) {
  var tpl_by_char = new plate.Template('{% for i in test|split:"" %}{{ i }}\n{% endfor %}')
    , tpl_with_none = new plate.Template('{% for i in test|split %}{{ i }}\n{% endfor %}')
    , tpl_split_by_pattern = new plate.Template('{% for i in test|split:"," %}{{ i }}\n{% endfor %}')

  tpl_by_char.render({test: 'hey there'}, function(err, data) {
    assert.ok(!err)
    assert.equal(data, 'hey there'.split('').join('\n')+'\n')
  })

  tpl_with_none.render({test: 'anything'}, function(err, data) {
    assert.ok(!err)
    assert.equal(data, 'anything\n')
  })

  tpl_split_by_pattern.render({test: 'hey,there'}, function(err, data) {
    assert.ok(!err)
    assert.equal(data, 'hey\nthere\n')
  })
}))

test("Test that the addslashes filter works as expected", mocktimeout(function(assert) {
        
        var tpl = new plate.Template("{{ test|addslashes }}"),
            ctxt = {},
            inp = [],
            num = 1 + ~~(Math.random()*10);

        for(var i = 0; inp.push("'") < num; ++i) {};

        inp = inp.join("asdf");
        ctxt.test = inp;

        tpl.render(ctxt, function(err, data) {
            assert.equal(data.split('\\').length, num+1);
        });
    })
)

test("Test that the capfirst filter works as expected", mocktimeout(function(assert) {
        
        var corpus = ['a', 'fluffy bunny', '99 times', 'lol', '', 3.2, {'toString':function(){return 'lol';}}],
            template = new plate.Template("{{ test|capfirst }}"),
            emitter = function(item) {
                var ctxt = { 'test':item };
                template.render(ctxt, function(err, data) {
                    assert.equal(data.charAt(0), item.toString().charAt(0).toUpperCase());
                });
            };
        for(var i = 0; i < corpus.length; ++i) {
            emitter(corpus[i]);
        }
    })
)

test("Test that the center filter works as expected.", mocktimeout(function(assert) {
    var corpus = ['a', 'bunny', 'rode', 'firmly', 'through', 'the', 'wood'],
        template = new plate.Template("{{ test|center:centernum }}"),
        emitter = function(item, len) {
            template.render({'test':item, 'centernum':len}, function(err, data) {
                if(item.length >= len) {
                    assert.equal(data.length, data.length);
                } else {
                    assert.equal(data.length, len);
                    var parts = data.split(item),
                        wlen = len - item.length,
                        strong_side = item.length % 2 == 0 ? 0 : 1,
                        testlen = Math.floor(wlen/2.0),
                        uneven = (wlen/2.0) - Math.floor(wlen/2.0) > 0.0;

                    if(uneven) {
                        assert.equal(parts[strong_side].length, testlen+1);
                        assert.equal(parts[0+!strong_side].length, testlen);
                    } else {
                        assert.equal(parts[strong_side].length, testlen);
                        assert.equal(parts[0+strong_side].length, testlen);
                    }
                }
            });
        },
        item = null;
    while(corpus.length > 0) {
        item = corpus.shift();
        emitter(item, ~~(Math.random() * 10) + 2);
    }
}))

test("Test that the cut filter works as expected", mocktimeout(function(assert) {
        
        var corpus = 'abcdefghijklmnopqrstuvwxyz',
            template = new plate.Template("{{ test|cut:val }}"),
            rand = function() {
                return String.fromCharCode(~~(Math.random() * ('z'.charCodeAt(0) - 'a'.charCodeAt(0))) + 'a'.charCodeAt(0));
            },
            emitter = function(item) {
                template.render({'test':corpus, 'val':item}, function(err, data) {
                    assert.equal(data.indexOf(item), -1);
                });
            };
        var len = ~~(Math.random() * 10);
        while(len-- > 0) emitter(rand());
    })
)

test("Test that the date filter defaults to 'N j, Y'", mocktimeout(function(assert) {
        

        var tpl = new plate.Template("{{ test|date }}")
          , dt
          , now = utils.date(dt = new Date, "N j, Y")

        tpl.render({test:dt}, function(err, data) {
            assert.equal(data, now)
        })
    })
)

test("Test that the date filter accepts a format arg", mocktimeout(function(assert) {
        

        var tpl = new plate.Template("{{ test|date:'jS o\\f F' }}")
          , dt
          , now = utils.date(dt = new Date, "jS o\\f F")

        tpl.render({test:dt}, function(err, data) {
            assert.equal(data, now)
        })
    })
)

test("Test that the date filter accepts non-date arguments", mocktimeout(function(assert) {
        

        var tpl = new plate.Template("{{ test|date:'jS o\\f F' }}")
          , dt
          , now = utils.date(dt = new Date, "jS o\\f F")

        tpl.render({test:+dt}, function(err, data) {
            assert.equal(data, now)
        })

        tpl.render({test:''+dt}, function(err, data) {
            assert.equal(data, now)
        })
    })
)

test("Test that the default filter works as expected", mocktimeout(function(assert) {
        
        var random = ~~(Math.random() * 10),
            template = new plate.Template("{{ test|default:default }}"),
            corpus = ['truthy', 0, null, false, NaN, {'toString':function(){return'lol';}}],
            emitter = function(item) {
                template.render({'test':item, 'default':random}, function(err, data) {
                    if(item) assert.equal(data, item.toString());
                    else     assert.equal(''+data, ''+random);
                });
            }
        while(corpus.length) {
            emitter(corpus.shift());
        }
    })
)

test("Test that the dictsort filter works as expected", mocktimeout(function(assert) {
        
        var F = function() {
                var self = this;
                this.value = ~~(Math.random() * 10);
                this.toString = function() {
                    return ''+self.value;
                };
            },
            len = ~~(Math.random() * 10) + 1,
            arr = [],
            sorted = null,
            template = new plate.Template("{% for i in items|dictsort:\"value\" %}{{ i }}\n{% endfor %}");
        while(len--) {
            arr.push(new F());
        }
        sorted = arr.slice().sort(function(x, y) {
            if(x.value < y.value) return -1;
            if(x.value > y.value) return 1;
            return 0;
        });
        template.render({'items':arr}, function(err, data) {
            var split = data.split('\n').slice(0,-1);
            while(split.length > 0) {
                assert.equal(split.shift(), sorted.shift().toString());
            }
        });
    })
)

test("Test that the dictsortreversed filter works as expected", mocktimeout(function(assert) {
        
        var F = function() {
                var self = this;
                this.value = ~~(Math.random() * 10);
                this.toString = function() {
                    return ''+self.value;
                };
            },
            len = ~~(Math.random() * 10) + 1,
            arr = [],
            sorted = null,
            template = new plate.Template("{% for i in items|dictsortreversed:\"value\" %}{{ i }}\n{% endfor %}");
        while(len--) {
            arr.push(new F());
        }
        sorted = arr.slice().sort(function(x, y) {
            if(x.value < y.value) return -1;
            if(x.value > y.value) return 1;
            return 0;
        }).reverse();
        template.render({'items':arr}, function(err, data) {
            var split = data.split('\n').slice(0,-1);
            while(split.length > 0) {
                assert.equal(split.shift(), sorted.shift().toString());
            }
        });
    })
)

test("Test that the divisibleby filter works as expected", mocktimeout(function(assert) {
        
        var pairs = (function(num) {
            var accum = [];
            for(;accum.length < num; accum.push([~~(Math.random()*10), ~~(Math.random()*10)]));
            return accum;
        })(~~(Math.random() * 10) + 2),
        template = new plate.Template("{% for x,y in pairs %}{% if x|divisibleby:y %}y{% else %}n{% endif %}\n{% endfor %}");
        template.render({pairs:pairs}, function(err, data) {
            var bits = data.split('\n').slice(0, -1);
            for(var i = 0, len = bits.length; i < len; ++i) {
                assert.equal(pairs[i][0] % pairs[i][1] == 0 ? 'y' : 'n', bits[i]);
            }
        });
    })
)

test("Test that the filesizeformat filter works as expected", mocktimeout(function(assert) {
        
        var items = [],
            template = new plate.Template("{{ i|filesizeformat }}");

        for(var i = 2, len = (1024*1024*1024*1024); i < len; i = Math.pow(i, 2)) {
            (function(item) {
                template.render({i:item}, function(err, data) {
                    var words = data.split(/\s+/);
                    if(item < 1024) {
                        assert.equal(words.slice(-1)[0], 'bytes');
                    } else if(item < (1024*1024)) {
                        assert.equal(words.slice(-1)[0], 'KB');
                    } else if(item < (1024*1024*1024)) {
                        assert.equal(words.slice(-1)[0], 'MB');
                    } else {
                        assert.equal(words.slice(-1)[0], 'GB');
                    }
                });
            })(i);
        }
    })
)

test("Test that the first filter works as expected", mocktimeout(function(assert) {
        
        var items = (function(len) {
                var accum = [];
                while(accum.length < len) {
                    accum.push(~~(Math.random()*10));
                }
                return accum;
            })(~~(Math.random()*10)+1),
            template = new plate.Template("{{ items|first }}");
        template.render({items:items}, function(err, data) {
            assert.equal(data, items[0].toString());
        });
    })
)

test("Test that the floatformat filter works as expected", mocktimeout(function(assert) {
        
        var tpl = new plate.Template(
                "{% for x,y in values %}{{ forloop.counter0 }}:{{ x|floatformat:y }}\n{% endfor %}"
            ),
            context = {
                'values':[]
            };

        while(context.values.length < 10) {
            context.values.push([
                (Math.random() * 10),
                (~~(Math.random()*10)-5)
            ]);
        }

        tpl.render(context, function(err, data) {
            var lines = data.split('\n').slice(0, -1),
                line_split,
                idx,
                val,
                val_split,
                decimal;
            while(lines.length) {
                line_split = lines.shift().split(':');
                idx = line_split[0];
                val = line_split[1];
                val_split = val.split('.');
                decimal = val_split.length > 1 ? val_split[1] : '';


                if(context.values[idx][1] < 1) {
                    assert.ok(decimal.length <= parseInt(Math.abs(context.values[idx][1])));
                } else {
                    assert.ok(decimal.length == parseInt(context.values[idx][1]));
                }
            }
        });
    })
)

test("Test that the get_digit filter works as expected.", mocktimeout(function(assert) {
      
      var tpl = new plate.Template(
        "{% for x in digit|make_list %}{{ digit|get_digit:forloop.counter }}\n{% endfor %}"
      ),
      context = {
        'digit':~~(Math.random()*1000)
      };
      tpl.render(context, function(err, data) {
        var bits = data.split('\n').slice(0, -1),
            num = context.digit.toString();

        assert.equal(bits.reverse().join(''), num+'');
      });
    })
)

test("Test that get_digit returns the original input when given a bad digit", mocktimeout(function(assert) {
      
      var tpl = new plate.Template(
          "{{ digit|get_digit:badfood }}"
        ),
        context = {
          'digit':~~(Math.random()*1000),
          'badfood':'asdf'
        };

      tpl.render(context, function(err, data) {
        assert.equal(data, context.digit.toString());
      });
    })
)

test("Test that the join filter works as expected.", mocktimeout(function(assert) {
      
      var tpl = new plate.Template(
          "{{ a_list|join:value }}"
        ),
        context = {
          a_list:[1,2,3,4,5],
          value:~~(Math.random()*100)
        };
      tpl.render(context, function(err, data) {
        assert.equal(data, context.a_list.join(context.value));
      });
    })
)

test("Test that last grabs the last element of a list.", mocktimeout(function(assert) {
      
      var tpl = new plate.Template(
        "{{ a_list|last }}"
      ),
      context = {
        a_list:[1,2,3,3,4,556,6,76,7,5,4,6].sort(function(lhs, rhs) {
          return Math.random() > 0.5;
        })
      };
      tpl.render(context, function(err, data) {
        assert.equal(data, ''+context.a_list[context.a_list.length-1]);
      });
    })
)

test("Test that length works with simple arrays.", mocktimeout(function(assert) {
      
      var tpl = new plate.Template(
        "{{ a_list|length }}"
      ),
      random_array = function() {
        var len = 1+~~(Math.random()*100),
            out = [];
        while(out.length < len) out.push(Math.random());
        return out;
      },
      context = {
        a_list:random_array()
      };
      tpl.render(context, function(err, data) {
        assert.equal(context.a_list.length+'', data);
      });
    })
)

test("Test that length works with complex objects.", mocktimeout(function(assert) {
      
      var randLen = ~~(Math.random()*10) + 1,
          lenFn = function(callback) {
            setTimeout(function() {
              callback(null, randLen);
            }, 1);
          },
          tpl = new plate.Template(
              "{{ a_list|length }}"
          ),
          context = {
            a_list:{length:lenFn}
          };

      tpl.render(context, function(err, data) {
          assert.equal(data, randLen+'');
      });
    })
)

test("Test that length_is works with simple arrays.", mocktimeout(function(assert) {
      
      var tpl = new plate.Template(
        "{{ a_list|length_is:a_list.length }}\n{{ a_list|length_is:0 }}"
      ),
      random_array = function() {
        var len = 1+~~(Math.random()*100),
            out = [];
        while(out.length < len) out.push(Math.random());
        return out;
      },
      context = {
        a_list:random_array()
      };
      tpl.render(context, function(err, data) {
        assert.equal('true\nfalse', data);
      });
    })
)

test("Test that length_is works with complex objects.", mocktimeout(function(assert) {
      
      var randLen = ~~(Math.random()*10) + 1,
          lenFn = function(callback) {
            setTimeout(function() {
              callback(null, randLen);
            }, 1);
          },
          tpl = new plate.Template(
              "{% with a_list.length as len %}{{ a_list|length_is:len }}\n{{ a_list|length_is:0 }}{% endwith %}"
          ),
          context = {
            a_list:{length:lenFn}
          };

      tpl.render(context, function(err, data) {
          assert.equal(data, "true\nfalse");
      });
    })
)

test("Test that linebreaks wraps all double-spaced elements in <p> tags.", mocktimeout(function(assert) {
      
      var text = "Hi there\n\nI am new to world\n\nEnjoying time very much.",
          tpl = new plate.Template(
            "{{ text|linebreaks }}"
          ),
          context = { text: text };

      tpl.render(context, function(err, data) {
        assert.equal(data, "<p>Hi there</p><p>I am new to world</p><p>Enjoying time very much.</p>");
      });
    })
)

test("Test that linebreaks creates <br /> tags for all single newline characters.", mocktimeout(function(assert) {
      
      var text = "Hi there\nI am new to world\nEnjoying time very much.",
          tpl = new plate.Template(
            "{{ text|linebreaks }}"
          ),
          context = { text: text };

      tpl.render(context, function(err, data) {
        assert.equal(data, "<p>Hi there<br />I am new to world<br />Enjoying time very much.</p>");
      });
    })
)

test("Test that linebreaksbr converts all newlines to br elements", mocktimeout(function(assert) {
      
      var text = "Hi there\n\nI am new\n to world\n\nEnjoying time very much.",
          tpl = new plate.Template(
            "{{ text|linebreaksbr }}"
          ),
          context = { text: text };

      tpl.render(context, function(err, data) {
        assert.equal(data, text.replace(/\n/g, '<br />'));
      });
    })
)

test("Test that linenumbers prepends line numbers to each line of input text.", mocktimeout(function(assert) {
      
      var text = "Yes\nI\nLike\nJavascript\nIs\nVery\nGood",
          tpl = new plate.Template(
            "{{ text|linenumbers }}"
          ),
          context = { text: text };

      tpl.render(context, function(err, data) {
        var expected = text.split('\n');
        for(var i = 0, len = expected.length; i < len; ++i) {
          expected[i] = (i+1)+'. '+expected[i];
        }
        expected = expected.join('\n');
        assert.equal(data, expected);
      });
    })
)

test("Test that ljust left justifies as expected.", mocktimeout(function(assert) {
      
      var tpl = new plate.Template(
        "{% for i in range %}{{ str|ljust:i }}\n{% endfor %}"
      ),
      makeRange = function() {
        var out = [], len = ~~(Math.random()*20) + 1;
        while(out.length < len) { out.push(out.length+1); }
        return out;
      },
      context = {
        'str':'hi',
        'range':makeRange()
      };

      tpl.render(context, function(err, data) {
        var bits = data.split('\n').slice(0, -1);
        while(bits.length) {
          var idx = context.range.length - bits.length
              bit = bits.shift();

          if(bit.length > context.str.length) {
            assert.equal(bit.length, context.range[idx]);
            assert.ok((/\s+$/g).test(bit));
          } else {
            assert.strictEqual(bit.length, context.str.length);
          }
        }
      });
    })
)

test("Test that lower works.", mocktimeout(function(assert) {
      
      var tpl = new plate.Template(
        "{% for word in words %}{{ word|lower }}{% endfor %}"
      );
      tpl.render({words:['Asdf', '1ST', 'YEAHHHH']}, function(err, data) {
        assert.ok(!(/[A-Z]+/g).test(data));
      });
    })
)

test("Test that make_list just passes through arrays.", mocktimeout(function(assert) {
    
    var tpl = new plate.Template(
      '{% for i in item|make_list %}{{ i }}{% if not forloop.last %}\n{% endif %}{% endfor %}'
    ),
    item = [1,2,3,4,5];
    tpl.render({'item':item}, function(err, data) {
      var bits = data.split('\n');
      assert.equal(bits.length, item.length);
      while(bits.length) {
        assert.equal(bits.pop(), ''+item.pop());
      };
    });
  })
)

test("Test that make_list works with strings.", mocktimeout(function(assert) {
    
    var tpl = new plate.Template(
      '{% for i in item|make_list %}{{ i }}{% if not forloop.last %}\n{% endif %}{% endfor %}'
    ),
    item = "random"+Math.random();
    tpl.render({'item':item}, function(err, data) {
      var bits = data.split('\n');
      item = item.toString().split('');
      assert.equal(bits.length, item.length);
      while(bits.length) {
        assert.equal(bits.pop(), item.pop());
      };
    });
  })
)

test("Test that make_list works with numbers.", mocktimeout(function(assert) {
    
    var tpl = new plate.Template(
      '{% for i in item|make_list %}{{ i }}{% if not forloop.last %}\n{% endif %}{% endfor %}'
    ),
    item = ~~(100 * Math.random());
    tpl.render({'item':item}, function(err, data) {
      var bits = data.split('\n');
      item = item.toString().split('');
      assert.equal(bits.length, item.length);
      while(bits.length) {
        assert.equal(bits.pop(), item.pop());
      };
    });
  })
)

test("Test that phone2numeric works as expected.", mocktimeout(function(assert) {
      
      var phone = '1-800-4GO-OGLE',
          expected = '1-800-446-6453',
          tpl = new plate.Template(
              "{{ item|phone2numeric }}"
          );
      tpl.render({'item':phone}, function(err, data) {
        assert.equal(data, expected);
      });

    })
)

test("Assert that pluralize coerces single argument to plural case.", mocktimeout(function(assert) {
      
      var values = [1,3],
          tpl = new plate.Template(
            '{% for i in items %}{{ i|pluralize:"s" }}:{% endfor %}'
          );
      tpl.render({items:values}, function(err, data) {
        assert.equal(data, ':s:');
      });
    })
)

test("Assert that pluralize coerces two arguments to singular, plural.", mocktimeout(function(assert) {
      
      var values = [1,3],
          tpl = new plate.Template(
            '{% for i in items %}{{ i|pluralize:"y,s" }}:{% endfor %}'
          );
      tpl.render({items:values}, function(err, data) {
        assert.equal(data, 'y:s:');
      });
    })
)

test("Assert that random pulls an item out of an array randomly.", mocktimeout(function(assert) {
      
      var arr = [1,2,3,4,5,6,7,8,9,10],
          tpl = new plate.Template(
            '{% for i in list %}{{ list|random }}\n{% endfor %}'
          );

      tpl.render({list:arr}, function(err, data) {
        var bits = data.split('\n').slice(0, -1);
        while(bits.length) {
          for(var i = 0, len = arr.length, item = bits.pop(), found = false; i < len && !found; ++i) {
            found = arr[i] == item;
          }
          assert.ok(found);
        }
      });
    })
)

test("Test that rjust right justifies as expected.", mocktimeout(function(assert) {
      
      var tpl = new plate.Template(
        "{% for i in range %}{{ str|rjust:i }}\n{% endfor %}"
      ),
      makeRange = function() {
        var out = [], len = ~~(Math.random()*20) + 1;
        while(out.length < len) { out.push(out.length+1); }
        return out;
      },
      context = {
        'str':'hi',
        'range':makeRange()
      };

      tpl.render(context, function(err, data) {
        var bits = data.split('\n').slice(0, -1);
        while(bits.length) {
          var idx = context.range.length - bits.length
              bit = bits.shift();

          assert.ok(bit.length === context.str.length || bit.length === context.range[idx]);
          if(bit.length > context.str.length) {
            assert.ok((/^\s+/g).test(bit));
          }
        }
      });
    })
)

test("Test that upper works.", mocktimeout(function(assert) {
      
      var tpl = new plate.Template(
        "{% for word in words %}{{ word|upper }}{% endfor %}"
      );
      tpl.render({words:['Asdf', '1ST', 'YEAHHHH']}, function(err, data) {
        assert.ok(!(/[a-z]+/g).test(data));
      });
    })
)

test("Test that HTML characters are escaped by default", mocktimeout(function(assert) {
      

      var tpl = new plate.Template('{{ value }}')

      tpl.render({'value':'<>"\'&'}, function(err, data) {
        assert.ok(!err)

        assert.equal(data, '&lt;&gt;&quot;&#39;&amp;')
      })
    })
)

test("Test that HTML characters may be marked 'safe'", mocktimeout(function(assert) {
      

      var tpl = new plate.Template('{{ value|safe }}')
        , x = '<>"\'&'
      tpl.render({'value':x}, function(err, data) {
        assert.ok(!err)

        assert.equal(data, x)
      })
    })
)
test("Test that escape automatically escapes the input", mocktimeout(function(assert) {
      

      var tpl = new plate.Template('{{ value|escape }}')
        , x   = '&'

      tpl.render({value:x}, function(err, data) {
        assert.ok(!err)

        assert.equal(data, '&amp;')
      })
    })
)

test("Test that escape does not double-escape the input", mocktimeout(function(assert) {
      

      var tpl = new plate.Template('{{ value|escape|escape }}')
        , x   = '&'

      tpl.render({value:x}, function(err, data) {
        assert.ok(!err)

        assert.equal(data, '&amp;')
      })
    })
)

test("Test that escape respects 'safe'", mocktimeout(function(assert) {
      

      var tpl = new plate.Template('{{ value|safe|escape }}')
        , x   = '&'

      tpl.render({value:x}, function(err, data) {
        assert.ok(!err)

        assert.equal(data, '&')
      })
    })
)

test("Test that force_escape does not respect 'safe'", mocktimeout(function(assert) {
      

      var tpl = new plate.Template('{{ value|safe|force_escape }}')
        , x   = '&'

      tpl.render({value:x}, function(err, data) {
        assert.ok(!err)

        assert.equal(data, '&amp;')
      })
    })
)
test("Test that slice works with :N", mocktimeout(function(assert) {
      
      var items = [1,2,3,4],
          rand = ~~(items.length * Math.random()),
          tpl = new plate.Template(
            "{% for i in items|slice:rand %}{{ i }}:{% endfor %}"
          );

      tpl.render({items:items, rand:':'+rand}, function(err, data) {
        var bits = data.split(':').slice(0, -1),
            expected = items.slice(0, rand);

        assert.equal(bits.length, expected.length);
        for(var i = 0, len = bits.length; i < len; ++i) {
          assert.equal(bits[i], ''+expected[i]);
        }
      });
    })
)

test("Test that slice works with N:", mocktimeout(function(assert) {
      
      var items = [1,2,3,4],
          rand = ~~(items.length * Math.random()),
          tpl = new plate.Template(
            "{% for i in items|slice:rand %}{{ i }}:{% endfor %}"
          );

      tpl.render({items:items, rand:rand+':'}, function(err, data) {
        var bits = data.split(':').slice(0, -1),
            expected = items.slice(rand);

        assert.equal(bits.length, expected.length);
        for(var i = 0, len = bits.length; i < len; ++i) {
          assert.equal(bits[i], ''+expected[i]);
        }
      });
    })
)

test("Test that slugify removes unicode, turns spaces into dashes, lowercases everything.", mocktimeout(function(assert) {
      
      var makeRandomString = function() {
        var len = ~~(Math.random()*1000),
            out = [];
        while(out.length < len) out.push(String.fromCharCode(~~(Math.random()*256)));
        return out.join('');
      },
      tpl = new plate.Template('{{ item|slugify }}'),
      context = {item:makeRandomString()};

      tpl.render(context, function(err, data) {
        assert.ok(!((/[^a-z\-0-9_]+/g).test(data)));
      });
    })
)

test("Test that timesince works as expected.", mocktimeout(function(assert) {
    
    var times = [
          ['3 years', (+new Date) - 31557600000 * 3]
        , ['1 month', (+new Date) - 2592000000 * 1]
        , ['2 days', (+new Date) - 86400000 * 2]
        , ['23 hours', (+new Date) - 3600000 * 23]
        , ['30 minutes', (+new Date) - 60000 * 30]
      ]
    , tpl = new plate.Template("{% for expected, time in times %}{{ time|timesince }}\n{% endfor %}")

    tpl.render({times:times}, function(err, data) {
      assert.ok(!err)

      data = data.split('\n').slice(0, -1)
      for(var i = 0; i < data.length; ++i) {
        assert.equal(data[i], times[i][0])
      }
    })
  })
)

test("Test that timesince may accept an input.", mocktimeout(function(assert) {
    

    var fake_now = +new Date() + ~~(Math.random() * 10000)
    var times = [
          ['3 years',     fake_now - 31557600000 * 3]
        , ['1 month',     fake_now - 2592000000 * 1]
        , ['2 days',      fake_now - 86400000 * 2]
        , ['23 hours',    fake_now - 3600000 * 23]
        , ['30 minutes',  fake_now - 60000 * 30]
      ]
    , tpl = new plate.Template("{% for expected, time in times %}{{ time|timesince:n }}\n{% endfor %}")

    tpl.render({times:times, n:fake_now}, function(err, data) {
      assert.ok(!err)

      data = data.split('\n').slice(0, -1)
      for(var i = 0; i < data.length; ++i) {
        assert.equal(data[i], times[i][0])
      }
    })
  })
)

test("Test that timesince displays the largest and second largest bit of multiple time values.", mocktimeout(function(assert) {
    
    var times = [
          ['3 years, 2 days',   (+new Date) - (31557600000 * 3 + 86400000 * 2 + 60000)]
        , ['1 month, 23 hours',           (+new Date) - (2592000000 + 3600000 * 23)]
        , ['1 year, 10 days', (+new Date) - (31557600000 + 10 * 86400000 + 20 * 60000)]
      ]
    , tpl = new plate.Template("{% for expected, time in times %}{{ time|timesince }}\n{% endfor %}")

    tpl.render({times:times}, function(err, data) {
      assert.ok(!err)

      data = data.split('\n').slice(0, -1)
      for(var i = 0; i < data.length; ++i) {
        assert.equal(data[i], times[i][0])
      }
    })
  })
)

test("Test that timesince displays '0 minutes' when time is in future, or when time is < 60 seconds away", mocktimeout(function(assert) {
    
    var t = new Date()
      , n = t + 1000
      , tpl = new plate.Template("{{ t|timesince:n }}")

    tpl.render({t:t, n:n}, function(err, data) {
      assert.equal(data, '0 minutes')
    })

    tpl.render({t:t, n:t}, function(err, data) {
      assert.equal(data, '0 minutes')
    })
  })
)
test("Test that title titlecases input.", mocktimeout(function(assert) {
      
      var words = ['hey','there','how','are','you',"you're",'1st','lol'],
          sentence = words.sort(function() {
              return Math.random() > 0.5;
          }).join(' ');

      var tpl = new plate.Template("{{ sentence|title }}");

      tpl.render({sentence:sentence}, function(err, data) {
        var bits = data.split(/\s+/g);
        while(bits.length) {
          assert.ok((/^[A-Z0-9]{1}[a-z']+/g).test(bits.pop()));
        }
      });
    })
)

test("Test that striptags removes all HTML tags no matter how cool they are.", mocktimeout(function(assert) {
      
      var testData =[
      '<div class="versionadded">',
      '<span class="title">New in Django 1.1.2:</span> <a class="reference internal" href="../../../releases/1.1.2/"><em>Please, see the release notes</em></a></div>',
      '<p>In the Django 1.1.X series, this is a no-op tag that returns an empty string for',
      'future compatibility purposes.  In Django 1.2 and later, it is used for CSRF',
      'protection, as described in the documentation for <a class="reference internal" href="../../contrib/csrf/"><em>Cross Site Request',
      'Forgeries</em></a>.</p>',
      '</div>'
      ].join('\n');
      var tpl = new plate.Template('{{ text|striptags }}');

      tpl.render({text:testData}, function(err, data) {
          // fail if you see a tag.
          assert.ok(!((/<[^>]*?>/g).test(data)));
      });
    })
)

test("Test that a string of characters gets truncated properly.", mocktimeout(function(assert) {
      
      var input = 'This is a collection of words.';

      var tpl = new plate.Template('{{ input|truncatechars:8 }}'),
          context = {input:input};

      tpl.render(context, function(err, data) {
        assert.equal(data, 'This is ...');
      });

      var tpl = new plate.Template('{{ input|truncatechars:20 }}'),
          context = {input:input};

      tpl.render(context, function(err, data) {
        assert.equal(data, 'This is a collection...');
      });

      var tpl = new plate.Template('{{ input|truncatechars:200 }}'),
          context = {input:input};

      tpl.render(context, function(err, data) {
        assert.equal(data, 'This is a collection of words.');
      });
    })
)

test("Test that a busted number doesn't double call the callback.", mocktimeout(function(assert) {
      
      var input = 'This is a collection of words.';

      var tpl = new plate.Template('{{ input|truncatechars:abc }}'),
          context = {input:input};

      tpl.render(context, function(err, data) {
        assert.equal(data, 'This is a collection of words.');
      });
    })
)

test("Test that a string of words gets truncated properly.", mocktimeout(function(assert) {
      
      var input = 'This is a collection of words.';

      var tpl = new plate.Template('{{ input|truncatewords:3 }}'),
          context = {input:input};

      tpl.render(context, function(err, data) {
        assert.equal(data, 'This is a...');
      });

      var tpl = new plate.Template('{{ input|truncatewords:0 }}'),
          context = {input:input};

      tpl.render(context, function(err, data) {
        assert.equal(data, '...');
      });

      var tpl = new plate.Template('{{ input|truncatewords:8 }}'),
          context = {input:input};

      tpl.render(context, function(err, data) {
        assert.equal(data, 'This is a collection of words.');
      });
    })
)

test("Test that a busted number doesn't double call the callback.", mocktimeout(function(assert) {
      
      var input = 'This is a collection of words.';

      var tpl = new plate.Template('{{ input|truncatewords:abc }}'),
          context = {input:input};

      tpl.render(context, function(err, data) {
        assert.equal(data, 'This is a collection of words.');
      });
    })
)

test("Test that unordered list... makes unordered lists. Awesome ones.", mocktimeout(function(assert) {
      
      var input = ['States', ['Kansas', ['Lawrence', 'Topeka'], 'Illinois']],
          output = '<li>States<ul><li>Kansas<ul><li>Lawrence</li><li>Topeka</li></ul></li><li>Illinois</li></ul></li>';

      var tpl = new plate.Template('{{ input|unordered_list }}'),
          context = {input:input};

      tpl.render(context, function(err, data) {
        assert.equal(data, output);
      });
    })
)

test("Test that urlencode encodes all appropriate characters by using the built-in escape function.", mocktimeout(function(assert) {
      
      var stringOfEverything = (function() {
          var out = [];
          while(out.length < 256) { out.push(String.fromCharCode(out.length)); }
          return out.join('');
        })(),
        tpl = new plate.Template('{{ str|urlencode }}');

      tpl.render({str:stringOfEverything}, function(err, data) {
        assert.equal(data, escape(stringOfEverything));
      });
    })
)

test("Test that urlize will turn urls of the form http://whatever.com/whatever, https://whatever.org/whatever into links.", mocktimeout(function(assert) {
      
      var links = ['https://google.com/', 'http://neversaw.us/media/blah.png'],
          para = ['hey there i love ', links[0], ' and(',links[1],')'].join(''),
          result = 'hey there i love <a href="'+links[0]+'">'+links[0]+'</a> and(<a href="'+links[1]+'">'+links[1]+'</a>)';

      var tpl = new plate.Template('{{ para|urlize }}');

      tpl.render({para:para}, function(err, data) {
        assert.equal(data, result);
      });
    })
)

test("Assert that wordcount counts the number of words.", mocktimeout(function(assert) {
      
      var lorem = 'Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
          count = lorem.split(/\s+/g).length,
          tpl = new plate.Template("{{ lorem|wordcount }}");

      tpl.render({lorem:lorem}, function(err, data) {
        assert.equal(data, count.toString());
      });
    })
)

test("Assert that wordwrap wraps lines at a given number.", mocktimeout(function(assert) {
      
      var lorem = 'Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
          values = [1,2,3,4,5,6,7,8,9],
          tpl = new plate.Template("{% for value in values %}{{ lorem|wordwrap:value }}:{% endfor %}");

      tpl.render({lorem:lorem, values:values}, function(err, data) {
        var bits = data.split(':').slice(0, -1);
        for(var i = 0, len = bits.length; i < len; ++i) {
          var lilbits = bits[i].split('\n'),
              max = 0,
              val;
          while(lilbits.length) {
            val = lilbits.pop().split(/\s+/g).length;
            max = max < val ? val : max;
          }
          assert.ok(max <= values[i]);
        }
      });
    })
)

test("Test that the yesno filter coerces values into truthy,falsy", mocktimeout(function(assert) {
      
      return

      var tpl = new plate.Template('{% for value in values %}{{ value|yesno:"truthy,falsy" }}\n{% endfor %}'),
          context = {
            values:[true, 1, {}, [], false, null]
          };
      tpl.render(context, function(err, data) {
        var bits = data.split('\n').slice(0, -1);
        for(var i = 0, len = bits.length; i < len; ++i) {
          var mode = context.values[i] ? 'truthy' : 'falsy';
          assert.equal(bits[i], mode);
        }
      });
    })
)

test("Test that the yesno filter coerces values into true,false,maybe", mocktimeout(function(assert) {
      
      var tpl = new plate.Template('{% for value in values %}{{ value|yesno:"truthy,falsy,maybe" }}\n{% endfor %}'),
          context = {
            values:[true, 1, {}, [], false, null]
          };
      tpl.render(context, function(err, data) {
        var bits = data.split('\n').slice(0, -1);
        for(var i = 0, len = bits.length; i < len; ++i) {
          var mode = context.values[i] ? 'truthy' : context.values[i] === false ? 'falsy' : 'maybe';
          assert.equal(bits[i], mode);
        }
      });
    })
)


