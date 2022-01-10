/**
 * WordPress dependencies
 */
import { SVG, Circle } from '@wordpress/primitives';

/**
 * External dependencies
 */
import styled from '@emotion/styled';

/**
 * Internal dependencies
 */
import { COLORS, CONFIG } from '../utils';

export const StyledSpinner = styled.span`
	width: ${ CONFIG.spinnerSize };
	height: ${ CONFIG.spinnerSize };
	display: block;
	margin-left: auto;
	margin-right: auto;
	position: relative;
	color: var( --wp-admin-theme-color );
	box-shadow: inset 0 0 0 1.5px ${ COLORS.gray[ 400 ] };
	border-radius: 50%;
`;

export default function Spinner() {
	return (
		<StyledSpinner className="components-spinner">
			<SVG
				className="components-spinner--svg"
				viewBox="0 0 18 18"
				xmlns="http://www.w3.org/2000/svg"
			>
				<Circle
					className="components-spinner--circle"
					cx="50%"
					cy="50%"
					r="8.25"
					vectorEffect="non-scaling-stroke"
				/>
			</SVG>
		</StyledSpinner>
	);
}
