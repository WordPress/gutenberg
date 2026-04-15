/**
 * Internal dependencies
 */
import { hasBlockSupport } from '../registration';
import { parseWithAttributeSchema } from './get-block-attributes';
import type { BlockAttribute, BlockType } from '../../types';

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
