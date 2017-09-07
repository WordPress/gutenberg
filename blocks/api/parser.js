/**
 * External dependencies
 */
import { parse as hpqParse, attr } from 'hpq';
import { mapValues, reduce, pickBy } from 'lodash';

/**
 * Internal dependencies
 */
import { parse as grammarParse } from './post.pegjs';
import { getBlockType, getUnknownTypeHandlerName } from './registration';
import { createBlock } from './factory';
import { isValidBlock } from './validation';
import { getCommentDelimitedContent } from './serializer';

/**
 * Returns true if the provided function is a valid attribute source, or false
 * otherwise.
 *
 * Sources are implemented as functions receiving a DOM node to select data
 * from. Using the DOM is incidental and we shouldn't guarantee a contract that
 * this be provided, else block implementers may feel inclined to use the node.
 * Instead, sources are intended as a generic interface to query data from any
 * tree shape. Here we pick only sources which include an internal flag.
 *
 * @param  {Function} source Function to test
 * @return {Boolean}         Whether function is an attribute source
 */
export function isValidSource( source ) {
	return !! source && '_wpBlocksKnownSource' in source;
}

/**
 * Returns the block attributes parsed from raw content.
 *
 * @param  {String} rawContent Raw block content
 * @param  {Object} schema     Block attribute schema
 * @return {Object}            Block attribute values
 */
export function getSourcedAttributes( rawContent, schema ) {
	const sources = mapValues(
		// Parse only sources with source defined
		pickBy( schema, ( attributeSchema ) => isValidSource( attributeSchema.source ) ),

		// Transform to object where source is value
		( attributeSchema ) => attributeSchema.source
	);

	return hpqParse( rawContent, sources );
}

/**
 * Returns value coerced to the specified JSON schema type string
 *
 * @see http://json-schema.org/latest/json-schema-validation.html#rfc.section.6.25
 *
 * @param  {*}      value Original value
 * @param  {String} type  Type to coerce
 * @return {*}            Coerced value
 */
export function asType( value, type ) {
	switch ( type ) {
		case 'string':
			return String( value );

		case 'boolean':
			return Boolean( value );

		case 'object':
			return Object( value );

		case 'null':
			return null;

		case 'array':
			if ( Array.isArray( value ) ) {
				return value;
			}

			return Array.from( value );

		case 'integer':
		case 'number':
			return Number( value );
	}

	return value;
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
	// Retrieve additional attributes sourced from content
	const sourcedAttributes = getSourcedAttributes(
		rawContent,
		blockType.attributes
	);

	const blockAttributes = reduce( blockType.attributes, ( result, source, key ) => {
		let value;
		if ( sourcedAttributes.hasOwnProperty( key ) ) {
			value = sourcedAttributes[ key ];
		} else if ( attributes ) {
			value = attributes[ key ];
		}

		// Return default if attribute value not assigned
		if ( undefined === value ) {
			// Nest the condition so that constructor coercion never occurs if
			// value is undefined and block type doesn't specify default value
			if ( 'default' in source ) {
				value = source.default;
			} else {
				return result;
			}
		}

		// Coerce value to specified type
		const coercedValue = asType( value, source.type );

		if ( 'development' === process.env.NODE_ENV &&
				! sourcedAttributes.hasOwnProperty( key ) &&
				value !== coercedValue ) {
			// Only in case of sourcing attribute from content do we want to
			// allow coercion, as comment attributes are serialized respecting
			// original data type. In development environments, log if value
			// coerced to specified type is not strictly equal. We still allow
			// coerced value to be assigned into attributes to avoid errors.
			//
			// Example:
			//   Number( 5 ) === 5
			//   Number( '5' ) !== '5'

			// eslint-disable-next-line no-console
			console.error(
				`Expected attribute "${ key }" of type ${ source.type } for ` +
				`block type "${ blockType.name }" but received ${ typeof value }.`
			);
		}

		result[ key ] = coercedValue;
		return result;
	}, {} );

	// If the block supports anchor, parse the id
	if ( blockType.supportAnchor ) {
		blockAttributes.anchor = hpqParse( rawContent, attr( '*', 'id' ) );
	}

	return blockAttributes;
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
	if ( name === 'core/text' || name === 'core/cover-text' ) {
		name = 'core/paragraph';
	}

	// Try finding type for known block name, else fall back again.
	let blockType = getBlockType( name );
	const fallbackBlock = getUnknownTypeHandlerName();
	if ( ! blockType ) {
		// If detected as a block which is not registered, preserve comment
		// delimiters in content of unknown type handler.
		if ( name ) {
			rawContent = getCommentDelimitedContent( name, attributes, rawContent );
		}

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
		// original value.
		block.isValid = isValidBlock( rawContent, blockType, block.attributes );

		// Preserve original content for future use in case the block is parsed
		// as invalid, or future serialization attempt results in an error
		block.originalContent = rawContent;

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
