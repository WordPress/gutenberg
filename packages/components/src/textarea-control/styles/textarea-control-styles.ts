/**
 * External dependencies
 */
import styled from '@emotion/styled';
import { css } from '@emotion/react';

/**
 * Internal dependencies
 */
import { font } from '../../utils/font';
import { COLORS } from '../../utils/colors-values';
import { CONFIG } from '../../utils';
import { breakpoint } from '../../utils/breakpoint';

const inputStyleNeutral = css`
	outline-width: 0;
	outline-style: solid;
	outline-color: transparent;
	outline-offset: 1px;
	border-radius: ${ CONFIG.radiusSmall };
	border: ${ CONFIG.borderWidth } solid ${ COLORS.ui.border };

	@media not ( prefers-reduced-motion ) {
		transition: outline 0.1s ease-out;
	}
`;

const inputStyleFocus = css`
	border-color: ${ COLORS.theme.accent };
	outline-width: ${ CONFIG.borderWidthFocus };
	outline-color: ${ COLORS.theme.accent };
`;

export const StyledTextarea = styled.textarea`
	width: 100%;
	display: block;
	font-family: ${ font( 'default.fontFamily' ) };
	line-height: 20px;
	background: ${ COLORS.theme.background };
	color: ${ COLORS.theme.foreground };
	resize: vertical;

	// Vertical padding is to match the standard 40px control height when rows=1,
	// in conjunction with the 20px line-height.
	// "Standard" metrics are 10px 12px, but subtracts 1px each to account for the border width.
	padding: 9px 11px;

	// Matching the 20px line-height + the 9px top and bottom padding.
	min-height: 38px;

	${ inputStyleNeutral };

	/* Fonts smaller than 16px causes mobile safari to zoom. */
	font-size: ${ font( 'mobileTextMinFontSize' ) };

	${ breakpoint( 'small' ) } {
		font-size: ${ font( 'default.fontSize' ) };
	}

	&:focus {
		${ inputStyleFocus }
	}

	// Use opacity to work in various editor styles.
	&::-webkit-input-placeholder {
		color: ${ COLORS.ui.darkGrayPlaceholder };
	}

	&::-moz-placeholder {
		color: ${ COLORS.ui.darkGrayPlaceholder };
	}

	&:-ms-input-placeholder {
		color: ${ COLORS.ui.darkGrayPlaceholder };
	}

	.is-dark-theme & {
		&::-webkit-input-placeholder {
			color: ${ COLORS.ui.lightGrayPlaceholder };
		}

		&::-moz-placeholder {
			color: ${ COLORS.ui.lightGrayPlaceholder };
		}

		&:-ms-input-placeholder {
			color: ${ COLORS.ui.lightGrayPlaceholder };
		}
	}
`;
