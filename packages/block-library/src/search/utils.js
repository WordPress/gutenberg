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
