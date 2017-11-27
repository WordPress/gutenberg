/**
 * External dependencies
 */
import { parse as hpqParse } from 'hpq';
import { mapValues, find, omit } from 'lodash';

/**
 * Internal dependencies
 */
import { parse as grammarParse } from './post.pegjs';
import { getBlockType, getUnknownTypeHandlerName } from './registration';
import { createBlock } from './factory';
import { isValidBlock } from './validation';
import { getCommentDelimitedContent } from './serializer';
import { attr, prop, html, text, query, node, children } from './matchers';

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
 * Returns an hpq matcher given a source object
 *
 * @param  {Object}   sourceConfig Attribute Source object
 * @return {Function}              hpq Matcher
 */
export function matcherFromSource( sourceConfig ) {
	switch ( sourceConfig.source ) {
		case 'attribute':
			return attr( sourceConfig.selector, sourceConfig.attribute );
		case 'property':
			return prop( sourceConfig.selector, sourceConfig.property );
		case 'html':
			return html( sourceConfig.selector );
		case 'text':
			return text( sourceConfig.selector );
		case 'children':
			return children( sourceConfig.selector );
		case 'node':
			return node( sourceConfig.selector );
		case 'query':
			const subMatchers = mapValues( sourceConfig.query, matcherFromSource );
			return query( sourceConfig.selector, subMatchers );
		default:
			// eslint-disable-next-line no-console
			console.error( `Unkown source type "${ sourceConfig.source }"` );
	}
}

/**
 * Given an attribute key, an attribute's schema, a block's raw content and the commentAttributes
 * returns the attribute value depending on its source definition of the given attribute key
 *
 * @param  {string} attributeKey        Attribute key
 * @param  {Object} attributeSchema     Attribute's schema
 * @param  {string} innerHTML           Block's raw content
 * @param  {Object} commentAttributes   Block's comment attributes
 *
 * @return {*}                          Attribute value
 */
export function getBlockAttribute( attributeKey, attributeSchema, innerHTML, commentAttributes ) {
	let value;
	switch ( attributeSchema.source ) {
		// undefined source means that it's an attribute serialized to the block's "comment"
		case undefined:
			value = commentAttributes ? commentAttributes[ attributeKey ] : undefined;
			break;
		case 'attribute':
		case 'property':
		case 'html':
		case 'text':
		case 'children':
		case 'node':
		case 'query':
			value = hpqParse( innerHTML, matcherFromSource( attributeSchema ) );
			break;
	}

	return value === undefined ? attributeSchema.default : asType( value, attributeSchema.type );
}

/**
 * Returns the block attributes of a registered block node given its type.
 *
 * @param  {?Object} blockType  Block type
 * @param  {string}  innerHTML  Raw block content
 * @param  {?Object} attributes Known block attributes (from delimiters)
 * @return {Object}             All block attributes
 */
export function getBlockAttributes( blockType, innerHTML, attributes ) {
	const blockAttributes = mapValues( blockType.attributes, ( attributeSchema, attributeKey ) => {
		return getBlockAttribute( attributeKey, attributeSchema, innerHTML, attributes );
	} );

	return blockAttributes;
}

/**
 * Creates a block with fallback to the unknown type handler.
 *
 * @param  {?String} name       Block type name
 * @param  {String}  innerHTML  Raw block content
 * @param  {?Object} attributes Attributes obtained from block delimiters
 * @return {?Object}            An initialized block object (if possible)
 */
export function createBlockWithFallback( name, innerHTML, attributes ) {
	// Use type from block content, otherwise find unknown handler.
	name = name || getUnknownTypeHandlerName();

	// Convert 'core/text' blocks in existing content to the new
	// 'core/paragraph'.
	if ( 'core/text' === name || 'core/cover-text' === name ) {
		name = 'core/paragraph';
	}

	// Try finding type for known block name, else fall back again.
	let blockType = getBlockType( name );
	const fallbackBlock = getUnknownTypeHandlerName();
	if ( ! blockType ) {
		// If detected as a block which is not registered, preserve comment
		// delimiters in content of unknown type handler.
		if ( name ) {
			innerHTML = getCommentDelimitedContent( name, attributes, innerHTML );
		}

		name = fallbackBlock;
		blockType = getBlockType( name );
	}

	// Include in set only if type were determined.
	// TODO do we ever expect there to not be an unknown type handler?
	if ( blockType && ( innerHTML || name !== fallbackBlock ) ) {
		// TODO allow blocks to opt-in to receiving a tree instead of a string.
		// Gradually convert all blocks to this new format, then remove the
		// string serialization.
		const block = createBlock(
			name,
			getBlockAttributes( blockType, innerHTML, attributes )
		);

		// Validate that the parsed block is valid, meaning that if we were to
		// reserialize it given the assumed attributes, the markup matches the
		// original value.
		block.isValid = isValidBlock( innerHTML, blockType, block.attributes );

		// Preserve original content for future use in case the block is parsed
		// as invalid, or future serialization attempt results in an error
		block.originalContent = innerHTML;

		// When a block is invalid, attempt to validate again using a supplied `deprecated` definition.
		// This allows blocks to modify their attribute and markup structure without invalidating
		// content written in previous formats.
		if ( ! block.isValid && blockType.deprecated ) {
			let attributesParsedWithDeprecatedVersion;
			const hasValidOlderVersion = find( blockType.deprecated, ( oldBlockType ) => {
				const deprecatedBlockType = {
					...omit( blockType, [ 'attributes', 'save', 'supports' ] ), // Parsing/Serialization properties
					...oldBlockType,
				};
				const deprecatedBlockAttributes = getBlockAttributes( deprecatedBlockType, innerHTML, attributes );
				const isValid = isValidBlock( innerHTML, deprecatedBlockType, deprecatedBlockAttributes );
				attributesParsedWithDeprecatedVersion = isValid ? deprecatedBlockAttributes : undefined;
				return isValid;
			} );

			if ( hasValidOlderVersion ) {
				block.isValid = true;
				block.attributes = attributesParsedWithDeprecatedVersion;
			}
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
		const { blockName, innerHTML, attrs } = blockNode;
		const block = createBlockWithFallback( blockName, innerHTML.trim(), attrs );
		if ( block ) {
			memo.push( block );
		}
		return memo;
	}, [] );
}

export default parseWithGrammar;
