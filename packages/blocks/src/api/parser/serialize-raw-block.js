/**
 * Internal dependencies
 */
import { getCommentDelimitedContent } from '../serializer';

/**
 * @typedef {Object}   Options                   Serialization options.
 * @property {boolean} [isCommentDelimited=true] Whether to output HTML comments around blocks.
 */

/** @typedef {import("./").WPRawBlock} WPRawBlock */

/**
 * Serializes a block node into the native HTML-comment-powered block format.
 * CAVEAT: This function is intended for re-serializing blocks as parsed by
 * valid parsers and skips any validation steps. This is NOT a generic
 * serialization function for in-memory blocks. For most purposes, see the
 * following functions available in the `@wordpress/blocks` package:
 *
 * @see serializeBlock
 * @see serialize
 *
 * For more on the format of block nodes as returned by valid parsers:
 *
 * @see `@wordpress/block-serialization-default-parser` package
 * @see `@wordpress/block-serialization-spec-parser` package
 *
 * @param {WPRawBlock} rawBlock     A block node as returned by a valid parser.
 * @param {Options}    [options={}] Serialization options.
 *
 * @return {string} An HTML string representing a block.
 */
export function serializeRawBlock( rawBlock, options = {} ) {
	const { isCommentDelimited = true } = options;
	const {
		blockName,
		attrs = {},
		innerBlocks = [],
		innerContent = [],
	} = rawBlock;

	let childIndex = 0;
	const content = innerContent
		.map( ( item ) =>
			// `null` denotes a nested block, otherwise we have an HTML fragment.
			item !== null
				? item
				: serializeRawBlock( innerBlocks[ childIndex++ ], options )
		)
		.join( '\n' )
		.replace( /\n+/g, '\n' )
		.trim();

	return isCommentDelimited
		? getCommentDelimitedContent( blockName, attrs, content )
		: content;
}
