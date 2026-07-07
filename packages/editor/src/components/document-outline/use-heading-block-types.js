/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';
import { applyFilters } from '@wordpress/hooks';

const HEADING_BLOCK_TYPES = [ 'core/heading' ];

/**
 * Returns the list of block types considered headings for the Document
 * Outline and Table of Contents, including any added via the
 * `editor.headingBlockTypes` filter. The result is memoized so it can be
 * used as a stable dependency in `useSelect` calls.
 *
 * Blocks added through the filter must expose a numeric `level` attribute
 * and a `content` attribute (heading text/HTML), the same attribute names
 * `core/heading` uses, since that's what the outline and Table of Contents
 * block read.
 *
 * @return {string[]} Block type names considered headings.
 */
export default function useHeadingBlockTypes() {
	return useMemo(
		() => [
			...applyFilters( 'editor.headingBlockTypes', HEADING_BLOCK_TYPES ),
		],
		[]
	);
}
