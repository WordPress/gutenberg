/**
 * External dependencies
 */
import { parse as hpqParse } from 'hpq';
import { flow, get, castArray, mapValues, omit, stubFalse } from 'lodash';

/**
 * WordPress dependencies
 */
import { autop } from '@wordpress/autop';
import { applyFilters } from '@wordpress/hooks';
import { parse as defaultParse } from '@wordpress/block-serialization-default-parser';
/**
 * Internal dependencies
 */
import {
	getBlockType,
	getFreeformContentHandlerName,
	getUnregisteredTypeHandlerName,
} from './registration';
import { createBlock } from './factory';
import { getBlockContentValidationResult } from './validation';
import { getCommentDelimitedContent, getSaveContent } from './serializer';
import { attr, html, text, query, node, children, prop } from './matchers';
import { normalizeBlockType } from './utils';
import { DEPRECATED_ENTRY_KEYS } from './constants';

/**
 * Sources which are guaranteed to return a string value.
 *
 * @type {Set}
 */
const STRING_SOURCES = new Set( [ 'attribute', 'html', 'text', 'tag' ] );

/**
 * Higher-order hpq matcher which enhances an attribute matcher to return true
 * or false depending on whether the original matcher returns undefined. This
 * is useful for boolean attributes (e.g. disabled) whose attribute values may
 * be technically falsey (empty string), though their mere presence should be
 * enough to infer as true.
 *
 * @param {Function} matcher Original hpq matcher.
 *
 * @return {Function} Enhanced hpq matcher.
 */
export const toBooleanAttributeMatcher = ( matcher ) =>
	flow( [
		matcher,
		// Expected values from `attr( 'disabled' )`:
		//
		// <input>
		// - Value:       `undefined`
		// - Transformed: `false`
		//
		// <input disabled>
		// - Value:       `''`
		// - Transformed: `true`
		//
		// <input disabled="disabled">
		// - Value:       `'disabled'`
		// - Transformed: `true`
		( value ) => value !== undefined,
	] );

/**
 * Returns true if value is of the given JSON schema type, or false otherwise.
 *
 * @see http://json-schema.org/latest/json-schema-validation.html#rfc.section.6.25
 *
 * @param {*}      value Value to test.
 * @param {string} type  Type to test.
 *
 * @return {boolean} Whether value is of type.
 */
export function isOfType( value, type ) {
	switch ( type ) {
		case 'string':
			return typeof value === 'string';

		case 'boolean':
			return typeof value === 'boolean';

		case 'object':
			return !! value && value.constructor === Object;

		case 'null':
			return value === null;

		case 'array':
			return Array.isArray( value );

		case 'integer':
		case 'number':
			return typeof value === 'number';
	}

	return true;
}

/**
 * Returns true if value is of an array of given JSON schema types, or false
 * otherwise.
 *
 * @see http://json-schema.org/latest/json-schema-validation.html#rfc.section.6.25
 *
 * @param {*}        value Value to test.
 * @param {string[]} types Types to test.
 *
 * @return {boolean} Whether value is of types.
 */
export function isOfTypes( value, types ) {
	return types.some( ( type ) => isOfType( value, type ) );
}

/**
 * Returns true if value is valid per the given block attribute schema type
 * definition, or false otherwise.
 *
 * @see https://json-schema.org/latest/json-schema-validation.html#rfc.section.6.1.1
 *
 * @param {*}                       value Value to test.
 * @param {?(Array<string>|string)} type  Block attribute schema type.
 *
 * @return {boolean} Whether value is valid.
 */
export function isValidByType( value, type ) {
	return type === undefined || isOfTypes( value, castArray( type ) );
}

/**
 * Returns true if value is valid per the given block attribute schema enum
 * definition, or false otherwise.
 *
 * @see https://json-schema.org/latest/json-schema-validation.html#rfc.section.6.1.2
 *
 * @param {*}      value   Value to test.
 * @param {?Array} enumSet Block attribute schema enum.
 *
 * @return {boolean} Whether value is valid.
 */
export function isValidByEnum( value, enumSet ) {
	return ! Array.isArray( enumSet ) || enumSet.includes( value );
}

/**
 * Returns true if the given attribute schema describes a value which may be
 * an ambiguous string.
 *
 * Some sources are ambiguously serialized as strings, for which value casting
 * is enabled. This is only possible when a singular type is assigned to the
 * attribute schema, since the string ambiguity makes it impossible to know the
 * correct type of multiple to which to cast.
 *
 * @param {Object} attributeSchema Attribute's schema.
 *
 * @return {boolean} Whether attribute schema defines an ambiguous string
 *                   source.
 */
export function isAmbiguousStringSource( attributeSchema ) {
	const { source, type } = attributeSchema;

	const isStringSource = STRING_SOURCES.has( source );
	const isSingleType = typeof type === 'string';

	return isStringSource && isSingleType;
}

/**
 * Returns an hpq matcher given a source object.
 *
 * @param {Object} sourceConfig Attribute Source object.
 *
 * @return {Function} A hpq Matcher.
 */
export function matcherFromSource( sourceConfig ) {
	switch ( sourceConfig.source ) {
		case 'attribute':
			let matcher = attr( sourceConfig.selector, sourceConfig.attribute );
			if ( sourceConfig.type === 'boolean' ) {
				matcher = toBooleanAttributeMatcher( matcher );
			}

			return matcher;
		case 'html':
			return html( sourceConfig.selector, sourceConfig.multiline );
		case 'text':
			return text( sourceConfig.selector );
		case 'children':
			return children( sourceConfig.selector );
		case 'node':
			return node( sourceConfig.selector );
		case 'query':
			const subMatchers = mapValues(
				sourceConfig.query,
				matcherFromSource
			);
			return query( sourceConfig.selector, subMatchers );
		case 'tag':
			return flow( [
				prop( sourceConfig.selector, 'nodeName' ),
				( nodeName ) =>
					nodeName ? nodeName.toLowerCase() : undefined,
			] );
		default:
			// eslint-disable-next-line no-console
			console.error( `Unknown source type "${ sourceConfig.source }"` );
	}
}

/**
 * Given a block's raw content and an attribute's schema returns the attribute's
 * value depending on its source.
 *
 * @param {string} innerHTML         Block's raw content.
 * @param {Object} attributeSchema   Attribute's schema.
 *
 * @return {*} Attribute value.
 */
export function parseWithAttributeSchema( innerHTML, attributeSchema ) {
	return hpqParse( innerHTML, matcherFromSource( attributeSchema ) );
}

/**
 * Given an attribute key, an attribute's schema, a block's raw content and the
 * commentAttributes returns the attribute value depending on its source
 * definition of the given attribute key.
 *
 * @param {string} attributeKey      Attribute key.
 * @param {Object} attributeSchema   Attribute's schema.
 * @param {string} innerHTML         Block's raw content.
 * @param {Object} commentAttributes Block's comment attributes.
 *
 * @return {*} Attribute value.
 */
export function getBlockAttribute(
	attributeKey,
	attributeSchema,
	innerHTML,
	commentAttributes
) {
	const { type, enum: enumSet } = attributeSchema;
	let value;

	switch ( attributeSchema.source ) {
		// An undefined source means that it's an attribute serialized to the
		// block's "comment".
		case undefined:
			value = commentAttributes
				? commentAttributes[ attributeKey ]
				: undefined;
			break;
		case 'attribute':
		case 'property':
		case 'html':
		case 'text':
		case 'children':
		case 'node':
		case 'query':
		case 'tag':
			value = parseWithAttributeSchema( innerHTML, attributeSchema );
			break;
	}

	if ( ! isValidByType( value, type ) || ! isValidByEnum( value, enumSet ) ) {
		// Reject the value if it is not valid. Reverting to the undefined
		// value ensures the default is respected, if applicable.
		value = undefined;
	}

	if ( value === undefined ) {
		return attributeSchema.default;
	}

	return value;
}

/**
 * Returns the block attributes of a registered block node given its type.
 *
 * @param {string|Object} blockTypeOrName Block type or name.
 * @param {string}        innerHTML       Raw block content.
 * @param {?Object}       attributes      Known block attributes (from delimiters).
 *
 * @return {Object} All block attributes.
 */
export function getBlockAttributes(
	blockTypeOrName,
	innerHTML,
	attributes = {}
) {
	const blockType = normalizeBlockType( blockTypeOrName );
	const blockAttributes = mapValues(
		blockType.attributes,
		( attributeSchema, attributeKey ) => {
			return getBlockAttribute(
				attributeKey,
				attributeSchema,
				innerHTML,
				attributes
			);
		}
	);

	return applyFilters(
		'blocks.getBlockAttributes',
		blockAttributes,
		blockType,
		innerHTML,
		attributes
	);
}

/**
 * Given a block object, returns a new copy of the block with any applicable
 * deprecated migrations applied, or the original block if it was both valid
 * and no eligible migrations exist.
 *
 * @param {WPBlock} block            Original block object.
 * @param {Object}  parsedAttributes Attributes as parsed from the initial
 *                                   block markup.
 *
 * @return {WPBlock} Migrated block object.
 */
export function getMigratedBlock( block, parsedAttributes ) {
	const blockType = getBlockType( block.name );

	const { deprecated: deprecatedDefinitions } = blockType;
	// Bail early if there are no registered deprecations to be handled.
	if ( ! deprecatedDefinitions || ! deprecatedDefinitions.length ) {
		return block;
	}

	const { originalContent, innerBlocks } = block;

	// By design, blocks lack any sort of version tracking. Instead, to process
	// outdated content the system operates a queue out of all the defined
	// attribute shapes and tries each definition until the input produces a
	// valid result. This mechanism seeks to avoid polluting the user-space with
	// machine-specific code. An invalid block is thus a block that could not be
	// matched successfully with any of the registered deprecation definitions.
	for ( let i = 0; i < deprecatedDefinitions.length; i++ ) {
		// A block can opt into a migration even if the block is valid by
		// defining `isEligible` on its deprecation. If the block is both valid
		// and does not opt to migrate, skip.
		const { isEligible = stubFalse } = deprecatedDefinitions[ i ];
		if ( block.isValid && ! isEligible( parsedAttributes, innerBlocks ) ) {
			continue;
		}

		// Block type properties which could impact either serialization or
		// parsing are not considered in the deprecated block type by default,
		// and must be explicitly provided.
		const deprecatedBlockType = Object.assign(
			omit( blockType, DEPRECATED_ENTRY_KEYS ),
			deprecatedDefinitions[ i ]
		);

		let migratedAttributes = getBlockAttributes(
			deprecatedBlockType,
			originalContent,
			parsedAttributes
		);

		// Ignore the deprecation if it produces a block which is not valid.
		const { isValid, validationIssues } = getBlockContentValidationResult(
			deprecatedBlockType,
			migratedAttributes,
			originalContent
		);

		// An invalid block does not imply incorrect HTML but the fact block
		// source information could be lost on reserialization.
		if ( ! isValid ) {
			block = {
				...block,
				validationIssues: [
					...get( block, 'validationIssues', [] ),
					...validationIssues,
				],
			};
			continue;
		}

		let migratedInnerBlocks = innerBlocks;

		// A block may provide custom behavior to assign new attributes and/or
		// inner blocks.
		const { migrate } = deprecatedBlockType;
		if ( migrate ) {
			[
				migratedAttributes = parsedAttributes,
				migratedInnerBlocks = innerBlocks,
			] = castArray( migrate( migratedAttributes, innerBlocks ) );
		}

		block = {
			...block,
			attributes: migratedAttributes,
			innerBlocks: migratedInnerBlocks,
			isValid: true,
		};
	}

	return block;
}

/**
 * Convert legacy blocks to their canonical form. This function is used
 * both in the parser level for previous content and to convert such blocks
 * used in Custom Post Types templates.
 *
 * @param {string} name The block's name
 * @param {Object} attributes The block's attributes
 *
 * @return {Object} The block's name and attributes, changed accordingly if a match was found
 */
export function convertLegacyBlocks( name, attributes ) {
	const newAttributes = { ...attributes };
	// Convert 'core/cover-image' block in existing content to 'core/cover'.
	if ( 'core/cover-image' === name ) {
		name = 'core/cover';
	}

	// Convert 'core/text' blocks in existing content to 'core/paragraph'.
	if ( 'core/text' === name || 'core/cover-text' === name ) {
		name = 'core/paragraph';
	}

	// Convert derivative blocks such as 'core/social-link-wordpress' to the
	// canonical form 'core/social-link'.
	if ( name && name.indexOf( 'core/social-link-' ) === 0 ) {
		// Capture `social-link-wordpress` into `{"service":"wordpress"}`
		newAttributes.service = name.substring( 17 );
		name = 'core/social-link';
	}

	// Convert derivative blocks such as 'core-embed/instagram' to the
	// canonical form 'core/embed'.
	if ( name && name.indexOf( 'core-embed/' ) === 0 ) {
		// Capture `core-embed/instagram` into `{"providerNameSlug":"instagram"}`
		const providerSlug = name.substring( 11 );
		const deprecated = {
			speaker: 'speaker-deck',
			polldaddy: 'crowdsignal',
		};
		newAttributes.providerNameSlug =
			providerSlug in deprecated
				? deprecated[ providerSlug ]
				: providerSlug;
		// this is needed as the `responsive` attribute was passed
		// in a different way before the refactoring to block variations
		if ( ! [ 'amazon-kindle', 'wordpress' ].includes( providerSlug ) ) {
			newAttributes.responsive = true;
		}
		name = 'core/embed';
	}
	return { name, attributes: newAttributes };
}

/**
 * Creates a block with fallback to the unknown type handler.
 *
 * @param {Object} blockNode Parsed block node.
 *
 * @return {?Object} An initialized block object (if possible).
 */
export function createBlockWithFallback( blockNode ) {
	const { blockName: originalName } = blockNode;

	// The fundamental structure of a blocktype includes its attributes, inner
	// blocks, and inner HTML. It is important to distinguish inner blocks from
	// the HTML content of the block as only the latter is relevant for block
	// validation and edit operations.
	let { attrs: attributes, innerBlocks = [], innerHTML } = blockNode;
	const { innerContent } = blockNode;

	// Blocks that don't have a registered handler are considered freeform.
	const freeformContentFallbackBlock = getFreeformContentHandlerName();

	const isV2Gallery = 'core/gallery' === originalName && attributes.imageCount !== undefined;

	const unregisteredFallbackBlock =
		getUnregisteredTypeHandlerName() || freeformContentFallbackBlock || isV2Gallery;

	console.log('isV2Gallery',isV2Gallery);
	console.log('unregisteredFallbackBlock',unregisteredFallbackBlock);

	attributes = attributes || {};

	// Trim content to avoid creation of intermediary freeform segments.
	innerHTML = innerHTML.trim();

	// Use type from block content if available. Otherwise, default to the
	// freeform content fallback.
	let name = originalName || freeformContentFallbackBlock;

	( { name, attributes } = convertLegacyBlocks( name, attributes ) );

	// Fallback content may be upgraded from classic content expecting implicit
	// automatic paragraphs, so preserve them. Assumes wpautop is idempotent,
	// meaning there are no negative consequences to repeated autop calls.
	if ( name === freeformContentFallbackBlock ) {
		innerHTML = autop( innerHTML ).trim();
	}

	// Try finding the type for known block name, else fall back again.
	let blockType = getBlockType( name );

	if ( ! blockType ) {
		// Since the constituents of the block node are extracted at the start
		// of the present function, construct a new object rather than reuse
		// `blockNode`.
		const reconstitutedBlockNode = {
			attrs: attributes,
			blockName: originalName,
			innerBlocks,
			innerContent,
		};

		// Preserve undelimited content for use by the unregistered type
		// handler. A block node's `innerHTML` isn't enough, as that field only
		// carries the block's own HTML and not its nested blocks.
		const originalUndelimitedContent = serializeBlockNode(
			reconstitutedBlockNode,
			{
				isCommentDelimited: false,
			}
		);

		// Preserve full block content for use by the unregistered type
		// handler, block boundaries included.
		const originalContent = serializeBlockNode( reconstitutedBlockNode, {
			isCommentDelimited: true,
		} );

		// If detected as a block which is not registered, preserve comment
		// delimiters in content of unregistered type handler.
		if ( name ) {
			innerHTML = originalContent;
		}

		name = unregisteredFallbackBlock;
		attributes = {
			originalName,
			originalContent,
			originalUndelimitedContent,
		};
		blockType = getBlockType( name );
	}

	// Coerce inner blocks from parsed form to canonical form.
	innerBlocks = innerBlocks.map( createBlockWithFallback );

	// Remove `undefined` innerBlocks.
	//
	// This is a temporary fix to prevent unrecoverable TypeErrors when handling unexpectedly
	// empty freeform block nodes. See https://github.com/WordPress/gutenberg/pull/17164.
	innerBlocks = innerBlocks.filter( ( innerBlock ) => innerBlock );

	const isFallbackBlock =
		name === freeformContentFallbackBlock ||
		name === unregisteredFallbackBlock;

	// Include in set only if type was determined.
	if ( ! blockType || ( ! innerHTML && isFallbackBlock ) ) {
		return;
	}

	let block = createBlock(
		name,
		getBlockAttributes( blockType, innerHTML, attributes ),
		innerBlocks
	);

	// Block validation assumes an idempotent operation from source block to serialized block
	// provided there are no changes in attributes. The validation procedure thus compares the
	// provided source value with the serialized output before there are any modifications to
	// the block. When both match, the block is marked as valid.
	if ( ! isFallbackBlock ) {
		const { isValid, validationIssues } = getBlockContentValidationResult(
			blockType,
			block.attributes,
			innerHTML
		);
		block.isValid = isValid;
		block.validationIssues = validationIssues;
	}

	// Preserve original content for future use in case the block is parsed
	// as invalid, or future serialization attempt results in an error.
	block.originalContent = block.originalContent || innerHTML;

	// Ensure all necessary migrations are applied to the block.
	block = getMigratedBlock( block, attributes );

	if ( block.validationIssues && block.validationIssues.length > 0 ) {
		if ( block.isValid ) {
			// eslint-disable-next-line no-console
			console.info(
				'Block successfully updated for `%s` (%o).\n\nNew content generated by `save` function:\n\n%s\n\nContent retrieved from post body:\n\n%s',
				blockType.name,
				blockType,
				getSaveContent( blockType, block.attributes ),
				block.originalContent
			);
		} else if ( isV2Gallery ){
			console.info('V2 Gallery block detected')
		} else {
			block.validationIssues.forEach( ( { log, args } ) =>
				log( ...args )
			);
		}
	}

	return block;
}

/**
 * Serializes a block node into the native HTML-comment-powered block format.
 * CAVEAT: This function is intended for reserializing blocks as parsed by
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
 * @param {Object}   blockNode                  A block node as returned by a valid parser.
 * @param {?Object}  options                    Serialization options.
 * @param {?boolean} options.isCommentDelimited Whether to output HTML comments around blocks.
 *
 * @return {string} An HTML string representing a block.
 */
export function serializeBlockNode( blockNode, options = {} ) {
	const { isCommentDelimited = true } = options;
	const {
		blockName,
		attrs = {},
		innerBlocks = [],
		innerContent = [],
	} = blockNode;

	let childIndex = 0;
	const content = innerContent
		.map( ( item ) =>
			// `null` denotes a nested block, otherwise we have an HTML fragment.
			item !== null
				? item
				: serializeBlockNode( innerBlocks[ childIndex++ ], options )
		)
		.join( '\n' )
		.replace( /\n+/g, '\n' )
		.trim();

	return isCommentDelimited
		? getCommentDelimitedContent( blockName, attrs, content )
		: content;
}

/**
 * Creates a parse implementation for the post content which returns a list of blocks.
 *
 * @param {Function} parseImplementation Parse implementation.
 *
 * @return {Function} An implementation which parses the post content.
 */
const createParse = ( parseImplementation ) => ( content ) =>
	parseImplementation( content ).reduce( ( accumulator, blockNode ) => {
		const block = createBlockWithFallback( blockNode );
		if ( block ) {
			accumulator.push( block );
		}
		return accumulator;
	}, [] );

/**
 * Utilizes an optimized token-driven parser based on the Gutenberg grammar spec
 * defined through a parsing expression grammar to take advantage of the regular
 * cadence provided by block delimiters -- composed syntactically through HTML
 * comments -- which, given a general HTML document as an input, returns a block
 * list array representation.
 *
 * This is a recursive-descent parser that scans linearly once through the input
 * document. Instead of directly recursing it utilizes a trampoline mechanism to
 * prevent stack overflow. This initial pass is mainly interested in separating
 * and isolating the blocks serialized in the document and manifestly not in the
 * content within the blocks.
 *
 * @see
 * https://developer.wordpress.org/block-editor/packages/packages-block-serialization-default-parser/
 *
 * @param {string} content The post content.
 *
 * @return {Array} Block list.
 */
export const parseWithGrammar = createParse( defaultParse );

export default parseWithGrammar;
