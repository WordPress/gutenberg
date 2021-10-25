/**
 * External dependencies
 */
import { css } from '@emotion/react';
import styled from '@emotion/styled';
/**
 * Internal dependencies
 */
import { COLORS, rtl } from '../../utils';
import NumberControl from '../../number-control';
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
`;

const paddingStyles = ( { disableUnits }: InputProps ) => {
	const value = disableUnits ? 3 : 24;

	return css`
		${ rtl( { paddingRight: value } )() };
	`;
};

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
			${ paddingStyles };
		}
	}
`;

const unitSizeStyles = ( { selectSize }: SelectProps ) => {
	const sizes = {
		default: {
			height: 28,
			lineHeight: '24px',
			minHeight: 28,
			top: 1,
		},
		small: {
			height: 22,
			lineHeight: '18px',
			minHeight: 22,
			top: 1,
		},
	};

	return css( sizes[ selectSize ] );
};

const baseUnitLabelStyles = ( props: SelectProps ) => {
	return css`
		appearance: none;
		background: transparent;
		border-radius: 2px;
		border: none;
		box-sizing: border-box;
		color: ${ COLORS.darkGray[ 500 ] };
		display: block;
		font-size: 8px;
		line-height: 1;
		letter-spacing: -0.5px;
		outline: none;
		padding: 2px 1px;
		position: absolute;
		text-align-last: center;
		text-transform: uppercase;
		width: 20px;

		${ rtl( { borderTopLeftRadius: 0, borderBottomLeftRadius: 0 } )() }
		${ rtl( { right: 0 } )() }
		${ unitSizeStyles( props ) }
	`;
};

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

		&:hover {
			background-color: ${ COLORS.lightGray[ 300 ] };
		}

		&:focus {
			border-color: ${ COLORS.ui.borderFocus };
			outline: 2px solid transparent;
			outline-offset: 0;
		}

		&:disabled {
			cursor: initial;

			&:hover {
				background-color: transparent;
			}
		}
	}
`;
