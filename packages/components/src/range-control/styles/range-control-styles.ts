/**
 * External dependencies
 */
import { css } from '@emotion/react';
import styled from '@emotion/styled';

/**
 * Internal dependencies
 */
import NumberControl from '../../number-control';
import { COLORS, rtl } from '../../utils';
import { space } from '../../utils/space';

import type {
	RangeMarkProps,
	RailProps,
	ThumbProps,
	TooltipProps,
	TrackProps,
	WrapperProps,
	RangeControlProps,
} from '../types';

const rangeHeightValue = 30;
const railHeight = 4;
const rangeHeight = () =>
	css( { height: rangeHeightValue, minHeight: rangeHeightValue } );
const thumbSize = 12;

const deprecatedHeight = ( {
	__next40pxDefaultSize,
}: Pick< RangeControlProps, '__next40pxDefaultSize' > ) =>
	! __next40pxDefaultSize && css( { minHeight: rangeHeightValue } );

type RootProps = Pick< RangeControlProps, '__next40pxDefaultSize' >;
export const Root = styled.div< RootProps >`
	-webkit-tap-highlight-color: transparent;
	align-items: center;
	display: flex;
	justify-content: flex-start;
	padding: 0;
	position: relative;
	touch-action: none;
	width: 100%;
	min-height: 40px;
	/* TODO: remove after removing the __next40pxDefaultSize prop */
	${ deprecatedHeight };
`;

const wrapperColor = ( { color = COLORS.ui.borderFocus }: WrapperProps ) =>
	css( { color } );

const wrapperMargin = ( { marks, __nextHasNoMarginBottom }: WrapperProps ) => {
	if ( ! __nextHasNoMarginBottom ) {
		return css( { marginBottom: marks ? 16 : undefined } );
	}
	return '';
};

export const Wrapper = styled.div< WrapperProps >`
	display: block;
	flex: 1;
	position: relative;
	width: 100%;

	${ wrapperColor };
	${ rangeHeight };
	${ wrapperMargin };
`;

export const BeforeIconWrapper = styled.span`
	display: flex; // ensures the height isn't affected by line-height
	margin-top: ${ railHeight }px;

	${ rtl( { marginRight: 6 } ) }
`;

export const AfterIconWrapper = styled.span`
	display: flex; // ensures the height isn't affected by line-height
	margin-top: ${ railHeight }px;

	${ rtl( { marginLeft: 6 } ) }
`;

const railBackgroundColor = ( { disabled, railColor }: RailProps ) => {
	let background = railColor || '';

	if ( disabled ) {
		background = COLORS.ui.backgroundDisabled;
	}

	return css( { background } );
};

export const Rail = styled.span`
	background-color: ${ COLORS.gray[ 300 ] };
	left: 0;
	pointer-events: none;
	right: 0;
	display: block;
	height: ${ railHeight }px;
	position: absolute;
	margin-top: ${ ( rangeHeightValue - railHeight ) / 2 }px;
	top: 0;
	border-radius: ${ railHeight }px;

	${ railBackgroundColor };
`;

const trackBackgroundColor = ( { disabled, trackColor }: TrackProps ) => {
	let background = trackColor || 'currentColor';

	if ( disabled ) {
		background = COLORS.gray[ 400 ];
	}

	return css( { background } );
};

export const Track = styled.span`
	background-color: currentColor;
	border-radius: ${ railHeight }px;
	height: ${ railHeight }px;
	pointer-events: none;
	display: block;
	position: absolute;
	margin-top: ${ ( rangeHeightValue - railHeight ) / 2 }px;
	top: 0;

	${ trackBackgroundColor };
`;

export const MarksWrapper = styled.span`
	display: block;
	pointer-events: none;
	position: relative;
	width: 100%;
	user-select: none;
`;

const markFill = ( { disabled, isFilled }: RangeMarkProps ) => {
	let backgroundColor = isFilled ? 'currentColor' : COLORS.gray[ 300 ];

	if ( disabled ) {
		backgroundColor = COLORS.gray[ 400 ];
	}

	return css( {
		backgroundColor,
	} );
};

export const Mark = styled.span`
	height: ${ thumbSize }px;
	left: 0;
	position: absolute;
	top: 9px;
	width: 1px;

	${ markFill };
`;

const markLabelFill = ( { isFilled }: RangeMarkProps ) => {
	return css( {
		color: isFilled ? COLORS.gray[ 700 ] : COLORS.gray[ 300 ],
	} );
};

export const MarkLabel = styled.span`
	color: ${ COLORS.gray[ 300 ] };
	font-size: 11px;
	position: absolute;
	top: 22px;
	white-space: nowrap;

	${ rtl( { left: 0 } ) };
	${ rtl(
		{ transform: 'translateX( -50% )' },
		{ transform: 'translateX( 50% )' }
	) };

	${ markLabelFill };
`;

const thumbColor = ( { disabled }: ThumbProps ) =>
	disabled
		? css`
				background-color: ${ COLORS.gray[ 400 ] };
		  `
		: css`
				background-color: ${ COLORS.theme.accent };
		  `;

export const ThumbWrapper = styled.span`
	align-items: center;
	display: flex;
	height: ${ thumbSize }px;
	justify-content: center;
	margin-top: ${ ( rangeHeightValue - thumbSize ) / 2 }px;
	outline: 0;
	pointer-events: none;
	position: absolute;
	top: 0;
	user-select: none;
	width: ${ thumbSize }px;
	border-radius: 50%;

	${ thumbColor };
	${ rtl( { marginLeft: -10 } ) };
	${ rtl(
		{ transform: 'translateX( 4.5px )' },
		{ transform: 'translateX( -4.5px )' }
	) };
`;

const thumbFocus = ( { isFocused }: ThumbProps ) => {
	return isFocused
		? css`
				&::before {
					content: ' ';
					position: absolute;
					background-color: ${ COLORS.theme.accent };
					opacity: 0.4;
					border-radius: 50%;
					height: ${ thumbSize + 8 }px;
					width: ${ thumbSize + 8 }px;
					top: -4px;
					left: -4px;
				}
		  `
		: '';
};

export const Thumb = styled.span< ThumbProps >`
	align-items: center;
	border-radius: 50%;
	height: 100%;
	outline: 0;
	position: absolute;
	user-select: none;
	width: 100%;

	${ thumbColor };
	${ thumbFocus };
`;

export const InputRange = styled.input`
	box-sizing: border-box;
	cursor: pointer;
	display: block;
	height: 100%;
	left: 0;
	margin: 0 -${ thumbSize / 2 }px;
	opacity: 0;
	outline: none;
	position: absolute;
	right: 0;
	top: 0;
	width: calc( 100% + ${ thumbSize }px );
`;

const tooltipShow = ( { show }: TooltipProps ) => {
	return css( {
		opacity: show ? 1 : 0,
	} );
};

const tooltipPosition = ( { position }: TooltipProps ) => {
	const isBottom = position === 'bottom';

	if ( isBottom ) {
		return css`
			bottom: -80%;
		`;
	}

	return css`
		top: -80%;
	`;
};

export const Tooltip = styled.span< TooltipProps >`
	background: rgba( 0, 0, 0, 0.8 );
	border-radius: 2px;
	color: white;
	display: inline-block;
	font-size: 12px;
	min-width: 32px;
	opacity: 0;
	padding: 4px 8px;
	pointer-events: none;
	position: absolute;
	text-align: center;
	user-select: none;
	line-height: 1.4;

	@media not ( prefers-reduced-motion ) {
		transition: opacity 120ms ease;
	}

	${ tooltipShow };
	${ tooltipPosition };
	${ rtl(
		{ transform: 'translateX(-50%)' },
		{ transform: 'translateX(50%)' }
	) }
`;

// @todo Refactor RangeControl with latest HStack configuration
// @see: packages/components/src/h-stack
export const InputNumber = styled( NumberControl )`
	display: inline-block;
	font-size: 13px;
	margin-top: 0;

	input[type='number']& {
		${ rangeHeight };
	}

	${ rtl( { marginLeft: `${ space( 4 ) } !important` } ) }
`;

export const ActionRightWrapper = styled.span`
	display: block;
	margin-top: 0;

	button,
	button.is-small {
		margin-left: 0;
		${ rangeHeight };
	}

	${ rtl( { marginLeft: 8 } ) }
`;
