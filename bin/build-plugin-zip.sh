#!/bin/bash

# Exit if any command fails.
set -e

# Change to the expected directory.
cd "$(dirname "$0")"
cd ..

# Enable nicer messaging for build status.
BLUE_BOLD='\033[1;34m';
GREEN_BOLD='\033[1;32m';
RED_BOLD='\033[1;31m';
YELLOW_BOLD='\033[1;33m';
COLOR_RESET='\033[0m';
error () {
	echo -e "\n${RED_BOLD}$1${COLOR_RESET}\n"
}
status () {
	echo -e "\n${BLUE_BOLD}$1${COLOR_RESET}\n"
}
success () {
	echo -e "\n${GREEN_BOLD}$1${COLOR_RESET}\n"
}
warning () {
	echo -e "\n${YELLOW_BOLD}$1${COLOR_RESET}\n"
}

status "💃 Time to build the Gutenberg plugin ZIP file 🕺"

if [ -z "$NO_CHECKS" ]; then
	# Make sure there are no changes in the working tree. Release builds should be
	# traceable to a particular commit and reliably reproducible. (This is not
	# totally true at the moment because we download nightly vendor scripts).
	changed=
	if ! git diff --exit-code > /dev/null; then
		changed="file(s) modified"
	elif ! git diff --cached --exit-code > /dev/null; then
		changed="file(s) staged"
	fi
	if [ ! -z "$changed" ]; then
		git status
		error "ERROR: Cannot build plugin zip with dirty working tree. ☝️
		Commit your changes and try again."
		exit 1
	fi

	# Do a dry run of the repository reset. Prompting the user for a list of all
	# files that will be removed should prevent them from losing important files!
	status "Resetting the repository to pristine condition. ✨"
	to_clean=$(git clean -xdf --dry-run)
	if [ ! -z "$to_clean" ]; then
		echo $to_clean
		warning "🚨 About to delete everything above! Is this okay? 🚨"
		echo -n "[y]es/[N]o: "
		read answer
		if [ "$answer" != "${answer#[Yy]}" ]; then
			# Remove ignored files to reset repository to pristine condition. Previous
			# test ensures that changed files abort the plugin build.
			status "Cleaning working directory... 🛀"
			git clean -xdf
		else
			error "Fair enough; aborting. Tidy up your repo and try again. 🙂"
			exit 1
		fi
	fi
fi

# Download all vendor scripts
status "Downloading remote vendor scripts... 🛵"
vendor_scripts=""
# Using `command | while read...` is more typical, but the inside of the `while`
# loop will run under a separate process this way, meaning that it cannot
# modify $vendor_scripts. See: https://stackoverflow.com/a/16855194
exec 3< <(
	# Get minified versions of vendor scripts.
	php bin/get-vendor-scripts.php
	# Get non-minified versions of vendor scripts (for SCRIPT_DEBUG).
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
		error "HTTP $http_status"
		exit 1
	fi
	mv -f "vendor/_download.tmp.js" "vendor/$filename"
	echo -e "${GREEN_BOLD}done!${COLOR_RESET}"
	vendor_scripts="$vendor_scripts vendor/$filename"
done

# Run the build.
status "Installing dependencies... 📦"
pnpm install
status "Generating build... 👷‍♀️"
pnpm build

# Temporarily modify `gutenberg.php` with production constants defined. Use a
# temp file because `bin/generate-gutenberg-php.php` reads from `gutenberg.php`
# so we need to avoid writing to that file at the same time.
php bin/generate-gutenberg-php.php > gutenberg.tmp.php
mv gutenberg.tmp.php gutenberg.php

build_files=$(
	ls build/*/*.{js,css,asset.php} \
	build/block-library/blocks/*.php \
	build/block-library/blocks/*/block.json \
	build/block-library/blocks/*/*.{js,css,asset.php} \
	build/edit-widgets/blocks/*/block.json \
	build/widgets/blocks/*.php \
	build/widgets/blocks/*/block.json \
)


# Generate the plugin zip file.
status "Creating archive... 🎁"
zip -r gutenberg.zip \
	gutenberg.php \
	lib \
	packages/block-serialization-default-parser/*.php \
	post-content.php \
	$vendor_scripts \
	$build_files \
	readme.txt \
	changelog.txt \
	README.md

# Reset `gutenberg.php`.
git checkout gutenberg.php

success "Done. You've built Gutenberg! 🎉 "
