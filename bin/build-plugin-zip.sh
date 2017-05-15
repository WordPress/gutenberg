#!/bin/sh

# Exit if any command fails
set -e

# Change to the expected directory
cd "$(dirname "$0")"
cd ..

# Remove any existing build
rm -f gutenberg.zip

# Run the build
npm install
npm run build

# Generate the plugin zip file
zip -r gutenberg.zip \
    index.php \
    post-content.js \
    editor/build \
    i18n/build \
    element/build \
    blocks/build \
    README.md
