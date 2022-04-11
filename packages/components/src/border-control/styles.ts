/**
 * External dependencies
 */
import { css } from '@emotion/react';
import type { CSSProperties } from 'react';

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
import { Root as UnitControlWrapper } from '../unit-control/styles/unit-control-styles';

import type { Border } from './types';

const labelStyles = css`
	font-weight: 500;
`;

export const borderControl = css`
	position: relative;
`;

export const innerWrapper = () => css`
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
	${ UnitControlWrapper } {
		flex: 1;
		${ rtl( { marginLeft: 0 } )() }
	}
`;

export const wrapperWidth = ( width: CSSProperties[ 'width' ] ) => {
	return css`
		width: ${ width };
		flex: 0 0 auto;
	`;
};

export const borderControlDropdown = () => css`
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

export const colorIndicatorBorder = ( border?: Border ) => {
	const { color, style } = border || {};

	const fallbackColor =
		!! style && style !== 'none' ? COLORS.gray[ 300 ] : undefined;

	return css`
		border-style: ${ style === 'none' ? 'solid' : style };
		border-color: ${ color || fallbackColor };
	`;
};

export const colorIndicatorWrapper = ( border?: Border ) => {
	const { style } = border || {};

	return css`
		border-radius: 9999px;
		border: 2px solid transparent;
		${ style ? colorIndicatorBorder( border ) : undefined }
		width: 28px;
		height: 28px;
		padding: 2px;

		/*
		 * ColorIndicator
		 *
		 * The transparent colors used here ensure visibility of the indicator
		 * over the active state of the border control dropdown's toggle button.
		 */
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

export const borderControlPopover = css`
	/* Remove padding from content, this will be re-added via inner elements*/
	&& > div > div {
		padding: 0;
	}
`;

export const borderControlPopoverControls = css`
	padding: ${ space( 2 ) };

	> div:first-of-type > ${ StyledLabel } {
		margin-bottom: 0;
		${ labelStyles }
	}

	&& ${ StyledLabel } + button:not( .has-text ) {
		min-width: 24px;
		padding: 0;
	}
`;

export const borderControlPopoverContent = css``;
export const borderColorIndicator = css``;

export const resetButton = css`
	justify-content: center;
	width: 100%;

	/* Override button component styling */
	&& {
		border-top: ${ CONFIG.borderWidth } solid ${ COLORS.gray[ 200 ] };
		height: 46px;
	}
`;

export const borderWidthControl = () => css`
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

export const borderControlStylePicker = css`
	${ StyledLabel } {
		${ labelStyles }
	}
`;

export const borderStyleButton = css`
	&&&&& {
		min-width: 30px;
		width: 30px;
		height: 30px;
		padding: 3px;
	}
`;

export const borderSlider = () => css`
	flex: 1 1 60%;
	${ rtl( { marginRight: space( 3 ) } )() }

	${ StyledField } {
		margin-bottom: 0;
		font-size: 0;
		display: flex;
	}
`;
