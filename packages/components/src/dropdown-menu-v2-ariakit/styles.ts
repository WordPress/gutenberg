/**
 * External dependencies
 */
// eslint-disable-next-line no-restricted-imports
import * as Ariakit from '@ariakit/react';
import styled from '@emotion/styled';

// TODO: z-index from global vars
export const DropdownMenu = styled( Ariakit.Menu )`
	position: relative;
	z-index: 50;
	display: flex;
	max-height: var( --popover-available-height );
	min-width: 180px;
	flex-direction: column;
	overscroll-behavior: contain;
	border-radius: 0.5rem;
	border-width: 1px;
	border-style: solid;
	border-color: hsl( 204 20% 88% );
	background-color: hsl( 204 20% 100% );
	padding: 0.5rem;
	color: hsl( 204 10% 10% );
	box-shadow:
		0 10px 15px -3px rgb( 0 0 0 / 0.1 ),
		0 4px 6px -4px rgb( 0 0 0 / 0.1 );
	outline: none !important;
	overflow: visible;
`;
export const DropdownMenuGroup = styled( Ariakit.MenuGroup )``;
export const DropdownMenuGroupLabel = styled( Ariakit.MenuGroupLabel )``;
export const DropdownMenuItem = styled( Ariakit.MenuItem )`
	display: flex;
	cursor: default;
	scroll-margin: 0.5rem;
	align-items: center;
	gap: 0.5rem;
	border-radius: 0.25rem;
	padding: 0.5rem;
	outline: none !important;

	&[aria-disabled='true'] {
		opacity: 0.25;
	}

	&[data-active-item] {
		background-color: hsl( 204 100% 40% );
		color: hsl( 204 20% 100% );
	}

	&:active,
	&[data-active] {
		background-color: hsl( 204 100% 32% );
	}

	${ DropdownMenu }:not(:focus) &:not(:focus)[aria-expanded="true"] {
		background-color: hsl( 204 10% 10% / 0.1 );
		color: currentColor;
	}
`;
export const DropdownMenuCheckboxItem = styled( Ariakit.MenuItemCheckbox )``;
export const DropdownMenuRadioItem = styled( Ariakit.MenuItemRadio )``;
export const DropdownMenuSeparator = styled( Ariakit.MenuSeparator )``;
