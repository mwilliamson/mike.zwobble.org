.PHONY: test 

start-server:
	node lib/blog/main.js

test:
	NODE_PATH=lib node_modules/.bin/nodeunit `find test -type d`

