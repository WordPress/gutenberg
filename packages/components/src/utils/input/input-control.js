/**
 * External dependencies
 */
import { css } from '@emotion/core';

/**
 * Internal dependencies
 */
import { inputStyleNeutral, inputStyleFocus } from './base';
import { font } from '../font';
import { color } from '../colors';
import { breakpoint } from '../breakpoint';

export const inputControl = css`
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
		color: ${ color( 'darkGray.placeholder' ) };
	}

	&::-moz-placeholder {
		opacity: 1; // Necessary because Firefox reduces this from 1.
		color: ${ color( 'darkGray.placeholder' ) };
	}

	&:-ms-input-placeholder {
		color: ${ color( 'darkGray.placeholder' ) };
	}

	.is-dark-theme & {
		&::-webkit-input-placeholder {
			color: ${ color( 'lightGray.placeholder' ) };
		}

		&::-moz-placeholder {
			opacity: 1; // Necessary because Firefox reduces this from 1.
			color: ${ color( 'lightGray.placeholder' ) };
		}

		&:-ms-input-placeholder {
			color: ${ color( 'lightGray.placeholder' ) };
		}
	}
`;
