/**
 * Internal dependencies
 */
import { hasBlockSupport } from '../registration';
import { parseWithAttributeSchema } from './get-block-attributes';

const ARIA_LABEL_ATTR_SCHEMA = {
	type: 'string',
	source: 'attribute',
	selector: '[data-aria-label] > *',
	attribute: 'aria-label',
};

/**
 * Given an HTML string, returns the aria-label attribute assigned to
 * the root element in the markup.
 *
 * @param {string} innerHTML Markup string from which to extract the aria-label.
 *
 * @return {string} The aria-label assigned to the root element.
 */
export function getHTMLRootElementAriaLabel( innerHTML ) {
	const parsed = parseWithAttributeSchema(
		`<div data-aria-label>${ innerHTML }</div>`,
		ARIA_LABEL_ATTR_SCHEMA
	);
	return parsed;
}

/**
 * Given a parsed set of block attributes, if the block supports ariaLabel
 * and an aria-label attribute is found, the aria-label attribute is assigned
 * to the block attributes.
 *
 * @param {Object} blockAttributes Original block attributes.
 * @param {Object} blockType       Block type settings.
 * @param {string} innerHTML       Original block markup.
 *
 * @return {Object} Filtered block attributes.
 */
export function fixAriaLabel( blockAttributes, blockType, innerHTML ) {
	if ( ! hasBlockSupport( blockType, 'ariaLabel', false ) ) {
		return blockAttributes;
	}
	const modifiedBlockAttributes = { ...blockAttributes };
	const ariaLabel = getHTMLRootElementAriaLabel( innerHTML );
	if ( ariaLabel ) {
		modifiedBlockAttributes.ariaLabel = ariaLabel;
	}
	return modifiedBlockAttributes;
}
