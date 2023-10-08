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

export const DropdownPointerEventsCapture = styled.div`
	// TODO: understand if there's a better way to cover the whole viewport
	position: fixed;
	top: 0;
	left: 0;
	width: 300vw;
	height: 300vh;
	transform: translate( -50%, -50% );
	// TODO: remove following background color
	background-color: rgba( 255, 0, 0, 0.3 );
	// TODO: justify this number
	z-index: 1000000;
`;
