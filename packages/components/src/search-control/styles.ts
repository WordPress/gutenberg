/**
 * External dependencies
 */
import styled from '@emotion/styled';

/**
 * Internal dependencies
 */
import { space } from '../utils/space';
import InputControl from '../input-control';
import { COLORS } from '../utils';
import type { SearchControlProps } from './types';

const inlinePadding = ( {
	size,
}: Required< Pick< SearchControlProps, 'size' > > ) => {
	return space( size === 'compact' ? 1 : 2 );
};

export const SuffixItemWrapper = styled.div`
	display: flex;
	padding-inline-end: ${ inlinePadding };

	svg {
		fill: currentColor;
	}
`;

export const StyledInputControl = styled( InputControl )`
	input[type='search'] {
		&::-webkit-search-decoration,
		&::-webkit-search-cancel-button,
		&::-webkit-search-results-button,
		&::-webkit-search-results-decoration {
			-webkit-appearance: none;
		}
	}

	&:not( :focus-within ) {
		--wp-components-color-background: ${ COLORS.theme.gray[ 100 ] };
	}
`;
