#!/usr/bin/env node
/**
 * Generates the per-colour-scheme design token stylesheet for the "Admin
 * design tokens" experiment.
 *
 * React admin screens read the active colour scheme from the `admin-color-*`
 * body class and hand its primary colour to `ThemeProvider`, which derives
 * the `--wpds-color-*` tokens at runtime. PHP-rendered screens have no
 * provider, so every token keeps the default scheme's value. This script runs
 * the same derivation at build time instead, and writes the result as CSS
 * scoped to each scheme's body class.
 *
 * Nothing is duplicated: scheme colours come from `@wordpress/admin-ui` and
 * the ramps from `@wordpress/theme`. Only tokens that differ from the default
 * scheme are written, and schemes that derive identical values share a rule.
 *
 * Usage: node bin/generate-wpds-admin-scheme-tokens.mjs
 */

import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
	buildBgRamp,
	buildAccentRamp,
	DEFAULT_SEED_COLORS,
} from '../packages/theme/src/color-ramps/index.ts';
import colorTokens from '../packages/theme/src/prebuilt/ts/color-tokens.ts';
import { getAdminThemeColors } from '../packages/admin-ui/src/admin-theme-colors/index.ts';

const ROOT = join( dirname( fileURLToPath( import.meta.url ) ), '..' );
const OUTPUT = join(
	ROOT,
	'lib/experimental/wpds-admin/css/05-scheme-tokens.css'
);

// The colour schemes bundled with WordPress. `modern` is the default.
const DEFAULT_SCHEME = 'modern';
const SCHEMES = [
	'modern',
	'fresh',
	'light',
	'blue',
	'coffee',
	'ectoplasm',
	'midnight',
	'ocean',
	'sunrise',
];

/**
 * Returns a scheme's primary colour, as `getAdminThemeColors()` reports it.
 *
 * @param {string} scheme Colour scheme name.
 * @return {string} Primary colour.
 */
function getSchemePrimary( scheme ) {
	globalThis.document = { body: { className: `admin-color-${ scheme }` } };
	return getAdminThemeColors().primary;
}

/**
 * Derives every colour token for a primary colour, the way `ThemeProvider`
 * does, with the default background.
 *
 * @param {string} primary Primary colour.
 * @return {Map<string, string>} Token name to value.
 */
function deriveTokens( primary ) {
	const seeds = { ...DEFAULT_SEED_COLORS, primary };
	const bgRamp = buildBgRamp( seeds.background );
	const tokens = new Map();

	for ( const [ rampName, seed ] of Object.entries( seeds ) ) {
		const { ramp } =
			rampName === 'background'
				? bgRamp
				: buildAccentRamp( seed, bgRamp );
		const primitive = rampName === 'background' ? 'bg' : rampName;

		for ( const [ step, value ] of Object.entries( ramp ) ) {
			for ( const id of colorTokens[ `${ primitive }-${ step }` ] ??
				[] ) {
				// eslint-disable-next-line @wordpress/no-unknown-ds-tokens -- Names come from the theme's own generated alias map.
				tokens.set( `--wpds-color-${ id }`, String( value ) );
			}
		}
	}

	return tokens;
}

const defaultPrimary = getSchemePrimary( DEFAULT_SCHEME );
const defaults = deriveTokens( defaultPrimary );
const rules = new Map();

for ( const scheme of SCHEMES.filter( ( name ) => name !== DEFAULT_SCHEME ) ) {
	const primary = getSchemePrimary( scheme );

	// An unknown scheme silently falls back to the default; fail instead.
	if ( primary === defaultPrimary ) {
		throw new Error(
			`No colours found for the "${ scheme }" admin colour scheme.`
		);
	}

	const declarations = [ ...deriveTokens( primary ) ]
		.filter( ( [ name, value ] ) => defaults.get( name ) !== value )
		.sort( ( [ a ], [ b ] ) => a.localeCompare( b ) )
		.map( ( [ name, value ] ) => `\t\t${ name }: ${ value };` )
		.join( '\n' );

	const selectors = rules.get( declarations ) ?? [];
	selectors.push( `\tbody.admin-color-${ scheme }` );
	rules.set( declarations, selectors );
}

const css = `/**
 * Design tokens for each bundled admin colour scheme.
 *
 * GENERATED FILE. Do not edit. Regenerate with:
 *
 *     node bin/generate-wpds-admin-scheme-tokens.mjs
 *
 * React admin screens derive these values at runtime through ThemeProvider.
 * PHP-rendered screens have no provider, so without this file every token
 * would keep the default scheme's value, and scheme-coloured controls would
 * pair the scheme's background with text chosen for the default blue. Only
 * tokens that differ from the default scheme are listed.
 *
 * Setting \`--wpds-*\` properties is reserved for the theme package, which is
 * where this output belongs once the experiment graduates.
 */

/* stylelint-disable plugin-wpds/no-setting-wpds-custom-properties -- Generated equivalent of ThemeProvider's runtime output. */

@layer wpds-overrides, wp-legacy, wpds;

@layer wpds {
${ [ ...rules ]
	.map(
		( [ declarations, selectors ] ) =>
			`${ selectors.join( ',\n' ) } {\n${ declarations }\n\t}`
	)
	.join( '\n\n' ) }
}
`;

writeFileSync( OUTPUT, css );
console.log(
	`Wrote ${ rules.size } rules for ${ SCHEMES.length - 1 } schemes.`
);
