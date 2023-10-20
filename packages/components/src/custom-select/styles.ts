// TODO (TEMP STYLES)
/**
 * External dependencies
 */
import styled from '@emotion/styled';
// eslint-disable-next-line no-restricted-imports
import * as Ariakit from '@ariakit/react';

/**
 * Internal dependencies
 */
import { COLORS } from '../utils';
import { space } from '../utils/space';

export const CustomSelectButton = styled( Ariakit.Select )`
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: ${ space( 1 ) };
	white-space: nowrap;
	font-size: 1rem;
	border-style: none;
	border-radius: ${ space( 1 ) };
	min-width: 250px;
	height: auto;
	margin-top: 1rem;
	padding: ${ space( 4 ) };
	background: ${ COLORS.white };
	box-shadow: 0 0 0 var( --wp-admin-border-width-focus )
		${ COLORS.gray[ 400 ] };
	&:hover {
		background-color: ${ COLORS.gray[ 100 ] };
	}
`;

export const CustomSelectPopover = styled( Ariakit.SelectPopover )`
	z-index: 50;
	display: flex;
	max-height: min( var( --popover-available-height, 300px ), 300px );
	flex-direction: column;
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
