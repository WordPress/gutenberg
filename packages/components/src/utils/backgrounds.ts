/**
 * External dependencies
 */
import { css, SerializedStyles } from '@emotion/react';
import colorize from 'tinycolor2';

/**
 * Internal dependencies
 */
import COLORS from './colors-values';

export const SUPPORTED_COLORS = [
	'blue',
	'red',
	'purple',
	'green',
	'yellow',
	'orange',
	'darkGray',
	'lightGray',
] as const;

export type SupportedColors = typeof SUPPORTED_COLORS[ number ];

function assertIsSupportedColor(
	color: any
): asserts color is SupportedColors {
	if ( ! SUPPORTED_COLORS.includes( color ) ) {
		throw new Error(
			`'color' must be one of the supported colors: ${ SUPPORTED_COLORS.join(
				', '
			) }`
		);
	}
}

export function getBackgroundColor(
	color: SupportedColors,
	options: { isBold?: boolean } = {}
): SerializedStyles {
	assertIsSupportedColor( color );

	const { isBold } = options;

	const colorized = colorize( color );

	switch ( color ) {
		case 'purple':
		case 'green':
			colorized.lighten( 60 );
			colorized.desaturate( 60 );
			break;
		case 'blue':
		case 'red':
		case 'orange':
			colorized.lighten( 40 );
			colorized.desaturate( 10 );
			break;
		case 'darkGray':
			colorized.lighten( 25 );
			break;
		case 'lightGray':
			colorized.lighten( 13 );
			break;
		case 'yellow':
			colorized.lighten( 40 );
			break;
	}

	if ( isBold ) {
		colorized.darken( 20 );
	}

	return css( {
		background: colorized.toHslString(),
		fontWeight: isBold ? 'bold' : 'normal',
	} );
}

const BACKGROUND_COLOR_TO_TEXT: Record< SupportedColors, `#${ string }` > = {
	blue: '#005f8c',
	green: '#25612f',
	yellow: '#c44f09',
	orange: '#aa3e1a',
	red: '#841e1e',
	lightGray: '#6c7177',
	darkGray: '#191E23',
	purple: '#342c48',
};

export function getTextColorForBackgroundColor(
	color: SupportedColors,
	{ isBold }: { isBold?: boolean } = {}
): SerializedStyles {
	assertIsSupportedColor( color );

	const value = isBold ? COLORS.black : BACKGROUND_COLOR_TO_TEXT[ color ];

	return css`
		color: ${ value };
	`;
}
