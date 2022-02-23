#!/bin/bash

# This script validates whether `npm init @wordpress/block` works properly
# with the latest changes applied to the `trunk` branch. It purposefully
# avoids installing `@wordpress/scripts` package from npm when scaffolding
# a test block and uses the local package by executing everything from the
# root of the project.

# Exit if any command fails.
set -e

DIRECTORY="$PWD"

status () {
	echo -e "\n\033[1;34m$1\033[0m\n"
}

error () {
	echo -e "\n\033[1;31m$1\033[0m\n"
}

cleanup() {
	rm -rf "$DIRECTORY/esnext-test"
}

trap cleanup EXIT

status "Scaffolding block..."
npx wp-create-block esnext-test --no-wp-scripts
cd esnext-test

status "Formatting files..."
../node_modules/.bin/wp-scripts format

status "Building block..."
../node_modules/.bin/wp-scripts build

status "Verifying build..."
expected=5
actual=$( ls build | wc -l )
if [ "$expected" -ne "$actual" ]; then
	error "Expected $expected files in the build folder, but found $actual."
    exit 1
fi

status "Linting CSS files..."
../node_modules/.bin/wp-scripts lint-style

status "Linting JavaScript files..."
../node_modules/.bin/wp-scripts lint-js

status "Creating a plugin zip file..."
../node_modules/.bin/wp-scripts plugin-zip
