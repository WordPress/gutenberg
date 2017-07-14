/**
 * External dependencies
 */
import { parse as hpqParse } from 'hpq';
import { isPlainObject, mapValues, pickBy } from 'lodash';

/**
 * WordPress dependencies
 */
import { bumpStat } from '@wordpress/utils';

/**
 * Internal dependencies
 */
import { parse as grammarParse } from './post.pegjs';
import { getBlockType, getUnknownTypeHandlerName } from './registration';
import { createBlock } from './factory';
import { isValidBlock } from './validation';

/**
 * Returns true if the provided function is a valid attribute matcher, or false
 * otherwise.
 *
 * Matchers are implemented as functions receiving a DOM node to select data
 * from. Using the DOM is incidental and we shouldn't guarantee a contract that
 * this be provided, else block implementers may feel inclined to use the node.
 * Instead, matchers are intended as a generic interface to query data from any
 * tree shape. Here we pick only matchers which include an internal flag.
 *
 * @param  {Function} matcher Function to test
 * @return {Boolean}          Whether function is an attribute matcher
 */
export function isValidMatcher( matcher ) {
	return !! matcher && '_wpBlocksKnownMatcher' in matcher;
}

/**
 * Returns the block attributes parsed from raw content.
 *
 * @param  {String} rawContent Raw block content
 * @param  {Object} sources    Block attribute matchers
 * @return {Object}            Block attributes
 */
export function getMatcherAttributes( rawContent, sources ) {
	const matchers = mapValues(
		// Parse only sources with matcher defined
		pickBy( sources, ( source ) => isValidMatcher( source.matcher ) ),

		// Transform to object where matcher is value
		( source ) => source.matcher
	);

	return hpqParse( rawContent, matchers );
}

/**
 * Returns an attribute source in normalized (object) form. A source may be
 * specified in shorthand form as a constructor or attribute matcher, or in its
 * expanded form as an object with any of `type`, `matcher`, and `defaultValue`
 * values.
 *
 * @param  {(Object|Function)} source Source to normalize
 * @return {Object}                   Normalized source
 */
export function getNormalizedAttributeSource( source ) {
	if ( isPlainObject( source ) ) {
		return source;
	} if ( 'function' === typeof source ) {
		// Function may be either matcher or a constructor. Quack quack.
		if ( isValidMatcher( source ) ) {
			return { matcher: source };
		}

		return { type: source };
	}
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
	const sources = mapValues( blockType.attributes, getNormalizedAttributeSource );

	// Merge matcher values into attributes parsed from comment delimiters
	attributes = {
		...attributes,
		...getMatcherAttributes( rawContent, sources ),
	};

	return mapValues( sources, ( source, key ) => {
		const value = attributes[ key ];

		// Return default if attribute value not assigned
		if ( undefined === value ) {
			// Nest the condition so that constructor coercion never occurs if
			// value is undefined and block type doesn't specify default value
			if ( 'defaultValue' in source ) {
				return source.defaultValue;
			}
		} else if ( source.type && source.type.prototype.valueOf ) {
			// Coerce to constructor value if source type
			return ( new source.type( value ) ).valueOf();
		}

		return value;
	} );
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
	name = name || getUnknownTypeHandlerName();

	// Convert 'core/text' blocks in existing content to the new
	// 'core/paragraph'.
	if ( name === 'core/text' ) {
		bumpStat( 'block_auto_convert', 'core-text-to-paragraph' );
		name = 'core/paragraph';
	}

	// Try finding type for known block name, else fall back again.
	let blockType = getBlockType( name );
	const fallbackBlock = getUnknownTypeHandlerName();
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
