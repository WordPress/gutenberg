/**
 * External dependencies
 */
import { css } from '@emotion/react';

/**
 * Internal dependencies
 */
import { COLORS, CONFIG, boxSizingReset, rtl } from '../utils';
import { space } from '../utils/space';
import { StyledLabel } from '../base-control/styles/base-control-styles';
import {
	ValueInput as UnitControlWrapper,
	UnitSelect,
} from '../unit-control/styles/unit-control-styles';

import type { Border } from './types';

const labelStyles = css`
	font-weight: 500;
`;

const focusBoxShadow = css`
	box-shadow: inset ${ CONFIG.controlBoxShadowFocus };
`;

export const borderControl = css`
	border: 0;
	padding: 0;
	margin: 0;
	${ boxSizingReset }
`;

export const innerWrapper = () => css`
	${ UnitControlWrapper } {
		flex: 1 1 40%;
	}
	&& ${ UnitSelect } {
		/* Prevent unit select forcing min height larger than its UnitControl */
		min-height: 0;
	}
`;

/*
 * This style is only applied to the UnitControl wrapper when the border width
 * field should be a set width. Omitting this allows the UnitControl &
 * RangeControl to share the available width in a 40/60 split respectively.
 */
export const wrapperWidth = css`
	${ UnitControlWrapper } {
		/* Force the UnitControl's set width. */
		flex: 0 0 auto;
	}
`;

export const wrapperHeight = ( size?: 'default' | '__unstable-large' ) => {
	return css`
		height: ${ size === '__unstable-large' ? '40px' : '30px' };
	`;
};

export const borderControlDropdown = css`
	background: #fff;

	&& > button {
		aspect-ratio: 1;
		padding: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		${ rtl(
			{ borderRadius: `2px 0 0 2px` },
			{ borderRadius: `0 2px 2px 0` }
		)() }
		border: ${ CONFIG.borderWidth } solid ${ COLORS.ui.border };

		&:focus,
		&:hover:not( :disabled ) {
			${ focusBoxShadow }
			border-color: ${ COLORS.ui.borderFocus };
			z-index: 1;
			position: relative;
		}
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

export const colorIndicatorWrapper = (
	border?: Border,
	size?: 'default' | '__unstable-large'
) => {
	const { style } = border || {};

	return css`
		border-radius: 9999px;
		border: 2px solid transparent;
		${ style ? colorIndicatorBorder( border ) : undefined }
		width: ${ size === '__unstable-large' ? '24px' : '22px' };
		height: ${ size === '__unstable-large' ? '24px' : '22px' };
		padding: ${ size === '__unstable-large' ? '2px' : '1px' };

		/*
		 * ColorIndicator
		 *
		 * The transparent colors used here ensure visibility of the indicator
		 * over the active state of the border control dropdown's toggle button.
		 */
		& > span {
			height: ${ space( 4 ) };
			width: ${ space( 4 ) };
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

// Must equal $color-palette-circle-size from:
// @wordpress/components/src/circular-option-picker/style.scss
const swatchSize = 28;
const swatchGap = 12;

export const borderControlPopoverControls = css`
	width: ${ swatchSize * 6 + swatchGap * 5 }px;

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
		border-top: ${ CONFIG.borderWidth } solid ${ COLORS.gray[ 400 ] };
		border-top-left-radius: 0;
		border-top-right-radius: 0;
		height: 40px;
	}
`;

export const borderSlider = () => css`
	flex: 1 1 60%;
	${ rtl( { marginRight: space( 3 ) } )() }
`;
