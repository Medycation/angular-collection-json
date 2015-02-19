define SAUCE_TARGETS
["Windows 7", "internet explorer", "9"], \
["Windows 7", "internet explorer", "8"], \
["OS X 10.9", "iphone", "7.1"] \

endef

all: test compile dist_test

node_modules:
	npm install

bower_components: node_modules
	./node_modules/bower/bin/bower install

test: bower_components
	@./node_modules/karma/bin/karma start --single-run

dist_test: compile
	@echo "Testing compiled"
	@TEST_TARGETS="dist/angular-collection-json.min.js" \
		./node_modules/karma/bin/karma start --single-run

dist:
	@mkdir -p dist

dist/angular-collection-json.js: node_modules dist lib
	@echo "Compiling coffee..."
	@./node_modules/coffee-script/bin/coffee \
		--bare \
		--compile \
		--no-header \
		--print \
		lib/client.coffee \
		lib/attributes/*.coffee \
		> dist/angular-collection-json.js

dist/angular-collection-json.ngmin.js: dist/angular-collection-json.js
	@echo "ngminifying..."
	@./node_modules/ngmin/bin/ngmin \
		< dist/angular-collection-json.js\
		> dist/angular-collection-json.ngmin.js\

dist/angular-collection-json.min.js: dist/angular-collection-json.ngmin.js
	@echo "Uglifying..."
	@./node_modules/uglify-js/bin/uglifyjs \
		< dist/angular-collection-json.ngmin.js\
		> dist/angular-collection-json.min.js\

compile: \
	dist/angular-collection-json.js \
	dist/angular-collection-json.ngmin.js \
	dist/angular-collection-json.min.js

clean:
	rm -rf dist

clean_deps:
	rm -rf node_modules bower_components

test_sauce:
	@echo "Ensure you have Sauce Connect running"
	@echo "Also, set SAUCE_USERNAME and SAUCE_ACCESS_KEY"
	@echo "Running tests for\n$(SAUCE_TARGETS)"
	@echo "Be patient..."
	@curl -X POST https://saucelabs.com/rest/v1/$(SAUCE_USERNAME)/js-tests \
		-u $(SAUCE_USERNAME):$(SAUCE_ACCESS_KEY) \
		-d url="http://localhost:9876" -d framework=jasmine \
		-d platforms='[$(SAUCE_TARGETS)]'
	@./node_modules/karma/bin/karma start --no-browsers

release: all
	@git commit -am 'build(release): rebuild for release'
	@bower version patch

.PHONY: all test test_sauce clean clean_deps dist_test dist/angular-collection-json.js
