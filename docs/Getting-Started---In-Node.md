# Getting Started / In Node

Welcome, node.js-faring djangonauts (and other interested parties!) I'm pleased to present the two steps necessary to install plate and setup a loading system!

## Step 1: Install it

````bash
$ npm install plate
````

Done. Take a break, have some coffee or beer. It's obvious that you must be exhausted by now.

## Step 2: Configure it

Open a file in your project -- say, `lib/template.js`.

````javascript
// lib/template.js
var plate = require('plate')
  , Loader = require('plate/lib/plugins/loaders/filesystem').Loader
  , path = require('path')

var plugin;
module.exports = plugin = new Loader([
    path.resolve(path.join(__dirname, '../templates'))
]).getPlugin()
````

`Loader` takes an array of paths to search when looking for a template. This example will look for templates in `<yourproject>/templates`. We make sure to export the plugin as well, so in our controller, we can do something like this:

````javascript
// lib/controller.js

// NOTE: this is (sort of) assuming we're using express / mongoose.
// but neither of those two libraries are *actually* required.
// they just make for a nice "real world"-y example.

var template = require('./template')
exports.list_users = function(req, resp, db) {
  var User = db.model('User')
  var context = {
    'users':function(ready) { User.find({}, ready) }
  }
  template('user_list.html', function(err, tplInstance) {
    tplInstance.render(context, function(err, data) {
      resp.send(data)
    })
  })
}
````

And our template can look like this:

````django
{% extends "base.html" %}

{% block content %}
{% for user in users %}
  <li>{{ user.name }}</li>
{% endfor %}
{% endblock %}
````

And you're pretty much done getting started!