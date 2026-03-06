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
import { space } from '../../utils/space';

// Using `selectSize` instead of `size` to avoid a type conflict with the
// `size` HTML attribute of the `select` element.
type SelectProps = {
	selectSize: SelectSize;
};

// TODO: Resolve need to use &&& to increase specificity
// https://github.com/WordPress/gutenberg/issues/18483

export const ValueInput = styled( NumberControl )`
	&&& {
		input {
			display: block;
			width: 100%;
		}

		${ BackdropUI } {
			transition: outline 0.1s ease-out;
		}
	}
`;

const baseUnitLabelStyles = ( { selectSize }: SelectProps ) => {
	const sizes = {
		small: css`
			box-sizing: border-box;
			padding: 2px 1px;
			width: 20px;
			font-size: 8px;
			line-height: 1;
			letter-spacing: -0.5px;
			text-transform: uppercase;
			text-align-last: center;

			&:not( :disabled ) {
				color: ${ COLORS.gray[ 800 ] };
			}
		`,
		default: css`
			box-sizing: border-box;
			min-width: 24px;
			max-width: 48px;
			height: 24px;
			margin-inline-end: ${ space( 2 ) };
			padding: ${ space( 1 ) };

			font-size: 13px;
			line-height: 1;
			text-align-last: center;
			white-space: nowrap;
			overflow: hidden;
			text-overflow: ellipsis;
			field-sizing: content;

			&:not( :disabled ) {
				color: ${ COLORS.theme.accent };
			}
		`,
	};

	return sizes[ selectSize ];
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
		small: css`
			height: 100%;
			border: 1px solid transparent;
			outline-width: 0;
			outline-style: solid;
			outline-color: transparent;
			outline-offset: 1px;
			transition:
				outline 0.1s ease-out,
				border 0.1s linear;

			${ rtl( { borderTopLeftRadius: 0, borderBottomLeftRadius: 0 } )() }

			&:not(:disabled):hover {
				background-color: ${ COLORS.gray[ 100 ] };
			}

			&:focus {
				border: 1px solid ${ COLORS.ui.borderFocus };
				outline-width: ${ CONFIG.borderWidthFocus };
				outline-color: ${ COLORS.ui.borderFocus };
				z-index: 1;
			}
		`,
		default: css`
			display: flex;
			justify-content: center;
			align-items: center;
			outline-width: 0;
			outline-style: solid;
			outline-color: transparent;
			outline-offset: 1px;

			@media not ( prefers-reduced-motion ) {
				transition: outline 0.1s ease-out;
			}

			&:where( :not( :disabled ) ):hover {
				outline-width: ${ CONFIG.borderWidth };
				outline-color: ${ COLORS.ui.borderFocus };
			}

			&:focus {
				outline-width: ${ CONFIG.borderWidthFocus };
				outline-color: ${ COLORS.ui.borderFocus };
			}
		`,
	};

	return sizes[ selectSize ];
};

export const UnitSelect = styled.select< SelectProps >`
	// The &&& counteracts <select> styles in WP forms.css
	&&& {
		appearance: none;
		background: transparent;
		border-radius: ${ CONFIG.radiusXSmall };
		border: none;
		display: block;
		outline: none;
		/* Removing margin ensures focus styles neatly overlay the wrapper. */
		margin: 0;
		min-height: auto;
		font-family: inherit;

		&:not( :disabled ) {
			cursor: pointer;
		}

		${ baseUnitLabelStyles };
		${ unitSelectSizes };
	}
`;
