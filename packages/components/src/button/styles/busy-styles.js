/**
 * External dependencies
 */
import { css, keyframes } from '@emotion/core';

/**
 * Internal dependencies
 */
import { color, darken } from '../../utils';

const busyAnimation = keyframes`
	0% {
		background-position: 200px 0;
	}
`;

const busy = css`
	animation: ${ busyAnimation } 2500ms infinite linear;
	opacity: 1;
	background-size: 100px 100%;
	background-image: linear-gradient(
		-45deg,
		${ darken( color( 'white' ), 2 ) } 28%,
		${ darken( color( 'white' ), 12 ) } 28%,
		${ darken( color( 'white' ), 12 ) } 72%,
		${ darken( color( 'white' ), 2 ) } 72%
	);
`;

export const appearBusy = ( props ) => ( props.isBusy ? busy : '' );
