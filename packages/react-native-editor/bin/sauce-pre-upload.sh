#!/bin/sh

# check if TRAVIS_PULL_REQUEST_BRANCH variable is set
if [[ -n "$TRAVIS_PULL_REQUEST_BRANCH" ]] ; then
    # replace / with - and assign to new var SAUCE_FILENAME
    export SAUCE_FILENAME=${TRAVIS_PULL_REQUEST_BRANCH//[\/]/-};
 else
    echo "Expected TRAVIS_PULL_REQUEST_BRANCH env variable";
fi
