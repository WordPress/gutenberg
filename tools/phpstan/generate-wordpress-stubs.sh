#!/bin/bash
#
# Generates the WordPress stubs that PHPStan analyzes against, from a pinned commit of WordPress
# core trunk.
#
# Gutenberg tracks core trunk, so the stubs released for each WordPress version lack the functions,
# classes, and types that were added since. Until php-stubs/wordpress-stubs publishes stubs built
# from trunk, they are generated here with its generator, and installed through the path repository
# in composer.json in place of the released package.
#
# To update the stubs, change the commits below, run this script, then `composer update` and
# `composer phpstan:baselines`.

# Exit if any command fails.
set -euo pipefail

# The commit of WordPress/wordpress-develop trunk to generate the stubs from.
WORDPRESS_DEVELOP_COMMIT=8dd36d03d3492b54b5191955a8a157f485c0f318

# The commit of php-stubs/wordpress-stubs whose generator is used. This is the head of
# https://github.com/php-stubs/wordpress-stubs/pull/498, without which the function map adds a
# second `@phpstan-return` to the docblocks for which core trunk now has its own.
WORDPRESS_STUBS_COMMIT=7c32aeca37ad7defa54758674ff62a70a521c8b5

PACKAGE_DIR="$(cd "$(dirname "$0")" && pwd)/wordpress-stubs"
WORK_DIR="$(mktemp -d "${TMPDIR:-/tmp}/wordpress-stubs.XXXXXX")"
trap 'rm -rf "$WORK_DIR"' EXIT

# Fetches a single commit of a GitHub repository into a new directory, limited to the given paths.
fetch_commit() {
	local dir="$1" repo="$2" commit="$3"
	shift 3
	git init --quiet "$dir"
	git -C "$dir" sparse-checkout set --no-cone "$@"
	git -C "$dir" fetch --quiet --depth=1 --filter=blob:none "https://github.com/$repo.git" "$commit"
	git -C "$dir" -c advice.detachedHead=false checkout --quiet FETCH_HEAD
}

echo "Fetching WordPress/wordpress-develop@$WORDPRESS_DEVELOP_COMMIT"
fetch_commit "$WORK_DIR/wordpress-develop" WordPress/wordpress-develop "$WORDPRESS_DEVELOP_COMMIT" '/src/'

echo "Fetching php-stubs/wordpress-stubs@$WORDPRESS_STUBS_COMMIT"
fetch_commit "$WORK_DIR/wordpress-stubs" php-stubs/wordpress-stubs "$WORDPRESS_STUBS_COMMIT" '/*'

# The generator reads the WordPress source from source/wordpress. Its Composer scripts would install
# the latest WordPress release there, so they are skipped.
composer --working-dir="$WORK_DIR/wordpress-stubs" update --no-interaction --no-progress --no-scripts
cp -R "$WORK_DIR/wordpress-develop/src" "$WORK_DIR/wordpress-stubs/source/wordpress"

echo "Generating the stubs"
(cd "$WORK_DIR/wordpress-stubs" && ./generate.sh)

# The SVN revision of the commit, and the WordPress version at it, such as 7.2-beta1-64606-src.
# A path repository needs an explicit version, which szepeviktor/phpstan-wordpress requires to be at
# least 6.6.2, so it is derived from these, such as 7.2.0-beta1.64757.
REVISION="$(git -C "$WORK_DIR/wordpress-develop" log -1 --format=%B | sed -n 's/^git-svn-id: [^@]*@\([0-9]*\) .*/\1/p')"
WP_VERSION="$(php -r 'require $argv[1]; echo $wp_version;' "$WORK_DIR/wordpress-develop/src/wp-includes/version.php")"
if [[ ! "$REVISION" =~ ^[0-9]+$ || ! "$WP_VERSION" =~ ^([0-9]+\.[0-9]+)(\.[0-9]+)?-([a-zA-Z]+[0-9]*)- ]]; then
	echo "Unable to determine the revision ($REVISION) and version ($WP_VERSION) of the commit." >&2
	exit 1
fi
PACKAGE_VERSION="${BASH_REMATCH[1]}${BASH_REMATCH[2]:-.0}-${BASH_REMATCH[3]}.$REVISION"

# Replace the generator's header with one that records where the stubs came from.
{
	cat <<-HEADER
		<?php
		/**
		 * Generated stub declarations for WordPress trunk, for Gutenberg's PHPStan analysis.
		 *
		 * Generated from https://github.com/WordPress/wordpress-develop/commit/$WORDPRESS_DEVELOP_COMMIT (r$REVISION)
		 * with https://github.com/php-stubs/wordpress-stubs/commit/$WORDPRESS_STUBS_COMMIT.
		 *
		 * Do not edit. Regenerate with tools/phpstan/generate-wordpress-stubs.sh.
		 */
	HEADER
	awk 'header_done { print; next } /^ \*\/$/ { header_done = 1 }' "$WORK_DIR/wordpress-stubs/wordpress-stubs.php"
} > "$PACKAGE_DIR/wordpress-stubs.stub"

printf '{\n\t"name": "php-stubs/wordpress-stubs",\n\t"version": "%s",\n\t"description": "%s",\n\t"license": "GPL-2.0-or-later"\n}\n' \
	"$PACKAGE_VERSION" \
	"WordPress stubs generated from core trunk r$REVISION by tools/phpstan/generate-wordpress-stubs.sh, in place of the released package." \
	> "$PACKAGE_DIR/composer.json"

echo "Generated the stubs for WordPress $WP_VERSION at r$REVISION, as version $PACKAGE_VERSION."
