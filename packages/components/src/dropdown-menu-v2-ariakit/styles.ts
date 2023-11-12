/**
 * External dependencies
 */
// eslint-disable-next-line no-restricted-imports
import * as Ariakit from '@ariakit/react';
import { css, keyframes } from '@emotion/react';
import styled from '@emotion/styled';

/**
 * Internal dependencies
 */
import { COLORS, font, rtl, CONFIG } from '../utils';
import { space } from '../utils/space';
import Icon from '../icon';
import { Truncate } from '../truncate';
import type { DropdownMenuContext } from './types';

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

export const DropdownMenu = styled( Ariakit.Menu )<
	Pick< DropdownMenuContext, 'variant' >
>`
	position: relative;
	/* Same as popover component */
	/* TODO: is there a way to read the sass variable? */
	z-index: 1000000;

	min-width: 220px;
	max-height: var( --popover-available-height );
	padding: ${ CONTENT_WRAPPER_PADDING };

	background-color: ${ COLORS.ui.background };
	border-radius: ${ CONFIG.radiusBlockUi };
	${ ( props ) => css`
		box-shadow: ${ props.variant === 'toolbar'
			? TOOLBAR_VARIANT_BOX_SHADOW
			: DEFAULT_BOX_SHADOW };
	` }

	overscroll-behavior: contain;
	overflow: auto;

	/* Only visible in Windows High Contrast mode */
	outline: 2px solid transparent !important;

	/* Animation */
	animation-duration: ${ ANIMATION_PARAMS.DURATION };
	animation-timing-function: ${ ANIMATION_PARAMS.EASING };
	will-change: transform, opacity;
	/* Default animation.*/
	animation-name: ${ slideDownAndFade };

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
	/* !important is to override some inline styles set by Ariakit */
	width: ${ ITEM_PREFIX_WIDTH } !important;
	/* !important is to override some inline styles set by Ariakit */
	height: auto !important;
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

	/* when the parent item is hovered / focused */
	[data-active-item] > &,
	/* when the parent item is a submenu trigger and the submenu is open */
	[aria-expanded='true'] > &,
	/* when the parent item is disabled */
	[aria-disabled='true'] > & {
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

	&[aria-disabled='true'] {
		/*
		TODO:
			- we need a disabled color in the Theme variables
			- design specs use opacity instead of setting a new text color
	*/
		opacity: 0.5;
		pointer-events: none;
	}

	/* Hover */
	&[data-active-item] {
		/* TODO: reconcile with global focus styles */
		background-color: ${ COLORS.gray[ '100' ] };
	}

	/* Keyboard focus (focus-visible) */
	&[data-focus-visible] {
		box-shadow: 0 0 0 1.5px var( --wp-admin-theme-color );

		/* Only visible in Windows High Contrast mode */
		outline: 2px solid transparent;
	}

	/* Active (ie. pressed, mouse down) */
	&:active,
	&[data-active] {
		/* TODO: should there be a visual active state? */
	}

	/* When the item is the trigger of an open submenu */
	${ DropdownMenu }:not(:focus) &:not(:focus)[aria-expanded="true"] {
		/* TODO: should we style submenu triggers any different? */
	}

	svg {
		fill: currentColor;
	}
`;

export const DropdownMenuItem = styled( Ariakit.MenuItem )< {
	shouldIndent?: boolean;
} >`
	${ baseItem }

	${ ( props ) =>
		props.shouldIndent &&
		`
		padding-inline-start: ${ ITEM_PREFIX_WIDTH };
		` }
`;

export const DropdownMenuCheckboxItem = styled( Ariakit.MenuItemCheckbox )`
	${ baseItem }
`;

export const DropdownMenuRadioItem = styled( Ariakit.MenuItemRadio )`
	${ baseItem }
`;

export const DropdownMenuItemContentWrapper = styled.div`
	display: inline-flex;
	flex-direction: column;
	pointer-events: none;
`;

export const DropdownMenuGroup = styled( Ariakit.MenuGroup )``;

export const DropdownMenuSeparator = styled( Ariakit.MenuSeparator )<
	Pick< DropdownMenuContext, 'variant' >
>`
	border: none;
	height: ${ CONFIG.borderWidth };
	/* TODO: doesn't match border color from variables */
	background-color: ${ ( props ) =>
		props.variant === 'toolbar'
			? TOOLBAR_VARIANT_BORDER_COLOR
			: DEFAULT_BORDER_COLOR };
	/* Negative horizontal margin to make separator go from side to side */
	margin: ${ space( 2 ) } calc( -1 * ${ CONTENT_WRAPPER_PADDING } );

	/* Only visible in Windows High Contrast mode */
	outline: 2px solid transparent;
`;

export const SubmenuChevronIcon = styled( Icon )`
	${ rtl(
		{
			transform: `scaleX(1) translateX(${ space( 2 ) })`,
		},
		{
			transform: `scaleX(-1) translateX(${ space( 2 ) })`,
		}
	) }
`;

export const DropdownMenuItemHelpText = styled( Truncate )`
	font-size: 12px;
	color: ${ COLORS.gray[ '700' ] };
`;

// /* when the immediate parent item is hovered / focused */
// [data-active-item] > ${ DropdownMenuItem }[data-active-item] > &,
// [data-active-item] > ${ DropdownMenuRadioItem }[data-active-item] > &,
// [data-active-item] > ${ DropdownMenuCheckboxItem }[data-active-item] > &,
// /* when the parent item is a submenu trigger and the submenu is open */
// [aria-expanded='true'] > &,
// /* when the parent item is disabled */
// [aria-disabled='true'] > & {
// 	color: inherit;
// }
