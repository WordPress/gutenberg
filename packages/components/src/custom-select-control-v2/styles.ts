/**
 * External dependencies
 */
import * as Ariakit from '@ariakit/react';
import { css, keyframes } from '@emotion/react';
import styled from '@emotion/styled';
/**
 * Internal dependencies
 */
import { COLORS, CONFIG } from '../utils';
import { space } from '../utils/space';
import { chevronIconSize } from '../select-control/styles/select-control-styles';
import { fontSizeStyles } from '../input-control/styles/input-control-styles';
import type { CustomSelectButtonSize } from './types';

// TODO: extract to common utils and apply to relevant components
const ANIMATION_PARAMS = {
	SLIDE_AMOUNT: '2px',
	DURATION: '400ms',
	EASING: 'cubic-bezier( 0.16, 1, 0.3, 1 )',
};

const INLINE_PADDING = {
	compact: 8, // space(2)
	small: 8, // space(2)
	default: 16, // space(4)
};

const getSelectSize = (
	size: NonNullable< CustomSelectButtonSize[ 'size' ] >,
	heightProperty: 'minHeight' | 'height'
) => {
	const sizes = {
		compact: {
			[ heightProperty ]: 32,
			paddingInlineStart: INLINE_PADDING.compact,
			paddingInlineEnd: INLINE_PADDING.compact + chevronIconSize,
		},
		default: {
			[ heightProperty ]: 40,
			paddingInlineStart: INLINE_PADDING.default,
			paddingInlineEnd: INLINE_PADDING.default + chevronIconSize,
		},
		small: {
			[ heightProperty ]: 24,
			paddingInlineStart: INLINE_PADDING.small,
			paddingInlineEnd: INLINE_PADDING.small + chevronIconSize,
		},
	};

	return sizes[ size ] || sizes.default;
};

const getSelectItemSize = (
	size: NonNullable< CustomSelectButtonSize[ 'size' ] >
) => {
	// Used to visually align the checkmark with the chevron
	const checkmarkCorrection = 6;
	const sizes = {
		compact: {
			paddingInlineStart: INLINE_PADDING.compact,
			paddingInlineEnd: INLINE_PADDING.compact - checkmarkCorrection,
		},
		default: {
			paddingInlineStart: INLINE_PADDING.default,
			paddingInlineEnd: INLINE_PADDING.default - checkmarkCorrection,
		},
		small: {
			paddingInlineStart: INLINE_PADDING.small,
			paddingInlineEnd: INLINE_PADDING.small - checkmarkCorrection,
		},
	};

	return sizes[ size ] || sizes.default;
};

export const Select = styled( Ariakit.Select, {
	// Do not forward `hasCustomRenderProp` to the underlying Ariakit.Select component
	shouldForwardProp: ( prop ) => prop !== 'hasCustomRenderProp',
} )(
	( {
		size,
		hasCustomRenderProp,
	}: {
		size: NonNullable< CustomSelectButtonSize[ 'size' ] >;
		hasCustomRenderProp: boolean;
	} ) => css`
		display: block;
		background-color: ${ COLORS.theme.background };
		border: none;
		color: ${ COLORS.theme.foreground };
		cursor: pointer;
		font-family: inherit;
		text-align: start;
		user-select: none;
		width: 100%;

		&[data-focus-visible] {
			outline: none; // handled by InputBase component
		}

		${ getSelectSize( size, hasCustomRenderProp ? 'minHeight' : 'height' ) }
		${ ! hasCustomRenderProp && truncateStyles }
		${ fontSizeStyles( { inputSize: size } ) }
	`
);

const slideDownAndFade = keyframes( {
	'0%': {
		opacity: 0,
		transform: `translateY(-${ ANIMATION_PARAMS.SLIDE_AMOUNT })`,
	},
	'100%': { opacity: 1, transform: 'translateY(0)' },
} );

export const SelectPopover = styled( Ariakit.SelectPopover )`
	display: flex;
	flex-direction: column;

	background-color: ${ COLORS.theme.background };
	border-radius: 2px;
	border: 1px solid ${ COLORS.theme.foreground };

	/* z-index(".components-popover") */
	z-index: 1000000;

	max-height: min( var( --popover-available-height, 400px ), 400px );
	overflow: auto;
	overscroll-behavior: contain;

	/* The smallest size without overflowing the container. */
	min-width: min-content;

	/* Animation */
	&[data-open] {
		@media not ( prefers-reduced-motion ) {
			animation-duration: ${ ANIMATION_PARAMS.DURATION };
			animation-timing-function: ${ ANIMATION_PARAMS.EASING };
			animation-name: ${ slideDownAndFade };
			will-change: transform, opacity;
		}
	}

	&[data-focus-visible] {
		/* The outline will be on the trigger, rather than the popover. */
		outline: none;
	}
`;

export const SelectItem = styled( Ariakit.SelectItem )(
	( {
		size,
	}: {
		size: NonNullable< CustomSelectButtonSize[ 'size' ] >;
	} ) => css`
		cursor: default;
		display: flex;
		align-items: center;
		justify-content: space-between;
		font-size: ${ CONFIG.fontSize };
		// TODO: reassess line-height for non-legacy v2
		line-height: 28px;
		padding-block: ${ space( 2 ) };
		scroll-margin: ${ space( 1 ) };
		user-select: none;

		&[aria-disabled='true'] {
			cursor: not-allowed;
		}

		&[data-active-item] {
			background-color: ${ COLORS.theme.gray[ 300 ] };
		}

		${ getSelectItemSize( size ) }
	`
);

const truncateStyles = css`
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
`;

export const SelectedExperimentalHintWrapper = styled.div`
	${ truncateStyles }
`;

export const SelectedExperimentalHintItem = styled.span`
	color: ${ COLORS.theme.gray[ 600 ] };
	margin-inline-start: ${ space( 2 ) };
`;

export const WithHintItemWrapper = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	flex-wrap: wrap;
	flex: 1;
	column-gap: ${ space( 4 ) };
`;

export const WithHintItemHint = styled.span`
	color: ${ COLORS.theme.gray[ 600 ] };
	text-align: initial;
	line-height: ${ CONFIG.fontLineHeightBase };
	padding-inline-end: ${ space( 1 ) };
	margin-block: ${ space( 1 ) };
`;

export const SelectedItemCheck = styled( Ariakit.SelectItemCheck )`
	display: flex;
	align-items: center;
	margin-inline-start: ${ space( 2 ) };

	// Keep the checkmark vertically aligned at the top. Since the item text has a
	// 28px line height and the checkmark is 24px tall, a (28-24)/2 = 2px margin
	// is applied to keep the correct alignment between the text and the checkmark.
	align-self: start;
	margin-block-start: 2px;

	// Since the checkmark's dimensions are applied with 'em' units, setting a
	// font size of 0 allows the space reserved for the checkmark to collapse for
	// items that are not selected or that don't have an associated item hint.
	font-size: 0;
	${ WithHintItemWrapper } ~ &,
	&:not(:empty) {
		font-size: 24px; // Size of checkmark icon
	}
`;
