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
	border-radius: 50%;
	box-shadow: inset 0 0 0 1.5px ${ COLORS.gray[ 400 ] };
	margin: auto;
	position: relative;
`;

export default function Spinner() {
	return <StyledSpinner className="components-spinner" />;
}
