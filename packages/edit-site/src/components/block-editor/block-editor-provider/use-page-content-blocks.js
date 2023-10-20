/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';
import { createBlock } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { PAGE_CONTENT_BLOCK_TYPES } from '../../../utils/constants';

/**
 * Helper method to iterate through all blocks, recursing into allowed inner blocks.
 * Returns a flattened object of transformed blocks.
 *
 * @param {Array}    blocks    Blocks to flatten.
 * @param {Function} transform Transforming function to be applied to each block. If transform returns `undefined`, the block is skipped.
 *
 * @return {Array} Flattened object.
 */
function flattenBlocks( blocks, transform ) {
	const result = [];
	for ( let i = 0; i < blocks.length; i++ ) {
		// Since the Query Block could contain PAGE_CONTENT_BLOCK_TYPES block types,
		// we skip it because we only want to render stand-alone page content blocks in the block list.
		if ( [ 'core/query' ].includes( blocks[ i ].name ) ) {
			continue;
		}
		const transformedBlock = transform( blocks[ i ] );
		if ( transformedBlock ) {
			result.push( transformedBlock );
		}
		result.push( ...flattenBlocks( blocks[ i ].innerBlocks, transform ) );
	}

	return result;
}

/**
 * Returns a memoized array of blocks that contain only page content blocks,
 * surrounded by an optional group block to mimic the post editor.
 *
 * @param {Object}  props                      The argument for the function.
 * @param {Array}   props.blocks               Block list.
 * @param {boolean} props.isPageContentFocused Whether the page content has focus (and the surrounding template is inert). If `true` return page content blocks. Default `false`.
 * @param {boolean} props.wrapPageContent      Whether to wrap the page content blocks in a group block to mimic the post editor. Default `false`.
 * @return {Array} Page content blocks.
 */
export default function usePageContentBlocks( {
	blocks = [],
	isPageContentFocused = false,
	wrapPageContent = false,
} ) {
	return useMemo( () => {
		if ( ! isPageContentFocused || ! blocks?.length ) {
			return [];
		}

		const innerBlocks = flattenBlocks( blocks, ( block ) =>
			PAGE_CONTENT_BLOCK_TYPES[ block.name ]
				? createBlock( block.name )
				: undefined
		);

		if ( ! innerBlocks.length ) {
			return [];
		}

		if ( ! wrapPageContent ) {
			return innerBlocks;
		}

		return [
			createBlock(
				'core/group',
				{
					layout: { type: 'constrained' },
					style: {
						spacing: {
							margin: {
								top: '4em', // Mimics the post editor.
							},
						},
					},
				},
				innerBlocks
			),
		];
	}, [ blocks, isPageContentFocused ] );
}
