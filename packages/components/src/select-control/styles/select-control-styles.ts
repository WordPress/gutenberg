/**
 * External dependencies
 */
import { css } from '@emotion/react';
import styled from '@emotion/styled';

/**
 * Internal dependencies
 */
import { COLORS, rtl } from '../../utils';
import { space } from '../../utils/space';
import type { SelectControlProps } from '../types';
import InputControlSuffixWrapper from '../../input-control/input-suffix-wrapper';
import { fontSizeStyles } from '../../input-control/styles/input-control-styles';
import InputBase from '../../input-control/input-base';

interface SelectProps
	extends Pick<
		SelectControlProps,
		'__next40pxDefaultSize' | 'disabled' | 'multiple' | 'variant'
	> {
	// Using `selectSize` instead of `size` to avoid a type conflict with the
	// `size` HTML attribute of the `select` element.
	selectSize?: SelectControlProps[ 'size' ];
}

const disabledStyles = ( { disabled }: SelectProps ) => {
	if ( ! disabled ) {
		return '';
	}

	return css`
		color: ${ COLORS.ui.textDisabled };
		cursor: default;
	`;
};

const inputBaseVariantStyles = ( { variant }: SelectProps ) => {
	if ( variant === 'minimal' ) {
		return css`
			display: inline-flex;
		`;
	}

	return '';
};

export const StyledInputBase = styled( InputBase )`
	color: ${ COLORS.theme.foreground };
	cursor: pointer;

	${ disabledStyles }
	${ inputBaseVariantStyles }
`;

const sizeStyles = ( {
	__next40pxDefaultSize,
	multiple,
	selectSize = 'default',
}: SelectProps ) => {
	if ( multiple ) {
		// When `multiple`, just use the native browser styles
		// without setting explicit height.
		return;
	}

	const sizes = {
		default: {
			height: 40,
			minHeight: 40,
			paddingTop: 0,
			paddingBottom: 0,
		},
		small: {
			height: 24,
			minHeight: 24,
			paddingTop: 0,
			paddingBottom: 0,
		},
		compact: {
			height: 32,
			minHeight: 32,
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

	if ( ! __next40pxDefaultSize ) {
		sizes.default = sizes.compact;
	}

	const style = sizes[ selectSize ] || sizes.default;

	return css( style );
};

export const chevronIconSize = 18;

const sizePaddings = ( {
	__next40pxDefaultSize,
	multiple,
	selectSize = 'default',
}: SelectProps ) => {
	const padding = {
		default: 16,
		small: 8,
		compact: 8,
		'__unstable-large': 16,
	};

	if ( ! __next40pxDefaultSize ) {
		padding.default = padding.compact;
	}

	const selectedPadding = padding[ selectSize ] || padding.default;

	return rtl( {
		paddingLeft: selectedPadding,
		paddingRight: selectedPadding + chevronIconSize,
		...( multiple
			? {
					paddingTop: selectedPadding,
					paddingBottom: selectedPadding,
			  }
			: {} ),
	} );
};

const overflowStyles = ( { multiple }: SelectProps ) => {
	return {
		overflow: multiple ? 'auto' : 'hidden',
	};
};

const variantStyles = ( { variant }: SelectProps ) => {
	if ( variant === 'minimal' ) {
		return css( {
			fieldSizing: 'content',
		} );
	}

	return '';
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
		color: currentColor; // Overrides hover/focus styles in forms.css
		cursor: inherit;
		display: block;
		font-family: inherit;
		margin: 0;
		width: 100%;
		max-width: none;
		white-space: nowrap;
		text-overflow: ellipsis;

		${ fontSizeStyles };
		${ sizeStyles };
		${ sizePaddings };
		${ overflowStyles }
		${ variantStyles }
	}
`;

export const DownArrowWrapper = styled.div`
	margin-inline-end: ${ space( -1 ) }; // optically adjust the icon
	line-height: 0;

	path {
		fill: currentColor;
	}
`;

export const InputControlSuffixWrapperWithClickThrough = styled(
	InputControlSuffixWrapper
)`
	position: absolute;
	pointer-events: none;

	${ rtl( { right: 0 } ) }
`;
