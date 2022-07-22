/**
 * External dependencies
 */
import { css } from '@emotion/react';
import styled from '@emotion/styled';

/**
 * Internal dependencies
 */
import { space } from '../ui/utils/space';
import type { DropdownContentWrapperProps } from './types';

const padding = ( { paddingSize = 'small' }: DropdownContentWrapperProps ) => {
	if ( paddingSize === 'none' ) return;

	const paddingValues = {
		small: space( 2 ),
		medium: space( 4 ),
	};

	return css`
		padding: ${ paddingValues[ paddingSize ] || paddingValues.small };
	`;
};

export const DropdownContentWrapperDiv = styled.div< DropdownContentWrapperProps >`
	// Negative margin to reset (offset) the default padding on .components-popover__content
	margin: ${ space( -2 ) };

	${ padding };
`;
