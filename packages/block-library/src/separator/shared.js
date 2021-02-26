/**
 * WordPress dependencies
 */
import { Platform } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

// Separator margin related constants.
export const MIN_PX_MARGIN = 15;
export const MIN_EM_MARGIN = 0.75;
export const MIN_REM_MARGIN = 0.7;
export const MAX_PX_MARGIN = 300;
export const MAX_EM_MARGIN = 20;
export const MAX_REM_MARGIN = 20;

const isWeb = Platform.OS === 'web';

/**
 * Available CSS units for specifying separator block margins.
 */
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

/**
 * Separator margin constraints for available CSS units.
 */
export const MARGIN_CONSTRAINTS = {
	px: {
		min: MIN_PX_MARGIN,
		max: MAX_PX_MARGIN,
		default: `${ MIN_PX_MARGIN }px`,
	},
	em: {
		min: MIN_EM_MARGIN,
		max: MAX_EM_MARGIN,
		default: '1em',
	},
	rem: {
		min: MIN_REM_MARGIN,
		max: MAX_REM_MARGIN,
		default: '1rem',
	},
};

/**
 * Extracts CSS unit from string.
 *
 * @param { string } cssValue CSS string containing unit and value.
 * @return { string }         CSS unit. Defaults to 'px'.
 */
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
