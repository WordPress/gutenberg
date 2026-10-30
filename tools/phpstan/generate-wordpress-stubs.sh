#!/bin/bash
#
# Generates the WordPress stubs that PHPStan analyzes against, from WordPress core trunk or from a
# wordpress-develop pull request.
#
# Gutenberg tracks core trunk, so the stubs released for each WordPress version lack the functions,
# classes, and types that were added since. Until php-stubs/wordpress-stubs publishes stubs built
# from trunk, they are generated here with its generator, and installed through the path repository
# in composer.json in place of the released package.
#
# The stubs are not committed. The package's composer.json records the source that they are generated
# from, and `composer phpstan` runs this script with no option first, which generates them when they
# are missing or were generated from another source.
#
# This is temporary. Once php-stubs/wordpress-stubs publishes builds from trunk, require a pinned one
# instead, and remove this script, the wordpress-stubs/ package, and the path repository.
#
# Usage, through `composer phpstan:generate-wordpress-stubs -- <option>`:
#
#   (no option)          Generate the stubs from the source recorded in wordpress-stubs/composer.json,
#                        unless they already were. Add `--force` to generate them anyway.
#   --commit=<ref>       Generate from a commit of wordpress-develop, such as `trunk`.
#   --pr=<number|url>    Generate from the head of a wordpress-develop pull request, for a Gutenberg
#                        pull request that depends on it. Before the Gutenberg pull request is
#                        merged, regenerate with `--commit=trunk` once the core change is committed.
#   --checkout[=<path>]  Generate from the working tree of a wordpress-develop checkout, including
#                        changes to tracked files that are not committed yet. By default, this is the
#                        checkout that Gutenberg is in, such as at src/wp-content/plugins/gutenberg.
#                        Add `--pr` to name the pull request that the checkout is working on. Stubs
#                        generated from uncommitted changes cannot be generated again elsewhere, such
#                        as in CI, so generate them with `--pr` or `--commit` before pushing.
#
# A commit is read from the wordpress-develop checkout that Gutenberg is in when it has the commit,
# and is fetched from GitHub otherwise. The options record the new source in composer.json, which is
# what gets committed. After using one, run `composer update` and `composer phpstan:baselines`.

# Exit if any command fails.
set -euo pipefail

# Report progress on standard error, since `composer phpstan` runs this before the analysis, whose
# report may be read from standard output.
exec 1>&2

# Each of the following can be overridden with an environment variable of the same name, such as to
# try a generator change, or a fork of wordpress-develop.

# The GitHub repository and commit of the generator, which is cached by its commit, so this needs to
# be a commit hash rather than a branch. This is the head of
# https://github.com/php-stubs/wordpress-stubs/pull/498, without which the function map adds a
# second `@phpstan-return` to the docblocks for which core trunk now has its own.
WORDPRESS_STUBS_REPO="${WORDPRESS_STUBS_REPO:-php-stubs/wordpress-stubs}"
WORDPRESS_STUBS_COMMIT="${WORDPRESS_STUBS_COMMIT:-7c32aeca37ad7defa54758674ff62a70a521c8b5}"

# The GitHub repository that commits and pull requests are fetched from.
WORDPRESS_DEVELOP_REPO="${WORDPRESS_DEVELOP_REPO:-WordPress/wordpress-develop}"

SCRIPT="$(cd "$(dirname "$0")" && pwd)/$(basename "$0")"
PACKAGE_DIR="$(dirname "$SCRIPT")/wordpress-stubs"
STUB_FILE="$PACKAGE_DIR/wordpress-stubs.stub"
GUTENBERG_DIR="$(cd "$(dirname "$SCRIPT")/../.." && pwd)"

# Where the generator is kept with its dependencies installed, one directory per repository and
# commit, so that it is only set up once.
WORDPRESS_STUBS_CACHE_DIR="${WORDPRESS_STUBS_CACHE_DIR:-$GUTENBERG_DIR/.cache/wordpress-stubs-generator}"

usage() {
	sed -n 's/^# \{0,1\}//; /^Usage/,/^A commit/p' "$SCRIPT" | sed '$d'
	exit 1
}

# Prints the directory of the wordpress-develop checkout that contains the given directory, if any.
find_checkout() {
	local dir="$1"
	while [[ "$dir" != / ]]; do
		dir="$(dirname "$dir")"
		if [[ -f "$dir/src/wp-includes/version.php" && -f "$dir/wp-tests-config-sample.php" ]]; then
			echo "$dir"
			return
		fi
	done
}

# Reads a value that the last generation recorded in the package's composer.json.
read_recorded() {
	php -r '$json = json_decode( (string) file_get_contents( $argv[1] ), true ); echo $json["extra"]["source"][ $argv[2] ] ?? "";' \
		"$PACKAGE_DIR/composer.json" "$1"
}

# Prints a key for everything that the stubs are generated from, including this script, so that they
# are generated again when any of it changes. The stubs record the key they were generated with.
generation_key() {
	{
		echo "$WORDPRESS_DEVELOP_REPO $1 $2"
		echo "$WORDPRESS_STUBS_REPO $WORDPRESS_STUBS_COMMIT"
		cat "$SCRIPT"
	} | git hash-object --stdin
}

# Prints the key that the existing stubs were generated with, if any.
stub_key() {
	if [[ -f "$STUB_FILE" ]]; then
		sed -n '1,20s/^ \* Generation key: \([0-9a-f]*\)$/\1/p' "$STUB_FILE"
	fi
}

COMMIT=''
PR=''
CHECKOUT=''
USE_CHECKOUT=false
FORCE=false
for arg in "$@"; do
	case "$arg" in
		--commit=?*) COMMIT="${arg#*=}" ;;
		--pr=?*) PR="${arg#*=}" ;;
		--checkout) USE_CHECKOUT=true ;;
		--checkout=?*) USE_CHECKOUT=true CHECKOUT="${arg#*=}" ;;
		--force) FORCE=true ;;
		*) usage ;;
	esac
done
if [[ "$PR" =~ ^(https://github\.com/$WORDPRESS_DEVELOP_REPO/pull/)?([0-9]+)/?$ ]]; then
	PR="${BASH_REMATCH[2]}"
elif [[ -n "$PR" ]]; then
	echo "Not a $WORDPRESS_DEVELOP_REPO pull request: $PR"
	exit 1
fi
if [[ -n "$COMMIT" && ( -n "$PR" || "$USE_CHECKOUT" == true ) ]]; then
	usage
fi

# Without an option, generate from the source recorded in composer.json, unless the stubs already
# were. Uncommitted changes cannot be generated again, since they are not recorded, so stubs
# generated from them are used as they are.
RECORDED=false
if [[ -z "$COMMIT" && -z "$PR" && "$USE_CHECKOUT" == false ]]; then
	RECORDED=true
	COMMIT="$(read_recorded commit)"
	PR="$(read_recorded pull-request)"
	if [[ -n "$(read_recorded uncommitted-changes)" ]]; then
		if [[ -f "$STUB_FILE" && "$FORCE" == false ]]; then
			echo "Using the WordPress stubs generated from uncommitted changes in a wordpress-develop checkout. Generate them with --pr or --commit before pushing, since they cannot be generated again elsewhere."
			exit 0
		fi
		echo "The WordPress stubs were generated from uncommitted changes in a wordpress-develop checkout, which cannot be generated again. Pass an option."
		usage
	fi
	if [[ -z "$COMMIT" ]]; then
		echo "No source for the WordPress stubs is recorded in $PACKAGE_DIR/composer.json. Pass an option."
		usage
	fi
	if [[ "$FORCE" == false && "$(stub_key)" == "$(generation_key "$COMMIT" "$PR")" ]]; then
		exit 0
	fi
fi

WORK_DIR="$(mktemp -d "${TMPDIR:-/tmp}/wordpress-stubs.XXXXXX")"
trap 'rm -rf "$WORK_DIR"' EXIT
SOURCE_DIR="$WORK_DIR/wordpress-develop"

# Fetches a single commit of a GitHub repository into a new directory, limited to the given paths.
fetch_commit() {
	local dir="$1" repo="$2" commit="$3"
	shift 3
	git init --quiet "$dir"
	git -C "$dir" remote add origin "https://github.com/$repo.git"
	git -C "$dir" sparse-checkout set --no-cone "$@"
	git -C "$dir" fetch --quiet --depth=1 --filter=blob:none origin "$commit"
	git -C "$dir" -c advice.detachedHead=false checkout --quiet FETCH_HEAD
}

# Prints the SVN revision of the most recent trunk commit in the history of a commit, that is, the
# revision of the commit itself when it is on trunk. A shallow clone is deepened until one is found.
find_revision() {
	local dir="$1" commit="$2" revision
	for _ in {1..20}; do
		revision="$(git -C "$dir" log -1 --format=%B --grep='^git-svn-id: ' "$commit" | sed -n 's/^git-svn-id: [^@]*@\([0-9]*\) .*/\1/p')"
		if [[ -n "$revision" ]]; then
			echo "$revision"
			return
		fi
		if [[ ! -f "$dir/.git/shallow" ]]; then
			break
		fi
		git -C "$dir" fetch --quiet --deepen=100 --filter=blob:none origin "$commit"
	done
}

LOCAL_CHECKOUT="${CHECKOUT:-$(find_checkout "$GUTENBERG_DIR")}"
UNCOMMITTED=''
if [[ "$USE_CHECKOUT" == true ]]; then
	if [[ -z "$LOCAL_CHECKOUT" ]] || ! git -C "$LOCAL_CHECKOUT" rev-parse --git-dir > /dev/null 2>&1; then
		echo "No wordpress-develop checkout found${CHECKOUT:+ at $CHECKOUT}."
		exit 1
	fi
	LOCAL_CHECKOUT="$(cd "$LOCAL_CHECKOUT" && pwd)"
	HEAD_COMMIT="$(git -C "$LOCAL_CHECKOUT" rev-parse HEAD)"
	BRANCH="$(git -C "$LOCAL_CHECKOUT" symbolic-ref --short -q HEAD || true)"
	# Capture the working tree as a commit without changing the checkout. It is empty when there are
	# no changes to tracked files.
	COMMIT="$(git -C "$LOCAL_CHECKOUT" stash create)"
	if [[ -n "$COMMIT" ]]; then
		UNCOMMITTED=true
	else
		COMMIT="$HEAD_COMMIT"
	fi
elif [[ -n "$PR" && -z "$COMMIT" ]]; then
	COMMIT="refs/pull/$PR/head"
fi

if [[ -n "$LOCAL_CHECKOUT" && "$COMMIT" =~ ^[0-9a-f]{40}$ ]] && git -C "$LOCAL_CHECKOUT" cat-file -e "$COMMIT^{commit}" 2>/dev/null; then
	echo "Reading $WORDPRESS_DEVELOP_REPO@$COMMIT from $LOCAL_CHECKOUT"
	mkdir "$SOURCE_DIR"
	git -C "$LOCAL_CHECKOUT" archive "$COMMIT" src | tar -x -C "$SOURCE_DIR"
	REVISION="$(find_revision "$LOCAL_CHECKOUT" "$COMMIT")"
	COMMIT_IS_TRUNK="$(git -C "$LOCAL_CHECKOUT" log -1 --format=%B "$COMMIT" | grep -c '^git-svn-id: ' || true)"
else
	echo "Fetching $WORDPRESS_DEVELOP_REPO@$COMMIT"
	fetch_commit "$SOURCE_DIR" "$WORDPRESS_DEVELOP_REPO" "$COMMIT" '/src/'
	COMMIT="$(git -C "$SOURCE_DIR" rev-parse HEAD)"
	REVISION="$(find_revision "$SOURCE_DIR" "$COMMIT")"
	COMMIT_IS_TRUNK="$(git -C "$SOURCE_DIR" log -1 --format=%B "$COMMIT" | grep -c '^git-svn-id: ' || true)"
fi

# Set up the generator unless it is cached. Its Composer scripts would install the latest WordPress
# release in source/wordpress, where it reads the WordPress source from, so they are skipped. It is
# moved into the cache only once set up, so that an interrupted run leaves nothing behind.
GENERATOR_DIR="$WORDPRESS_STUBS_CACHE_DIR/${WORDPRESS_STUBS_REPO//\//-}-$WORDPRESS_STUBS_COMMIT"
if [[ -d "$GENERATOR_DIR" ]]; then
	echo "Using $WORDPRESS_STUBS_REPO@$WORDPRESS_STUBS_COMMIT from $GENERATOR_DIR"
else
	echo "Fetching $WORDPRESS_STUBS_REPO@$WORDPRESS_STUBS_COMMIT"
	fetch_commit "$WORK_DIR/generator" "$WORDPRESS_STUBS_REPO" "$WORDPRESS_STUBS_COMMIT" '/*'
	composer --working-dir="$WORK_DIR/generator" update --no-interaction --no-progress --no-scripts
	mkdir -p "$WORDPRESS_STUBS_CACHE_DIR"
	mv "$WORK_DIR/generator" "$GENERATOR_DIR"
fi

# Generate in a copy, keeping the cached generator unchanged.
cp -R "$GENERATOR_DIR" "$WORK_DIR/wordpress-stubs"
cp -R "$SOURCE_DIR/src" "$WORK_DIR/wordpress-stubs/source/wordpress"

echo "Generating the WordPress stubs"
(cd "$WORK_DIR/wordpress-stubs" && ./generate.sh)

# The WordPress version at the commit, such as 7.2-beta1-64606-src. A path repository needs an
# explicit version, which szepeviktor/phpstan-wordpress requires to be at least 6.6.2, so it is
# derived from this and the revision of the most recent trunk commit, such as 7.2.0-beta1.64757.
WP_VERSION="$(php -r 'require $argv[1]; echo $wp_version;' "$SOURCE_DIR/src/wp-includes/version.php")"
if [[ ! "$REVISION" =~ ^[0-9]+$ || ! "$WP_VERSION" =~ ^([0-9]+\.[0-9]+)(\.[0-9]+)?-([a-zA-Z]+[0-9]*)- ]]; then
	echo "Unable to determine the revision ($REVISION) and version ($WP_VERSION) of the commit."
	exit 1
fi
PACKAGE_VERSION="${BASH_REMATCH[1]}${BASH_REMATCH[2]:-.0}-${BASH_REMATCH[3]}.$REVISION"

# Describe where the stubs came from: a trunk commit has a revision of its own, while a pull request
# or a checkout is described by the trunk revision it is based on. A commit in a checkout is not
# linked unless it is named as the head of a pull request, since it may not have been pushed.
COMMIT_URL="https://github.com/$WORDPRESS_DEVELOP_REPO/commit/$COMMIT"
PR_PREFIX="${PR:+https://github.com/$WORDPRESS_DEVELOP_REPO/pull/$PR, from }"
if [[ -n "$UNCOMMITTED" || ( "$USE_CHECKOUT" == true && -z "$PR" && "$COMMIT_IS_TRUNK" -eq 0 ) ]]; then
	SOURCE="${PR_PREFIX}a wordpress-develop checkout at $HEAD_COMMIT${BRANCH:+ (branch $BRANCH)}${UNCOMMITTED:+ with uncommitted changes}, based on r$REVISION"
elif [[ -n "$PR" ]]; then
	SOURCE="https://github.com/$WORDPRESS_DEVELOP_REPO/pull/$PR at $COMMIT_URL, based on r$REVISION"
elif [[ "$COMMIT_IS_TRUNK" -gt 0 ]]; then
	SOURCE="$COMMIT_URL (r$REVISION)"
else
	SOURCE="$COMMIT_URL, based on r$REVISION"
fi

# Replace the generator's header with one that records where the stubs came from.
{
	cat <<-HEADER
		<?php
		/**
		 * Generated stub declarations for WordPress trunk, for Gutenberg's PHPStan analysis.
		 *
		 * Generated from $SOURCE
		 * with https://github.com/$WORDPRESS_STUBS_REPO/commit/$WORDPRESS_STUBS_COMMIT.
		 *
		 * Do not edit. This file is not committed: \`composer phpstan\` generates it from the source
		 * recorded in composer.json, using tools/phpstan/generate-wordpress-stubs.sh.
		 *
		 * Generation key: $(generation_key "$COMMIT" "$PR")
		 */
	HEADER
	awk 'header_done { print; next } /^ \*\/$/ { header_done = 1 }' "$WORK_DIR/wordpress-stubs/wordpress-stubs.php"
} > "$STUB_FILE"

# The recorded source is only written when it changes, by an option.
if [[ "$RECORDED" == true ]]; then
	echo "Generated the WordPress stubs for WordPress $WP_VERSION from $SOURCE."
	exit 0
fi

# Write the package, recording the source to generate the stubs from. Uncommitted changes record no
# commit, since the one that captured them exists only in the checkout.
php -r '
	[ , $file, $version, $description, $commit, $pr, $revision ] = $argv;
	$source = $commit !== "" ? [ "commit" => $commit ] : [ "uncommitted-changes" => true ];
	if ( $pr !== "" ) {
		$source["pull-request"] = (int) $pr;
	}
	$source["revision"] = (int) $revision;
	$json = json_encode(
		[
			"name"        => "php-stubs/wordpress-stubs",
			"version"     => $version,
			"description" => $description,
			"license"     => "GPL-2.0-or-later",
			"extra"       => [ "source" => $source ],
		],
		JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES
	);
	file_put_contents( $file, preg_replace_callback( "/^(?: {4})+/m", fn ( $m ) => str_repeat( "\t", strlen( $m[0] ) / 4 ), $json ) . "\n" );
' \
	"$PACKAGE_DIR/composer.json" \
	"$PACKAGE_VERSION" \
	"WordPress stubs generated from $SOURCE, in place of the released package." \
	"$([[ -n "$UNCOMMITTED" ]] || echo "$COMMIT")" \
	"$PR" \
	"$REVISION"

echo "Generated the WordPress stubs for WordPress $WP_VERSION from $SOURCE, as version $PACKAGE_VERSION. Run \`composer update\` and \`composer phpstan:baselines\`, and commit tools/phpstan/wordpress-stubs/composer.json."
