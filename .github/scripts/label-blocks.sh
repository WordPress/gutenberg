#!/bin/bash
#
# Adds [Block] labels to a pull request for the blocks whose folders it changes.
# A block's label matches its folder name or block.json title, else its parent block's.
# Never removes labels, and adds none when the PR changes more than 3 blocks (a refactor).

set -euo pipefail

SRC=packages/block-library/src

# Blocks whose label has another name.
exception() {
	case "$1" in
		social-link | social-links) echo '[Block] Social' ;;
		table-of-contents) echo '[Block] Table of contents (experimental)' ;;
	esac
}

norm() { tr '[:upper:]' '[:lower:]' | sed -E 's/[^a-z0-9]+/-/g; s/^-+|-+$//g'; }

labels="$( gh label list --repo "$REPO" --search '[Block]' --limit 500 --json name --jq '.[].name | select( startswith( "[Block] " ) )' )"

label_for() {
	local dir="$1" json="$SRC/$1/block.json" title label name parent
	label="$( exception "$dir" )"
	if [ -n "$label" ]; then
		echo "$label"
		return
	fi
	[ -f "$json" ] || return 0
	title="$( jq -r '.title' "$json" | norm )"
	while read -r label; do
		name="$( printf '%s' "${label#\[Block\] }" | norm )"
		if [ "$name" = "$dir" ] || [ "$name" = "$title" ]; then
			echo "$label"
			return
		fi
	done <<< "$labels"
	parent="$( jq -r '( .parent // .ancestor // [] )[0] // empty' "$json" )"
	if [[ "$parent" == core/* ]]; then
		label_for "${parent#core/}"
	fi
}

dirs="$( gh api --paginate "repos/$REPO/pulls/$PR/files" --jq '.[].filename' |
	sed -nE "s#^$SRC/([a-z0-9-]+)/.*#\1#p" | sort -u )"
found="$( for dir in $dirs; do label_for "$dir"; done | sort -u )"
count="$( printf '%s' "$found" | grep -c . || true )"

if [ "$count" -eq 0 ] || [ "$count" -gt 3 ]; then
	echo "Block labels found: $count. Adding none."
	exit 0
fi
echo "Adding: $( printf '%s' "$found" | paste -sd, - )"
gh pr edit "$PR" --repo "$REPO" --add-label "$( printf '%s' "$found" | paste -sd, - )"
