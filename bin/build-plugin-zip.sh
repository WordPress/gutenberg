#!/bin/bash

# Exit if any command fails
set -e

# Change to the expected directory
cd "$(dirname "$0")"
cd ..

# Enable nicer messaging for build status
YELLOW_BOLD='\033[1;33m';
COLOR_RESET='\033[0m';
status () {
	echo -e "\n${YELLOW_BOLD}$1${COLOR_RESET}\n"
}

# Make sure there are no changes in the working tree.  Release builds should be
# traceable to a particular commit and reliably reproducible.  (This is not
# totally true at the moment because we download nightly vendor scripts).
changed=
if ! git diff --exit-code > /dev/null; then
	changed="file(s) modified"
elif ! git diff --cached --exit-code > /dev/null; then
	changed="file(s) staged"
fi
if [ ! -z "$changed" ]; then
	git status
	echo "ERROR: Cannot build plugin zip with dirty working tree."
	echo "       Commit your changes and try again."
	exit 1
fi

branch="$(git rev-parse --abbrev-ref HEAD)"
if [ "$branch" != 'master' ]; then
	echo "WARNING: You should probably be running this script against the"
	echo "         'master' branch (current: '$branch')"
	echo
	sleep 2
fi

# Remove ignored files to reset repository to pristine condition. Previous test
# ensures that changed files abort the plugin build.
status "Cleaning working directory..."
git clean -xdf

# Download all vendor scripts
status "Downloading remote vendor scripts..."
vendor_scripts=""
# Using `command | while read...` is more typical, but the inside of the while
# loop will run under a separate process this way, meaning that it cannot
# modify $vendor_scripts.  See:  https://stackoverflow.com/a/16855194
exec 3< <(
	# minified versions of vendor scripts
	php bin/get-vendor-scripts.php
	# non-minified versions of vendor scripts (for SCRIPT_DEBUG)
	php bin/get-vendor-scripts.php debug
)
while IFS='|' read -u 3 url filename; do
	echo "$url"
	echo -n " > vendor/$filename ... "
	http_status=$( curl \
		--location \
		--silent \
		"$url" \
		--output "vendor/_download.tmp.js" \
		--write-out "%{http_code}"
	)
	if [ "$http_status" != 200 ]; then
		echo "error - HTTP $http_status"
		exit 1
	fi
	mv -f "vendor/_download.tmp.js" "vendor/$filename"
	echo "done!"
	vendor_scripts="$vendor_scripts vendor/$filename"
done

# Run the build
status "Installing dependencies..."
npm install
status "Generating build..."
npm run build

# Remove any existing zip file
rm -f gutenberg.zip

# Temporarily modify `gutenberg.php` with production constants defined.  Use a
# temp file because `bin/generate-gutenberg-php.php` reads from `gutenberg.php`
# so we need to avoid writing to that file at the same time.
php bin/generate-gutenberg-php.php > gutenberg.tmp.php
mv gutenberg.tmp.php gutenberg.php

# Generate the plugin zip file
status "Creating archive..."
zip -r gutenberg.zip \
	gutenberg.php \
	lib/*.php \
	blocks/library/*/*.php \
	post-content.js \
	$vendor_scripts \
	blocks/build/*.{js,map} \
	components/build/*.{js,map} \
	date/build/*.{js,map} \
	editor/build/*.{js,map} \
	element/build/*.{js,map} \
	hooks/build/*.{js,map} \
	i18n/build/*.{js,map} \
	data/build/*.{js,map} \
	utils/build/*.{js,map} \
	blocks/build/*.css \
	components/build/*.css \
	editor/build/*.css \
	README.md

# Reset `gutenberg.php`
git checkout gutenberg.php

status "Done."
