/**
 * External dependencies
 */
import { css, keyframes } from '@emotion/core';

/**
 * Internal dependencies
 */
import { color, darken } from '../../utils';

export const primary = css`
	color: ${ color( 'white' ) };
	background-size: 100px 100%;
	// Disable reason: This function call looks nicer when each argument is on its own line.
	/* stylelint-disable */
	background-image: linear-gradient(
		-45deg,
		var( --wp-admin-theme-color ) 28%,
		var( --wp-admin-theme-color-darker-20 ) 28%,
		var( --wp-admin-theme-color-darker-20 ) 72%,
		var( --wp-admin-theme-color ) 72%
	);
	/* stylelint-enable */
	border-color: var( --wp-admin-theme-color );
`;

const busyAnimation = keyframes`
	0% {
		background-position: 200px 0;
	}
`;

export const generic = css`
	animation: ${ busyAnimation } 2500ms infinite linear;
	opacity: 1;
	background-size: 100px 100%;
	// Disable reason: This function call looks nicer when each argument is on its own line.
	/* stylelint-disable */
	background-image: linear-gradient(
		-45deg,
		${ darken( color( 'white' ), 2 ) } 28%,
		${ darken( color( 'white' ), 12 ) } 28%,
		${ darken( color( 'white' ), 12 ) } 72%,
		${ darken( color( 'white' ), 2 ) } 72%
	);
`;
