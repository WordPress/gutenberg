/**
 * WordPress dependencies
 */
import { useEffect } from '@wordpress/element';
import { addFilter, removeFilter } from '@wordpress/hooks';
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';

// These post types are "structural" block lists.
// We should be allowed to use the post content,
// template parts and breadcrumbs blocks within them.
const POST_TYPES_ALLOWING_POST_CONTENT_TEMPLATE_PART_BREADCRUMBS = [
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
	const isHierarchicalPostType = useSelect(
		( select ) => select( coreStore ).getPostType( postType )?.hierarchical,
		[ postType ]
	);
	useEffect( () => {
		/*
		 * Prevent adding template part in the editor.
		 */
		addFilter(
			'blockEditor.__unstableCanInsertBlockType',
			'removeTemplatePartsFromInserter',
			( canInsert, blockType ) => {
				if (
					! POST_TYPES_ALLOWING_POST_CONTENT_TEMPLATE_PART_BREADCRUMBS.includes(
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
					! POST_TYPES_ALLOWING_POST_CONTENT_TEMPLATE_PART_BREADCRUMBS.includes(
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
		 * Prevent adding breadcrumbs block to non-hierarchical post types.
		 */
		addFilter(
			'blockEditor.__unstableCanInsertBlockType',
			'removeBreadcrumbsFromInserter',
			( canInsert, blockType ) => {
				if (
					! POST_TYPES_ALLOWING_POST_CONTENT_TEMPLATE_PART_BREADCRUMBS.includes(
						postType
					) &&
					! isHierarchicalPostType &&
					blockType.name === 'core/breadcrumbs' &&
					mode === 'post-only'
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
				'removeBreadcrumbsFromInserter'
			);
		};
	}, [ postType, isHierarchicalPostType, mode ] );
}
