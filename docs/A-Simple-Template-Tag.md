# Writing Template Tags
## Part 1: A Simple Template Tag
### Why write a template tag?
Template tags are designed to encompass more complicated logic than custom filters; as such, they are able to modify the current `context` variable.
If you have custom view logic that requires knowledge of multiple context variables, or could potentially fail, it should probably go into a template tag.

Plate inherits much of it's underlying design from the Django Template Language, which (depending on your outlook) fortunately or unfortunately includes
it's requirement that one must write a custom tag parser for a new tag. On the upside, you've got JavaScript's brilliant `RegExp` implementation to make
things easier.

### Let's Take a First pass

A good first step is to write a simple, synchronous template tag -- in this case, a simple tag that outputs the current Date.

````javascript
  var NowNode = function() {
  };
  // context is an `Object` with the special property `copy`.
  // ready is a callback that takes (surprise!) `error` and `data`.
  NowNode.prototype.render = function(context, ready) {
    ready(null, new Date())
  };

  // we attach the parsing function to the NowNode
  // class out of convention, not necessity.
  NowNode.parse = function(tokenContents, parser) {
    return new NowNode();
  };

  // register it under the name 'now'
  plate.Template.Meta.registerTag('now', NowNode.parse);

  // test it!
  (new plate.Template('{% now %}')).render({}, function(err, data) {
    // it should look like (new Date).toString()!
    console.log(data);
  })
````

The two required pieces for a template tag are the `Node` class and the `parse` function. 
Whenever a '{% templatetagname %}' token is encountered, plate attempts to look up the registered
parser for that name. If it's found, it calls the parse function with the string contents of that
tag (sans leading and trailing whitespace) -- so `{% tag thing1 thing2 thing3 %}` will be call the 'tag'
parser with 'tag thing1 thing2 thing3' as the first argument.

The second argument is a `Parser` instance that exposes a bit more functionality to you -- specifically,
the ability to `parse_until` a closing tag. In the [next section](A Complex Template Tag), we'll cover how
to use the `parser` argument, as well as how to modify context.
