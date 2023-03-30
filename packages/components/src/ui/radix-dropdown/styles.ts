/**
 * External dependencies
 */
import styled from '@emotion/styled';
import { css, keyframes } from '@emotion/react';

import * as DropdownMenu from '@radix-ui/react-dropdown-menu';

const slideDownAndFade = keyframes`
	from {
		opacity: 0;
		transform: translateY(-2px);
	}
	to {
		opacity: 1;
		transform: translateY(0);
	}
`;
const slideLeftAndFade = keyframes`
	from {
		opacity: 0;
		transform: translateX(2px);
	}
	to {
		opacity: 1;
		transform: translateX(0);
	}
`;
const slideUpAndFade = keyframes`
	from {
		opacity: 0;
		transform: translateY(2px);
	}
	to {
		opacity: 1;
		transform: translateY(0);
	}
`;
const slideRightAndFade = keyframes`
	from {
		opacity: 0;
		transform: translateX(-2px);
	}
	to {
		opacity: 1;
		transform: translateX(0);
	}
`;

const baseContent = css`
	min-width: 220px;
	background-color: white;
	border-radius: 6px;
	padding: 5px;
	box-shadow: 0px 10px 38px -10px rgba( 22, 23, 24, 0.35 ),
		0px 10px 20px -15px rgba( 22, 23, 24, 0.2 );
	animation-duration: 400ms;
	animation-timing-function: cubic-bezier( 0.16, 1, 0.3, 1 );
	will-change: transform, opacity;

	&[data-side='top'] {
		animation-name: ${ slideDownAndFade };
	}

	&[data-side='right'] {
		animation-name: ${ slideLeftAndFade };
	}

	&[data-side='bottom'] {
		animation-name: ${ slideUpAndFade };
	}

	&[data-side='left'] {
		animation-name: ${ slideRightAndFade };
	}
`;

const baseItem = css`
	font-size: 13px;
	line-height: 1;
	color: hsl( 250, 95%, 76.8% ); // violet11
	border-radius: 3px;
	display: flex;
	align-items: center;
	height: 25px;
	padding: 0 5px;
	position: relative;
	padding-left: 25px;
	user-select: none;
	outline: none;

	&[data-disabled] {
		color: hsl( 247, 4.8%, 32.5% ); // mauve8
		pointer-events: none;
	}

	&[data-highlighted] {
		background-color: hsl( 252, 56%, 57.5% ); // violet9
		color: hsl( 250, 20%, 10.2% ); // violet1
	}
`;

export const Root = styled( DropdownMenu.Root )`
	button {
		all: unset;
	}
`;

export const Content = styled( DropdownMenu.Content )`
	${ baseContent }
`;
export const SubContent = styled( DropdownMenu.SubContent )`
	${ baseContent }
`;

export const Item = styled( DropdownMenu.Item )`
	${ baseItem }
`;
export const CheckboxItem = styled( DropdownMenu.CheckboxItem )`
	${ baseItem }
`;
export const RadioItem = styled( DropdownMenu.RadioItem )`
	${ baseItem }
`;
export const SubTrigger = styled( DropdownMenu.SubTrigger )`
	${ baseItem }

	&[data-state='open'] {
		background-color: hsl( 252, 40.1%, 22.5% ); // violet4
		color: hsl( 250, 95%, 76.8% ); // violet11
	}
`;

export const Label = styled( DropdownMenu.Label )`
	padding-left: 25px;
	font-size: 12px;
	line-height: 25px;
	color: hsl( 253, 4%, 63.7% ); // mauve11
`;

export const Separator = styled( DropdownMenu.Separator )`
	height: 1px;
	background-color: hsl(251, 44.3%, 31.1%) // violet6;
	margin: 5px;
`;

export const ItemIndicator = styled( DropdownMenu.ItemIndicator )`
	position: absolute;
	left: 0;
	width: 25px;
	display: inline-flex;
	align-items: center;
	justify-content: center;
`;

export const Arrow = styled( DropdownMenu.Arrow )`
	fill: white;
`;
