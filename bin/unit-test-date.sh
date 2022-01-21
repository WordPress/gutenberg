#!/bin/bash

set -eu

pids=()
pidsTimezones=()
pidsLocales=()

timezones=(EST GMT CET)
locales=(en_US ja_JP)

for timezone in "${timezones[@]}"; do
    for locale in "${locales[@]}"; do
        TZ=$timezone LANG=$locale pnpm test-unit -- packages/date "$@" &
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
