/**
 * External dependencies
 */
import * as Ariakit from '@ariakit/react';
import { css } from '@emotion/react';
import styled from '@emotion/styled';

/**
 * Internal dependencies
 */
import { COLORS, font, rtl, CONFIG } from '../utils';
import { space } from '../utils/space';
import Icon from '../icon';
import { Truncate } from '../truncate';
import type { ContextProps } from './types';

const ANIMATION_PARAMS = {
	SCALE_AMOUNT_OUTER: 0.82,
	SCALE_AMOUNT_CONTENT: 0.9,
	DURATION: {
		IN: '400ms',
		OUT: '200ms',
	},
	EASING: 'cubic-bezier(0.33, 0, 0, 1)',
};

const CONTENT_WRAPPER_PADDING = space( 1 );
const ITEM_PADDING_BLOCK = space( 2 );
const ITEM_PADDING_INLINE = space( 3 );

// TODO:
// - border color and divider color are different from COLORS.theme variables
// - lighter text color is not defined in COLORS.theme, should it be?
// - lighter background color is not defined in COLORS.theme, should it be?
const DEFAULT_BORDER_COLOR = COLORS.theme.gray[ 300 ];
const DIVIDER_COLOR = COLORS.theme.gray[ 200 ];
const LIGHTER_TEXT_COLOR = COLORS.theme.gray[ 700 ];
const LIGHT_BACKGROUND_COLOR = COLORS.theme.gray[ 100 ];
const TOOLBAR_VARIANT_BORDER_COLOR = COLORS.theme.foreground;
const DEFAULT_BOX_SHADOW = `0 0 0 ${ CONFIG.borderWidth } ${ DEFAULT_BORDER_COLOR }, ${ CONFIG.elevationMedium }`;
const TOOLBAR_VARIANT_BOX_SHADOW = `0 0 0 ${ CONFIG.borderWidth } ${ TOOLBAR_VARIANT_BORDER_COLOR }`;

const GRID_TEMPLATE_COLS = 'minmax( 0, max-content ) 1fr';

export const PopoverOuterWrapper = styled.div<
	Pick< ContextProps, 'variant' >
>`
	position: relative;

	background-color: ${ COLORS.ui.background };
	border-radius: ${ CONFIG.radiusMedium };
	${ ( props ) => css`
		box-shadow: ${ props.variant === 'toolbar'
			? TOOLBAR_VARIANT_BOX_SHADOW
			: DEFAULT_BOX_SHADOW };
	` }

	overflow: hidden;

	/* Open/close animation (outer wrapper) */
	@media not ( prefers-reduced-motion ) {
		transition-property: transform, opacity;
		transition-timing-function: ${ ANIMATION_PARAMS.EASING };
		transition-duration: ${ ANIMATION_PARAMS.DURATION.IN };
		will-change: transform, opacity;

		/* Regardless of the side, fade in and out. */
		opacity: 0;
		&:has( [data-enter] ) {
			opacity: 1;
		}

		&:has( [data-leave] ) {
			transition-duration: ${ ANIMATION_PARAMS.DURATION.OUT };
		}

		/* For menus opening on top and bottom side, animate the scale Y too. */
		&:has( [data-side='bottom'] ),
		&:has( [data-side='top'] ) {
			transform: scaleY( ${ ANIMATION_PARAMS.SCALE_AMOUNT_OUTER } );
		}
		&:has( [data-side='bottom'] ) {
			transform-origin: top;
		}
		&:has( [data-side='top'] ) {
			transform-origin: bottom;
		}
		&:has( [data-enter][data-side='bottom'] ),
		&:has( [data-enter][data-side='top'] ),
		/* Do not animate the scaleY when closing the menu */
		&:has( [data-leave][data-side='bottom'] ),
		&:has( [data-leave][data-side='top'] ) {
			transform: scaleY( 1 );
		}
	}
`;

export const PopoverInnerWrapper = styled.div`
	position: relative;
	/* Same as popover component */
	/* TODO: is there a way to read the sass variable? */
	z-index: 1000000;

	display: grid;
	grid-template-columns: ${ GRID_TEMPLATE_COLS };
	grid-template-rows: auto;

	box-sizing: border-box;
	min-width: 160px;
	max-width: 320px;
	max-height: var( --popover-available-height );

	padding: ${ CONTENT_WRAPPER_PADDING };

	overscroll-behavior: contain;
	overflow: auto;

	/* Only visible in Windows High Contrast mode */
	outline: 2px solid transparent !important;

	/* Open/close animation (inner content wrapper) */
	@media not ( prefers-reduced-motion ) {
		transition: inherit;
		transform-origin: inherit;

		/*
		 * For menus opening on top and bottom side, animate the scale Y too.
		 * The content scales at a different rate than the outer container:
		 * - first, counter the outer scale factor by doing "1 / scaleAmountOuter"
		 * - then, apply the content scale factor.
		 */
		&[data-side='bottom'],
		&[data-side='top'] {
			transform: scaleY(
				calc(
					1 / ${ ANIMATION_PARAMS.SCALE_AMOUNT_OUTER } *
						${ ANIMATION_PARAMS.SCALE_AMOUNT_CONTENT }
				)
			);
		}
		&[data-enter][data-side='bottom'],
		&[data-enter][data-side='top'],
		/* Do not animate the scaleY when closing the menu */
		&[data-leave][data-side='bottom'],
		&[data-leave][data-side='top'] {
			transform: scaleY( 1 );
		}
	}
`;

const baseItem = css`
	all: unset;

	position: relative;
	min-height: ${ space( 10 ) };
	box-sizing: border-box;

	/* Occupy the width of all grid columns (ie. full width) */
	grid-column: 1 / -1;

	display: grid;
	grid-template-columns: ${ GRID_TEMPLATE_COLS };
	align-items: center;

	@supports ( grid-template-columns: subgrid ) {
		/*
		 * Define a grid layout which inherits the same columns configuration
		 * from the parent layout (ie. subgrid). This allows the menu
		 * to synchronize the indentation of all its items.
		 */
		grid-template-columns: subgrid;
	}

	font-size: ${ font( 'default.fontSize' ) };
	font-family: inherit;
	font-weight: normal;
	line-height: 20px;

	color: ${ COLORS.theme.foreground };
	border-radius: ${ CONFIG.radiusSmall };

	padding-block: ${ ITEM_PADDING_BLOCK };
	padding-inline: ${ ITEM_PADDING_INLINE };

	/*
	 * Make sure that, when an item is scrolled into view (eg. while using the
	 * keyboard to move focus), the whole item comes into view
	 */
	scroll-margin: ${ CONTENT_WRAPPER_PADDING };

	user-select: none;
	outline: none;

	&[aria-disabled='true'] {
		color: ${ COLORS.ui.textDisabled };
		cursor: not-allowed;
	}

	/* Active item (including hover) */
	&[data-active-item]:not( [data-focus-visible] ):not(
			[aria-disabled='true']
		) {
		background-color: ${ COLORS.theme.accent };
		color: ${ COLORS.theme.accentInverted };
	}

	/* Keyboard focus (focus-visible) */
	&[data-focus-visible] {
		box-shadow: 0 0 0 1.5px ${ COLORS.theme.accent };

		/* Only visible in Windows High Contrast mode */
		outline: 2px solid transparent;
	}

	/* Active (ie. pressed, mouse down) */
	&:active,
	&[data-active] {
		/* TODO: should there be a visual active state? */
	}

	/* When the item is the trigger of an open submenu */
	${ PopoverInnerWrapper }:not(:focus) &:not(:focus)[aria-expanded="true"] {
		background-color: ${ LIGHT_BACKGROUND_COLOR };
		color: ${ COLORS.theme.foreground };
	}

	svg {
		fill: currentColor;
	}
`;

export const Item = styled( Ariakit.MenuItem )`
	${ baseItem };
`;

export const CheckboxItem = styled( Ariakit.MenuItemCheckbox )`
	${ baseItem };
`;

export const RadioItem = styled( Ariakit.MenuItemRadio )`
	${ baseItem };
`;

export const ItemPrefixWrapper = styled.span`
	/* Always occupy the first column, even when auto-collapsing */
	grid-column: 1;

	/*
	 * Even when the item is not checked, occupy the same screen space to avoid
	 * the space collapside when no items are checked.
	 */
	${ CheckboxItem } > &,
	${ RadioItem } > & {
		/* Same width as the check icons */
		min-width: ${ space( 6 ) };
	}

	${ CheckboxItem } > &,
	${ RadioItem } > &,
	&:not( :empty ) {
		margin-inline-end: ${ space( 2 ) };
	}

	display: flex;
	align-items: center;
	justify-content: center;

	color: ${ LIGHTER_TEXT_COLOR };

	/*
	* When the parent menu item is active, except when it's a non-focused/hovered
	* submenu trigger (in that case, color should not be inherited)
	*/
	[data-active-item]:not( [data-focus-visible] ) > &,
	/* When the parent menu item is disabled */
	[aria-disabled='true'] > & {
		color: inherit;
	}
`;

export const ItemContentWrapper = styled.div`
	/*
	 * Always occupy the second column, since the first column
	 * is taken by the prefix wrapper (when displayed).
	 */
	grid-column: 2;

	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: ${ space( 3 ) };

	pointer-events: none;
`;

export const ItemChildrenWrapper = styled.div`
	flex: 1;

	display: inline-flex;
	flex-direction: column;
	gap: ${ space( 1 ) };
`;

export const ItemSuffixWrapper = styled.span`
	flex: 0 1 fit-content;
	min-width: 0;
	width: fit-content;

	display: flex;
	align-items: center;
	justify-content: center;
	gap: ${ space( 3 ) };

	color: ${ LIGHTER_TEXT_COLOR };

	/*
	 * When the parent menu item is active, except when it's a non-focused/hovered
	 * submenu trigger (in that case, color should not be inherited)
	 */
	[data-active-item]:not( [data-focus-visible] ) *:not(${ PopoverInnerWrapper }) &,
	/* When the parent menu item is disabled */
	[aria-disabled='true'] *:not(${ PopoverInnerWrapper }) & {
		color: inherit;
	}
`;

export const Group = styled( Ariakit.MenuGroup )`
	/* Ignore this element when calculating the layout. Useful for subgrid */
	display: contents;
`;

export const GroupLabel = styled( Ariakit.MenuGroupLabel )`
	/* Occupy the width of all grid columns (ie. full width) */
	grid-column: 1 / -1;

	padding-block-start: ${ space( 3 ) };
	padding-block-end: ${ space( 2 ) };
	padding-inline: ${ ITEM_PADDING_INLINE };
`;

export const Separator = styled( Ariakit.MenuSeparator )<
	Pick< ContextProps, 'variant' >
>`
	/* Occupy the width of all grid columns (ie. full width) */
	grid-column: 1 / -1;

	border: none;
	height: ${ CONFIG.borderWidth };
	background-color: ${ ( props ) =>
		props.variant === 'toolbar'
			? TOOLBAR_VARIANT_BORDER_COLOR
			: DIVIDER_COLOR };
	/* Align with menu items' content */
	margin-block: ${ space( 2 ) };
	margin-inline: ${ ITEM_PADDING_INLINE };

	/* Only visible in Windows High Contrast mode */
	outline: 2px solid transparent;
`;

export const SubmenuChevronIcon = styled( Icon )`
	width: ${ space( 1.5 ) };
	${ rtl(
		{
			transform: `scaleX(1)`,
		},
		{
			transform: `scaleX(-1)`,
		}
	) };
`;

export const ItemLabel = styled( Truncate )`
	font-size: ${ font( 'default.fontSize' ) };
	line-height: 20px;
	color: inherit;
`;

export const ItemHelpText = styled( Truncate )`
	font-size: ${ font( 'helpText.fontSize' ) };
	line-height: 16px;
	color: ${ LIGHTER_TEXT_COLOR };
	overflow-wrap: anywhere;

	[data-active-item]:not( [data-focus-visible] )
		*:not( ${ PopoverInnerWrapper } )
		&,
	[aria-disabled='true'] *:not( ${ PopoverInnerWrapper } ) & {
		color: inherit;
	}
`;
