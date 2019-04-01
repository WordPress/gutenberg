#!/bin/sh


if [[ "${DEVICE_TESTS}" = true ]] ; then
    cp ./bin/tmp/initial-device-tests-html.js ./src/app/initial-html.js
    else
    cp ./bin/tmp/initial-html.js ./src/app/initial-html.js
fi;
