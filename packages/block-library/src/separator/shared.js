/**
 * WordPress dependencies
 */
import { Platform } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

//Separator height related constants.
export const MIN_PX_HEIGHT = 30;
export const MIN_EM_HEIGHT = 1.5;
export const MIN_REM_HEIGHT = 1.5;
export const MAX_PX_HEIGHT = 500;
export const MAX_EM_HEIGHT = 30;
export const MAX_REM_HEIGHT = 30;

const isWeb = Platform.OS === 'web';

/**
 * Available CSS units for specifying Separator height.
 */
export const HEIGHT_CSS_UNITS = [
	{ value: 'px', label: isWeb ? 'px' : __( 'Pixels (px)' ), default: 0 },
	{
		value: 'em',
		label: isWeb ? 'em' : __( 'Relative to parent font size (em)' ),
		default: 0,
	},
	{
		value: 'rem',
		label: isWeb ? 'rem' : __( 'Relative to root font size (rem)' ),
		default: 0,
	},
];

/**
 * Separator height constraints for available CSS units.
 */
export const HEIGHT_CONSTRAINTS = {
	px: {
		min: MIN_PX_HEIGHT,
		max: MAX_PX_HEIGHT,
		default: MIN_PX_HEIGHT,
	},
	em: {
		min: MIN_EM_HEIGHT,
		max: MAX_EM_HEIGHT,
		default: 1.5,
	},
	rem: {
		min: MIN_REM_HEIGHT,
		max: MAX_REM_HEIGHT,
		default: 1.5,
	},
};
