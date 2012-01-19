#!/bin/bash

git clone git@github.com:chrisdickinson/tz.js .tz.js
cd .tz.js
make build
cd ..
python support/build.py .plate.js
node node_modules/.bin/platoon -s -b test.html -I .plate.js -I .tz.js/tz.js tests
rm .plate.js
rm -rf .tz.js
