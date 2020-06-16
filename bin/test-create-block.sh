#!/bin/bash

# This script validates whether `npm init @wordpress/block` works properly
# with the latest changes applied to the `master` branch. It purpousfuly
# avoids installing `@wordpress/scripts` package from npm when scaffolding
# a test block and uses the local package by executing everything from the
# root of the project.

# Exit if any command fails.
set -e

status () {
	echo -e "\n\033[1;34m$1\033[0m\n"
}

status "Scaffolding block..."
rm -rf esnext-test
npx wp-create-block esnext-test --no-wp-scripts
cd esnext-test

status "Formatting JavaScript files..."
../node_modules/.bin/wp-scripts format-js

status "Building block..."
../node_modules/.bin/wp-scripts build

status "Lintig CSS files..."
../node_modules/.bin/wp-scripts lint-style

status "Linting JavaScript files..."
../node_modules/.bin/wp-scripts lint-js
