/**
 * WordPress dependencies
 */
import { Platform } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

//Separator height related constants.
export const MIN_PX_HEIGHT = 20;
export const MIN_EM_HEIGHT = 1;
export const MIN_REM_HEIGHT = 1;
export const MAX_PX_HEIGHT = 500;
export const MAX_EM_HEIGHT = 30;
export const MAX_REM_HEIGHT = 30;

const isWeb = Platform.OS === 'web';
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

export const getHeightConstraints = ( minimumScale = 1 ) => {
	return {
		px: {
			min: minimumScale * MIN_PX_HEIGHT,
			max: MAX_PX_HEIGHT,
			default: minimumScale * MIN_PX_HEIGHT,
		},
		em: {
			min: minimumScale * MIN_EM_HEIGHT,
			max: MAX_EM_HEIGHT,
			default: 1,
		},
		rem: {
			min: minimumScale * MIN_REM_HEIGHT,
			max: MAX_REM_HEIGHT,
			default: 1,
		},
	};
};
