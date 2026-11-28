import { privateApis as globalStylesEnginePrivateApis } from '@wordpress/global-styles-engine';
import { getInlineStyles } from './style';
import type { StyleAttributes } from './types';
import { unlock } from '../lock-unlock';

const { isZeroRotation } = unlock( globalStylesEnginePrivateApis );

// This utility is intended to assist where the serialization of the transform
// block support is being skipped for a block but the transform related styles
// still need to be generated so they can be applied to inner elements.

/**
 * Provides the class name and inline styles for a block's transform support
 * attributes.
 *
 * @param attributes Block attributes.
 * @return Transform block support derived class name and inline styles.
 */
export function getTransformClassesAndStyles( attributes: StyleAttributes ) {
	const transform = attributes.style?.transform || {};
	const style = getInlineStyles( { transform } );

	return {
		// Lets the shared stylesheet fit a rotated block to its content.
		className:
			style.rotate && ! isZeroRotation( style.rotate )
				? 'has-rotation'
				: undefined,
		style,
	};
}
