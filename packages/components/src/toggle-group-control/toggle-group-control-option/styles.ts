/**
 * External dependencies
 */
import { css } from '@emotion/react';
import styled from '@emotion/styled';

/**
 * Internal dependencies
 */
import { CONFIG, COLORS, reduceMotion } from '../../utils';

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
	background-color: ${ COLORS.gray[ 900 ] };
`;

export const ButtonContentView = styled.div`
	font-size: ${ CONFIG.fontSize };
	line-height: 1;
	position: absolute;
	top: 50%;
	left: 50%;
	transform: translate( -50%, -50% );
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
