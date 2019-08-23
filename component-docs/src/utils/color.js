/**
 * External dependencies
 */
import PALETTE from '@automattic/color-studio';

/**
 * Retrieves a color value from the A8C color palette
 * Data file:
 * https://github.com/Automattic/color-studio/blob/master/dist/colors.json
 *
 * @param {string} colorValue The desired color value from the palette
 * @return {string} The hex color value
 */
export function getColor( colorValue ) {
	return PALETTE.colors[ colorValue ];
}
