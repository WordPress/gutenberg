/**
 * Internal dependencies
 */
import { getCommentDelimitedContent } from '../serializer';

/**
 * @typedef {import('../../types').BlockNode} BlockNode
 * @typedef {import('../serializer')} serialize
 * @typedef {import('../serializer').serializeBlock} serializeBlock
 * @typedef {import('../types').BlockSerializationOptions} BlockSerializationOptions
 */

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
 * @see {@link https://github.com/WordPress/gutenberg/tree/trunk/packages/block-serialization-default-parser block-serialization-default-parser}
 * @see {@link https://github.com/WordPress/gutenberg/tree/trunk/packages/block-serialization-spec-parser block-serialization-spec-parser}
 *
 * @param {BlockNode}                  rawBlock A block node as returned by a valid parser.
 * @param {BlockSerializationOptions=} options  Serialization options.
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
