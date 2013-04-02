Plate.js -- A Template Library
=================================

Plate is a Django Template Language implementation in Javascript. Super exciting!

Plate
----------
* Plays nicely with the event loop and async code. Plate makes it easy to parallelize your view code!
* Aims to be compatible with the latest version of the Django Template Language. If you've got a template in Django, it should render just fine in Plate.
* Thoroughly tested using tape.
* Designed to work nicely in a Node.js environment
* Extensible -- It makes use of plugins to provide capabilities (e.g., template loading).

Can I use it in my browser?
---------------------------

Yes. Plate was designed to work well in the standard suite of browsers. Each minor point release will target
compatibility with IE7+, FF3+, Chrome, and Safari 4+.

You can [download a minified, precompiled version here](https://raw.github.com/chrisdickinson/plate/master/dist/plate.min.js).

If you're having trouble, try using the [debug version, with source maps](https://raw.github.com/chrisdickinson/plate/master/dist/plate.debug.js).


How do I use it?
----------------

### In node (or browserify):

```javascript

    var plate = require('plate')

    var template = new plate.Template('hello {{ world }}')

    template.render({world:'everyone'}, function(err, data) {
      console.log(data)
    })

    // outputs "hello everyone"

```

Plate follows the Node.js style of taking callbacks that receive an error object and a data object. If there's no
error, `err` will be null.

### In browser (vanilla):

```html
    <script type="text/javascript" src="plate.min.js">
    <script type="text/html" id="template">
        hello {{ world }}.
    </script>
    <script type="text/javascript">
        var source = $('#template').text()
          , template = new plate.Template(source)

        template.render({world: 'everyone'}, function(err, data) {
          console.log(data)
        })
    </script>
```

### In browser (using require.js):

```javascript

require(['plate.min'], function(plate) {
  var template = new plate.Template('hello {{ world }}')
})


```

Documentation
-------------

Plate is documented on [its github wiki](https://github.com/chrisdickinson/plate/wiki). There are "Getting Started"
guides for both in-browser as well as in-node environments.

Contributing
------------

Got a feature you'd like to add? I'd love to see it. The workflow is pretty standard Github fare:

* Fork this repository.
* Create a branch -- title it descriptively, please :)
* Work, work, work. 
* Push your changes and submit a pull request.

The minimum requirements for a pull request to be merged are:

* You've added (passing) tests for your new code.
* The existing tests still pass.
* You've added (or changed, as appropriate) documentation to the `docs/` folder in Markdown format.

Run the tests
-------------

In node:

````

$ npm install plate
$ npm test plate

````

License
-----------------
Licensed MIT.
