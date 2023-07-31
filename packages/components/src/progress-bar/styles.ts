/**
 * External dependencies
 */
import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';

/**
 * Internal dependencies
 */
import { COLORS, CONFIG } from '../utils';

const animateProgressBar = keyframes( {
	'0%': {
		left: '-50%',
	},
	'100%': {
		left: '100%',
	},
} );

export const Track = styled.div`
	position: relative;
	overflow: hidden;
	width: 100%;
	height: ${ CONFIG.borderWidthFocus };
	background-color: var(
		--wp-components-color-gray-100,
		${ COLORS.gray[ 100 ] }
	);
	border-radius: ${ CONFIG.radiusBlockUi };
`;

export const Indicator = styled.div`
	display: inline-block;
	position: absolute;
	top: 0;
	height: 100%;
	border-radius: ${ CONFIG.radiusBlockUi };
	background-color: ${ COLORS.ui.theme };

	.is-indeterminate & {
		animation-duration: 1.5s;
		animation-timing-function: ease-in-out;
		animation-iteration-count: infinite;
		animation-name: ${ animateProgressBar };

		@media ( prefers-reduced-motion ) {
			animation-duration: 0s;
		}
	}
`;

export const ProgressElement = styled.progress`
	position: absolute;
	top: 0;
	left: 0;
	opacity: 0;
	width: 100%;
	height: 100%;
`;
