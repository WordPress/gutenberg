/**
 * External dependencies
 */
import { clamp } from 'lodash';

/**
 * WordPress dependencies
 */
import { Platform } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

//Separator margin related constants.
export const MIN_PX_MARGIN = 15;
export const MIN_EM_MARGIN = 0.75;
export const MIN_REM_MARGIN = 0.75;
export const MAX_PX_MARGIN = 300;
export const MAX_EM_MARGIN = 20;
export const MAX_REM_MARGIN = 20;

const isWeb = Platform.OS === 'web';

/**
 * Available CSS units for specifying Separator margins.
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
		minHeight: `${ MIN_PX_MARGIN * 2 }px`,
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

/**
 * Calculates a height and corresponding CSS value.
 *
 * @param { Object } style Separator block's style prop.
 * @param { string } unit  Current CSS unit.
 */
export const getHeightFromStyle = ( style, unit ) => {
	const { top, bottom } = style?.spacing?.margin || {};
	const height = parseFloat( top || 0 ) + parseFloat( bottom || 0 );
	return {
		height,
		cssHeight: `${ height }${ unit }`,
	};
};

/**
 * Splits a new height value into appropriate top and bottom margin values
 * to store in the block's `style.spacing.margin` attribute.
 *
 * @param { number } newHeight New Separator height.
 * @param {*} currentTop       Current top margin.
 * @param {*} currentBottom    Current bottom margin.
 */
export const calculateMargins = ( newHeight, currentTop, currentBottom ) => {
	const { min, max } = MARGIN_CONSTRAINTS.px;

	// Split the new height between margins by default.
	let top = Math.floor( newHeight / 2 );
	let bottom = Math.ceil( newHeight / 2 );

	// Handle existing ratio between top and bottom margins if available.
	if ( currentTop && currentBottom ) {
		const marginTop = parseFloat( currentTop || 0 );
		const marginBottom = parseFloat( currentBottom || 0 );
		const totalMargin = marginTop + marginBottom;

		top = newHeight * ( marginTop / totalMargin );
		bottom = newHeight * ( marginBottom / totalMargin );
	}

	top = clamp( Math.round( top ), min, max );
	bottom = clamp( Math.round( bottom ), min, max );

	return {
		top: `${ top }px`,
		bottom: `${ bottom }px`,
	};
};
