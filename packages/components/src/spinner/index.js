/**
 * External dependencies
 */
import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';

/**
 * Internal dependencies
 */
import { COLORS, CONFIG } from '../utils';

/**
 * WordPress dependencies
 */
import { SVG, Circle } from '@wordpress/primitives';

const spinAnimation = keyframes`
	from {
		transform: rotate(0deg);
	}
	to {
		transform: rotate(360deg);
	}
`;

// A dedicated wrapper allows us to apply width and shadow color based on config values
// The SVG can only have a centered stroke so a stacked box-shadow accomplishes a matching 1.5px border
export const StyledSpinner = styled.span`
	width: ${ CONFIG.spinnerSize }px;
	height: ${ CONFIG.spinnerSize }px;
	box-shadow: inset 0 0 0 0.75px ${ COLORS.gray[ 300 ] },
		0 0 0 0.75px ${ COLORS.gray[ 300 ] };
	display: block;
	border-radius: 50%;
	margin: auto;
	position: relative;
	color: var(--wp-admin-theme-color);
	animation: 1.4s linear infinite both ${ spinAnimation };

	.components-spinner__track {
		position: absolute;
		top: 0;
		left: 0;
		overflow: visible;
	}

	.components-spinner__indicator {
		fill: transparent;
		stroke: currentColor;
		stroke-linecap: round;
		stroke-width: 1.5px;
		transform-origin: 50% 50%;
	}
`;

export default function Spinner() {
	const viewBox = `0 0 ${ CONFIG.spinnerSize } ${ CONFIG.spinnerSize }`;
	const radius = Number( CONFIG.spinnerSize ) / 2;
	const strokeDasharray = `${ CONFIG.spinnerSize }, calc(${ CONFIG.spinnerSize } * 10)`;

	return (
		<StyledSpinner className="components-spinner">
			<SVG
				viewBox={ viewBox }
				xmlns="http://www.w3.org/2000/svg"
				className="components-spinner__track"
				role="img"
				aria-hidden="true"
				focusable="false"
			>
				<Circle
					className="components-spinner__indicator"
					cx="50%"
					cy="50%"
					r={ radius }
					strokeDasharray={ strokeDasharray }
					vectorEffect="non-scaling-stroke"
				/>
			</SVG>
		</StyledSpinner>
	);
}
