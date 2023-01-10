/**
 * External dependencies
 */
import { colord, extend } from 'colord';
import a11yPlugin from 'colord/plugins/a11y';
import namesPlugin from 'colord/plugins/names';

/**
 * WordPress dependencies
 */
import warning from '@wordpress/warning';

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

	const generatedColors = {
		...generateAccentDependentColors( inputs.accent ),
		...generateBackgroundDependentColors( inputs.background ),
	};

	warnContrastIssues( checkContrasts( inputs, generatedColors ) );

	return { colors: generatedColors };
}

function validateInputs( inputs: ThemeInputValues ) {
	for ( const [ key, value ] of Object.entries( inputs ) ) {
		if ( typeof value !== 'undefined' && ! colord( value ).isValid() ) {
			warning(
				`wp.components.Theme: "${ value }" is not a valid color value for the '${ key }' prop.`
			);
		}
	}
}

export function checkContrasts(
	inputs: ThemeInputValues,
	outputs: ThemeOutputValues[ 'colors' ]
) {
	const background = inputs.background || COLORS.white;
	const accent = inputs.accent || '#007cba';
	const foreground = outputs.foreground || COLORS.gray[ 900 ];
	const gray = outputs.gray || COLORS.gray;

	return {
		accent: colord( background ).isReadable( accent )
			? undefined
			: `The background color ("${ background }") does not have sufficient contrast against the accent color ("${ accent }").`,
		foreground: colord( background ).isReadable( foreground )
			? undefined
			: `The background color provided ("${ background }") does not have sufficient contrast against the standard foreground colors.`,
		grays:
			colord( background ).contrast( gray[ 600 ] ) >= 3 &&
			colord( background ).contrast( gray[ 700 ] ) >= 4.5
				? undefined
				: `The background color provided ("${ background }") cannot generate a set of grayscale foreground colors with sufficient contrast. Try adjusting the color to be lighter or darker.`,
	};
}

function warnContrastIssues( issues: ReturnType< typeof checkContrasts > ) {
	for ( const error of Object.values( issues ) ) {
		if ( error ) {
			warning( 'wp.components.Theme: ' + error );
		}
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

export function generateShades( background: string, foreground: string ) {
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

	return result as NonNullable< ThemeOutputValues[ 'colors' ][ 'gray' ] >;
}
