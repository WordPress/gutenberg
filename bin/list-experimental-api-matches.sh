#!/bin/sh

# Generate a Markdown-formatted list of experimental APIs found across our
# packages and lib, providing GitHub search links for each match.
#
# Experimental APIs must be regularly audited, particularly in the context of
# major WordPress releases. This script allows release leads to generate a list
# to share in release issues.
#
# @see example audit issue for WordPress 6.2:
# https://github.com/WordPress/gutenberg/issues/47196

# Exit if any command fails.
set -e

# Change to the root directory.
cd "$(dirname "$0")"
cd ..

# POSIX: prefer standard grep over rg. Git is assumed present (ls-files), but
# could be replaced with find.
grep_experimental_apis() {
	git ls-files packages/* lib \
		| grep -E '\.(js|ts|jsx|tsx|php)$' \
		| grep -v __tests__ \
		| xargs grep -Eo '__experimental\w+'
}

# For each line as `<filepath>:<match>`, rewrite as `<package> <match>`.
namespace() {
	awk -F: '
		{ print module($1), $2 }
		function module(path) {
			n = split(path, parts, "/")
			if (parts[1] == "lib") return "lib"
			return parts[1] "/" parts[2]
		}'
}

# Like uniq, but applied across packages: if `__experimentalFoo` appears in
# packages A and B, only keep the occurrence under A.
compact() {
	sort | uniq | awk '{
		if (known_api[$2]) next
		known_api[$2] = 1
		print
	}'
}

# Output a heading for each package and a link for each experimental API.
format() {
	awk '{
		if (prev_dir != $1) {
			if (NR > 1) print ""
			printf "## `%s`\n", $1
			prev_dir = $1
		}
		printf "[`%s`](/WordPress/gutenberg/search?q=%s)\n", $2, $2
	}'
}

grep_experimental_apis \
	| namespace \
	| compact \
	| format
