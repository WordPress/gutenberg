/**
 * External dependencies
 */
import styled from 'styled-components';

/**
 * Internal dependencies
 */
import { getColor } from '../utils/color';

const Label = styled.div`
	color: ${ getColor( 'Gray 40' ) };
	font-size: 0.8rem;
	margin-bottom: 5px;

	&:last-child {
		margin-bottom: 0;
	}
`;

export default Label;
