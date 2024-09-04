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
	box-shadow: 0 0 0 transparent;
	border-radius: ${ CONFIG.radiusSmall };
	border: ${ CONFIG.borderWidth } solid ${ COLORS.ui.border };

	@media not ( prefers-reduced-motion ) {
		transition: box-shadow 0.1s linear;
	}
`;

const inputStyleFocus = css`
	border-color: ${ COLORS.theme.accent };
	box-shadow: 0 0 0
		calc( ${ CONFIG.borderWidthFocus } - ${ CONFIG.borderWidth } )
		${ COLORS.theme.accent };

	// Windows High Contrast mode will show this outline, but not the box-shadow.
	outline: 2px solid transparent;
`;

export const StyledTextarea = styled.textarea`
	width: 100%;
	display: block;
	font-family: ${ font( 'default.fontFamily' ) };
	line-height: 20px;

	// Vertical padding is to match the standard 40px control height when rows=1,
	// in conjunction with the 20px line-height.
	// "Standard" metrics are 10px 12px, but subtracts 1px each to account for the border width.
	padding: 9px 11px;

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
		opacity: 1; // Necessary because Firefox reduces this from 1.
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
			opacity: 1; // Necessary because Firefox reduces this from 1.
			color: ${ COLORS.ui.lightGrayPlaceholder };
		}

		&:-ms-input-placeholder {
			color: ${ COLORS.ui.lightGrayPlaceholder };
		}
	}
`;
