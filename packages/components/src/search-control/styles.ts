/**
 * External dependencies
 */
import styled from '@emotion/styled';

/**
 * Internal dependencies
 */
import InputControl from '../input-control';

export const StyledInputControl = styled( InputControl )`
	input[type='search'] {
		&::-webkit-search-decoration,
		&::-webkit-search-cancel-button,
		&::-webkit-search-results-button,
		&::-webkit-search-results-decoration {
			-webkit-appearance: none;
		}
	}
`;
