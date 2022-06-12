/**
 * External dependencies
 */
import { css } from '@emotion/react';
import styled from '@emotion/styled';

/**
 * Internal dependencies
 */
import { CONFIG, COLORS, reduceMotion } from '../../utils';

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
