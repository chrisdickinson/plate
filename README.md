Plate.js -- A Template Library
=================================

Plate is a Django Template Language implementation in Javascript. Super exciting!

Why Plate?
----------
* Plate plays nicely with the event loop. Control of the loop is returned after each node is rendered -- consequently Plate makes heavy use of the concept of eteration.
* Plate aims to be compatible (insofar as possible) with the latest version of the Django Template Language. If you've got a template in Django, it should render just fine in Plate.
* Plate is heavily tested using the [Platoon](http://github.com/chrisdickinson/platoon) testing framework.
* It's designed to work nicely in a Node.js environment (mostly thanks to the aforementioned "being nice to the event loop").
* It makes use of plugins to provide capabilities such as URL matching, template loading, etc.

What's Missing?
---------------
Plate is still a work-in-progress. 
Otherwise:

* `true`, `false`, `null`, etc do not get casted into the Python versions (`True`, `False`, `None`, etc).
* Some tags are missing -- notably `url`, `cycle`, `ifchanged`, and `now`. This is being addressed.
* Likewise, filters are a work in progress -- I've only made it as far as `first` alphabetically.
* If a tag is deprecated -- e.g., `ifequal x y` versus `if x == y`, it will not be supported anytime soon.

Can I use it in my browser?
---------------------------
That's the goal. I haven't finished testing Plate across browsers, but the Platoon tests currently pass
in Firefox (3.7) and Chrome (latest).

To get a file suitable for use in-browser, do the following:

    git clone git://github.com/chrisdickinson/plate.git
    cd plate
    chmod +x bin/build-plate
    bin/build-plate > plate.js
    # or alternatively
    bin/build-plate | jsmin > plate.min.js

How do I use it?
----------------

The most basic case:

    var plate = require('plate'),
        sys = require('sys');
    var template = new plate.Template('hello {{ world }}');

    template.render({world:'everyone'}, function(err, data) {
        sys.puts(data);
    });

    // outputs "hello everyone"

Plate follows the Node.js style of taking callbacks that receive an error object and a data object. If there's no
error, `err` will be null.

The `plate.Template` class takes three arguments:

    plate.Template(raw_template[, {plugin_library, filter_library, tag_library}[, parser_class]]);

Where `{plugin_library, filter_library, tag_library}` is an object literal with those three items as optional keys pointing
to an instance of `plate.libraries.Library`. You can replace the parser itself (not... exactly recommended, but possible!)
by providing your own `parser_class`.

`plate.Template` objects do not tokenize or parse until `getNodeList` is invoked on the instance. In practice, this means
that until you call `tpl.render(ctxt, callback);` plate does not do any heavy lifting.

`plate.Template` objects are designed to be reused with different context objects. If you're using plate in a node web-app,
it might be a good idea to cache existing template objects when possible.

Plate plays well with functions in context:

    var context = {
        item:function() {
            return 'hi';
        },
        item2:function(callback) {
            setTimeout(function() {
                callback(null, 'howdy');    // callback(Error, Data)
            }, 100);
        },
        obj: {
            'name':'Gary',
            'fullname':function() {
                return this.name + ' Busey';
            }
        }
    };
    var tpl = new plate.Template('{{ item|capfirst }}\n{{ item2|capfirst }}\n{{ obj.fullname }}');
    tpl.render(context, function(err, data) {
        sys.puts(data);
    });

    // outputs "Hi\nHowdy\nGary Busey"

In the case of `item` -- a function returning a value -- Plate will automatically use that value. If the function takes a callback
and does not return a value, the function can perform asyncronous operations (talk to a database in the background, setTimeout, or the
like) and the rendering of the template will continue once the `callback` function is executed.

Functions execute in the context of the last item looked up in the filter. In the case of `obj.fullname`, the fullname function will
execute with `obj` set to `this`. Of course, this can be used in callback-style as well.  

-----------------
Licensed new BSD.
