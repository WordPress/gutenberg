/**
 * WordPress dependencies
 */
import { Platform } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

//Separator margin related constants.
export const MIN_PX_MARGIN = 10;
export const MIN_EM_MARGIN = 0.5;
export const MIN_REM_MARGIN = 0.5;
export const MAX_PX_MARGIN = 300;
export const MAX_EM_MARGIN = 20;
export const MAX_REM_MARGIN = 20;

const isWeb = Platform.OS === 'web';
export const CSS_UNITS = [
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

export const getMarginConstraints = ( minimumScale = 1 ) => {
	return {
		px: {
			min: minimumScale * MIN_PX_MARGIN,
			max: MAX_PX_MARGIN,
			default: `${ minimumScale * MIN_PX_MARGIN }px`,
		},
		em: {
			min: minimumScale * MIN_EM_MARGIN,
			max: MAX_EM_MARGIN,
			default: '1em',
		},
		rem: {
			min: minimumScale * MIN_REM_MARGIN,
			max: MAX_REM_MARGIN,
			default: '1rem',
		},
	};
};

export const parseUnit = ( cssValue ) => {
	if ( ! cssValue ) {
		return 'px';
	}

	const matches = cssValue.trim().match( /[\d.\-+]*\s*([a-zA-Z]*)$/ );
	if ( ! matches ) {
		return 'px';
	}
	const [ , unit ] = matches;
	return ( unit || 'px' ).toLowerCase();
};
