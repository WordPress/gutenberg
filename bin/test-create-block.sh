#!/bin/bash

# This script validates whether the create-block package works properly
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
node ./packages/create-block/index.js example-static-es5 -t es5
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
node ./packages/create-block/index.js example-static --no-wp-scripts
cd example-static

status "Verifying project..."
expected=5
actual=$( find . -maxdepth 1 -type f | wc -l )
if [ "$expected" -ne "$actual" ]; then
	error "Expected $expected files in the project root, but found $actual."
    exit 1
fi
expected=7
actual=$( find src -maxdepth 2 -type f | wc -l )
if [ "$expected" -ne "$actual" ]; then
	error "Expected $expected files in the \`src\` directory, but found $actual."
    exit 1
fi

# Create an ESLint config that extends wp-scripts' default config but uses the
# monorepo's custom import resolver. This is needed because local @wordpress/*
# packages export paths pointing to built files (build-module/), but we haven't
# run a build. The custom resolver maps these to source files (src/) instead.
cat > .eslintrc.js << 'EOF'
module.exports = {
	extends: [ require.resolve( '@wordpress/scripts/config/.eslintrc' ) ],
	settings: {
		'import/resolver': require.resolve( '../tools/eslint/import-resolver' ),
	},
};
EOF

# Set NODE_PATH to include @wordpress/scripts node_modules so webpack can be found.
# With pnpm, dependencies are not hoisted to root node_modules, so we need to
# explicitly add the path where webpack is installed.
export NODE_PATH="../packages/scripts/node_modules:$NODE_PATH"

status "Formatting files..."
pnpm exec wp-scripts format

status "Building block..."
pnpm exec wp-scripts build

status "Verifying build..."
expected=9
actual=$( find build -maxdepth 2 -type f | wc -l )
if [ "$expected" -ne "$actual" ]; then
	error "Expected $expected files in the \`build\` directory, but found $actual."
    exit 1
fi

status "Linting CSS files..."
pnpm exec wp-scripts lint-style

# Ensure monorepo prelint:js scripts have run (e.g., to build design tokens for ESLint).
status "Running prelint:js..."
( cd .. && pnpm run prelint:js )

status "Linting JavaScript files..."
pnpm exec wp-scripts lint-js

status "Creating a plugin zip file..."
pnpm exec wp-scripts plugin-zip
