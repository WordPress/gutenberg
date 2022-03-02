/**
 * External dependencies
 */
import { css } from '@emotion/react';
import styled from '@emotion/styled';

/**
 * Internal dependencies
 */
import { COLORS, rtl } from '../../utils';
import type { Size } from '../types';

interface SelectProps {
	disabled?: boolean;
	selectSize?: Size;
}

const disabledStyles = ( { disabled }: SelectProps ) => {
	if ( ! disabled ) return '';

	return css( {
		color: COLORS.ui.textDisabled,
	} );
};

const fontSizeStyles = ( { selectSize }: SelectProps ) => {
	const sizes = {
		default: '13px',
		small: '11px',
		'__unstable-large': '13px',
	};

	const fontSize = sizes[ selectSize as Size ];
	const fontSizeMobile = '16px';

	if ( ! fontSize ) return '';

	return css`
		font-size: ${ fontSizeMobile };

		@media ( min-width: 600px ) {
			font-size: ${ fontSize };
		}
	`;
};

const sizeStyles = ( { selectSize }: SelectProps ) => {
	const sizes = {
		default: {
			height: 30,
			lineHeight: 1,
			minHeight: 30,
		},
		small: {
			height: 24,
			lineHeight: 1,
			minHeight: 24,
		},
		'__unstable-large': {
			height: 40,
			lineHeight: 1,
			minHeight: 40,
		},
	};

	const style = sizes[ selectSize as Size ] || sizes.default;

	return css( style );
};

const sizePaddings = ( { selectSize = 'default' }: SelectProps ) => {
	const sizes = {
		default: {
			paddingLeft: 8,
			paddingRight: 24,
		},
		small: {
			paddingLeft: 8,
			paddingRight: 24,
		},
		'__unstable-large': {
			paddingLeft: 16,
			paddingRight: 32,
		},
	};
	return rtl( sizes[ selectSize ] );
};

// TODO: Resolve need to use &&& to increase specificity
// https://github.com/WordPress/gutenberg/issues/18483

export const Select = styled.select< SelectProps >`
	&&& {
		appearance: none;
		background: transparent;
		box-sizing: border-box;
		border: none;
		box-shadow: none !important;
		color: ${ COLORS.black };
		display: block;
		font-family: inherit;
		margin: 0;
		width: 100%;

		${ disabledStyles };
		${ fontSizeStyles };
		${ sizeStyles };
		${ sizePaddings };
	}
`;

export const DownArrowWrapper = styled.div`
	align-items: center;
	bottom: 0;
	box-sizing: border-box;
	display: flex;
	padding: 0 4px;
	pointer-events: none;
	position: absolute;
	top: 0;

	${ rtl( { right: 0 } ) }

	svg {
		display: block;
	}
`;
