var plate = require('../index')
  , test = require('tape')

test('test of chained elif / with else', function(assert) {
  var template = [
      '    {% if alpha %}'
    , '      alpha'
    , '    {% elif beta %}'
    , '      beta'
    , '    {% else %}'
    , '      gamma'
    , '    {% endif %}'
  ].join('\n')

  template = new plate.Template(template)

  template.render({}, check('gamma'))

  function check(what) {
    return onrendered

    function onrendered(err, html) {
      assert.ok(html.indexOf(what) > -1, what + ' present as expected')
      assert.end()
    }
  }
})

test('test of chained elif / no else', function(assert) {
  var template = [
      '    {% if alpha %}'
    , '      alpha'
    , '    {% elif beta %}'
    , '      beta'
    , '    {% elif gamma %}'
    , '      gamma'
    , '    {% endif %}'
  ].join('\n')

  var pending = 3

  template = new plate.Template(template)

  template.render({alpha: 1}, check('alpha'))
  template.render({beta: 1}, check('beta'))
  template.render({gamma: 1}, check('gamma'))

  function check(what) {
    return onrendered

    function onrendered(err, html) {
      assert.ok(html.indexOf(what) > -1, what + ' present as expected')
      !--pending && assert.end()
    }
  }
})
