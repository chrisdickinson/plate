build:
	npm install
	./node_modules/.bin/browserify -s plate browser.js > dist/plate.js
	cat dist/plate.js | uglifyjs > dist/plate.min.js
	node ./support/build-debug.js > dist/plate.debug.js

test:
	npm install
	npm test
