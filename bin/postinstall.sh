#!/usr/bin/env bash

if [ "$CI_RUN" != "e2e" ]; then
	npm run mobile-install && npm run check-licenses && npm run build:packages
fi
