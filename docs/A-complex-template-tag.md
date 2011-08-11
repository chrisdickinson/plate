# Writing Template Tags
## Part 2: A Complex Template Tag
### A quick refresher

Remember this?

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
````

Well, it seems pretty useless at the moment. It'd be a lot nicer if we could
assign it to the current context.

To do that, though, we'll need to construct a `NodeList` containing all the nodes
where our new context variable will be in effect.

Let's revisit the tag parser, shall we?

````javascript

NowNode.parse = function(contents, parser) {
    var re = /now as ([\w\d\_]+)/g
      , match = re.exec(contents);

  // we're looking at the context-modifying variant of this tag
  if(match) {
    var contextVar = match[1]
      , nodes = parser.parseUntil(['endnow']);

    // the parser will leave the last token
    // on the stack -- so that we can switch
    // behavior based on what it's contents are.
    // in this case, we don't care.
    parser.tokens.shift();

    return new NowNode(contextVar, nodes);
  } else {
    // return the old, boring version.
    return new NowNode();
  }
};
````

We've updated our `parse` function and added another path for it to follow -- if it encounters
a tag that looks like `{% now as currentTime %}{% endnow %}`, it will send the nodelist (everything
in between `now` and `endnow` along with `currentTime` to the `NowNode`.)

We should update the Node to support this usage:

````javascript
var NowNode = function(varName, nodes) {
    this.varName = varName;
    this.nodes = nodes;
};

NowNode.prototype.render = function(context, ready) {
    if(this.varName && this.nodes) {
        // the new behavior

        // copy the context and assign the date to our
        // varName.
        var ctxt = context.copy();
        ctxt[this.varName] = new Date;

        // render our nodelist using the new
        // context.
        this.nodelist.render(ctxt, ready);
    } else {
        // the old behavior
        ready(null, new Date());
    }
};
````

The new `NowNode` will optionally take a varName and a list of nodes to render. If it has these properties,
it attempts to trigger the new behavior -- setting the provided varName to a new Date object, and rendering
the node list with a new context scope. Otherwise it falls back to the older, less useful behavior.

NOTE: copying the context doesn't actually loop over the context variable; it uses JavaScript's handy prototype
chaining to create a child object that uses the current context as its parent prototype. Copying the context in
this fashion should be a fairly lightweight operation.

### Why copy the context? Why take a nodelist?

Plate differs from the Django Template Language in this regard -- in the DTL, you'd simply assign the new context
variable and be done with it; no nodelist parsing necessary. That's because the DTL is written to be synchronous:
specifically, you can be assured that each node will be evaluated and return a result before the next node is evaluated.

Plate doesn't do this. When it encounters a list of nodes, it attempts to fire off all of them at once. Some may fire within
the same stack. Others -- asynchronous nodes -- may fire off, but return later. Imagine this situation:

````javascript
var context = {
    'lhs':function(ready) {
        setTimeout(function() {
            ready(null, 'hi there');
        }, 1000);
    },
    'rhs':function(ready) {
        setTimeout(function() {
            ready(null, 'friend.');
        }, 1000);
    },
    'list':[1,2,3,4,5,6,7]
}

var tpl = new plate.Template('
    {{ lhs }}\
    {{ rhs }}\
    {% for i in list %}\
        {{ i }}\
    {% endfor %}\
');

var start = +(new Date());
tpl.render(context, function(err, data) {
    console.log(+(new Date()) - start);
});
````

How long should this template take to run? If Plate acted like the DTL in this situation, it would take (at minimum) 2 seconds to
render and return a result. This is fairly unacceptable. Instead, Plate eagerly calls `render` on each node in the list, expecting
them to return at a later time. When they return, they are pieced together according to their original order. This cuts the runtime
down to 1s, since both `lhs` and `rhs` are fired off at roughly the same time.

### Okay, but why the nodelist?

Simply put, since node lists render in parallel (in as much as is possible), there's no way to guarantee that nodes that work like
this:

````django
{% now as date %}
{{ date }}
````

will act as expected. `now` could take 3 seconds to return a result, but by that time we will have already evaluated the next node --
the variable node containing `{{ date }}` -- and returned it's value (which, since `now` hasn't assigned the variable yet, will be nothing!).

The solution is to make all context-modifying nodes take a nodelist where the result of their context modification will apply -- a "shared nothing" approach to rendering templates.
