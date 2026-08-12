#!/bin/bash

set -eu

pids=()
pidsTimezones=()
pidsLocales=()

timezones=(EST GMT CET)
locales=(en_US ja_JP)

for timezone in "${timezones[@]}"; do
    for locale in "${locales[@]}"; do
	# Use FK_ENV_* variables to define a dedicated Flakiness.io test
	# environment.
	# See https://docs.flakiness.io/ci/configuring-environments/
        TZ=$timezone LANG=$locale \
            FK_ENV_TZ=$timezone FK_ENV_LANG=$locale \
            FLAKINESS_OUTPUT_DIR="flakiness-report-$timezone-$locale" \
            npm run test:unit -- packages/date "$@" &
        pids+=($!)
        pidsTimezones+=($timezone)
        pidsLocales+=($locale)
    done
done

for i in "${!pids[@]}"; do
    pid=${pids[i]}
    timezone=${pidsTimezones[i]}
    locale=${pidsLocales[i]}
    wait "$pid" || (
        echo "Date tests failed with timezone = $timezone and locale = $locale"
        exit 1
    )
done
