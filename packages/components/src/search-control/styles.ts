/**
 * External dependencies
 */
import styled from '@emotion/styled';

/**
 * Internal dependencies
 */
import { space } from '../utils/space';
import type { SearchControlProps } from './types';
import InputControl from '../input-control';

const inlinePadding = ( {
	size,
}: Required< Pick< SearchControlProps, 'size' > > ) => {
	return space( size === 'compact' ? 1 : 2 );
};

export const SearchIconWrapper = styled.div`
	display: flex;
	padding-inline-start: ${ inlinePadding };
`;

export const CloseIconWrapper = styled.div`
	display: flex;
	padding-inline-end: ${ inlinePadding };
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
