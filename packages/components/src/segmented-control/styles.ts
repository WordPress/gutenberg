/**
 * External dependencies
 */
import { css } from '@emotion/core';
import styled from '@emotion/styled';

/**
 * Internal dependencies
 */
import { CONFIG, COLORS } from '../utils';

export const SegmentedControl = css`
	background: ${ COLORS.ui.background };
	border: 1px solid;
	border-color: ${ COLORS.ui.border };
	border-radius: calc( ${ CONFIG.controlBorderRadius } + 1px );
	display: inline-flex;
	min-height: ${ CONFIG.controlHeight };
	min-width: 0;
	padding: 1px;
	position: relative;
	transition: all ${ CONFIG.transitionDurationFastest } linear;

	&:hover {
		border-color: ${ COLORS.ui.borderHover };
	}

	&:focus {
		border-color: ${ COLORS.ui.borderFocus };
		box-shadow: ${ CONFIG.controlBoxShadowFocus };
		outline: none;
		z-index: 1;
	}
`;

export const block = css`
	display: flex;
	width: 100%;
`;

export const BackdropView = styled.div`
	background: ${ COLORS.ui.background };
	border: 1px solid ${ CONFIG.segmentedControlBackdropBorderColor };
	border-radius: ${ CONFIG.controlBorderRadius };
	box-shadow: ${ CONFIG.segmentedControlBackdropBoxShadow };
	height: calc( ${ CONFIG.controlHeight } - 4px );
	left: 0;
	position: absolute;
	transition: all ${ CONFIG.transitionDurationFast } ease;
	z-index: 1;
`;

export const LabelView = styled.div`
	display: inline-flex;
	max-width: 100%;
	min-width: 0;
	position: relative;
`;

export const labelBlock = css`
	flex: 1;
`;

export const ButtonView = styled.button`
	align-items: center;
	appearance: none;
	background: transparent;
	border: none;
	border-radius: ${ CONFIG.controlBorderRadius };
	color: ${ CONFIG.controlTextActiveColor }; // ui.color.text
	cursor: pointer;
	display: flex;
	height: 100%;
	justify-content: center;
	line-height: 100%;
	outline: none;
	padding: 0 12px;
	position: relative;
	text-align: center;
	transition: background-color ${ CONFIG.transitionDurationFast } linear,
		color ${ CONFIG.transitionDurationFast } linear, font-weight 60ms linear;
	user-select: none;
	width: 100%;
	z-index: 2;

	&::-moz-focus-inner {
		border: 0;
	}

	&:active {
		background: ${ CONFIG.segmentedControlButtonColorActive };
	}
`;

export const ButtonContentView = styled.div`
	font-size: ${ CONFIG.fontSize };
	left: 50%;
	line-height: 1;
	position: absolute;
	top: 50%;
	transform: translate( -50%, -50% );
`;

export const buttonActive = css`
	color: ${ CONFIG.controlTextActiveColor };
	font-weight: bold;
`;

export const SeparatorView = styled.div`
	background: ${ CONFIG.colorDivider };
	height: calc( 100% - 4px - 4px );
	position: absolute;
	right: 0;
	top: 4px;
	transition: background ${ CONFIG.transitionDuration } linear;
	width: 1px;
`;

export const separatorActive = css`
	background: transparent;
`;

export const LabelPlaceholderView = styled.div`
	font-size: ${ CONFIG.fontSize };
	font-weight: bold;
	height: 0;
	overflow: hidden;
	visibility: hidden;
`;

export const large = css`
	min-height: ${ CONFIG.controlHeightLarge };
`;

export const small = css`
	min-height: ${ CONFIG.controlHeightSmall };
`;
