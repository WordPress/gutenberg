import { useMemo } from '@wordpress/element';
import { getRotatedOverlayStyle } from './rotation';

/**
 * Gets the style that keeps a block overlay, such as the resize handles,
 * aligned with a rotated grid item.
 *
 * @param {HTMLElement|null} blockElement The grid item element.
 * @param {number}           angle        Rotation in degrees.
 * @param {Object}           baseStyle    Other style properties for the overlay.
 *
 * @return {Object|undefined} Style properties for the overlay.
 */
export function useRotatedOverlayStyle( blockElement, angle, baseStyle ) {
	const width = blockElement?.offsetWidth ?? 0;
	const height = blockElement?.offsetHeight ?? 0;
	return useMemo( () => {
		const rotatedStyle = getRotatedOverlayStyle( {
			width,
			height,
			angle,
		} );
		if ( ! rotatedStyle ) {
			return baseStyle;
		}
		return { ...baseStyle, ...rotatedStyle };
	}, [ width, height, angle, baseStyle ] );
}
