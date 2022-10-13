/**
 * External dependencies
 */
import { css } from '@emotion/react';
import styled from '@emotion/styled';

/**
 * Internal dependencies
 */
import { COLORS, rtl } from '../../utils';
import { space } from '../../ui/utils/space';
import type { SelectControlProps } from '../types';
import InputControlSuffixWrapper from '../../input-control/input-suffix-wrapper';

interface SelectProps
	extends Pick< SelectControlProps, '__next36pxDefaultSize' | 'disabled' > {
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
}: SelectProps ) => {
	const sizes = {
		default: {
			height: 36,
			minHeight: 36,
			paddingTop: 0,
			paddingBottom: 0,
		},
		small: {
			height: 24,
			minHeight: 24,
			paddingTop: 0,
			paddingBottom: 0,
		},
		'__unstable-large': {
			height: 40,
			minHeight: 40,
			paddingTop: 0,
			paddingBottom: 0,
		},
	};

	if ( ! __next36pxDefaultSize ) {
		sizes.default = {
			height: 30,
			minHeight: 30,
			paddingTop: 0,
			paddingBottom: 0,
		};
	}

	const style = sizes[ selectSize ] || sizes.default;

	return css( style );
};

export const chevronIconSize = 18;

const sizePaddings = ( {
	__next36pxDefaultSize,
	selectSize = 'default',
}: SelectProps ) => {
	const iconWidth = chevronIconSize;

	const sizes = {
		default: {
			paddingLeft: 16,
			paddingRight: 16 + iconWidth,
		},
		small: {
			paddingLeft: 8,
			paddingRight: 8 + iconWidth,
		},
		'__unstable-large': {
			paddingLeft: 16,
			paddingRight: 16 + iconWidth,
		},
	};

	if ( ! __next36pxDefaultSize ) {
		sizes.default = {
			paddingLeft: 8,
			paddingRight: 8 + iconWidth,
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
		max-width: none;
		cursor: pointer;
		overflow: hidden;
		white-space: nowrap;
		text-overflow: ellipsis;

		${ disabledStyles };
		${ fontSizeStyles };
		${ sizeStyles };
		${ sizePaddings };
	}
`;

export const DownArrowWrapper = styled.div`
	margin-inline-end: ${ space( -1 ) }; // optically adjust the icon
	line-height: 0;
`;

export const InputControlSuffixWrapperWithClickThrough = styled(
	InputControlSuffixWrapper
)`
	position: absolute;
	pointer-events: none;

	${ rtl( { right: 0 } ) }
`;
