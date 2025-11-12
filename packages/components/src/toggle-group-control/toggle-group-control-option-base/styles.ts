/**
 * External dependencies
 */
import { css } from '@emotion/react';
import styled from '@emotion/styled';

/**
 * Internal dependencies
 */
import { CONFIG, COLORS } from '../../utils';
import type {
	ToggleGroupControlProps,
	ToggleGroupControlOptionBaseProps,
} from '../types';

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
	isPressed,
	size,
}: Pick< ToggleGroupControlProps, 'isDeselectable' | 'size' > &
	Pick< ToggleGroupControlOptionBaseProps, 'isIcon' > & {
		isPressed?: boolean;
	} ) => css`
	align-items: center;
	appearance: none;
	background: transparent;
	border: none;
	border-radius: ${ CONFIG.radiusXSmall };
	color: ${ COLORS.theme.gray[ 700 ] };
	fill: currentColor;
	cursor: pointer;
	display: flex;
	font-family: inherit;
	height: 100%;
	justify-content: center;
	line-height: 100%;
	outline: none;
	padding: 0 12px;
	position: relative;
	text-align: center;
	@media not ( prefers-reduced-motion ) {
		transition:
			background ${ CONFIG.transitionDurationFast } linear,
			color ${ CONFIG.transitionDurationFast } linear,
			font-weight 60ms linear;
	}
	user-select: none;
	width: 100%;
	z-index: 2;

	&::-moz-focus-inner {
		border: 0;
	}

	&[disabled] {
		opacity: 0.4;
		cursor: default;
	}

	&:active {
		background: ${ COLORS.ui.background };
	}

	${ isDeselectable && deselectable }
	${ isIcon && isIconStyles( { size } ) }
	${ isPressed && pressed }
`;

const pressed = css`
	color: ${ COLORS.theme.foregroundInverted };

	&:active {
		background: transparent;
	}
`;

const deselectable = css`
	color: ${ COLORS.theme.foreground };

	&:focus {
		box-shadow:
			inset 0 0 0 1px ${ COLORS.ui.background },
			0 0 0 ${ CONFIG.borderWidthFocus } ${ COLORS.theme.accent };
		outline: 2px solid transparent;
	}
`;

export const ButtonContentView = styled.div`
	display: flex;
	font-size: ${ CONFIG.fontSize };
	line-height: 1;
`;

const isIconStyles = ( {
	size = 'default',
}: Pick< ToggleGroupControlProps, 'size' > ) => {
	const iconButtonSizes = {
		default: '30px',
		'__unstable-large': '32px',
	};

	return css`
		color: ${ COLORS.theme.foreground };
		height: ${ iconButtonSizes[ size ] };
		aspect-ratio: 1;
		padding-left: 0;
		padding-right: 0;
	`;
};
