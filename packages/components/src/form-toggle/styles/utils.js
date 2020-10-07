/**
 * External dependencies
 */
import { css } from '@emotion/core';

/**
 * Internal dependencies
 */
import { getRTL } from '../../utils';

export const toggleWidth = 36;
export const toggleHeight = 18;
export const toggleBorderWidth = 1;

export const appearTransform = () => {
	const value =
		toggleWidth -
		toggleBorderWidth * 4 -
		( toggleHeight - toggleBorderWidth * 4 );

	if ( getRTL() ) {
		return css`
			transform: translateX( -${ value }px );
		`;
	}

	return css`
		transform: translateX( ${ value }px );
	`;
};
