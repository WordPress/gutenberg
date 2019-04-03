#!/bin/sh


if [[ "${DEVICE_TESTS}" = true ]] ; then
    cp ./bin/example-content/initial-device-tests-html.js ./src/app/initial-html.js
    else
    cp ./bin/example-content/initial-html.js ./src/app/initial-html.js
fi;
