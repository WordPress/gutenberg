/**
 * WordPress dependencies
 */
import { addFilter } from '@wordpress/hooks';
import { removep } from '@wordpress/autop';
import {
	isUnmodifiedDefaultBlock,
	getUnknownTypeHandlerName,
} from '@wordpress/blocks';

/**
 * Returns true if the given array of blocks consists of a single block of the
 * unknown type, or false otherwise.
 *
 * @param {WPBlock[]} blocks Array of block objects.
 *
 * @return {boolean} Whether array consists of single unknown block.
 */
export function isSingleUnknownBlock( blocks ) {
	return (
		blocks.length === 1 &&
		blocks[ 0 ].name === getUnknownTypeHandlerName()
	);
}

/**
 * Returns true if the given array of blocks consists of a single unmodified
 * default block, or false otherwise.
 *
 * @param {WPBlock[]} blocks Array of block objects.
 *
 * @return {boolean} Whether array consists of single unmodified default block.
 */
export function isSingleUnmodifiedDefaultBlock( blocks ) {
	return (
		blocks.length === 1 &&
		isUnmodifiedDefaultBlock( blocks[ 0 ] )
	);
}

/**
 * Given an array of blocks, returns either an empty array if the blocks
 * consist only of a single unmodified default block. Otherwise returns the
 * original array unmodified.
 *
 * @param {WPBlock[]} blocks Array of blocks.
 *
 * @return {WPBlock[]} Empty array, or original passed set of blocks.
 */
export function omitSingleUnmodifiedDefaultBlock( blocks ) {
	if ( isSingleUnmodifiedDefaultBlock( blocks ) ) {
		blocks = [];
	}

	return blocks;
}

/**
 * Given an HTML string and array of blocks, returns a formatted HTML string
 * with paragraph tags removed via `removep` behavior if the array of blocks
 * consists only of a single block of the unknown type.
 *
 * @link https://www.npmjs.com/package/@wordpress/autop
 *
 * @param {string}    content HTML content.
 * @param {WPBlock[]} blocks  Array of blocks from which HTML content has been
 *                            generated.
 *
 * @return {string} HTML content, with `removep` filtering applied if the array
 *                  of blocks from which it was generated consists only of a
 *                  single block of the unknown type.
 */
export function removepSingleUnknownBlock( content, blocks ) {
	if ( isSingleUnknownBlock( blocks ) ) {
		content = removep( content );
	}

	return content;
}

addFilter(
	'editor.selectors.getBlockContent',
	'core/processContent/removepSingleUnknownBlock',
	removepSingleUnknownBlock
);

addFilter(
	'editor.selectors.getBlocksForSave',
	'core/processContent/omitSingleUnmodifiedDefaultBlock',
	omitSingleUnmodifiedDefaultBlock
);
