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
# This is temporary. Once php-stubs/wordpress-stubs publishes builds from trunk, require a pinned one
# instead, and remove this script, the wordpress-stubs/ package, and the path repository.
#
# Usage, through `composer phpstan:generate-wordpress-stubs -- <option>`:
#
#   (no option)          Regenerate the stubs from the commit they were last generated from.
#   --commit=<ref>       Generate from a commit of wordpress-develop, such as `trunk`.
#   --pr=<number|url>    Generate from the head of a wordpress-develop pull request, for a Gutenberg
#                        pull request that depends on it. Before the Gutenberg pull request is
#                        merged, regenerate with `--commit=trunk` once the core change is committed.
#   --checkout[=<path>]  Generate from the working tree of a wordpress-develop checkout, including
#                        changes to tracked files that are not committed yet. By default, this is the
#                        checkout that Gutenberg is in, such as at src/wp-content/plugins/gutenberg.
#                        Add `--pr` to name the pull request that the checkout is working on.
#
# A commit is read from the wordpress-develop checkout that Gutenberg is in when it has the commit,
# and is fetched from GitHub otherwise. After generating the stubs, run `composer update` and
# `composer phpstan:baselines`.

# Exit if any command fails.
set -euo pipefail

# The commit of php-stubs/wordpress-stubs whose generator is used. This is the head of
# https://github.com/php-stubs/wordpress-stubs/pull/498, without which the function map adds a
# second `@phpstan-return` to the docblocks for which core trunk now has its own.
WORDPRESS_STUBS_COMMIT=7c32aeca37ad7defa54758674ff62a70a521c8b5

WORDPRESS_DEVELOP_REPO=WordPress/wordpress-develop
PACKAGE_DIR="$(cd "$(dirname "$0")" && pwd)/wordpress-stubs"
GUTENBERG_DIR="$(cd "$(dirname "$0")/../.." && pwd)"

usage() {
	sed -n 's/^# \{0,1\}//; /^Usage/,/^A commit/p' "$0" | sed '$d' >&2
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

COMMIT=''
PR=''
CHECKOUT=''
USE_CHECKOUT=false
for arg in "$@"; do
	case "$arg" in
		--commit=?*) COMMIT="${arg#*=}" ;;
		--pr=?*) PR="${arg#*=}" ;;
		--checkout) USE_CHECKOUT=true ;;
		--checkout=?*) USE_CHECKOUT=true CHECKOUT="${arg#*=}" ;;
		*) usage ;;
	esac
done
if [[ "$PR" =~ ^(https://github\.com/$WORDPRESS_DEVELOP_REPO/pull/)?([0-9]+)/?$ ]]; then
	PR="${BASH_REMATCH[2]}"
elif [[ -n "$PR" ]]; then
	echo "Not a $WORDPRESS_DEVELOP_REPO pull request: $PR" >&2
	exit 1
fi
if [[ -n "$COMMIT" && ( -n "$PR" || "$USE_CHECKOUT" == true ) ]]; then
	usage
fi

# Without an option, regenerate from the commit recorded by the last generation, keeping its pull
# request. Uncommitted changes cannot be regenerated, since they are not recorded.
if [[ -z "$COMMIT" && -z "$PR" && "$USE_CHECKOUT" == false ]]; then
	COMMIT="$(read_recorded commit)"
	PR="$(read_recorded pull-request)"
	if [[ -z "$COMMIT" || -n "$(read_recorded uncommitted-changes)" ]]; then
		echo "The stubs were not generated from a commit that can be regenerated. Pass an option." >&2
		usage
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
		echo "No wordpress-develop checkout found${CHECKOUT:+ at $CHECKOUT}." >&2
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

echo "Fetching php-stubs/wordpress-stubs@$WORDPRESS_STUBS_COMMIT"
fetch_commit "$WORK_DIR/wordpress-stubs" php-stubs/wordpress-stubs "$WORDPRESS_STUBS_COMMIT" '/*'

# The generator reads the WordPress source from source/wordpress. Its Composer scripts would install
# the latest WordPress release there, so they are skipped.
composer --working-dir="$WORK_DIR/wordpress-stubs" update --no-interaction --no-progress --no-scripts
cp -R "$SOURCE_DIR/src" "$WORK_DIR/wordpress-stubs/source/wordpress"

echo "Generating the stubs"
(cd "$WORK_DIR/wordpress-stubs" && ./generate.sh)

# The WordPress version at the commit, such as 7.2-beta1-64606-src. A path repository needs an
# explicit version, which szepeviktor/phpstan-wordpress requires to be at least 6.6.2, so it is
# derived from this and the revision of the most recent trunk commit, such as 7.2.0-beta1.64757.
WP_VERSION="$(php -r 'require $argv[1]; echo $wp_version;' "$SOURCE_DIR/src/wp-includes/version.php")"
if [[ ! "$REVISION" =~ ^[0-9]+$ || ! "$WP_VERSION" =~ ^([0-9]+\.[0-9]+)(\.[0-9]+)?-([a-zA-Z]+[0-9]*)- ]]; then
	echo "Unable to determine the revision ($REVISION) and version ($WP_VERSION) of the commit." >&2
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
		 * with https://github.com/php-stubs/wordpress-stubs/commit/$WORDPRESS_STUBS_COMMIT.
		 *
		 * Do not edit. Regenerate with \`composer phpstan:generate-wordpress-stubs\`.
		 */
	HEADER
	awk 'header_done { print; next } /^ \*\/$/ { header_done = 1 }' "$WORK_DIR/wordpress-stubs/wordpress-stubs.php"
} > "$PACKAGE_DIR/wordpress-stubs.stub"

# Write the package, recording the source for the next regeneration. Uncommitted changes record no
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

echo "Generated the stubs for WordPress $WP_VERSION from $SOURCE, as version $PACKAGE_VERSION."
