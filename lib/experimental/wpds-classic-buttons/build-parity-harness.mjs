#!/usr/bin/env node
/**
 * Parity harness for the WPDS classic buttons POC.
 *
 * Renders the REAL React Button (`.components-button`, styled by its own rules
 * extracted from the compiled component CSS) beside the classic button
 * (`.wp-core-ui .button`, styled by our generated buttons.css) — same accent,
 * same tokens — so they can be compared directly. Both forced to 40px.
 *
 * Only the button's own rules are inlined (not the whole 127 KB component
 * bundle) to avoid global/reset rules leaking into the harness layout.
 *
 * Usage: node build-parity-harness.mjs
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire( import.meta.url );
// eslint-disable-next-line import/no-extraneous-dependencies -- dev-only harness script; postcss is present via the build toolchain.
const postcss = require( 'postcss' );

const HERE = dirname( fileURLToPath( import.meta.url ) );
const REPO_ROOT = resolve( HERE, '../../..' );

const tokensCss = readFileSync(
	resolve( REPO_ROOT, 'packages/theme/prebuilt/css/design-tokens.css' ),
	'utf8'
);
const classicCss = readFileSync( resolve( HERE, 'buttons.css' ), 'utf8' );

// Extract only the React Button's own rules from the compiled component CSS.
function extractButtonRules( cssPath ) {
	const root = postcss.parse( readFileSync( cssPath, 'utf8' ) );
	const out = postcss.root();
	const keep = ( r ) =>
		r.selectors &&
		r.selectors.some( ( s ) =>
			s.trim().startsWith( '.components-button' )
		);
	root.each( ( node ) => {
		if ( node.type === 'rule' && keep( node ) ) {
			out.append( node.clone() );
		} else if ( node.type === 'atrule' ) {
			const inner = [];
			node.walkRules( ( r ) => {
				if ( keep( r ) ) {
					inner.push( r.clone() );
				}
			} );
			if ( inner.length ) {
				const at = postcss.atRule( {
					name: node.name,
					params: node.params,
				} );
				inner.forEach( ( r ) => at.append( r ) );
				out.append( at );
			}
		}
	} );
	return out.toString();
}

const reactButtonCss = extractButtonRules(
	resolve( REPO_ROOT, 'packages/components/build-style/style.css' )
);

const ACCENT = {
	'--wp-admin-theme-color': '#3858e9',
	'--wp-admin-theme-color--rgb': '56, 88, 233',
	'--wp-admin-theme-color-darker-10': 'rgb(33, 69, 230)',
	'--wp-admin-theme-color-darker-20': 'rgb(24, 58, 214)',
};
const accentStyle = Object.entries( ACCENT )
	.map( ( [ k, v ] ) => `${ k }: ${ v };` )
	.join( ' ' );

// [ label, React classes, classic classes ]
const ROWS = [
	[ 'Primary', 'components-button is-primary', 'button button-primary' ],
	[
		'Secondary',
		'components-button is-secondary',
		'button button-secondary',
	],
	[ 'Default (.button)', 'components-button is-secondary', 'button' ],
	[ 'Link', 'components-button is-link', 'button-link' ],
	[
		'Primary · small',
		'components-button is-primary is-small',
		'button button-primary button-small',
	],
];

// React buttons opt into 40px so both sides share the default height.
const FORTY = ' is-next-40px-default-size';

const rows = ROWS.map(
	( [ label, react, classic ] ) => `
		<div class="parity-label">${ label }</div>
		<div class="parity-cell"><button type="button" class="${ react }${ FORTY }">Code is poetry</button></div>
		<div class="parity-cell wp-core-ui"><button type="button" class="${ classic }">Code is poetry</button></div>`
).join( '' );

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>WPDS classic buttons — React vs classic parity</title>
<style>
${ tokensCss }
/* --- React Button's own rules (extracted from the compiled component CSS) --- */
${ reactButtonCss }
/* --- Our generated, React-derived classic buttons --- */
${ classicCss }
/* --- Harness chrome (uniquely prefixed to avoid collisions) --- */
body { ${ accentStyle } margin: 0; padding: 24px; background: #f0f0f1; font-family: -apple-system, system-ui, "Segoe UI", Roboto, sans-serif; color: #1e1e1e; }
h1 { font-size: 20px; margin: 0 0 4px; }
p.parity-lede { margin: 0 0 20px; color: #50575e; max-width: 72ch; }
.parity-grid { display: grid; grid-template-columns: max-content 1fr 1fr; align-items: center; background: #fff; border: 1px solid #dcdcde; border-radius: 8px; overflow: hidden; }
.parity-grid > div { padding: 16px 20px; border-top: 1px solid #f0f0f1; }
.parity-grid > .parity-head { border-top: 0; font-size: 12px; text-transform: uppercase; letter-spacing: .04em; color: #757575; }
.parity-label { font-size: 13px; color: #50575e; white-space: nowrap; }
</style>
</head>
<body>
<h1>React Button vs. classic wp-admin button — parity</h1>
<p class="parity-lede">Middle column: the real React <code>.components-button</code>. Right column: classic <code>.wp-core-ui .button</code> (our generated <code>buttons.css</code>, re-scoped from the same React source). Same accent, same tokens, both at the 40px default. Tab to a button to compare the focus ring.</p>
<div class="parity-grid">
	<div class="parity-head">Variant</div>
	<div class="parity-head">React (<code>.components-button</code>)</div>
	<div class="parity-head">Classic (<code>.wp-core-ui .button</code>)</div>
	${ rows }
</div>
</body>
</html>
`;

writeFileSync( resolve( HERE, 'parity-harness.html' ), html );
// eslint-disable-next-line no-console
console.log( 'Wrote parity-harness.html' );
