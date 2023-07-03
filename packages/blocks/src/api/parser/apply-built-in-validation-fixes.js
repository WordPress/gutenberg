/**
 * Internal dependencies
 */
import { fixCustomClassname } from './fix-custom-classname';

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
	const updatedBlockAttributes = fixCustomClassname(
		block.attributes,
		blockType,
		block.originalContent
	);
	return {
		...block,
		attributes: updatedBlockAttributes,
	};
}
