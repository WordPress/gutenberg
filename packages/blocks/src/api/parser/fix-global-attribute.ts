import { hasBlockSupport } from '../registration';
import { parseWithAttributeSchema } from './get-block-attributes';
import { GLOBAL_HTML_ATTRIBUTES } from '../constants';
import type { BlockAttribute, BlockType } from '../../types';

const GLOBAL_ATTRIBUTES_DATA_ATTRIBUTE = 'data-global-attributes';

/**
 * Reads every attribute in `GLOBAL_HTML_ATTRIBUTES` off the root element in a
 * single parse, rather than one parse per attribute.
 */
const GLOBAL_ATTRIBUTES_SCHEMA: BlockAttribute = {
	type: 'array',
	source: 'query',
	selector: `[${ GLOBAL_ATTRIBUTES_DATA_ATTRIBUTE }] > *`,
	query: Object.fromEntries(
		GLOBAL_HTML_ATTRIBUTES.map( ( attribute ) => [
			attribute,
			{ type: 'string', source: 'attribute', attribute },
		] )
	),
};

/**
 * Given an HTML string and an attribute schema, returns the specified attribute
 * value from the root element in the markup.
 *
 * @param innerHTML       Markup string from which to extract the attribute.
 * @param dataAttribute   The data attribute name to use as wrapper.
 * @param attributeSchema The attribute schema configuration.
 *
 * @return The attribute value assigned to the root element.
 */
export function getHTMLRootElement(
	innerHTML: string,
	dataAttribute: string,
	attributeSchema: BlockAttribute
): unknown {
	const parsed = parseWithAttributeSchema(
		`<div ${ dataAttribute }>${ innerHTML }</div>`,
		attributeSchema
	);
	return parsed;
}

/**
 * Given a parsed set of block attributes, if the block supports the specified attribute
 * and the attribute is found in the HTML, the attribute is assigned to the block attributes.
 *
 * @param blockAttributes Original block attributes.
 * @param blockType       Block type settings.
 * @param innerHTML       Original block markup.
 * @param supportKey      The block support key to check and attribute key to set.
 * @param dataAttribute   The data attribute name to use as wrapper.
 * @param attributeSchema The attribute schema configuration.
 *
 * @return Filtered block attributes.
 */
export function fixGlobalAttribute(
	blockAttributes: Record< string, unknown >,
	blockType: BlockType,
	innerHTML: string,
	supportKey: string,
	dataAttribute: string,
	attributeSchema: BlockAttribute
): Record< string, unknown > {
	if ( ! hasBlockSupport( blockType, supportKey, false ) ) {
		return blockAttributes;
	}
	const modifiedBlockAttributes = { ...blockAttributes };
	const attributeValue = getHTMLRootElement(
		innerHTML,
		dataAttribute,
		attributeSchema
	);
	if ( attributeValue ) {
		modifiedBlockAttributes[ supportKey ] = attributeValue;
	}
	return modifiedBlockAttributes;
}

/**
 * Given a parsed set of block attributes, restores the global HTML attributes
 * authored on the block's root element that the block's own attribute sources
 * did not capture, so that hand-edited markup does not invalidate the block.
 *
 * Attributes already present in `globalAttributes` are left alone, so an
 * explicit value in the block's comment delimiter always wins over the markup.
 *
 * @param blockAttributes Original block attributes.
 * @param blockType       Block type settings.
 * @param innerHTML       Original block markup.
 *
 * @return Filtered block attributes.
 */
export function fixGlobalAttributes(
	blockAttributes: Record< string, unknown >,
	blockType: BlockType,
	innerHTML: string
): Record< string, unknown > {
	if ( ! hasBlockSupport( blockType, 'globalAttributes', true ) ) {
		return blockAttributes;
	}

	const parsed = getHTMLRootElement(
		innerHTML,
		GLOBAL_ATTRIBUTES_DATA_ATTRIBUTE,
		GLOBAL_ATTRIBUTES_SCHEMA
	) as Array< Record< string, string | undefined > > | undefined;
	const rootAttributes = parsed?.[ 0 ];

	if ( ! rootAttributes ) {
		return blockAttributes;
	}

	const globalAttributes: Record< string, string > = {
		...( blockAttributes.globalAttributes as
			| Record< string, string >
			| undefined ),
	};
	let hasRestoredAttribute = false;

	for ( const attribute of GLOBAL_HTML_ATTRIBUTES ) {
		const value = rootAttributes[ attribute ];
		if (
			value === undefined ||
			globalAttributes.hasOwnProperty( attribute )
		) {
			continue;
		}
		globalAttributes[ attribute ] = value;
		hasRestoredAttribute = true;
	}

	if ( ! hasRestoredAttribute ) {
		return blockAttributes;
	}

	return { ...blockAttributes, globalAttributes };
}
