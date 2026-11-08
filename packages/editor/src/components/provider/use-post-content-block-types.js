/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';
import { applyFilters } from '@wordpress/hooks';

const POST_CONTENT_BLOCK_TYPES = [
	'core/post-title',
	'core/post-featured-image',
	'core/post-content',
];

/**
 * Returns the list of post content block types, including any added via the
 * `editor.postContentBlockTypes` filter. The result is memoized so it can be
 * used as a stable dependency in `useSelect` calls.
 *
 * @return {string[]} Block type names considered post content.
 */
export default function usePostContentBlockTypes() {
	return useMemo(
		() => [
			...applyFilters(
				'editor.postContentBlockTypes',
				POST_CONTENT_BLOCK_TYPES
			),
		],
		[]
	);
}
