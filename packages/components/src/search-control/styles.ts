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

const horizontalPadding = ( {
	size,
}: Required< Pick< SearchControlProps, 'size' > > ) => {
	return space( size === 'compact' ? 1 : 2 );
};

export const SearchIconWrapper = styled.div`
	display: flex;
	padding: 0 ${ horizontalPadding };
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
