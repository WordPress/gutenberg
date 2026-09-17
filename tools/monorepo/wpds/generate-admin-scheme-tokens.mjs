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
 * Nothing is duplicated: the derivation is `@wordpress/theme`'s own
 * `generateColorTokens`, the same one `ThemeProvider` applies, and the scheme
 * colours come from `@wordpress/admin-ui`. Only tokens that differ from the
 * default scheme are written, and schemes that derive identical values share a
 * rule.
 *
 * Only the `tokens` group is written. The `compatibility` group is deliberately
 * left out: `wp-base-styles` already defines `--wp-admin-theme-color` per
 * scheme on the same `body.admin-color-*` selector, and a second definition of
 * the same property would leave source order to decide between them.
 *
 * The scheme list is still imported from `@wordpress/admin-ui` package source,
 * because reading it needs no DOM but the package exports only the DOM-reading
 * `getAdminThemeColors`.
 *
 * Usage: npm run wpds:admin-scheme-tokens --workspace @wordpress/monorepo-tools
 */

import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { generateColorTokens } from '@wordpress/theme/colors';
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

const defaults = generateColorTokens( { primary: getDefaultPrimary() } ).tokens;
const rules = new Map();

// Every scheme `@wordpress/admin-ui` knows about, so an added scheme is
// picked up without editing this script.
for ( const [ scheme, { primary } ] of ADMIN_THEME_COLORS ) {
	const { tokens } = generateColorTokens( { primary } );
	const declarations = Object.entries( tokens )
		.filter( ( [ name, value ] ) => defaults[ name ] !== value )
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
 * DELETE WHEN: wp-admin generates these tokens for the active colour scheme
 * with \`generateColorTokens\` from \`@wordpress/theme\`, which will also need to
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
