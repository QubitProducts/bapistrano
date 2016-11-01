BIN = ./node_modules/.bin

.PHONY: bootstrap test compile watch;

bootstrap:
	yarn

compile:
	NODE_ENV=production $(BIN)/babel lib --out-dir dist --copy-files

watch:
	NODE_ENV=production $(BIN)/babel lib --out-dir dist --copy-files --watch

test: lint

lint:
	$(BIN)/standard

release:
	$(BIN)/release
