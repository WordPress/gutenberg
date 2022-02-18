/**
 * External dependencies
 */
import { css } from '@emotion/react';

/**
 * Internal dependencies
 */
import { COLORS, CONFIG, rtl } from '../utils';
import { space } from '../ui/utils/space';
import {
	StyledField,
	StyledLabel,
} from '../base-control/styles/base-control-styles';
import { BackdropUI } from '../input-control/styles/input-control-styles';

import type { Border } from './types';

const labelStyles = css`
	font-weight: 500;
`;

export const BorderControl = css`
	position: relative;
`;

export const InnerWrapper = css`
	border: ${ CONFIG.borderWidth } solid ${ COLORS.gray[ 200 ] };
	border-radius: 2px;
	flex: 1 0 40%;

	/*
	 * Needs more thought. Aim is to prevent the border for BorderBoxControl
	 * showing through the control. Likely needs to take into account
	 * light/dark themes etc.
	 */
	background: #fff;

	/*
	 * Forces the width control to fill available space given UnitControl
	 * passes its className directly through to the input.
	 */
	> div:last-child {
		flex: 1;
		${ rtl( { marginLeft: 0 } )() }
	}

	/* If arbitrary width is supplied honor it. */
	&[style*='width'] {
		flex: 0 0 auto;
	}
`;

export const WrapperWidth = ( width: string ) => {
	return css`
		width: ${ width };
		flex: 0 0 auto;
	`;
};

export const BorderControlDropdown = css`
	background: #fff;
	${ rtl(
		{
			borderRadius: `1px 0 0 1px`,
			borderRight: `${ CONFIG.borderWidth } solid ${ COLORS.gray[ 200 ] }`,
		},
		{
			borderRadius: `0 1px 1px 0`,
			borderLeft: `${ CONFIG.borderWidth } solid ${ COLORS.gray[ 200 ] }`,
		}
	)() }

	&& > button {
		padding: ${ space( 1 ) };
		border-radius: inherit;
	}
`;

export const ColorIndicatorWrapper = ( border?: Border ) => {
	const { color, style } = border || {};

	const fallbackColor =
		!! style && style !== 'none' ? COLORS.gray[ 300 ] : undefined;

	return css`
		border-radius: 9999px;
		border: 2px solid transparent;
		border-style: ${ style === 'none' ? 'solid' : style };
		border-color: ${ color || fallbackColor };
		width: 28px;
		height: 28px;
		padding: 2px;

		/* ColorIndicator */
		& > span {
			background: linear-gradient(
				-45deg,
				transparent 48%,
				rgb( 0 0 0 / 20% ) 48%,
				rgb( 0 0 0 / 20% ) 52%,
				transparent 52%
			);
		}
	`;
};

export const BorderControlPopover = css`
	/* Remove padding from content, this will be re-added via inner elements*/
	&& > div > div {
		padding: 0;
	}
`;

export const BorderControlPopoverControls = css`
	padding: ${ space( 4 ) };

	> div:first-of-type > ${ StyledLabel } {
		margin-bottom: 0;
		${ labelStyles }
	}

	&& ${ StyledLabel } + button:not( .has-text ) {
		min-width: 24px;
		padding: 0;
	}
`;

export const BorderControlPopoverContent = css``;
export const BorderColorIndicator = css``;

export const ResetButton = css`
	justify-content: center;
	width: 100%;

	/* Override button component styling */
	&& {
		border-top: ${ CONFIG.borderWidth } solid ${ COLORS.gray[ 200 ] };
		height: 46px;
	}
`;

export const BorderWidthControl = css`
	/* Target the InputControl's backdrop */
	&&& ${ BackdropUI } {
		border: none;
	}

	/* Specificity required to overcome UnitControl padding */
	/* See packages/components/src/unit-control/styles/unit-control-styles.ts */
	&&& input {
		${ rtl( { paddingRight: 0 } )() }
	}
`;

export const BorderControlStylePicker = css`
	${ StyledLabel } {
		${ labelStyles }
	}
`;

export const BorderStyleButton = css`
	&&&&& {
		min-width: 30px;
		width: 30px;
		height: 30px;
		padding: 3px;
	}
`;

export const BorderSlider = css`
	flex: 1 1 60%;
	${ rtl( { marginRight: space( 3 ) } )() }

	${ StyledField } {
		margin-bottom: 0;
		display: flex;
		align-items: center;
	}
`;
