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

export const CustomSelectButton = styled( Ariakit.Select )`
	display: flex;
	justify-content: space-between;
	align-items: center;
	font-size: 1rem;
	border-style: none;
	border-radius: ${ space( 1 ) };
	min-width: 250px;
	margin-top: 1rem;
	padding: ${ space( 4 ) };
	background: ${ COLORS.white };
	box-shadow: 0 0 0 var( --wp-admin-border-width-focus )
		${ COLORS.gray[ 400 ] };
	&:hover {
		background-color: ${ COLORS.gray[ 100 ] };
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
	border-radius: ${ space( 1 ) };
	background: ${ COLORS.white };
	box-shadow: 0 0 0 var( --wp-admin-border-width-focus )
		${ COLORS.gray[ 400 ] };
`;
export const CustomSelectItem = styled( Ariakit.SelectItem )`
	cursor: pointer;
	padding: ${ space( 2 ) };
	&:hover {
		background-color: ${ COLORS.theme.accent };
		color: ${ COLORS.white };
	}
`;
