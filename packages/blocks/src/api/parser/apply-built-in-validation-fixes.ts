/**
 * Internal dependencies
 */
import { fixCustomClassname } from './fix-custom-classname';
import { fixGlobalAttribute } from './fix-global-attribute';
import type { Block, BlockAttribute, BlockType } from '../../types';

const ARIA_LABEL_ATTR_SCHEMA: BlockAttribute = {
	type: 'string',
	source: 'attribute',
	selector: '[data-aria-label] > *',
	attribute: 'aria-label',
};

const ANCHOR_ATTR_SCHEMA: BlockAttribute = {
	type: 'string',
	source: 'attribute',
	selector: '[data-anchor] > *',
	attribute: 'id',
};

/**
 * Attempts to fix block invalidation by applying build-in validation fixes
 * like moving all extra classNames to the className attribute.
 *
 * @param block      block object.
 * @param blockType  Block type. This is normalize not necessary and
 *                   can be inferred from the block name,
 *                   but it's here for performance reasons.
 * @param parsedBody Pre-parsed body element of `block.originalContent`, if
 *                   available. When provided, the fixes read attributes
 *                   directly off the body's first element child instead of
 *                   re-parsing originalContent for each fix.
 *
 * @return Fixed block object
 */
export function applyBuiltInValidationFixes(
	block: Block,
	blockType: BlockType,
	parsedBody?: Element | null
): Block {
	const { attributes, originalContent } = block;
	let updatedBlockAttributes = attributes;

	// Extract the root element once: every fix below reads attributes off the
	// block's outermost element. `undefined` here means "no pre-parsed body
	// supplied" — the fixes will fall back to parsing originalContent
	// themselves. `null` means "we have a parsed body but it has no element
	// child" (e.g. text-only innerHTML).
	const rootElement =
		parsedBody !== undefined
			? parsedBody?.firstElementChild ?? null
			: undefined;

	// Fix block invalidation for className attribute.
	updatedBlockAttributes = fixCustomClassname(
		attributes,
		blockType,
		originalContent ?? '',
		rootElement
	);
	// Fix block invalidation for ariaLabel attribute.
	updatedBlockAttributes = fixGlobalAttribute(
		updatedBlockAttributes,
		blockType,
		originalContent ?? '',
		'ariaLabel',
		'data-aria-label',
		ARIA_LABEL_ATTR_SCHEMA,
		rootElement
	);
	// Fix block invalidation for anchor attribute.
	updatedBlockAttributes = fixGlobalAttribute(
		updatedBlockAttributes,
		blockType,
		originalContent ?? '',
		'anchor',
		'data-anchor',
		ANCHOR_ATTR_SCHEMA,
		rootElement
	);

	return {
		...block,
		attributes: updatedBlockAttributes,
	};
}
