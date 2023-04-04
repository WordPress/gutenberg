/**
 * External dependencies
 */
import styled from '@emotion/styled';
import { css, keyframes } from '@emotion/react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';

/**
 * Internal dependencies
 */
import { COLORS } from '../../utils';

const ANIMATION_PARAMS = {
	SLIDE_AMOUNT: '2px',
	DURATION: '400ms',
	EASING: 'cubic-bezier( 0.16, 1, 0.3, 1 )',
};

const slideUpAndFade = keyframes( {
	'0%': {
		opacity: 0,
		transform: `translateY(${ ANIMATION_PARAMS.SLIDE_AMOUNT })`,
	},
	'100%': { opacity: 1, transform: 'translateY(0)' },
} );

const slideRightAndFade = keyframes( {
	'0%': {
		opacity: 0,
		transform: `translateX(-${ ANIMATION_PARAMS.SLIDE_AMOUNT })`,
	},
	'100%': { opacity: 1, transform: 'translateX(0)' },
} );

const slideDownAndFade = keyframes( {
	'0%': {
		opacity: 0,
		transform: `translateY(-${ ANIMATION_PARAMS.SLIDE_AMOUNT })`,
	},
	'100%': { opacity: 1, transform: 'translateY(0)' },
} );

const slideLeftAndFade = keyframes( {
	'0%': {
		opacity: 0,
		transform: `translateX(${ ANIMATION_PARAMS.SLIDE_AMOUNT })`,
	},
	'100%': { opacity: 1, transform: 'translateX(0)' },
} );

const baseContent = css`
	min-width: 220px;
	background-color: ${ COLORS.ui.background };
	border: 1px solid ${ COLORS.ui.border };
	border-radius: 6px;
	padding: 5px;
	box-shadow: 0px 10px 38px -10px rgba( 22, 23, 24, 0.35 ),
		0px 10px 20px -15px rgba( 22, 23, 24, 0.2 );
	animation-duration: ${ ANIMATION_PARAMS.DURATION };
	animation-timing-function: ${ ANIMATION_PARAMS.EASING };
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
	all: unset;
	font-size: 13px;
	line-height: 1;
	color: ${ COLORS.gray[ 900 ] };
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
		color: ${ COLORS.ui.textDisabled };
		pointer-events: none;
	}

	&[data-highlighted] {
		color: ${ COLORS.ui.theme };
	}

	svg {
		fill: currentColor;
	}
`;

const itemPrefix = css`
	position: absolute;
	left: 0;
	width: 25px;
	display: inline-flex;
	align-items: center;
	justify-content: center;
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
	&[data-state='open'] {
		color: ${ COLORS.ui.theme };
	}

	${ baseItem }
`;

export const Label = styled( DropdownMenu.Label )`
	padding-left: 25px;
	font-size: 12px;
	line-height: 25px;
	color: ${ COLORS.ui.textDisabled };
`;

export const Separator = styled( DropdownMenu.Separator )`
	height: 1px;
	background-color: ${ COLORS.ui.borderDisabled };
	margin: 5px;
`;

export const ItemIndicator = styled( DropdownMenu.ItemIndicator )`
	${ itemPrefix }
`;

export const ItemPrefixWrapper = styled.span`
	${ itemPrefix }
`;

export const Arrow = styled( DropdownMenu.Arrow )`
	fill: ${ COLORS.ui.background };

	/* The following styles aim at adding a border to the arrow*/
	stroke: ${ COLORS.ui.border };
	stroke-dasharray: 36 28;
	stroke-dashoffset: 34;
	stroke-linejoin: round;
	stroke-width: 2.5;
`;
