/**
 * External dependencies
 */
import styled from '@emotion/styled';

/**
 * Internal dependencies
 */
import { COLORS, CONFIG } from '../utils';

/**
 * WordPress dependencies
 */
import { SVG, Circle } from '@wordpress/primitives';

export const StyledSpinner = styled.span`
	width: ${ CONFIG.spinnerSize }px;
	height: ${ CONFIG.spinnerSize }px;
	box-shadow: inset 0 0 0 0.75px ${ COLORS.gray[ 400 ] },
		0 0 0 0.75px ${ COLORS.gray[ 400 ] };
`;

export default function Spinner() {
	const viewBox = `0 0 ${ CONFIG.spinnerSize } ${ CONFIG.spinnerSize }`;
	const radius = Number( CONFIG.spinnerSize ) / 2;
	const strokeDasharray = [
		Number( CONFIG.spinnerSize ),
		Number( CONFIG.spinnerSize ) * 10,
	];

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
					stroke-dasharray={ strokeDasharray }
					vector-effect="non-scaling-stroke"
				/>
			</SVG>
		</StyledSpinner>
	);
}
