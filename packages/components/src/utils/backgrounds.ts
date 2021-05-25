/**
 * External dependencies
 */
import { css } from 'emotion';
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
) {
	assertIsSupportedColor( color );

	const { isBold, isSubtle } = options;

	const colorized = colorize( color );

	let baseBackground = colorized.clone().setAlpha( 20 );
	if ( isBold ) {
		baseBackground = colorized.clone().setAlpha( 70 );
	} else if ( isSubtle ) {
		baseBackground = colorized.clone().setAlpha( 10 );
	}

	const baseColor = css( {
		background: baseBackground.toString( 'rgb' ),
	} );

	return css`
		${ baseColor };
	`;
}

const TEXT_TO_BACKGROUND_COLOR: Record< SupportedColors, `#${ string }` > = {
	blue: '#0072A8',
	green: '#25612f',
	yellow: '#dd631a',
	orange: '#aa3e1a',
	red: '#841e1e',
	lightGray: '#a2aab2',
	darkGray: '#191E23',
	purple: '#342c48',
};

export function getBackgroundColorText(
	color: SupportedColors,
	options: { isBold?: boolean } = {}
) {
	assertIsSupportedColor( color );

	const { isBold } = options;

	const value = isBold ? COLORS.white : TEXT_TO_BACKGROUND_COLOR[ color ];

	return css`
		color: ${ value };
	`;
}
