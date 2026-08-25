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
	# traceable to a particular commit and reliably reproducible.
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

	# WordPress Core builds prune non-public icons using jq, which is expected to be
	# present on the system running this script.
	if [ "$IS_WORDPRESS_CORE" = "true" ] && ! command -v jq > /dev/null 2>&1; then
		error "ERROR: jq is required to build for WordPress Core but was not found. 🫥
		Install jq (https://jqlang.org/) and try again."
		exit 1
	fi
fi

# Run the build.
status "Installing dependencies... 📦"
npm cache verify
npm ci
status "Generating build... 👷‍♀️"
npm run build

# Only including public icons when building for WordPress Core.
#
# This runs before creating the archive but after the build so icon collection validation passes as expected. Plugin
# builds keep the full library.
if [ "$IS_WORDPRESS_CORE" = "true" ]; then
	status "Pruning non-public icons for WordPress Core... ✂️"
	(
  	cd packages/icons/src
  	non_public_icons=$(comm -13 \
  		<(jq -r "map(select(.public) | .filePath)[]" manifest.json | sort) \
  		<(ls library/*.svg))
  	echo "$non_public_icons" | sed 's|^|  Deleting packages/icons/src/|'
  	echo "$non_public_icons" | xargs rm
  )
fi

# Generate the plugin zip file.
status "Creating archive... 🎁"
zip --recurse-paths --no-dir-entries \
	gutenberg.zip \
	gutenberg.php \
	lib \
	packages/block-serialization-default-parser/*.php \
	packages/icons/src/manifest.php \
	packages/icons/src/library/*.svg \
	build \
	build-module \
	readme.txt \
	changelog.txt \
	README.md

status "Restoring non-public icons... 🔁"
git diff --name-only --diff-filter=D -- packages/icons/src | sed 's|^|  Restoring |'
git restore packages/icons/src

success "Done. You've built Gutenberg! 🎉 "
