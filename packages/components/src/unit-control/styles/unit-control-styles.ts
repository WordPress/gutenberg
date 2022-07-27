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

const baseUnitLabelStyles = css`
	appearance: none;
	background: transparent;
	border-radius: 2px;
	border: none;
	box-sizing: border-box;
	color: ${ COLORS.darkGray[ 500 ] };
	display: block;
	font-size: 8px;
	letter-spacing: -0.5px;
	outline: none;
	padding: 2px 1px;
	text-align-last: center;
	text-transform: uppercase;
	width: 20px;

	${ rtl( { borderTopLeftRadius: 0, borderBottomLeftRadius: 0 } )() }
`;

export const UnitLabel = styled.div< SelectProps >`
	&&& {
		pointer-events: none;

		${ baseUnitLabelStyles };
	}
`;

export const UnitSelect = styled.select< SelectProps >`
	&&& {
		${ baseUnitLabelStyles };
		cursor: pointer;
		border: 1px solid transparent;
		height: 100%;
		/* Removing margin ensures focus styles neatly overlay the wrapper. */
		margin: 0;
		transition: box-shadow 0.1s linear, border 0.1s linear;

		&:hover {
			background-color: ${ COLORS.lightGray[ 300 ] };
		}

		&:focus {
			border: 1px solid ${ COLORS.ui.borderFocus };
			box-shadow: inset 0 0 0 ${ CONFIG.borderWidth }
				${ COLORS.ui.borderFocus };
			outline-offset: 0;
			outline: 2px solid transparent;
			z-index: 1;
		}

		&:disabled {
			cursor: initial;

			&:hover {
				background-color: transparent;
			}
		}
	}
`;
