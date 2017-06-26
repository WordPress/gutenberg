/**
 * External dependencies
 */
import { parse as hpqParse } from 'hpq';
import { pickBy } from 'lodash';

/**
 * Internal dependencies
 */
import { parse as grammarParse } from './post.pegjs';
import { getBlockType, getUnknownTypeHandler } from './registration';
import { createBlock } from './factory';

/**
 * Returns the block attributes parsed from raw content.
 *
 * @param  {String} rawContent    Raw block content
 * @param  {Object} blockType     Block type
 * @return {Object}               Block attributes
 */
export function parseBlockAttributes( rawContent, blockType ) {
	const { attributes } = blockType;
	if ( 'function' === typeof attributes ) {
		return attributes( rawContent );
	} else if ( attributes ) {
		// Matchers are implemented as functions that receive a DOM node from
		// which to select data. Use of the DOM is incidental and we shouldn't
		// guarantee a contract that this be provided, else block implementers
		// may feel compelled to use the node. Instead, matchers are intended
		// as a generic interface to query data from any tree shape. Here we
		// pick only matchers which include an internal flag.
		const knownMatchers = pickBy( attributes, '_wpBlocksKnownMatcher' );

		return hpqParse( rawContent, knownMatchers );
	}

	return {};
}

/**
 * Returns the block attributes of a registered block node given its type.
 *
 * @param  {?Object} blockType     Block type
 * @param  {string}  rawContent    Raw block content
 * @param  {?Object} attributes    Known block attributes (from delimiters)
 * @return {Object}                All block attributes
 */
export function getBlockAttributes( blockType, rawContent, attributes ) {
	// Merge any attributes present in comment delimiters with those
	// that are specified in the block implementation.
	attributes = attributes || {};
	if ( blockType ) {
		attributes = {
			...blockType.defaultAttributes,
			...attributes,
			...parseBlockAttributes( rawContent, blockType ),
		};
	}

	return attributes;
}

/**
 * Creates a block with fallback to the unknown type handler.
 *
 * @param  {?String} name       Block type name
 * @param  {String}  rawContent Raw block content
 * @param  {?Object} attributes Attributes obtained from block delimiters
 * @return {?Object}            An initialized block object (if possible)
 */
export function createBlockWithFallback( name, rawContent, attributes ) {
	// Use type from block content, otherwise find unknown handler.
	name = name || getUnknownTypeHandler();

	// Try finding type for known block name, else fall back again.
	let blockType = getBlockType( name );
	const fallbackBlock = getUnknownTypeHandler();
	if ( ! blockType ) {
		name = fallbackBlock;
		blockType = getBlockType( name );
	}

	// Include in set only if type were determined.
	// TODO do we ever expect there to not be an unknown type handler?
	if ( blockType && ( rawContent.trim() || name !== fallbackBlock ) ) {
		// TODO allow blocks to opt-in to receiving a tree instead of a string.
		// Gradually convert all blocks to this new format, then remove the
		// string serialization.
		const block = createBlock(
			name,
			getBlockAttributes( blockType, rawContent.trim(), attributes )
		);
		return block;
	}
}

/**
 * Parses the post content with a PegJS grammar and returns a list of blocks.
 *
 * @param  {String} content The post content
 * @return {Array}          Block list
 */
export function parseWithGrammar( content ) {
	return grammarParse( content ).reduce( ( memo, blockNode ) => {
		const { blockName, rawContent, attrs } = blockNode;
		const block = createBlockWithFallback( blockName, rawContent, attrs );
		if ( block ) {
			memo.push( block );
		}
		return memo;
	}, [] );
}

export default parseWithGrammar;
