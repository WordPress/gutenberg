#!/usr/bin/env bash

caffeinate -dsiu \
hyperfine \
	-L checkout cf45f4595b6201ff22d4aa8f9d44a3b0c30bf76a,d4baf294767,120b554aa46,475be71ee27,283a1e003f5 \
	--prepare 'git checkout {checkout}' './node_modules/.bin/tsc --build packages/components --force' -n '{checkout}' \
	--export-markdown bench.md \
	--show-output


