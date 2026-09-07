import { useEffect } from '@wordpress/element';
import { addFilter, removeFilter } from '@wordpress/hooks';

// These post types are "structural" block lists.
// We should be allowed to use
// the post content block within them.
const POST_TYPES_ALLOWING_POST_CONTENT = [
	'wp_block',
	'wp_template',
	'wp_template_part',
];

/**
 * In some specific contexts,
 * the post content block needs to be hidden.
 *
 * @param {string} postType Post Type
 */
export function useHideBlocksFromInserter( postType ) {
	useEffect( () => {
		/*
		 * Prevent adding post content block (except in query block) in the editor.
		 */
		addFilter(
			'blockEditor.__unstableCanInsertBlockType',
			'removePostContentFromInserter',
			(
				canInsert,
				blockType,
				rootClientId,
				{ getBlockParentsByBlockName }
			) => {
				if (
					! POST_TYPES_ALLOWING_POST_CONTENT.includes( postType ) &&
					blockType.name === 'core/post-content'
				) {
					return (
						getBlockParentsByBlockName( rootClientId, 'core/query' )
							.length > 0
					);
				}
				return canInsert;
			}
		);

		return () => {
			removeFilter(
				'blockEditor.__unstableCanInsertBlockType',
				'removePostContentFromInserter'
			);
		};
	}, [ postType ] );
}
