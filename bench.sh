#!/usr/bin/env bash

caffeinate -dsiu \
hyperfine \
	-L checkout fix/improve-components-ts-perf,trunk \
	--prepare 'git checkout {checkout}' './node_modules/.bin/tsc --build packages/components --force' -n '{checkout}' \
	--export-markdown bench.md
