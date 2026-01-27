/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { useMemo } from '@wordpress/element';
import { applyFilters } from '@wordpress/hooks';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';
import { unlock } from '../../lock-unlock';

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
			const { getPostBlocksByName } = unlock( select( editorStore ) );
			return getPostBlocksByName( contentOnlyBlockTypes );
		},
		[ contentOnlyBlockTypes ]
	);

	return contentOnlyIds;
}
