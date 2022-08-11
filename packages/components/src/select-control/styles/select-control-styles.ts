/**
 * External dependencies
 */
import { css } from '@emotion/react';
import styled from '@emotion/styled';

/**
 * Internal dependencies
 */
import { COLORS, rtl } from '../../utils';
import type { SelectControlProps } from '../types';

interface SelectProps
	extends Pick<
		SelectControlProps,
		'__next36pxDefaultSize' | 'disabled' | 'multiple'
	> {
	// Using `selectSize` instead of `size` to avoid a type conflict with the
	// `size` HTML attribute of the `select` element.
	selectSize?: SelectControlProps[ 'size' ];
}

const disabledStyles = ( { disabled }: SelectProps ) => {
	if ( ! disabled ) return '';

	return css( {
		color: COLORS.ui.textDisabled,
	} );
};

const fontSizeStyles = ( { selectSize = 'default' }: SelectProps ) => {
	const sizes = {
		default: '13px',
		small: '11px',
		'__unstable-large': '13px',
	};

	const fontSize = sizes[ selectSize ];
	const fontSizeMobile = '16px';

	if ( ! fontSize ) return '';

	return css`
		font-size: ${ fontSizeMobile };

		@media ( min-width: 600px ) {
			font-size: ${ fontSize };
		}
	`;
};

const sizeStyles = ( {
	__next36pxDefaultSize,
	selectSize = 'default',
	multiple,
}: SelectProps ) => {
	const sizes = {
		default: {
			height: multiple ? 36 * 2 : 36,
			minHeight: 36,
			paddingTop: 0,
			paddingBottom: 0,
		},
		small: {
			height: multiple ? 24 * 2 : 24,
			minHeight: 24,
			paddingTop: 0,
			paddingBottom: 0,
		},
		'__unstable-large': {
			height: multiple ? 40 * 2 : 40,
			minHeight: 40,
			paddingTop: 0,
			paddingBottom: 0,
		},
	};

	if ( ! __next36pxDefaultSize ) {
		sizes.default = {
			height: multiple ? 30 * 2 : 30,
			minHeight: 30,
			paddingTop: 0,
			paddingBottom: 0,
		};
	}

	const style = sizes[ selectSize ] || sizes.default;

	return css( style );
};

const sizePaddings = ( {
	__next36pxDefaultSize,
	selectSize = 'default',
	multiple,
}: SelectProps ) => {
	const equalizePadding = ( paddingLeft: number, paddingRight: number ) => {
		return multiple ? paddingLeft : paddingRight;
	};

	const sizes = {
		default: {
			paddingLeft: 16,
			paddingRight: equalizePadding( 16, 32 ),
		},
		small: {
			paddingLeft: 8,
			paddingRight: equalizePadding( 8, 24 ),
		},
		'__unstable-large': {
			paddingLeft: 16,
			paddingRight: equalizePadding( 16, 32 ),
		},
	};

	if ( ! __next36pxDefaultSize ) {
		sizes.default = {
			paddingLeft: 8,
			paddingRight: equalizePadding( 8, 24 ),
		};
	}

	return rtl( sizes[ selectSize ] || sizes.default );
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
		color: ${ COLORS.gray[ 900 ] };
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
