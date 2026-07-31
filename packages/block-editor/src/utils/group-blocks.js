/**
 * WordPress dependencies
 */
import {
	findTransform,
	getBlockTransforms,
	switchToBlockType,
} from '@wordpress/blocks';

/**
 * Wraps the given blocks in the grouping block. Unlike a plain
 * `switchToBlockType` call, the blocks' own transforms to the grouping block
 * type are never used: the Group action is a structural wrap, while a
 * block's own transform changes what the block is (a quote's transform to
 * group dissolves the quote into its inner blocks).
 *
 * @param {WPBlock[]} blocks            Blocks to group.
 * @param {string}    groupingBlockName Name of the grouping block.
 *
 * @return {?WPBlock[]} The grouped blocks, or null.
 */
export function groupBlocks( blocks, groupingBlockName ) {
	const groupingBlockTransform = findTransform(
		getBlockTransforms( 'from', groupingBlockName ),
		( transform ) =>
			transform.type === 'block' &&
			transform.isMultiBlock &&
			transform.blocks.includes( '*' )
	);

	if ( groupingBlockTransform?.__experimentalConvert ) {
		const result = groupingBlockTransform.__experimentalConvert( blocks );
		return Array.isArray( result ) ? result : [ result ];
	}

	// A grouping block without a wildcard transform. Fall back to regular
	// block conversion.
	return switchToBlockType( blocks, groupingBlockName );
}
