#!/bin/sh

# check if CIRCLE_BRANCH variable is set
if [[ -n "$CIRCLE_BRANCH" ]] ; then
    # replace / with - and assign to new var SAUCE_FILENAME
    export SAUCE_FILENAME=${CIRCLE_BRANCH//[\/]/-};
 else
    echo "Expected CIRCLE_BRANCH env variable";
fi
