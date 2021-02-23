/**
 * External dependencies
 */

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Platform } from '@wordpress/element';

/**
 * Constants
 */
const isWeb = Platform.OS === 'web';

export const PC_WIDTH_DEFAULT = 50;
export const PX_WIDTH_DEFAULT = 350;
export const MIN_WIDTH = 220;
export const MIN_WIDTH_UNIT = 'px';

export const CSS_UNITS = [
	{
		value: '%',
		label: isWeb ? '%' : __( 'Percentage (%)' ),
		default: PC_WIDTH_DEFAULT,
	},
	{
		value: 'px',
		label: isWeb ? 'px' : __( 'Pixels (px)' ),
		default: PX_WIDTH_DEFAULT,
	},
];

/**
 * Returns a boolean whether passed unit is percentage
 *
 * @param {string} unit Block width unit.
 *
 * @return {boolean} 	Whether unit is '%'.
 */
export function isPercentageUnit( unit ) {
	return unit === '%';
}
