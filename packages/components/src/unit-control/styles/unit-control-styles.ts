/**
 * External dependencies
 */
import { css } from '@emotion/react';
import styled from '@emotion/styled';
/**
 * Internal dependencies
 */
import { COLORS, CONFIG, rtl } from '../../utils';
import NumberControl from '../../number-control';
import { BackdropUI } from '../../input-control/styles/input-control-styles';
import type { SelectSize } from '../types';
import { space } from '../../ui/utils/space';

// Using `selectSize` instead of `size` to avoid a type conflict with the
// `size` HTML attribute of the `select` element.
type SelectProps = {
	selectSize: SelectSize;
};

type InputProps = {
	disableUnits?: boolean;
};

export const Root = styled.div`
	box-sizing: border-box;
	position: relative;

	/* Target the InputControl's backdrop and make focus styles smoother. */
	&&& ${ BackdropUI } {
		transition: box-shadow 0.1s linear;
	}
`;

const arrowStyles = ( { disableUnits }: InputProps ) => {
	if ( disableUnits ) return '';

	return css`
		&::-webkit-outer-spin-button,
		&::-webkit-inner-spin-button {
			-webkit-appearance: none;
			margin: 0;
		}
	`;
};

// TODO: Resolve need to use &&& to increase specificity
// https://github.com/WordPress/gutenberg/issues/18483

export const ValueInput = styled( NumberControl )`
	&&& {
		input {
			appearance: none;
			-moz-appearance: textfield;
			display: block;
			width: 100%;

			${ arrowStyles };
		}
	}
`;

const baseUnitLabelStyles = ( { selectSize }: SelectProps ) => {
	const sizes = {
		default: css`
			box-sizing: border-box;
			padding: 2px 1px;
			width: 20px;
			color: ${ COLORS.darkGray[ 500 ] };
			font-size: 8px;
			letter-spacing: -0.5px;
			text-transform: uppercase;
			text-align-last: center;
		`,
		large: css`
			box-sizing: border-box;
			width: 36px;
			height: 36px;
			margin-inline-end: 2px;
			padding: ${ space( 1 ) };
			display: flex;
			justify-content: center;
			align-items: center;
			color: ${ COLORS.ui.theme };
			font-size: 13px;
			text-align-last: center;
		`,
	};

	return selectSize === '__unstable-large' ? sizes.large : sizes.default;
};

export const UnitLabel = styled.div< SelectProps >`
	&&& {
		pointer-events: none;

		${ baseUnitLabelStyles };

		color: ${ COLORS.gray[ 900 ] };
	}
`;

const unitSelectSizes = ( { selectSize = 'default' }: SelectProps ) => {
	const sizes = {
		default: css`
			height: 100%;
			/* Removing margin ensures focus styles neatly overlay the wrapper. */
			margin: 0;
			border: 1px solid transparent;
			transition: box-shadow 0.1s linear, border 0.1s linear;

			${ rtl( { borderTopLeftRadius: 0, borderBottomLeftRadius: 0 } )() }

			&:not(:disabled):hover {
				background-color: ${ COLORS.lightGray[ 300 ] };
			}

			&:focus {
				border: 1px solid ${ COLORS.ui.borderFocus };
				box-shadow: inset 0 0 0
					${ CONFIG.borderWidth + ' ' + COLORS.ui.borderFocus };
				outline-offset: 0;
				outline: 2px solid transparent;
				z-index: 1;
			}
		`,
		large: css`
			&:hover {
				color: ${ COLORS.ui.borderFocus };
				box-shadow: inset 0 0 0
					${ CONFIG.borderWidth + ' ' + COLORS.ui.borderFocus };
				outline: ${ CONFIG.borderWidth } solid transparent; // For High Contrast Mode
			}

			&:focus {
				box-shadow: 0 0 0
					${ CONFIG.borderWidthFocus + ' ' + COLORS.ui.borderFocus };
				outline: ${ CONFIG.borderWidthFocus } solid transparent; // For High Contrast Mode
			}
		`,
	};

	return selectSize === '__unstable-large' ? sizes.large : sizes.default;
};

export const UnitSelect = styled.select< SelectProps >`
	appearance: none;
	background: transparent;
	border-radius: 2px;
	border: none;
	display: block;
	outline: none;
	font-family: inherit;

	&:not( :disabled ) {
		cursor: pointer;
	}

	${ baseUnitLabelStyles };
	${ unitSelectSizes };
`;
