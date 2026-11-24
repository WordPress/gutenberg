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

// The blocks of a template that hold the blocks of something else.
const BLOCKS_HOLDING_ANOTHER_ENTITY = [ 'core/template-part', 'core/block' ];

/**
 * In some specific contexts,
 * the template part, post content and template slot blocks need to be hidden.
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

		/*
		 * Prevent adding a template slot anywhere but among the blocks of a
		 * template. It is where the templates rendered inside a template go,
		 * and it is looked for among the blocks of the template alone: not
		 * in its template parts, nor in its synced patterns.
		 */
		addFilter(
			'blockEditor.__unstableCanInsertBlockType',
			'removeTemplateSlotFromInserter',
			(
				canInsert,
				blockType,
				rootClientId,
				{ getBlock, getBlockParentsByBlockName }
			) => {
				if ( blockType.name !== 'core/template-slot' ) {
					return canInsert;
				}
				if ( postType !== 'wp_template' ) {
					return false;
				}
				if (
					rootClientId &&
					( BLOCKS_HOLDING_ANOTHER_ENTITY.includes(
						getBlock( rootClientId )?.name
					) ||
						getBlockParentsByBlockName(
							rootClientId,
							BLOCKS_HOLDING_ANOTHER_ENTITY
						).length > 0 )
				) {
					return false;
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
			removeFilter(
				'blockEditor.__unstableCanInsertBlockType',
				'removeTemplateSlotFromInserter'
			);
		};
	}, [ postType, mode ] );
}
