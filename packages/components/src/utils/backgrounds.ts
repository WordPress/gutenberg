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
	options: { isBold?: boolean; isSubtle?: boolean } = {}
): SerializedStyles {
	assertIsSupportedColor( color );

	const { isBold, isSubtle } = options;

	const colorized = colorize( color );

	colorized.setAlpha( 0.2 );
	if ( isBold ) {
		colorized.setAlpha( 0.7 );
	} else if ( isSubtle ) {
		colorized.setAlpha( 0.1 );
	}
	return css( {
		background: colorized.toRgbString(),
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

	const value = isBold ? COLORS.white : BACKGROUND_COLOR_TO_TEXT[ color ];

	return css`
		color: ${ value };
	`;
}
