BIN = ./node_modules/.bin

.PHONY: bootstrap test compile;

bootstrap:
	yarn

compile:
	NODE_ENV=production $(BIN)/async-to-gen lib --out-dir dist

test: lint

lint:
	$(BIN)/standard

release:
	$(BIN)/release
