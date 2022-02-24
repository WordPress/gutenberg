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
	rm -rf "$DIRECTORY/example-static-es5"
	rm -rf "$DIRECTORY/example-static"
}

trap cleanup EXIT

# First test block

status "Scaffolding Example Static (ES5) block..."
npx wp-create-block example-static-es5 -t es5
cd example-static-es5

status "Verifying project..."
expected=8
actual=$( find . -maxdepth 1 -type f | wc -l )
if [ "$expected" -ne "$actual" ]; then
	error "Expected $expected files in the project root, but found $actual."
    exit 1
fi

cd ..

# Second test block

status "Scaffolding Example Static block..."
npx wp-create-block example-static --no-wp-scripts
cd example-static

status "Verifying project..."
expected=5
actual=$( find . -maxdepth 1 -type f | wc -l )
if [ "$expected" -ne "$actual" ]; then
	error "Expected $expected files in the project root, but found $actual."
    exit 1
fi
expected=6
actual=$( find src -maxdepth 1 -type f | wc -l )
if [ "$expected" -ne "$actual" ]; then
	error "Expected $expected files in the `src` directory, but found $actual."
    exit 1
fi

status "Formatting files..."
../node_modules/.bin/wp-scripts format

status "Building block..."
../node_modules/.bin/wp-scripts build

status "Verifying build..."
expected=5
actual=$( find build -maxdepth 1 -type f | wc -l )
if [ "$expected" -ne "$actual" ]; then
	error "Expected $expected files in the `build` directory, but found $actual."
    exit 1
fi

status "Linting CSS files..."
../node_modules/.bin/wp-scripts lint-style

status "Linting JavaScript files..."
../node_modules/.bin/wp-scripts lint-js

status "Creating a plugin zip file..."
../node_modules/.bin/wp-scripts plugin-zip
