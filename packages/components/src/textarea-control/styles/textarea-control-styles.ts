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
	padding: 6px 8px;
	${ inputStyleNeutral };

	/* Fonts smaller than 16px causes mobile safari to zoom. */
	font-size: ${ font( 'mobileTextMinFontSize' ) };
	/* Override core line-height. To be reviewed. */
	line-height: normal;

	${ breakpoint( 'small' ) } {
		font-size: ${ font( 'default.fontSize' ) };
		/* Override core line-height. To be reviewed. */
		line-height: normal;
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
