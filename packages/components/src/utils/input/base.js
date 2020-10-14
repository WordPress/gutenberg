/**
 * External dependencies
 */
import { css } from '@emotion/core';

/**
 * Internal dependencies
 */
import { reduceMotion } from '../reduce-motion';
import { variable } from '../misc-variable';
import { color } from '../colors';

export const inputStyleNeutral = css`
	box-shadow: 0 0 0 transparent;
	transition: box-shadow 0.1s linear;
	border-radius: ${ variable( 'radiusBlockUi' ) };
	border: ${ variable( 'borderWidth' ) } solid ${ color( 'ui.border' ) };
	${ reduceMotion( 'transition' ) }
`;

export const inputStyleFocus = css`
	border-color: var( --wp-admin-theme-color );
	box-shadow: 0 0 0
		calc(
			${ variable( 'borderWidthFocus' ) } - ${ variable( 'borderWidth' ) }
		)
		var( --wp-admin-theme-color );

	// Windows High Contrast mode will show this outline, but not the box-shadow.
	outline: 2px solid transparent;
`;
