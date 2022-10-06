#!/bin/bash

# This script replaces '_Gutenberg' and 'gutenberg_' with '' and 'wp_' for the tests in this directory.
# The intention is to make things a little less tedious for backporting files during Core releases.
# It might be useful to genericize later for wider use.

# Exit if any command fails.
set -e

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

warning "This script must be run in the Gutenberg development environment.
It will copy the Gutenberg PHP Unit tests and replace '_Gutenberg' and 'gutenberg_' with '' and 'wp_'"
warning "Shall we go ahead?"
echo -n "[y]es/[N]o: "
read answer
if [ "$answer" != "${answer#[Yy]}" ]; then
  cp -r ../../phpunit/style-engine ./
  mv ./style-engine ./phpunit
  cd phpunit
  success "Copied files ✅"
  status "The following matches >>>>>"
  find ./ -type f -name "*-test.php" -exec grep -E "_Gutenberg|gutenberg_" {} \;
  status "Will be replaced by >>>>>"
  find ./ -type f -name "*-test.php" -exec sed -n "s/_Gutenberg/\x0/gp; s/gutenberg_/wp_/gp" {} \;
  warning "Shall we go ahead?"
  echo -n "[y]es/[N]o: "
  read answer
  if [ "$answer" != "${answer#[Yy]}" ]; then
    # Replaces suffixes and prefixes.
    find ./ -type f -name "*-test.php" -exec sed -i '' "s/_Gutenberg/\x0/g; s/gutenberg_/function wp_/g" {} +
    success "Okay, done! ✅"
  else
    error "No worries, aborting.🙂"
    exit 1
  fi
else
  error "No worries, aborting.🙂"
  exit 1
fi


