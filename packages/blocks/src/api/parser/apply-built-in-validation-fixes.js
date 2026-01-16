/**
 * Internal dependencies
 */
import { fixCustomClassname } from './fix-custom-classname';
import { fixGlobalAttribute } from './fix-global-attribute';

const ARIA_LABEL_ATTR_SCHEMA = {
	type: 'string',
	source: 'attribute',
	selector: '[data-aria-label] > *',
	attribute: 'aria-label',
};

const ANCHOR_ATTR_SCHEMA = {
	type: 'string',
	source: 'attribute',
	selector: '[data-anchor] > *',
	attribute: 'id',
};

/**
 * Attempts to fix block invalidation by applying build-in validation fixes
 * like moving all extra classNames to the className attribute.
 *
 * @param {WPBlock}                               block     block object.
 * @param {import('../registration').WPBlockType} blockType Block type. This is normalize not necessary and
 *                                                          can be inferred from the block name,
 *                                                          but it's here for performance reasons.
 *
 * @return {WPBlock} Fixed block object
 */
export function applyBuiltInValidationFixes( block, blockType ) {
	const { attributes, originalContent } = block;
	let updatedBlockAttributes = attributes;

	// Fix block invalidation for className attribute.
	updatedBlockAttributes = fixCustomClassname(
		attributes,
		blockType,
		originalContent
	);
	// Fix block invalidation for ariaLabel attribute.
	updatedBlockAttributes = fixGlobalAttribute(
		updatedBlockAttributes,
		blockType,
		originalContent,
		'ariaLabel',
		'data-aria-label',
		ARIA_LABEL_ATTR_SCHEMA
	);
	// Fix block invalidation for anchor attribute.
	updatedBlockAttributes = fixGlobalAttribute(
		updatedBlockAttributes,
		blockType,
		originalContent,
		'anchor',
		'data-anchor',
		ANCHOR_ATTR_SCHEMA
	);

	return {
		...block,
		attributes: updatedBlockAttributes,
	};
}
