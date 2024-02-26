/**
 * External dependencies
 */
import { css } from '@emotion/react';

/**
 * Internal dependencies
 */
import { inputStyleNeutral, inputStyleFocus } from './base';
import { font } from '../font';
import { COLORS } from '../colors-values';
import { breakpoint } from '../breakpoint';

export const inputControl = css`
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
