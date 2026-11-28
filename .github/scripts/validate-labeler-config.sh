#!/bin/bash
#
# Validates that every package in packages/ has a corresponding entry
# in .github/labeler.yml, and every block in packages/block-library/src/
# one in .github/labeler-blocks.yml.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
LABELER_CONFIG="$REPO_ROOT/.github/labeler.yml"
BLOCKS_LABELER_CONFIG="$REPO_ROOT/.github/labeler-blocks.yml"
BLOCKS_DIR="$REPO_ROOT/packages/block-library/src"

# DO NOT ADD TO THIS LIST. These are packages which do not have an associated
# GitHub label yet. Remove entries from this list as labels are created.
EXCLUDED_PACKAGES=(
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
	react-inert-value
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
)

# DO NOT ADD TO THIS LIST unless the block has no [Block] label.
EXCLUDED_BLOCKS=(
	missing
	navigation-overlay-close
	post-comment
	term-count
	term-name
	text-columns
)

is_excluded_package() {
	local pkg_name="$1"
	local excluded_package

	for excluded_package in "${EXCLUDED_PACKAGES[@]}"; do
		if [[ "$excluded_package" == "$pkg_name" ]]; then
			return 0
		fi
	done

	return 1
}

missing=()

for pkg_dir in "$REPO_ROOT"/packages/*/; do
	# Skip directories without a package.json (not real packages)
	if [ ! -f "$pkg_dir/package.json" ]; then
		continue
	fi

	pkg_name="$(basename "$pkg_dir")"

	# Skip excluded packages
	if is_excluded_package "$pkg_name"; then
		continue
	fi

	# Check that the labeler config references this package's glob
	if ! grep -q "packages/${pkg_name}/\*\*" "$LABELER_CONFIG"; then
		missing+=("$pkg_name")
	fi
done

missing_blocks=()

for block_dir in "$BLOCKS_DIR"/*/; do
	if [ ! -f "$block_dir/block.json" ]; then
		continue
	fi

	block_name="$(basename "$block_dir")"

	if [[ " ${EXCLUDED_BLOCKS[*]} " == *" $block_name "* ]]; then
		continue
	fi

	if ! grep -q "packages/block-library/src/${block_name}/\*\*" "$BLOCKS_LABELER_CONFIG"; then
		missing_blocks+=("$block_name")
	fi
done

stale=()

for excluded_package in "${EXCLUDED_PACKAGES[@]}"; do
	if [ ! -f "$REPO_ROOT/packages/$excluded_package/package.json" ]; then
		stale+=("$excluded_package")
	fi
done

status=0

if [ ${#missing[@]} -gt 0 ]; then
	echo "The following packages are missing from .github/labeler.yml:"
	for pkg in "${missing[@]}"; do
		echo "  - packages/$pkg"
	done
	echo ""
	echo "Add a labeling rule for each missing package to .github/labeler.yml."
	status=1
fi

if [ ${#missing_blocks[@]} -gt 0 ]; then
	echo "The following blocks are missing from .github/labeler-blocks.yml:"
	for block in "${missing_blocks[@]}"; do
		echo "  - packages/block-library/src/$block"
	done
	echo ""
	echo "Add each one to the rule of its [Block] label in .github/labeler-blocks.yml."
	status=1
fi

for excluded_block in "${EXCLUDED_BLOCKS[@]}"; do
	if [ ! -f "$BLOCKS_DIR/$excluded_block/block.json" ]; then
		stale+=("block-library/src/$excluded_block")
	fi
done

if [ ${#stale[@]} -gt 0 ]; then
	echo "The following excluded packages no longer exist:"
	for pkg in "${stale[@]}"; do
		echo "  - packages/$pkg"
	done
	echo ""
	echo "Remove each one from EXCLUDED_PACKAGES or EXCLUDED_BLOCKS in this script."
	status=1
fi

if [ "$status" -ne 0 ]; then
	exit 1
fi

echo "All packages and blocks have labeler config entries."
