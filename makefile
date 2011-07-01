.PHONY: test 

start-mongo:
	mongod --dbpath=mongo-data

start-server:
	node lib/blog/main.js

test:
	NODE_PATH=lib nodeunit `find test -type d`

