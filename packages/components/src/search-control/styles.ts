/**
 * External dependencies
 */
import styled from '@emotion/styled';

/**
 * Internal dependencies
 */
import { space } from '../utils/space';
import type { SearchControlProps } from './types';

const horizontalPadding = ( {
	size,
}: Required< Pick< SearchControlProps, 'size' > > ) => {
	return space( size === 'compact' ? 1 : 2 );
};

export const SearchIconWrapper = styled.div`
	display: flex;
	padding: 0 ${ horizontalPadding };
`;
