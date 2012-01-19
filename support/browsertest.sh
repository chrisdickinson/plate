#!/bin/bash

curl https://raw.github.com/chrisdickinson/dst.js/master/index.js 2>/dev/null > .dst.js
python support/build.py .plate.js
node node_modules/.bin/platoon -s -b test.html -I .plate.js -I .dst.js tests
rm .plate.js
rm .dst.js
