browser:
	npm install --dev
	./node_modules/.bin/browserify browser.js > dist/plate.js
	./node_modules/.bin/browserify browser.js > dist/plate.min.js
	node ./support/build-debug.js > dist/plate.debug.js

build:
	npm install --dev
	./node_modules/.bin/browserify browser.js > dist/plate.js
	./node_modules/.bin/browserify browser.js > dist/plate.min.js
	node ./support/build-debug.js > dist/plate.debug.js

test:
	npm install --dev
	npm test
