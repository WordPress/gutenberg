/**
 * External dependencies
 */
import styled from '@emotion/styled';

/**
 * Internal dependencies
 */
import { space } from '../utils/space';
import InputControl from '../input-control';

const INLINE_PADDING_SPACE = 1;

export const SearchIconWrapper = styled.div`
	display: flex;
	margin-inline-end: ${ space( INLINE_PADDING_SPACE * -1 ) };
	padding-inline-start: ${ space( INLINE_PADDING_SPACE ) };
`;

export const CloseIconWrapper = styled.div`
	display: flex;
	margin-inline-start: ${ space( INLINE_PADDING_SPACE * -1 ) };
	padding-inline-end: ${ space( INLINE_PADDING_SPACE ) };
`;

export const InputControlWithoutWebkitStyles = styled( InputControl )`
	input[type='search'] {
		&::-webkit-search-decoration,
		&::-webkit-search-cancel-button,
		&::-webkit-search-results-button,
		&::-webkit-search-results-decoration {
			-webkit-appearance: none;
		}
	}
`;
