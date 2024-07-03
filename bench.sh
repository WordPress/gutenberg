#!/usr/bin/env bash

caffeinate -dsiu \
hyperfine \
	-L checkout origin/trunk,fix/improve-components-ts-perf \
	--prepare 'git checkout {checkout}' 'node --max-old-space-size=16000 ./node_modules/.bin/tsc --build packages/components --force' -n '{checkout}' \
	--export-markdown bench.md
