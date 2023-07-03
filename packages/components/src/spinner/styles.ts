/**
 * External dependencies
 */
import styled from '@emotion/styled';
import { css, keyframes } from '@emotion/react';

/**
 * Internal dependencies
 */
import { COLORS, CONFIG } from '../utils';

const spinAnimation = keyframes`
	from {
		transform: rotate(0deg);
	}
	to {
		transform: rotate(360deg);
	}
 `;

export const StyledSpinner = styled.svg`
	width: ${ CONFIG.spinnerSize }px;
	height: ${ CONFIG.spinnerSize }px;
	display: inline-block;
	margin: 5px 11px 0;
	position: relative;
	color: ${ COLORS.ui.theme };
	overflow: visible;
	opacity: 1;
	background-color: transparent;
`;

const commonPathProps = css`
	fill: transparent;
	stroke-width: 1.5px;
`;

export const SpinnerTrack = styled.circle`
	${ commonPathProps };
	stroke: ${ COLORS.gray[ 300 ] };
`;

export const SpinnerIndicator = styled.path`
	${ commonPathProps };
	stroke: currentColor;
	stroke-linecap: round;
	transform-origin: 50% 50%;
	animation: 1.4s linear infinite both ${ spinAnimation };
`;
