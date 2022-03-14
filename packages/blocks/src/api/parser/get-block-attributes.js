/**
 * External dependencies
 */
import { parse as hpqParse } from 'hpq';
import { flow, mapValues, castArray } from 'lodash';

/**
 * WordPress dependencies
 */
import { applyFilters } from '@wordpress/hooks';

/**
 * Internal dependencies
 */
import { attr, html, text, query, node, children, prop } from '../matchers';
import { normalizeBlockType } from '../utils';

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
 * Given an attribute key, an attribute's schema, a block's raw content and the
 * commentAttributes returns the attribute value depending on its source
 * definition of the given attribute key.
 *
 * @param {string}      attributeKey      Attribute key.
 * @param {Object}      attributeSchema   Attribute's schema.
 * @param {string|Node} innerHTML         Block's raw content.
 * @param {Object}      commentAttributes Block's comment attributes.
 *
 * @return {*} Attribute value.
 */
export function getBlockAttribute(
	attributeKey,
	attributeSchema,
	innerHTML,
	commentAttributes
) {
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

	if (
		! isValidByType( value, attributeSchema.type ) ||
		! isValidByEnum( value, attributeSchema.enum )
	) {
		// Reject the value if it is not valid. Reverting to the undefined
		// value ensures the default is respected, if applicable.
		value = undefined;
	}

	if ( value === undefined ) {
		value = attributeSchema.default;
	}

	return value;
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
 * Memoize one-parameter function using a WeakMap.
 *
 * @param {Function} fn Function to memoize.
 *
 * @return {Function} The same function memoized.
 */
function memoize( fn ) {
	const cache = new WeakMap();

	return function ( param ) {
		let result = cache.get( param );
		if ( result === undefined ) {
			result = fn( param );
			cache.set( param, result );
		}
		return result;
	};
}

/**
 * Returns an hpq matcher given a source object.
 *
 * @param {Object} sourceConfig Attribute Source object.
 *
 * @return {Function} A hpq Matcher.
 */
export const matcherFromSource = memoize( ( sourceConfig ) => {
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
} );

/**
 * Parse a HTML string into DOM tree.
 *
 * @param {string|Node} innerHTML HTML string or already parsed DOM node.
 *
 * @return {Node} Parsed DOM node.
 */
function parseHtml( innerHTML ) {
	return hpqParse( innerHTML, ( h ) => h );
}

/**
 * Given a block's raw content and an attribute's schema returns the attribute's
 * value depending on its source.
 *
 * @param {string|Node} innerHTML       Block's raw content.
 * @param {Object}      attributeSchema Attribute's schema.
 *
 * @return {*} Attribute value.
 */
export function parseWithAttributeSchema( innerHTML, attributeSchema ) {
	return matcherFromSource( attributeSchema )( parseHtml( innerHTML ) );
}

/**
 * Returns the block attributes of a registered block node given its type.
 *
 * @param {string|Object} blockTypeOrName Block type or name.
 * @param {string|Node}   innerHTML       Raw block content.
 * @param {?Object}       attributes      Known block attributes (from delimiters).
 *
 * @return {Object} All block attributes.
 */
export function getBlockAttributes(
	blockTypeOrName,
	innerHTML,
	attributes = {}
) {
	const doc = parseHtml( innerHTML );
	const blockType = normalizeBlockType( blockTypeOrName );

	const blockAttributes = mapValues( blockType.attributes, ( schema, key ) =>
		getBlockAttribute( key, schema, doc, attributes )
	);

	return applyFilters(
		'blocks.getBlockAttributes',
		blockAttributes,
		blockType,
		innerHTML,
		attributes
	);
}
