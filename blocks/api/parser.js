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
import { getBeautifulContent, getSaveContent } from './serializer';

/**
 * Returns the block attributes parsed from raw content.
 *
 * @param  {String} rawContent    Raw block content
 * @param  {Object} attributes    Block attribute matchers
 * @return {Object}               Block attributes
 */
export function parseBlockAttributes( rawContent, attributes ) {
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
			...parseBlockAttributes( rawContent, blockType.attributes ),
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
	if ( blockType && ( rawContent || name !== fallbackBlock ) ) {
		// TODO allow blocks to opt-in to receiving a tree instead of a string.
		// Gradually convert all blocks to this new format, then remove the
		// string serialization.
		const block = createBlock(
			name,
			getBlockAttributes( blockType, rawContent, attributes )
		);

		// Validate that the parsed block is valid, meaning that if we were to
		// reserialize it given the assumed attributes, the markup matches the
		// original value. Otherwise, preserve original to avoid destruction.
		block.isValid = isValidBlock( rawContent, blockType, block.attributes );
		if ( ! block.isValid ) {
			block.originalContent = rawContent;
		}

		return block;
	}
}

/**
 * Returns true if the parsed block is valid given the input content. A block
 * is considered valid if, when serialized with assumed attributes, the content
 * matches the original value.
 *
 * Logs to console in development environments when invalid.
 *
 * @param  {String}  rawContent Original block content
 * @param  {String}  blockType  Block type
 * @param  {Object}  attributes Parsed block attributes
 * @return {Boolean}            Whether block is valid
 */
export function isValidBlock( rawContent, blockType, attributes ) {
	const [ actual, expected ] = [
		rawContent,
		getSaveContent( blockType, attributes ),
	].map( getBeautifulContent );

	const isValid = ( actual === expected );

	if ( ! isValid && 'development' === process.env.NODE_ENV ) {
		// eslint-disable-next-line no-console
		console.error(
			'Invalid block parse\n' +
				'\tExpected: ' + expected + '\n' +
				'\tActual:   ' + actual
		);
	}

	return isValid;
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
		const block = createBlockWithFallback( blockName, rawContent.trim(), attrs );
		if ( block ) {
			memo.push( block );
		}
		return memo;
	}, [] );
}

export default parseWithGrammar;
