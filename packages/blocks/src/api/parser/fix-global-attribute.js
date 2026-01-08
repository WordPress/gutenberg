/**
 * Internal dependencies
 */
import { hasBlockSupport } from '../registration';
import { parseWithAttributeSchema } from './get-block-attributes';

/**
 * Given an HTML string and an attribute schema, returns the specified attribute
 * value from the root element in the markup.
 *
 * @param {string} innerHTML       Markup string from which to extract the attribute.
 * @param {string} dataAttribute   The data attribute name to use as wrapper.
 * @param {Object} attributeSchema The attribute schema configuration.
 *
 * @return {string} The attribute value assigned to the root element.
 */
export function getHTMLRootElement(
	innerHTML,
	dataAttribute,
	attributeSchema
) {
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
 * @param {Object} blockAttributes Original block attributes.
 * @param {Object} blockType       Block type settings.
 * @param {string} innerHTML       Original block markup.
 * @param {string} supportKey      The block support key to check and attribute key to set.
 * @param {string} dataAttribute   The data attribute name to use as wrapper.
 * @param {Object} attributeSchema The attribute schema configuration.
 *
 * @return {Object} Filtered block attributes.
 */
export function fixGlobalAttribute(
	blockAttributes,
	blockType,
	innerHTML,
	supportKey,
	dataAttribute,
	attributeSchema
) {
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
