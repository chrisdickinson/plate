browser:
	browserify -r tz -r dst browser.js > plate.js
	cat plate.js | uglifyjs > plate.min.js
	platoon -b index.html -I plate.min.js

build:
	browserify -r tz -r dst browser.js | uglifyjs > plate.min.js

test:
	platoon -s tests/
