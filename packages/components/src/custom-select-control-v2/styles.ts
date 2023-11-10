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
	padding: ${ space( 2 ) };
	width: 100%;
	&[data-focus-visible] {
		outline-style: solid;
	}
	&[aria-expanded='true'] {
		border: 1.5px solid ${ COLORS.theme.accent };
	}
`;

export const inputSize = {
	default: css`
		height: 40px;
	`,
	large: css`
		height: auto;
	`,
};

export const CustomSelectPopover = styled( Ariakit.SelectPopover )`
	z-index: 50;
	border-radius: ${ space( 0.5 ) };
	background: ${ COLORS.white };
	border: 1px solid ${ COLORS.gray[ 900 ] };
	margin: ${ space( 3 ) } 0;
`;
export const CustomSelectItem = styled( Ariakit.SelectItem )`
	padding: ${ space( 2 ) };
	&:hover {
		background-color: ${ COLORS.gray[ 300 ] };
	}
`;
