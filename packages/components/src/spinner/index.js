/**
 * External dependencies
 */
import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';

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

// The Circle can only have a centered stroke so a stacked box-shadow on the svg accomplishes a matching 1.5px border
export const StyledSpinner = styled.svg`
	width: ${ CONFIG.spinnerSize }px;
	height: ${ CONFIG.spinnerSize }px;
	box-shadow: inset 0 0 0 0.75px ${ COLORS.gray[ 300 ] },
		0 0 0 0.75px ${ COLORS.gray[ 300 ] };
	display: block;
	border-radius: 50%;
	margin: auto;
	position: relative;
	color: var( --wp-admin-theme-color );
	overflow: visible;
	animation: 1.4s linear infinite both ${ spinAnimation };
`;

export const SpinnerIndicator = styled.circle`
	fill: transparent;
	stroke: currentColor;
	stroke-linecap: round;
	stroke-width: 1.5px;
	transform-origin: 50% 50%;
	stroke-dasharray: ${ CONFIG.spinnerSize },
		calc( ${ CONFIG.spinnerSize } * 10 );
`;

export default function Spinner() {
	return (
		<StyledSpinner
			className="components-spinner"
			viewBox="0 0 100 100"
			xmlns="http://www.w3.org/2000/svg"
			role="img"
			aria-hidden="true"
			focusable="false"
		>
			<SpinnerIndicator
				cx="50%"
				cy="50%"
				r="50"
				vectorEffect="non-scaling-stroke"
			/>
		</StyledSpinner>
	);
}
