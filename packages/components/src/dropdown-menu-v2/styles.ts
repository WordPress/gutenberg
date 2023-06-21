/**
 * External dependencies
 */
import styled from '@emotion/styled';
import { css, keyframes } from '@emotion/react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';

/**
 * Internal dependencies
 */
import { COLORS, font, rtl, CONFIG } from '../utils';
import { space } from '../ui/utils/space';
import Icon from '../icon';
import type { DropdownMenuInternalContext } from './types';

const ANIMATION_PARAMS = {
	SLIDE_AMOUNT: '2px',
	DURATION: '400ms',
	EASING: 'cubic-bezier( 0.16, 1, 0.3, 1 )',
};

const CONTENT_WRAPPER_PADDING = space( 2 );
const ITEM_PREFIX_WIDTH = space( 7 );
const ITEM_PADDING_INLINE_START = space( 2 );
const ITEM_PADDING_INLINE_END = space( 2.5 );

// TODO: should bring this into the config, and make themeable
const DEFAULT_BORDER_COLOR = COLORS.ui.borderDisabled;
const TOOLBAR_VARIANT_BORDER_COLOR = COLORS.gray[ '900' ];
const DEFAULT_BOX_SHADOW = `0 0 0 ${ CONFIG.borderWidth } ${ DEFAULT_BORDER_COLOR }, ${ CONFIG.popoverShadow }`;
const TOOLBAR_VARIANT_BOX_SHADOW = `0 0 0 ${ CONFIG.borderWidth } ${ TOOLBAR_VARIANT_BORDER_COLOR }`;

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

const baseContent = (
	variant: DropdownMenuInternalContext[ 'variant' ]
) => css`
	min-width: 220px;
	background-color: ${ COLORS.ui.background };
	border-radius: ${ CONFIG.radiusBlockUi };
	padding: ${ CONTENT_WRAPPER_PADDING };
	box-shadow: ${ variant === 'toolbar'
		? TOOLBAR_VARIANT_BOX_SHADOW
		: DEFAULT_BOX_SHADOW };
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

const itemPrefix = css`
	width: ${ ITEM_PREFIX_WIDTH };
	display: inline-flex;
	align-items: center;
	justify-content: center;
	/* Prefixes don't get affected by the item's inline start padding */
	margin-inline-start: calc( -1 * ${ ITEM_PADDING_INLINE_START } );
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
	/* Push prefix to the inline-end of the item */
	margin-inline-start: auto;
	/* Minimum space between the item's content and suffix */
	padding-inline-start: ${ space( 6 ) };
	/*
		Negative margin allows the suffix to be as tall as the whole item
		(incl. padding) before increasing the items' height. This can be useful,
		e.g., when using icons that are bigger than 20x20 px
	*/
	margin-top: ${ space( -2 ) };
	margin-bottom: ${ space( -2 ) };

	/*
		Override color in normal conditions, but inherit the item's color
	  for altered conditions.

		TODO:
		  - For now, used opacity like for disabled item, which makes it work
			  regardless of the theme
		  - how do we translate this for themes? Should we have a new variable
		for "secondary" text?
	*/
	opacity: 0.6;

	[data-highlighted] > &,
	[data-state='open'] > &,
	[data-disabled] > & {
		opacity: 1;
	}
`;

export const ItemPrefixWrapper = styled.span`
	${ itemPrefix }
`;

export const ItemSuffixWrapper = styled.span`
	${ itemSuffix }
`;

const baseItem = css`
	all: unset;
	font-size: ${ font( 'default.fontSize' ) };
	font-family: inherit;
	font-weight: normal;
	line-height: 20px;
	color: ${ COLORS.gray[ 900 ] };
	border-radius: ${ CONFIG.radiusBlockUi };
	display: flex;
	align-items: center;
	padding: ${ space( 2 ) } ${ ITEM_PADDING_INLINE_END } ${ space( 2 ) }
		${ ITEM_PADDING_INLINE_START };
	position: relative;
	user-select: none;
	outline: none;

	&[data-disabled] {
		/*
			TODO:
			  - we need a disabled color in the Theme variables
			  - design specs use opacity instead of setting a new text color
		*/
		opacity: 0.5;
		pointer-events: none;
	}

	/* Hover and Focus styles */
	&[data-highlighted] {
		/* TODO: reconcile with global focus styles */
		background-color: ${ COLORS.gray[ '100' ] };

		/* Only visible in Windows High Contrast mode */
		outline: 2px solid transparent;
	}

	svg {
		fill: currentColor;
	}

	&:not( :has( ${ ItemPrefixWrapper } ) ) {
		padding-inline-start: ${ ITEM_PREFIX_WIDTH };
	}
`;

export const Content = styled( DropdownMenu.Content )<
	Pick< DropdownMenuInternalContext, 'variant' >
>`
	${ ( props ) => baseContent( props.variant ) }
`;
export const SubContent = styled( DropdownMenu.SubContent )<
	Pick< DropdownMenuInternalContext, 'variant' >
>`
	${ ( props ) => baseContent( props.variant ) }
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
		background-color: ${ COLORS.gray[ '100' ] };
	}
`;

export const Label = styled( DropdownMenu.Label )`
	box-sizing: border-box;
	display: flex;
	align-items: center;
	min-height: ${ space( 8 ) };

	padding: ${ space( 2 ) } ${ ITEM_PADDING_INLINE_END } ${ space( 2 ) }
		${ ITEM_PREFIX_WIDTH };
	/* TODO: color doesn't match available UI variables */
	color: ${ COLORS.gray[ 700 ] };

	/* TODO: font size doesn't match available ones via "font" utils */
	font-size: 11px;
	line-height: 1.4;
	font-weight: 500;
	text-transform: uppercase;
`;

export const Separator = styled( DropdownMenu.Separator )<
	Pick< DropdownMenuInternalContext, 'variant' >
>`
	height: ${ CONFIG.borderWidth };
	/* TODO: doesn't match border color from variables */
	background-color: ${ ( props ) =>
		props.variant === 'toolbar'
			? TOOLBAR_VARIANT_BORDER_COLOR
			: DEFAULT_BORDER_COLOR };
	/* Negative horizontal margin to make separator go from side to side */
	margin: ${ space( 2 ) } calc( -1 * ${ CONTENT_WRAPPER_PADDING } );
`;

export const ItemIndicator = styled( DropdownMenu.ItemIndicator )`
	display: inline-flex;
	align-items: center;
	justify-content: center;
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
