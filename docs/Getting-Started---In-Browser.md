# Getting Started / In Browser

It's an exciting day! You have a project that's relatively heavy on client side logic, and you'd like to abstract your view layer into something a little cleaner than `$('<div></div>').append($('<blerp />')).appendTo('body')`. You may (or may not) be familiar with the [Django Template Language](https://docs.djangoproject.com/en/1.3/topics/templates/) -- it's geared towards making it easy to separate concerns between designers and developers -- and may want a templating language that looks familiar. Or, you may wish to have a template language that knows about the asynchronous nature of JavaScript, and fully endorses the use of XHR as context variables. Or finally, you may be a relative or close friend of mine, in which case I thank you for the reverse nepotism :)

## Build it!

It's easy to build:

````bash
$ git clone git://github.com/chrisdickinson/plate.git
$ cd plate
$ make build      # this creates plate.js in the plate repository directory -- the one you're currently in.
````

And amenable to minifying:

````bash
$ cat plate.js | jsmin > plate.min.js
# OR, preferably:
$ cat plate.js | uglifyjs > plate.min.js
````

## A Simple Example

Plate is designed to be framework agnostic, but plays nicely with jQuery et. al. Let's write a simple template:

````html
<script type="text/javascript">
  $(function() {
    // plate namespaces everything under -- you guessed it -- `plate`.
    // pass your raw template string as the first argument to the Template constructor.
    // NOTE: plate won't do anything with it until you attempt to render it.
    var template = new plate.Template('<ul>{% for item in items %}<li>{{ item }}</li>{% endfor %}</ul>');

    // context may be passed in as a normal object hash. nothin' fancy.
    var context = {'items':['gary', 'busey', 'is', 'alright']};

    // render it!
    template.render(context, function(err, data) {
       // in this case, we want to be noisy if we fail.
       if(err) throw err;

       // note that `data` will just be a plain string.
       // it's handy to wrap it with jQuery on the way out.
       var $html = $(data);
       $('body').append($html);
    });
  });
</script>
````

You'll only have to remember `new plate.Template(<str>)` and `plate.render(context, function(err, data) { ... })`, in most cases -- and that data gets passed back as a string.

## But what about includes and extends?

One of the biggest boons of the Django Template Language is the template inheritance pattern. Plate supports this 100%, but you have to do some legwork at the outset. As aforementioned, plate is *framework agnostic* -- meaning it can't count on jQuery being there, or even that XMLHttpRequests will be present.

The upside is that plate gives you a lot of freedom in terms of how you'd like to configure your template loading.

Let's look at the easiest way to get up and running with a template loader -- the `<script type="text/html">` paradigm:

````html
<!-- let's define some templates: "base" and "list". -->
<script id="base" type="text/html">
  <ul>
    {% block content %}

    {% endblock %}
  </ul>
</script>
<script id="list" type="text/html">
{% extends "base" %}

{% block content %}
  {% for item in items %}
    <li>{{ item }}</li>
  {% endfor %}
{% endblock %}
</script>
<!-- and the loader code. -->
<script type="text/javascript">
$(function() {
  // the `Meta` object is a handy way to define defaults
  // for all of your `plate.Template` instances.

  plate.Template.Meta.registerPlugin(
    // plate looks for a plugin called 'loader' when loading templates.
    'loader',
    function(templateName, ready) {
      // `templateName` is the string containing your template name -- exciting, I know.
      // e.g., `{% extends "base" %}` will call the loader with `"base"`.
      var target = $('#'+templateName);
      if(target.length) {
        // ready takes two parameters -- `err` and `template`.
        ready(null, new plate.Template(target.text()));
      } else {
        ready(new Error('Could not find '+templateName));
      }
    }
  )
</script>
````

Elsewhere, can easily lean on that loader:

````javascript
  var template = new plate.Template('{% extends "list" %}');
  var context = {'items':['hats','are','fancy']};
  template.render(context, function(err, data) {
      $('body').append($(data));
  });
````

So, you may be asking: why use `ready` in the loader? Why not just `return new plate.Template(<txt>);`? Are you a sadist?

A possible rebuttal, in the form of a stanza:

````javascript

plate.Template.Meta.registerPlugin('loader',
  function(templateName, ready) {
    var xhr = new XMLHttpRequest;
    xhr.onreadystatechange = function() {
      if(xhr.readyState === 4) {
        ready(null, new plate.Template(xhr.responseText));
      }
    };
    xhr.open('GET', '/platetemplates/'+templateName);
    xhr.send(null);
  }
);

````

Now your loader will grab the template strings from your server, at "/platetemplates/<templatename>", easy-as-you-please.