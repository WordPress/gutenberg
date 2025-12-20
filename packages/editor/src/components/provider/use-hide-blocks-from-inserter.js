/**
 * WordPress dependencies
 */
import { useEffect } from '@wordpress/element';
import { addFilter, removeFilter } from '@wordpress/hooks';

// These post types are "structural" block lists.
// We should be allowed to use
// the post content and template parts blocks within them.
const POST_TYPES_ALLOWING_POST_CONTENT_TEMPLATE_PART = [
	'wp_block',
	'wp_template',
	'wp_template_part',
];

/**
 * In some specific contexts,
 * the template part and post content blocks need to be hidden.
 *
 * @param {string} postType Post Type
 * @param {string} mode     Rendering mode
 */
export function useHideBlocksFromInserter( postType, mode ) {
	useEffect( () => {
		/*
		 * Prevent adding template part in the editor.
		 */
		addFilter(
			'blockEditor.__unstableCanInsertBlockType',
			'removeTemplatePartsFromInserter',
			( canInsert, blockType ) => {
				if (
					! POST_TYPES_ALLOWING_POST_CONTENT_TEMPLATE_PART.includes(
						postType
					) &&
					blockType.name === 'core/template-part' &&
					mode === 'post-only'
				) {
					return false;
				}
				return canInsert;
			}
		);

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
					! POST_TYPES_ALLOWING_POST_CONTENT_TEMPLATE_PART.includes(
						postType
					) &&
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
				'removeTemplatePartsFromInserter'
			);
			removeFilter(
				'blockEditor.__unstableCanInsertBlockType',
				'removePostContentFromInserter'
			);
		};
	}, [ postType, mode ] );
}
