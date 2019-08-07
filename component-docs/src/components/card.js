/**
 * External dependencies
 */
import styled from '@emotion/styled';

const Card = styled( 'div' )`
	margin: 2em 0 3em;
	border: 1px solid #ddd;
	border-radius: 4px;

	& > * {
		&:first-of-type {
			border-top-left-radius: 4px;
			border-top-right-radius: 4px;
		}
		&:last-of-type {
			border-bottom-left-radius: 4px;
			border-bottom-right-radius: 4px;
		}
	}
`;

export default Card;
