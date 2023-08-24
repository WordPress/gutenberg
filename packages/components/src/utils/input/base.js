/**
 * External dependencies
 */
import { css } from '@emotion/react';

/**
 * Internal dependencies
 */
import { reduceMotion } from '../reduce-motion';
import { COLORS } from '../colors-values';
import { CONFIG } from '../';

export const inputStyleNeutral = css`
	box-shadow: 0 0 0 transparent;
	transition: box-shadow 0.1s linear;
	border-radius: ${ CONFIG.radiusBlockUi };
	border: ${
		CONFIG.borderWidth
	} solid var( --wp-components-color-gray-component-border ) };
	${ reduceMotion( 'transition' ) }
`;

export const inputStyleFocus = css`
	border-color: var( --wp-components-color-accent-solid );
	box-shadow: 0 0 0
		calc( ${ CONFIG.borderWidthFocus } - ${ CONFIG.borderWidth } )
		var( --wp-components-color-accent-solid );

	// Windows High Contrast mode will show this outline, but not the box-shadow.
	outline: 2px solid transparent;
`;
