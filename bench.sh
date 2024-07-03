#!/usr/bin/env bash

caffeinate -dsiu \
hyperfine \
	-L checkout origin/trunk,fix/improve-components-ts-perf \
	--prepare 'git checkout {checkout}' './node_modules/.bin/tsc --build packages/components --force' -n '{checkout}' \
	--export-markdown bench.md
