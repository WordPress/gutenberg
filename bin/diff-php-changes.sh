#!/bin/sh

_usage() {
	cat <<EOD
usage: $0 [--filter=<filter>] <range>
    List PHP files that have been added, deleted and/or modified files
    within Git range <range>. For example:

	$(basename "$0") origin/wp/5.5..origin/wp/trunk
	$(basename "$0") --filter=Ar origin/wp/5.5..origin/wp/trunk

Optionally filter according to \`git diff --diff-filter\`, e.g.
 --filter=A	Show added paths
 --filter=AD	Show added and deleted paths
 --filter=MR	Show modified and renamed paths
 --filter=d	Exclude deleted paths

Other options:
 -h	Show this help screen
EOD
	exit 1
}

_diff() {
	filter="$1"
	git diff "$range" --name-status --diff-filter="$filter" '**/*.php'
}

_main() {
	# shellcheck disable=2068
	set -- $@
	filter=""
	for arg; do
		case "$arg" in
			--filter=*) filter="${arg#--filter=}"; shift;;
			-*) _usage; shift; break;;
		esac
	done
	[ $# != 1 ] && _usage
	range="$1"
	echo "### $range"
	_diff "$filter"
}

_main "$@"
