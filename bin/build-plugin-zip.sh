#!/bin/sh

# Exit if any command fails
set -e

# Change to the expected directory
cd "$(dirname "$0")"
cd ..

# Run the build
npm install
npm run build

# Remove any existing zip file
rm -f gutenberg.zip

# Generate the plugin zip file
zip -r gutenberg.zip \
	gutenberg.php \
	lib/*.php \
	lib/blocks/*.php \
	post-content.js \
	blocks/build \
	components/build \
	date/build \
	editor/build \
	element/build \
	i18n/build \
	utils/build \
	README.md
