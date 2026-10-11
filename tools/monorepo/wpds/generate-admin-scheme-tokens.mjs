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
 * Both are imported from package source because neither package exports these
 * as a plain function yet. Once `@wordpress/theme` does, this script and its
 * output are meant to be replaced by that.
 *
 * Usage: npm run wpds:admin-scheme-tokens --workspace @wordpress/monorepo-tools
 */

import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
	buildBgRamp,
	buildAccentRamp,
	DEFAULT_SEED_COLORS,
} from '../../../packages/theme/src/color-ramps/index.ts';
import colorTokens from '../../../packages/theme/src/prebuilt/ts/color-tokens.ts';
import {
	ADMIN_THEME_COLORS,
	getAdminThemeColors,
} from '../../../packages/admin-ui/src/admin-theme-colors/index.ts';

const ROOT = join( dirname( fileURLToPath( import.meta.url ) ), '../../..' );
const OUTPUT = join(
	ROOT,
	'lib/experimental/wpds-admin/css/05-scheme-tokens.css'
);

/**
 * Returns the default scheme's primary colour, as `getAdminThemeColors()`
 * resolves it when no scheme class is present.
 *
 * @return {string} Primary colour.
 */
function getDefaultPrimary() {
	globalThis.document = { body: { className: '' } };
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

const defaults = deriveTokens( getDefaultPrimary() );
const rules = new Map();

// Every scheme `@wordpress/admin-ui` knows about, so an added scheme is
// picked up without editing this script.
for ( const [ scheme, { primary } ] of ADMIN_THEME_COLORS ) {
	const declarations = [ ...deriveTokens( primary ) ]
		.filter( ( [ name, value ] ) => defaults.get( name ) !== value )
		.sort( ( [ a ], [ b ] ) => a.localeCompare( b ) )
		.map( ( [ name, value ] ) => `\t\t${ name }: ${ value };` )
		.join( '\n' );

	// The default scheme, or any scheme deriving identical tokens.
	if ( ! declarations ) {
		continue;
	}

	const selectors = rules.get( declarations ) ?? [];
	selectors.push( `\tbody.admin-color-${ scheme }` );
	rules.set( declarations, selectors );
}

const css = `/**
 * Design tokens for each bundled admin colour scheme.
 *
 * GENERATED FILE. Do not edit. Regenerate with:
 *
 *     npm run wpds:admin-scheme-tokens --workspace @wordpress/monorepo-tools
 *
 * React admin screens derive these values at runtime through ThemeProvider.
 * PHP-rendered screens have no provider, so without this file every token
 * would keep the default scheme's value, and scheme-coloured controls would
 * pair the scheme's background with text chosen for the default blue. Only
 * tokens that differ from the default scheme are listed.
 *
 * Setting \`--wpds-*\` properties is reserved for the theme package.
 *
 * DELETE WHEN: \`@wordpress/theme\` can generate these tokens outside React and
 * wp-admin loads them for the active colour scheme, which will also need to
 * cover custom colour seeds (Core-66026, Core-65776).
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
	`Wrote ${ rules.size } rules for ${ ADMIN_THEME_COLORS.size } schemes.`
);
