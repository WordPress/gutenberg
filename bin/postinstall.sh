#!/usr/bin/env bash

if [ "$SKIP_POSTINSTALL" != "true" ]; then
	npm run mobile-install && npm run check-licenses && npm run build:packages
fi
