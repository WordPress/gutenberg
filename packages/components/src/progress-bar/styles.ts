/**
 * External dependencies
 */
import styled from '@emotion/styled';
import { css, keyframes } from '@emotion/react';

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

// Width of the indicator for the indeterminate progress bar
export const INDETERMINATE_TRACK_WIDTH = 50;

export const Track = styled.div`
	position: relative;
	overflow: hidden;
	width: 100%;
	max-width: 160px;
	height: ${ CONFIG.borderWidthFocus };
	background-color: var(
		--wp-components-color-gray-300,
		${ COLORS.gray[ 300 ] }
	);
	border-radius: ${ CONFIG.radiusBlockUi };
`;

export const Indicator = styled.div< {
	isIndeterminate: boolean;
	value?: number;
} >`
	display: inline-block;
	position: absolute;
	top: 0;
	height: 100%;
	border-radius: ${ CONFIG.radiusBlockUi };
	background-color: ${ COLORS.theme.accent };

	${ ( { isIndeterminate, value } ) =>
		isIndeterminate
			? css( {
					animationDuration: '1.5s',
					animationTimingFunction: 'ease-in-out',
					animationIterationCount: 'infinite',
					animationName: animateProgressBar,
					width: `${ INDETERMINATE_TRACK_WIDTH }%`,
			  } )
			: css( {
					width: `${ value }%`,
					transition: 'width 0.4s ease-in-out',
			  } ) };
`;

export const ProgressElement = styled.progress`
	position: absolute;
	top: 0;
	left: 0;
	opacity: 0;
	width: 100%;
	height: 100%;
`;
