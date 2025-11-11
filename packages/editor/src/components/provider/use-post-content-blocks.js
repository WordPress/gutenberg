/**
 * WordPress dependencies
 */
import { store as blockEditorStore } from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';
import { useMemo } from '@wordpress/element';
import { applyFilters } from '@wordpress/hooks';

const POST_CONTENT_BLOCK_TYPES = [
	'core/post-title',
	'core/post-featured-image',
	'core/post-content',
];

export default function usePostContentBlocks() {
	const contentOnlyBlockTypes = useMemo(
		() => [
			...applyFilters(
				'editor.postContentBlockTypes',
				POST_CONTENT_BLOCK_TYPES
			),
		],
		[]
	);

	// Note that there are two separate subscriptions because the result for each
	// returns a new array.
	const contentOnlyIds = useSelect(
		( select ) => {
			const { getClientIdsWithDescendants, getBlock } =
				select( blockEditorStore );
			return getClientIdsWithDescendants().filter( ( clientId ) => {
				const block = getBlock( clientId );
				return (
					contentOnlyBlockTypes.includes( block.name ) ||
					block.attributes?.metadata?.bindings
				);
			} );
		},
		[ contentOnlyBlockTypes ]
	);

	return contentOnlyIds;
}
