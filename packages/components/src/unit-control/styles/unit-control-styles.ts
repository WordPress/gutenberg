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
			transition: box-shadow 0.1s linear;
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
			transition:
				box-shadow 0.1s linear,
				border 0.1s linear;

			${ rtl( { borderTopLeftRadius: 0, borderBottomLeftRadius: 0 } )() }

			&:not(:disabled):hover {
				background-color: ${ COLORS.gray[ 100 ] };
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
		default: css`
			display: flex;
			justify-content: center;
			align-items: center;

			&:where( :not( :disabled ) ):hover {
				box-shadow: 0 0 0
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
