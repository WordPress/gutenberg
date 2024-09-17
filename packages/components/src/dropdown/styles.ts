/**
 * External dependencies
 */
import { css } from '@emotion/react';
import styled from '@emotion/styled';

/**
 * Internal dependencies
 */
import { space } from '../utils/space';
import type { DropdownContentWrapperProps } from './types';

const padding = ( { paddingSize = 'small' }: DropdownContentWrapperProps ) => {
	if ( paddingSize === 'none' ) {
		return;
	}

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
	margin-left: ${ space( -2 ) };
	margin-right: ${ space( -2 ) };
	&:first-of-type {
		margin-top: ${ space( -2 ) };
	}
	&:last-of-type {
		margin-bottom: ${ space( -2 ) };
	}

	${ padding };
`;
