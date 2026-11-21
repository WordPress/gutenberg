import { getInlineStyles } from './style';
import type { StyleAttributes } from './types';

// This utility is intended to assist where the serialization of the transform
// block support is being skipped for a block but the transform related styles
// still need to be generated so they can be applied to inner elements.

/**
 * Provides the inline styles for a block's transform support attributes.
 *
 * @param attributes Block attributes.
 * @return Transform block support derived inline styles.
 */
export function getTransformClassesAndStyles( attributes: StyleAttributes ) {
	const transform = attributes.style?.transform || {};

	return {
		style: getInlineStyles( { transform } ),
	};
}
