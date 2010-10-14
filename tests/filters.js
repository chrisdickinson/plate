var plate = require('plate'),
    platoon = require('platoon');


exports.TestAddFilter = platoon.unit({},
    function(assert) {
        "Test that the add filter works as expected";
        var tpl = new plate.Template("{{ test|add:3 }}"),
            rnd = ~~(Math.random()*10);

        tpl.render({'test':rnd}, assert.async(function(err, data) {
            assert.equal((rnd+3), parseInt(data, 10));
        }));
    }
);

exports.TestAddSlashesFilter = platoon.unit({},
    function(assert) {
        "Test that the addslashes filter works as expected";
        var tpl = new plate.Template("{{ test|addslashes }}"),
            ctxt = {},
            inp = [],
            num = 1 + ~~(Math.random()*10);

        for(var i = 0; inp.push("'") < num; ++i) {};
        
        inp = inp.join("asdf");
        ctxt.test = inp;

        tpl.render(ctxt, assert.async(function(err, data) {
            assert.equal(data.split('\\').length, num+1);
        }));
    }
);

exports.TestCapFirstFilter = platoon.unit({},
    function(assert) {
        "Test that the capfirst filter works as expected";
        var corpus = ['a', 'fluffy bunny', '99 times', 'lol', '', 3.2, {'toString':function(){return 'lol';}}],
            template = new plate.Template("{{ test|capfirst }}"),
            emitter = function(item) {
                var ctxt = { 'test':item };
                template.render(ctxt, assert.async(function(err, data) {
                    assert.equal(data.charAt(0), item.toString().charAt(0).toUpperCase());
                }));
            };
        for(var i = 0; i < corpus.length; ++i) {
            emitter(corpus[i]);
        }
    }
);

exports.TestCenterFilter = platoon.unit({},
    function(assert) {
        "Test that the center filter works as expected.";
        var corpus = ['a', 'bunny', 'rode', 'firmly', 'through', 'the', 'wood'],
            template = new plate.Template("{{ test|center:centernum }}"),
            emitter = function(item, len) {
                template.render({'test':item, 'centernum':len}, assert.async(function(err, data) {
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
                }));
            },
            item = null;
        while(corpus.length > 0) {
            item = corpus.shift();
            emitter(item, ~~(Math.random() * 10) + 2);
        }
    }
);

exports.TestCutFilter = platoon.unit({},
    function(assert) {
        "Test that the cut filter works as expected";
        var corpus = 'abcdefghijklmnopqrstuvwxyz',
            template = new plate.Template("{{ test|cut:val }}"),
            rand = function() {
                return String.fromCharCode(~~(Math.random() * ('z'.charCodeAt(0) - 'a'.charCodeAt(0))) + 'a'.charCodeAt(0));
            },
            emitter = function(item) {
                template.render({'test':corpus, 'val':item}, assert.async(function(err, data) {
                    assert.equal(data.indexOf(item), -1);
                }));
            };
        var len = ~~(Math.random() * 10);
        while(len-- > 0) emitter(rand());
    }
);

exports.TestDefaultFilter = platoon.unit({},
    function(assert) {
        "Test that the default filter works as expected";
        var random = ~~(Math.random() * 10),
            template = new plate.Template("{{ test|default:default }}"),
            corpus = ['truthy', 0, null, false, undefined, NaN, {'toString':function(){return'lol';}}],
            emitter = function(item) {
                template.render({'test':item, 'default':random}, assert.async(function(err, data) {
                    if(item) assert.equal(data, item.toString());
                    else     assert.equal(data, random);
                }));
            }
        while(corpus.length) {
            emitter(corpus.shift());
        }
    }
);

exports.TestDictSortFilter = platoon.unit({},
    function(assert) {
        "Test that the dictsort filter works as expected";
        var F = function() {
                var self = this;
                this.value = ~~(Math.random() * 10);
                this.toString = function() {
                    return self.value;
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
        template.render({'items':arr}, assert.async(function(err, data) {
            var split = data.split('\n').slice(0,-1);
            while(split.length > 0) {
                assert.equal(split.shift(), sorted.shift().toString());
            }
        }));
    },
    function(assert) {
        "Test that the dictsortreversed filter works as expected";
        var F = function() {
                var self = this;
                this.value = ~~(Math.random() * 10);
                this.toString = function() {
                    return self.value;
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
        template.render({'items':arr}, assert.async(function(err, data) {
            var split = data.split('\n').slice(0,-1);
            while(split.length > 0) {
                assert.equal(split.shift(), sorted.shift().toString());
            }
        }));
    }
);

exports.TestOfDivisibleByFilter = platoon.unit({},
    function(assert) {
        "Test that the divisibleby filter works as expected";
        var pairs = (function(num) {
            var accum = [];
            for(;accum.length < num; accum.push([~~(Math.random()*10), ~~(Math.random()*10)]));
            return accum;
        })(~~(Math.random() * 10) + 2),
        template = new plate.Template("{% for x,y in pairs %}{% if x|divisibleby:y %}y{% else %}n{% endif %}\n{% endfor %}");
        template.render({pairs:pairs}, assert.async(function(err, data) {
            var bits = data.split('\n').slice(0, -1);
            for(var i = 0, len = bits.length; i < len; ++i) {
                assert.equal(pairs[i][0] % pairs[i][1] == 0 ? 'y' : 'n', bits[i]);
            }
        }));
    }
);

exports.TestOfFilesizeFormatFilter = platoon.unit({},
    function(assert) {
        "Test that the filesizeformat filter works as expected";
        var items = [],
            template = new plate.Template("{{ i|filesizeformat }}");

        for(var i = 2, len = (1024*1024*1024*1024); i < len; i = Math.pow(i, 2)) {
            (function(item) {
                template.render({i:item}, assert.async(function(err, data) {
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
                }));
            })(i);
        }
    }
);

exports.TestOfFirstFilter = platoon.unit({},
    function(assert) {
        "Test that the first filter works as expected";
        var items = (function(len) {
                var accum = [];
                while(accum.length < len) {
                    accum.push(~~(Math.random()*10));
                }
                return accum; 
            })(~~(Math.random()*10)+1),
            template = new plate.Template("{{ items|first }}");
        template.render({items:items}, assert.async(function(err, data) {
            assert.equal(data, items[0].toString());
        }));
    }
);

exports.TestOfFloatFormatFilter = platoon.unit({},
    function(assert) {
        "Test that the floatformat filter works as expected";
        var tpl = new plate.Template(
                "{% for x,y in values %}{{ forloop.counter0 }}:{{ x|floatformat:y }}\n{% endfor %}"
            ),
            context = {
                'values':[]
            };

        while(context.values.length < 10) {
            context.values.push([
                (Math.random() * 10),
                (~~(Math.random*10)-5)
            ]);
        }

        tpl.render(context, assert.async(function(err, data) {
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

                if(context.values[idx][1] < 0) {
                    assert.ok(decimal.length <= parseInt(Math.abs(context.values[idx][1])));
                } else {
                    assert.ok(decimal.length == parseInt(context.values[idx][1]));
                }
            }
        }));
    }
);
