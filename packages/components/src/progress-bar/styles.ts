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
	height: ${ CONFIG.borderWidthFocus };
	/* Text color at 10% opacity */
	background-color: color-mix(
		in srgb,
		${ COLORS.theme.foreground },
		transparent 90%
	);
	border-radius: ${ CONFIG.radiusBlockUi };

	// Windows high contrast mode.
	outline: 2px solid transparent;
	outline-offset: 2px;

	:where( & ) {
		width: 160px;
	}
`;

export const Indicator = styled.div< {
	isIndeterminate: boolean;
} >`
	display: inline-block;
	position: absolute;
	top: 0;
	height: 100%;
	border-radius: ${ CONFIG.radiusBlockUi };
	/* Text color at 90% opacity */
	background-color: color-mix(
		in srgb,
		${ COLORS.theme.foreground },
		transparent 10%
	);

	// Windows high contrast mode.
	outline: 2px solid transparent;
	outline-offset: -2px;

	${ ( { isIndeterminate } ) =>
		isIndeterminate
			? css( {
					animationDuration: '1.5s',
					animationTimingFunction: 'ease-in-out',
					animationIterationCount: 'infinite',
					animationName: animateProgressBar,
					width: `${ INDETERMINATE_TRACK_WIDTH }%`,
			  } )
			: css( {
					width: 'var(--indicator-width)',
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
