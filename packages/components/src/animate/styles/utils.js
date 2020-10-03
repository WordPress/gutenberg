/**
 * External dependencies
 */
import { css } from '@emotion/core';

/**
 * Internal dependencies
 */
import { getRTL } from '../../utils';

const RTL_TRANSLATE_X = {
	'-100%': '+100%',
	'+100%': '-100%',
};

export const appearTransform = ( { origin } ) => {
	const isRTL = getRTL();

	let translateX = origin === 'right' ? '+100%' : '-100%';
	if ( isRTL ) {
		translateX = RTL_TRANSLATE_X[ translateX ];
	}

	return css`
		transform: translateX( ${ translateX } );
	`;
};

const RTL_DIRECTION = {
	left: 'right',
	right: 'left',
};

export const appearTransformOrigin = ( { yAxis, xAxis } ) => {
	const isRTL = getRTL();

	if ( isRTL ) {
		// Use opposite values when one exists, otherwise default to the value itself (as in the case of `center`).
		xAxis = RTL_DIRECTION[ xAxis ] || xAxis;
	}

	return css`
		transform-origin: ${ yAxis } ${ xAxis };
	`;
};
