#!/bin/bash

_usage() {
	cat <<EOD
usage: $0 [-adm] <range>
    List PHP files that have been added, deleted and/or modified files
    within Git range <range>. For example:

    $(basename $0) origin/wp/5.5..origin/wp/trunk

Enable filtering by passing one or more of the following options:
 -a	Show added files [default]
 -d	Show deleted files [default]
 -m	Show modified files [default]

Other options:
 -h	Show this help screen
EOD
	exit 1
}

_diff_php() {
	git diff "$range" -- '*.php'
}

_diff_php_plus() {
	_diff_php | grep ^+++ | cut -c 6-
}

_diff_php_minus() {
	_diff_php | grep ^--- | cut -c 6-
}

_compare() {
	comm "$1" <(_diff_php_minus | sort) <(_diff_php_plus | sort) \
		| grep -v ^dev/null
}

_print_added() {
	_compare -13 | sed "s/^/added:		/"
}

_print_deleted() {
	_compare -23 | sed "s/^/deleted:	/"
}

_print_modified() {
	_compare -12 | sed "s/^/modified:	/"
}

_main() {
	local args
	if ! args=$(getopt hadm "$@"); then
		_usage
		exit 2
	fi

	# shellcheck disable=2086
	set -- $args
	for arg; do
		case "$arg" in
			-h|--help) _usage; shift;;
			-a|--added) has_filter=true; show_added=true; shift;;
			-d|--deleted) has_filter=true; show_deleted=true; shift;;
			-m|--modified) has_filter=true; show_modified=true; shift;;
			--) shift; break;;
		esac
	done

	[ $# != 1 ] && _usage

	range="$1"
	echo "### $range"
	[ -z "$has_filter" ] || [ -n "$show_added" ] && _print_added
	[ -z "$has_filter" ] || [ -n "$show_deleted" ] && _print_deleted
	[ -z "$has_filter" ] || [ -n "$show_modified" ] && _print_modified
}

_main "$@"
