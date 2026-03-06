#!/bin/bash
#
# Validates that every package in packages/ has a corresponding entry
# in .github/labeler.yml.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
LABELER_CONFIG="$REPO_ROOT/.github/labeler.yml"

# DO NOT ADD TO THIS LIST. These are packages which do not have an associated
# GitHub label yet. Remove entries from this list as labels are created.
EXCLUDED_PACKAGES="
	annotations
	asset-loader
	block-directory
	block-serialization-default-parser
	block-serialization-spec-parser
	connectors
	core-abilities
	create-block-interactive-template
	create-block-tutorial-template
	customize-widgets
	dashboard-init
	edit-site-init
	global-styles-engine
	global-styles-ui
	kebab-case
	latex-to-mathml
	lazy-editor
	list-reusable-blocks
	media-editor
	media-fields
	nux
	postcss-themes
	preferences-persistence
	react-native-editor
	report-flaky-tests
	reusable-blocks
	route
	shortcode
	style-runtime
	undo-manager
	upload-media
	video-conversion
	vips
	widgets
	worker-threads
	workflow
"

missing=()

for pkg_dir in "$REPO_ROOT"/packages/*/; do
	# Skip directories without a package.json (not real packages)
	if [ ! -f "$pkg_dir/package.json" ]; then
		continue
	fi

	pkg_name="$(basename "$pkg_dir")"

	# Skip excluded packages
	if echo "$EXCLUDED_PACKAGES" | grep -qw "$pkg_name"; then
		continue
	fi

	# Check that the labeler config references this package's glob
	if ! grep -q "packages/${pkg_name}/\*\*" "$LABELER_CONFIG"; then
		missing+=("$pkg_name")
	fi
done

if [ ${#missing[@]} -gt 0 ]; then
	echo "The following packages are missing from .github/labeler.yml:"
	for pkg in "${missing[@]}"; do
		echo "  - packages/$pkg"
	done
	echo ""
	echo "Add a labeling rule for each missing package to .github/labeler.yml."
	exit 1
fi

echo "All packages have labeler config entries."
