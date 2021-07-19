/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Platform } from '@wordpress/element';
const isWeb = Platform.OS === 'web';

export const DEFAULT_MEDIA_SIZE_SLUG = 'full';
export const CSS_UNITS = [
	{
		value: 'px',
		label: isWeb ? 'px' : __( 'Pixels (px)' ),
		default: 430,
	},
	{
		value: 'em',
		label: isWeb ? 'em' : __( 'Relative to parent font size (em)' ),
		default: 20,
	},
	{
		value: 'rem',
		label: isWeb ? 'rem' : __( 'Relative to root font size (rem)' ),
		default: 20,
	},
	{
		value: 'vw',
		label: isWeb ? 'vw' : __( 'Viewport width (vw)' ),
		default: 20,
	},
	{
		value: 'vh',
		label: isWeb ? 'vh' : __( 'Viewport height (vh)' ),
		default: 50,
	},
];
