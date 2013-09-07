build:
	npm install
	./node_modules/.bin/browserify -s plate browser.js > dist/plate.js
	./node_modules/.bin/browserify -s plate browser.js --debug > dist/plate.debug.js
	cat dist/plate.js | uglifyjs > dist/plate.min.js

test:
	npm install
	npm test
