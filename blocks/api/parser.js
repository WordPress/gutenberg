/**
 * External dependencies
 */
import { parse as hpqParse } from 'hpq';
import { mapValues, find } from 'lodash';

/**
 * Internal dependencies
 */
import { parse as grammarParse } from './post.pegjs';
import { getBlockType, getUnknownTypeHandlerName } from './registration';
import { createBlock } from './factory';
import { isEquivalentHTML } from './validation';
import { getCommentDelimitedContent, getSaveContent } from './serializer';
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
 * Returns the block attributes given its attributes schema
 *
 * @param  {?Object} schema     Block attributes schema
 * @param  {string}  innerHTML  Raw block content
 * @param  {?Object} attributes Known block attributes (from delimiters)
 * @return {Object}             All block attributes
 */
export function getBlockAttributes( schema, innerHTML, attributes ) {
	const blockAttributes = mapValues( schema, ( attributeSchema, attributeKey ) => {
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
 * @param  {?Number} version    The block version
 * @return {?Object}            An initialized block object (if possible)
 */
export function createBlockWithFallback( name, innerHTML, attributes, version ) {
	let originalContent = innerHTML; // originalContent before parsing
	let contentToValidate; // Content serialized after parsing or after migration from old block
	let parsedAttributes; // Parsed block attributes or migrated to

	// Convert 'core/text' blocks in existing content to the new
	// 'core/paragraph'.
	if ( 'core/text' === name || 'core/cover-text' === name ) {
		name = 'core/paragraph';
	}
	let shouldFallback = false;

	// Checking The BlockType
	const blockType = getBlockType( name );
	const fallbackBlockName = getUnknownTypeHandlerName();
	if ( blockType ) {
		const blockTypeVersion = blockType.version || 1;
		if ( blockTypeVersion !== version ) {
			const migration = find( blockType.migrations, ( mig ) => mig.version === version );
			if ( ! migration ) {
				shouldFallback = true;
			} else {
				// Needs to pass the migration.attributes instead to do the parsing
				const oldAttributes = getBlockAttributes( migration.attributes, innerHTML, attributes );

				// Serialize using the old save
				contentToValidate = getSaveContent( {
					...blockType,
					attributes: migration.attributes,
					save: migration.save,
				}, oldAttributes );

				// Migrate the old attributes
				parsedAttributes = migration.migrate( oldAttributes );
			}
		} else {
			parsedAttributes = getBlockAttributes( blockType.attributes, innerHTML, attributes );
			contentToValidate = getSaveContent( blockType, parsedAttributes );
		}
	} else {
		shouldFallback = true;
	}

	// Fallback to the fallback block type
	if ( shouldFallback ) {
		// Explicit empty fallback blocks are ignored
		if ( ! name && ! innerHTML ) {
			return;
		}

		const fallbackBlockType = getBlockType( fallbackBlockName );
		if ( ! fallbackBlockType ) {
			// eslint-disable-next-line no-console
			console.warn( `Block ${ name } ignored, no fallback block` );
			return;
		}

		if ( name ) {
			originalContent = getCommentDelimitedContent( name, attributes, innerHTML, version );
		}

		name = fallbackBlockName;
		parsedAttributes = getBlockAttributes( fallbackBlockType.attributes, originalContent, attributes );
		contentToValidate = getSaveContent( fallbackBlockType, parsedAttributes );
	}

	const block = createBlock(
		name,
		parsedAttributes
	);

	block.isValid = isEquivalentHTML( originalContent, contentToValidate );

	// Preserve original content for future use in case the block is parsed
	// as invalid, or future serialization attempt results in an error
	block.originalContent = originalContent;

	return block;
}

/**
 * Parses the post content with a PegJS grammar and returns a list of blocks.
 *
 * @param  {String} content The post content
 * @return {Array}          Block list
 */
export function parseWithGrammar( content ) {
	return grammarParse( content ).reduce( ( memo, blockNode ) => {
		const { blockName, innerHTML, attrs, version } = blockNode;
		const block = createBlockWithFallback( blockName, innerHTML.trim(), attrs, version );

		if ( block ) {
			memo.push( block );
		}
		return memo;
	}, [] );
}

export default parseWithGrammar;
