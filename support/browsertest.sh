#!/bin/bash

curl https://raw.github.com/chrisdickinson/dst.js/master/index.js 2>/dev/null >> tz.js
python support/build.py plate.js
node node_modules/.bin/platoon -s -b test.html -I tests/plate.js -I ../dstjs/index.js tests

