/**
 * External dependencies
 */
import { css } from '@emotion/react';
import styled from '@emotion/styled';

/**
 * Internal dependencies
 */
import { CONFIG, COLORS, reduceMotion } from '../../utils';
import type {
	ToggleGroupControlProps,
	ToggleGroupControlOptionBaseProps,
} from '../types';
import { BACKDROP_BG_COLOR } from '../toggle-group-control/styles';

const BUTTON_SIZES = {
	default: '30px',
	'__unstable-large': '34px',
};

export const LabelView = styled.div`
	display: inline-flex;
	max-width: 100%;
	min-width: 0;
	position: relative;
`;

export const labelBlock = css`
	flex: 1;
`;

export const buttonView = ( {
	isDeselectable,
	isIcon,
	isMultiple,
	isPressed,
	size,
}: Pick< ToggleGroupControlProps, 'isDeselectable' > &
	Pick< ToggleGroupControlOptionBaseProps, 'isIcon' | 'isMultiple' > & {
		isPressed?: boolean;
		size: NonNullable< ToggleGroupControlProps[ 'size' ] >;
	} ) => css`
	align-items: center;
	appearance: none;
	background: transparent;
	border: none;
	border-radius: ${ CONFIG.controlBorderRadius };
	color: ${ COLORS.gray[ 700 ] };
	fill: currentColor;
	cursor: pointer;
	display: flex;
	font-family: inherit;
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

	${ buttonHeight( { size } ) }
	${ isDeselectable && deselectable }
	${ isIcon && isIconStyles( { size } ) }
	${ isMultiple && isPressed && staticBackground }
	${ isPressed && pressed }
`;

const staticBackground = css`
	background: ${ BACKDROP_BG_COLOR };
`;

const pressed = css`
	color: ${ COLORS.white };

	&:active {
		background: transparent;
	}
`;

const deselectable = css`
	color: ${ COLORS.gray[ 900 ] };

	&:focus {
		box-shadow: inset 0 0 0 1px ${ COLORS.white },
			0 0 0 ${ CONFIG.borderWidthFocus } ${ COLORS.ui.theme };
		outline: 2px solid transparent;
	}
`;

const buttonHeight = ( {
	size,
}: {
	size: NonNullable< ToggleGroupControlProps[ 'size' ] >;
} ) => {
	return css`
		height: ${ BUTTON_SIZES[ size ] };
	`;
};

export const ButtonContentView = styled.div`
	display: flex;
	font-size: ${ CONFIG.fontSize };
	line-height: 1;
`;

const isIconStyles = ( {
	size,
}: {
	size: NonNullable< ToggleGroupControlProps[ 'size' ] >;
} ) => {
	return css`
		color: ${ COLORS.gray[ 900 ] };
		width: ${ BUTTON_SIZES[ size ] };
		padding-left: 0;
		padding-right: 0;
	`;
};
