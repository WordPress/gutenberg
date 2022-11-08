/**
 * External dependencies
 */
import { colord, extend } from 'colord';
import a11yPlugin from 'colord/plugins/a11y';
import namesPlugin from 'colord/plugins/names';

/**
 * Internal dependencies
 */
import type { ThemeInputValues, ThemeOutputValues } from './types';
import { COLORS } from '../utils';

extend( [ namesPlugin, a11yPlugin ] );

export function generateThemeVariables(
	inputs: ThemeInputValues
): ThemeOutputValues {
	validateInputs( inputs );

	return {
		colors: {
			...generateAccentDependentColors( inputs.accent ),
			...generateBackgroundDependentColors( inputs.background ),
		},
	};
}

// TODO: Add unit tests
function validateInputs( inputs: ThemeInputValues ) {
	for ( const [ key, value ] of Object.entries( inputs ) ) {
		if ( typeof value !== 'undefined' && ! colord( value ).isValid() ) {
			// eslint-disable-next-line no-console
			console.warn(
				`wp.components.Theme: "${ value }" is not a valid color value for the '${ key }' prop.`
			);
		}
	}

	if (
		inputs.background &&
		! colord( inputs.background ).isReadable(
			inputs.accent || COLORS.ui.theme
		)
	) {
		// eslint-disable-next-line no-console
		console.warn(
			`wp.components.Theme: The background color provided ("${ inputs.background }") does not have sufficient contrast against the accent color ("${ inputs.accent }").`
		);
	}
}

function generateAccentDependentColors( accent?: string ) {
	if ( ! accent ) return {};

	return {
		accent,
		accentDarker10: colord( accent ).darken( 0.1 ).toHex(),
		accentDarker20: colord( accent ).darken( 0.2 ).toHex(),
		accentInverted: getForegroundForColor( accent ),
	};
}

function generateBackgroundDependentColors( background?: string ) {
	if ( ! background ) return {};

	const foreground = getForegroundForColor( background );

	return {
		background,
		foreground,
		foregroundInverted: getForegroundForColor( foreground ),
		gray: generateShades( background, foreground ),
	};
}

function getForegroundForColor( color: string ) {
	return colord( color ).isDark() ? COLORS.white : COLORS.gray[ 900 ];
}

// TODO: Add unit test so the result of this matches the default case (#fff to #1e1e1e)
function generateShades( background: string, foreground: string ) {
	// How much darkness you need to add to #fff to get the COLORS.gray[n] color
	const SHADES = {
		100: 0.06,
		200: 0.121,
		300: 0.132,
		400: 0.2,
		600: 0.42,
		700: 0.543,
		800: 0.821,
	};

	// Darkness of COLORS.gray[ 900 ], relative to #fff
	const limit = 0.884;

	const direction = colord( background ).isDark() ? 'lighten' : 'darken';

	// Lightness delta between the background and foreground colors
	const range =
		Math.abs(
			colord( background ).toHsl().l - colord( foreground ).toHsl().l
		) / 100;

	const result: Record< number, string > = {};

	Object.entries( SHADES ).forEach( ( [ key, value ] ) => {
		result[ parseInt( key ) ] = colord( background )
			[ direction ]( ( value / limit ) * range )
			.toHex();
	} );

	return result as ThemeOutputValues[ 'colors' ][ 'gray' ];
}
