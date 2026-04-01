/**
 * External dependencies
 */
// @ts-ignore
import { parse as hpqParse } from 'hpq';
import memoize from 'memize';

/**
 * WordPress dependencies
 */
import { applyFilters } from '@wordpress/hooks';
import { RichTextData } from '@wordpress/rich-text';

/**
 * Internal dependencies
 */
import {
	attr,
	html,
	text,
	query,
	node,
	children,
	prop,
	richText,
} from '../matchers';
import { normalizeBlockType, getDefault } from '../utils';
import type { BlockAttribute, BlockType } from '../../types';

/**
 * Higher-order hpq matcher which enhances an attribute matcher to return true
 * or false depending on whether the original matcher returns undefined. This
 * is useful for boolean attributes (e.g. disabled) whose attribute values may
 * be technically falsey (empty string), though their mere presence should be
 * enough to infer as true.
 *
 * @param matcher Original hpq matcher.
 *
 * @return Enhanced hpq matcher.
 */
export const toBooleanAttributeMatcher =
	( matcher: ( value: unknown ) => unknown ) =>
	( value: unknown ): boolean =>
		matcher( value ) !== undefined;

/**
 * Returns true if value is of the given JSON schema type, or false otherwise.
 *
 * @see http://json-schema.org/latest/json-schema-validation.html#rfc.section.6.25
 *
 * @param value Value to test.
 * @param type  Type to test.
 *
 * @return Whether value is of type.
 */
export function isOfType( value: unknown, type: string ): boolean {
	switch ( type ) {
		case 'rich-text':
			return value instanceof RichTextData;

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
 * @param value Value to test.
 * @param types Types to test.
 *
 * @return Whether value is of types.
 */
export function isOfTypes( value: unknown, types: string[] ): boolean {
	return types.some( ( type ) => isOfType( value, type ) );
}

/**
 * Given an attribute key, an attribute's schema, a block's raw content and the
 * commentAttributes returns the attribute value depending on its source
 * definition of the given attribute key.
 *
 * @param attributeKey      Attribute key.
 * @param attributeSchema   Attribute's schema.
 * @param innerDOM          Parsed DOM of block's inner HTML.
 * @param commentAttributes Block's comment attributes.
 * @param innerHTML         Raw HTML from block node's innerHTML property.
 *
 * @return Attribute value.
 */
export function getBlockAttribute(
	attributeKey: string,
	attributeSchema: BlockAttribute,
	innerDOM: Node,
	commentAttributes: Record< string, unknown >,
	innerHTML: string | Node
): unknown {
	let value;

	switch ( attributeSchema.source ) {
		// An undefined source means that it's an attribute serialized to the
		// block's "comment".
		case undefined:
			value = commentAttributes
				? commentAttributes[ attributeKey ]
				: undefined;
			break;
		// raw source means that it's the original raw block content.
		case 'raw':
			value = innerHTML;
			break;
		case 'attribute':
		case 'property':
		case 'html':
		case 'text':
		case 'rich-text':
		case 'children':
		case 'node':
		case 'query':
		case 'tag':
			value = parseWithAttributeSchema( innerDOM, attributeSchema );
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
		value = getDefault( attributeSchema );
	}

	return value;
}

/**
 * Returns true if value is valid per the given block attribute schema type
 * definition, or false otherwise.
 *
 * @see https://json-schema.org/latest/json-schema-validation.html#rfc.section.6.1.1
 *
 * @param value Value to test.
 * @param type  Block attribute schema type.
 *
 * @return Whether value is valid.
 */
export function isValidByType(
	value: unknown,
	type: string | string[] | undefined
): boolean {
	return (
		type === undefined ||
		isOfTypes( value, Array.isArray( type ) ? type : [ type ] )
	);
}

/**
 * Returns true if value is valid per the given block attribute schema enum
 * definition, or false otherwise.
 *
 * @see https://json-schema.org/latest/json-schema-validation.html#rfc.section.6.1.2
 *
 * @param value   Value to test.
 * @param enumSet Block attribute schema enum.
 *
 * @return Whether value is valid.
 */
export function isValidByEnum(
	value: unknown,
	enumSet: unknown[] | undefined
): boolean {
	return ! Array.isArray( enumSet ) || enumSet.includes( value );
}

// Returns an hpq matcher given a source object.
export const matcherFromSource = memoize(
	(
		sourceConfig: BlockAttribute
	): ( ( domNode: Element ) => unknown ) | undefined => {
		switch ( sourceConfig.source ) {
			case 'attribute': {
				let matcher = attr(
					sourceConfig.selector,
					sourceConfig.attribute
				);
				if ( sourceConfig.type === 'boolean' ) {
					matcher = toBooleanAttributeMatcher( matcher );
				}
				return matcher;
			}
			case 'html':
				return html( sourceConfig.selector, sourceConfig.multiline );
			case 'text':
				return text( sourceConfig.selector );
			case 'rich-text':
				return richText(
					sourceConfig.selector,
					sourceConfig.__unstablePreserveWhiteSpace
				);
			case 'children':
				return children( sourceConfig.selector );
			case 'node':
				return node( sourceConfig.selector );
			case 'query':
				const subMatchers = Object.fromEntries(
					Object.entries( sourceConfig.query! ).map(
						( [ key, subSourceConfig ] ) => [
							key,
							matcherFromSource( subSourceConfig ),
						]
					)
				);
				return query( sourceConfig.selector, subMatchers );
			case 'tag': {
				const matcher = prop( sourceConfig.selector, 'nodeName' );
				return ( domNode: Node ) =>
					( matcher( domNode ) as string )?.toLowerCase();
			}
			default:
				// eslint-disable-next-line no-console
				console.error(
					`Unknown source type "${ sourceConfig.source }"`
				);
				return undefined;
		}
	}
);

/**
 * Parse a HTML string into DOM tree.
 *
 * @param innerHTML HTML string or already parsed DOM node.
 *
 * @return Parsed DOM node.
 */
function parseHtml( innerHTML: string | Node ): Node {
	return hpqParse( innerHTML, ( h: Node ) => h );
}

/**
 * Given a block's raw content and an attribute's schema returns the attribute's
 * value depending on its source.
 *
 * @param innerHTML       Block's raw content.
 * @param attributeSchema Attribute's schema.
 *
 * @return Attribute value.
 */
export function parseWithAttributeSchema(
	innerHTML: string | Node,
	attributeSchema: BlockAttribute
): unknown {
	return matcherFromSource( attributeSchema )!(
		parseHtml( innerHTML ) as Element
	);
}

/**
 * Returns the block attributes of a registered block node given its type.
 *
 * @param blockTypeOrName Block type or name.
 * @param innerHTML       Raw block content.
 * @param attributes      Known block attributes (from delimiters).
 *
 * @return All block attributes.
 */
export function getBlockAttributes(
	blockTypeOrName: string | BlockType,
	innerHTML: string | Node,
	attributes: Record< string, unknown > = {}
): Record< string, unknown > {
	const doc = parseHtml( innerHTML );
	const blockType = normalizeBlockType( blockTypeOrName );

	const blockAttributes = Object.fromEntries(
		Object.entries( blockType?.attributes ?? {} ).map(
			( [ key, schema ] ) => [
				key,
				getBlockAttribute( key, schema, doc, attributes, innerHTML ),
			]
		)
	);

	return applyFilters(
		'blocks.getBlockAttributes',
		blockAttributes,
		blockType,
		innerHTML,
		attributes
	) as Record< string, unknown >;
}
