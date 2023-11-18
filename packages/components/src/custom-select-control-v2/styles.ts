/**
 * External dependencies
 */
import styled from '@emotion/styled';
import { css } from '@emotion/react';
// eslint-disable-next-line no-restricted-imports
import * as Ariakit from '@ariakit/react';

/**
 * Internal dependencies
 */
import { COLORS } from '../utils';
import { space } from '../utils/space';
import type { CustomSelectProps } from './types';

export const customSelectHeight = (
	renderSelectedValue: CustomSelectProps[ 'renderSelectedValue' ],
	size: NonNullable< CustomSelectProps[ 'size' ] >
) => {
	const defaultSizes = {
		default: {
			height: '40px',
		},
		small: {
			height: '24px',
			fontSize: '11px',
			padding: `${ space( 2 ) }`,
		},
	};

	const customHeight = {
		default: {
			height: 'auto',
			minHeight: '40px',
		},
		small: {
			height: 'auto',
			minHeight: '24px',
		},
	};

	if ( ! renderSelectedValue ) {
		return defaultSizes[ size ];
	}

	return css( customHeight[ size ] );
};

export const customSelectSizes = ( {
	renderSelectedValue,
	size,
}: Pick< CustomSelectProps, 'renderSelectedValue' > & {
	size: NonNullable< CustomSelectProps[ 'size' ] >;
} ) => css`
	${ customSelectHeight( renderSelectedValue, size ) }
`;

export const CustomSelectLabel = styled( Ariakit.SelectLabel )`
	font-size: 11px;
	font-weight: 500;
	line-height: 1.4;
	text-transform: uppercase;
	margin-bottom: ${ space( 2 ) };
`;

export const CustomSelectButton = styled( Ariakit.Select )`
	display: flex;
	justify-content: space-between;
	align-items: center;
	background: ${ COLORS.white };
	border: 1px solid ${ COLORS.gray[ 600 ] };
	border-radius: ${ space( 0.5 ) };
	cursor: pointer;
	padding: ${ space( 4 ) };
	width: 100%;
	&[data-focus-visible] {
		outline-style: solid;
	}
	&[aria-expanded='true'] {
		border: 1.5px solid ${ COLORS.theme.accent };
	}
`;

export const CustomSelectPopover = styled( Ariakit.SelectPopover )`
	border-radius: ${ space( 0.5 ) };
	background: ${ COLORS.white };
	border: 1px solid ${ COLORS.gray[ 900 ] };
`;
export const CustomSelectItem = styled( Ariakit.SelectItem )`
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: ${ space( 2 ) };
	&:hover {
		background-color: ${ COLORS.gray[ 300 ] };
	}
`;
