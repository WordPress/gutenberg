/**
 * External dependencies
 */
import { css } from '@emotion/react';
import styled from '@emotion/styled';

/**
 * Internal dependencies
 */
import { CONFIG, COLORS, reduceMotion } from '../utils';

export const ToggleGroupControl = css`
	background: ${ COLORS.ui.background };
	border: 1px solid;
	border-color: ${ COLORS.ui.border };
	border-radius: ${ CONFIG.controlBorderRadius };
	display: inline-flex;
	min-height: ${ CONFIG.controlHeight };
	min-width: 0;
	padding: 2px;
	position: relative;
	transition: transform ${ CONFIG.transitionDurationFastest } linear;
	${ reduceMotion( 'transition' ) }
	&:hover {
		border-color: ${ COLORS.ui.borderHover };
	}

	&:focus-within {
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
	background: ${ COLORS.gray[ 900 ] };
	border-radius: ${ CONFIG.controlBorderRadius };
	box-shadow: ${ CONFIG.toggleGroupControlBackdropBoxShadow };
	left: 0;
	position: absolute;
	top: 2px;
	bottom: 2px;
	transition: transform ${ CONFIG.transitionDurationFast } ease;
	${ reduceMotion( 'transition' ) }
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

export const buttonView = css`
	align-items: center;
	appearance: none;
	background: transparent;
	border: none;
	border-radius: ${ CONFIG.controlBorderRadius };
	color: ${ COLORS.gray[ 700 ] };
	cursor: pointer;
	display: flex;
	height: 100%;
	justify-content: center;
	line-height: 100%;
	outline: none;
	padding: 0 12px;
	position: relative;
	text-align: center;
	transition: background ${ CONFIG.transitionDurationFast } linear,
		color ${ CONFIG.transitionDurationFast } linear, font-weight 60ms linear;
	${ reduceMotion( 'transition' ) }
	user-select: none;
	width: 100%;
	z-index: 2;

	&::-moz-focus-inner {
		border: 0;
	}

	&:active {
		background: ${ CONFIG.toggleGroupControlBackgroundColor };
	}
`;

export const buttonActive = css`
	color: ${ COLORS.white };
`;

export const ButtonContentView = styled.div`
	font-size: ${ CONFIG.fontSize };
	line-height: 1;
	position: absolute;
	top: 50%;
	left: 50%;
	transform: translate( -50%, -50% );
`;

export const SeparatorView = styled.div`
	background: ${ CONFIG.colorDivider };
	height: calc( 100% - 4px - 4px );
	position: absolute;
	right: 0;
	top: 4px;
	transition: background ${ CONFIG.transitionDuration } linear;
	${ reduceMotion( 'transition' ) }
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

export const medium = css`
	min-height: ${ CONFIG.controlHeight };
`;
