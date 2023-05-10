/**
 * External dependencies
 */
import styled from '@emotion/styled';
import { css, keyframes } from '@emotion/react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';

/**
 * Internal dependencies
 */
import { COLORS, font, rtl } from '../../utils';
import { space } from '../utils/space';
import Icon from '../../icon';

const ANIMATION_PARAMS = {
	SLIDE_AMOUNT: '2px',
	DURATION: '400ms',
	EASING: 'cubic-bezier( 0.16, 1, 0.3, 1 )',
};

const ITEM_HORIZONTAL_PADDING = space( 2 );

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
	border-radius: 2px;
	padding: ${ space( 2 ) };
	box-shadow: 0 0.7px 1px rgba( 0, 0, 0, 0.1 ),
		0 1.2px 1.7px -0.2px rgba( 0, 0, 0, 0.1 ),
		0 2.3px 3.3px -0.5px rgba( 0, 0, 0, 0.1 );
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

	@media ( prefers-reduced-motion ) {
		animation-duration: 0s;
	}
`;

const baseItem = css`
	all: unset;
	font-size: ${ font( 'default.fontSize' ) };
	font-family: inherit;
	font-weight: normal;
	line-height: 20px;
	color: ${ COLORS.gray[ 900 ] };
	border-radius: 3px;
	display: flex;
	align-items: center;
	padding: ${ space( 2 ) } ${ ITEM_HORIZONTAL_PADDING };
	position: relative;
	user-select: none;
	outline: none;

	&[data-disabled] {
		color: ${ COLORS.ui.textDisabled };
		pointer-events: none;
	}

	&[data-highlighted] {
		color: ${ COLORS.ui.theme };
	}

	&[data-highlighted]:focus-visible {
		outline: 1px solid ${ COLORS.ui.theme };
	}

	svg {
		fill: currentColor;
	}
`;

const itemPrefix = css`
	width: ${ space( 8 ) };
	display: inline-flex;
	align-items: center;
	justify-content: center;
	margin-inline-start: calc( -1 * ${ ITEM_HORIZONTAL_PADDING } );
	/*
		Negative margin allows the suffix to be as tall as the whole item
		(incl. padding) before increasing the items' height. This can be useful,
		e.g., when using icons that are bigger than 20x20 px
	*/
	margin-top: ${ space( -2 ) };
	margin-bottom: ${ space( -2 ) };
`;

const itemSuffix = css`
	width: max-content;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	margin-inline-start: auto;
	padding-inline-start: ${ space( 6 ) };
	/*
		Negative margin allows the suffix to be as tall as the whole item
		(incl. padding) before increasing the items' height. This can be useful,
		e.g., when using icons that are bigger than 20x20 px
	*/
	margin-top: ${ space( -2 ) };
	margin-bottom: ${ space( -2 ) };
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
	&[data-state='open']:not( [data-highlighted] ) {
		background-color: ${ COLORS.ui.backgroundDisabled };
	}

	${ baseItem }
`;

export const Label = styled( DropdownMenu.Label )`
	padding: 0 ${ ITEM_HORIZONTAL_PADDING };
	font-size: ${ font( 'helpText.fontSize' ) };
	line-height: ${ space( 7 ) };
	color: ${ COLORS.ui.textDisabled };
`;

export const Separator = styled( DropdownMenu.Separator )`
	height: 1px;
	background-color: ${ COLORS.ui.border };
	/* Negative horizontal margin to make separator go from side to side */
	margin: ${ space( 2 ) } ${ space( -2 ) };
`;

export const ItemIndicator = styled( DropdownMenu.ItemIndicator )`
	display: inline-flex;
	align-items: center;
	justify-content: center;
`;

export const ItemPrefixWrapper = styled.span`
	${ itemPrefix }
`;

export const ItemSuffixWrapper = styled.span`
	${ itemSuffix }
`;

export const SubmenuRtlChevronIcon = styled( Icon )`
	${ rtl(
		{
			transform: `scaleX(1) translateX(${ space( 2 ) })`,
		},
		{
			transform: `scaleX(-1) translateX(${ space( 2 ) })`,
		}
	)() }
`;
