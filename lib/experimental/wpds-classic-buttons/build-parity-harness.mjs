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
const exceptionsCss = readFileSync(
	resolve( HERE, 'buttons-exceptions.css' ),
	'utf8'
);

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

// Disabled is the one class-driven state that CAN be compared statically:
// React uses the real `disabled` attribute, classic a `.disabled` class.
// [ label, React classes, React attrs, classic classes ]
const STATE_ROWS = [
	[
		'Disabled — React attribute vs classic class',
		'components-button is-secondary',
		'disabled',
		'button disabled',
	],
	[
		'Disabled — standalone legacy class',
		'components-button is-secondary',
		'disabled',
		'button button-disabled',
	],
	[
		'Disabled — primary, standalone legacy class',
		'components-button is-primary',
		'disabled',
		'button button-primary button-primary-disabled',
	],
];

// Classic-only specimens: no React counterpart exists, so these are shown on
// their own. Each says which group of buttons-exceptions.css it belongs to.
// [ label, markup, note ]
const EXCEPTION_ROWS = [
	[
		'.button-hero',
		'<button type="button" class="button button-hero">Code is poetry</button>',
		'Awaiting DS coverage — no React 48px size.',
	],
	[
		'.button-large',
		'<button type="button" class="button button-large">Code is poetry</button>',
		'Awaiting DS coverage — no React large size.',
	],
	[
		'.button-compact',
		'<button type="button" class="button button-compact">Code is poetry</button>',
		'Awaiting DS coverage — the key maps is-compact here, but React has no compact height rule.',
	],
	[
		'.button-small',
		'<button type="button" class="button button-small">Code is poetry</button>',
		'Generated — shown for size comparison.',
	],
	[
		'.button-link-delete',
		'<button type="button" class="button-link button-link-delete">Delete permanently</button>',
		'Awaiting DS coverage — needs is-destructive plus a dual-role focus token.',
	],
	[
		'.button.active (pressed)',
		'<button type="button" class="button active">Code is poetry</button>',
		'Awaiting DS coverage — deliberately NOT mapped from :active; different state.',
	],
	[
		'.button with .dashicons',
		'<button type="button" class="button"><span class="dashicons dashicons-admin-generic"></span> Settings</button>',
		'Classic-only — React uses .dashicon in a flex icon slot.',
	],
	[
		'input[type="reset"]',
		'<input type="reset" value="Reset">',
		'Classic-only — React has no reset button.',
	],
	[
		'.button.hidden',
		'<button type="button" class="button hidden">Should be invisible</button><em class="parity-note-inline">(nothing should appear to the left)</em>',
		'Classic-only, FUNCTIONAL — classic JS hides buttons with this class.',
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

const stateRows = STATE_ROWS.map(
	( [ label, react, attrs, classic ] ) => `
		<div class="parity-label">${ label }</div>
		<div class="parity-cell"><button type="button" ${ attrs } class="${ react }${ FORTY }">Code is poetry</button></div>
		<div class="parity-cell wp-core-ui"><button type="button" class="${ classic }">Code is poetry</button></div>`
).join( '' );

const exceptionRows = EXCEPTION_ROWS.map(
	( [ label, markup, note ] ) => `
		<div class="parity-label"><code>${ label.replace( /</g, '&lt;' ) }</code></div>
		<div class="parity-cell wp-core-ui">${ markup }</div>
		<div class="parity-note">${ note }</div>`
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
/* --- Hand-authored exceptions (the shrinking to-do list) --- */
${ exceptionsCss }
/* --- Harness chrome (uniquely prefixed to avoid collisions) --- */
body { ${ accentStyle } margin: 0; padding: 24px; background: #f0f0f1; font-family: -apple-system, system-ui, "Segoe UI", Roboto, sans-serif; color: #1e1e1e; }
h1 { font-size: 20px; margin: 0 0 4px; }
p.parity-lede { margin: 0 0 20px; color: #50575e; max-width: 72ch; }
.parity-grid { display: grid; grid-template-columns: max-content 1fr 1fr; align-items: center; background: #fff; border: 1px solid #dcdcde; border-radius: 8px; overflow: hidden; }
.parity-grid > div { padding: 16px 20px; border-top: 1px solid #f0f0f1; }
.parity-grid > .parity-head { border-top: 0; font-size: 12px; text-transform: uppercase; letter-spacing: .04em; color: #757575; }
.parity-label { font-size: 13px; color: #50575e; white-space: nowrap; }
h2 { font-size: 16px; margin: 32px 0 4px; }
.parity-note { font-size: 12px; color: #757575; max-width: 44ch; line-height: 1.5; }
.parity-note-inline { font-size: 12px; color: #757575; }
.parity-grid--exceptions { grid-template-columns: max-content minmax(220px, 1fr) max-content; }
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

<h2>Class-driven states</h2>
<p class="parity-lede">Core toggles button state with <em>classes</em> as well as pseudo-classes, because legacy admin JS sets them directly. These class forms are now generated from React's own declarations (see <code>stateClassMap</code>), so they should match. Disabled is the one state comparable in static HTML — React uses the real <code>disabled</code> attribute, classic a class. Hover and focus have no static equivalent; tab through the table above to check focus.</p>
<div class="parity-grid">
	<div class="parity-head">State</div>
	<div class="parity-head">React (real pseudo-class)</div>
	<div class="parity-head">Classic (legacy class)</div>
	${ stateRows }
</div>

<h2>Exceptions — classic only</h2>
<p class="parity-lede">These have no React counterpart, so there is nothing to compare against; they come from the hand-authored <code>buttons-exceptions.css</code>. Each note says why it resists automation. This table should get shorter over time — if it never does, the exceptions have become permanent, which is worth knowing too.</p>
<div class="parity-grid parity-grid--exceptions">
	<div class="parity-head">Selector</div>
	<div class="parity-head">Classic rendering</div>
	<div class="parity-head">Why it is here</div>
	${ exceptionRows }
</div>
</body>
</html>
`;

writeFileSync( resolve( HERE, 'parity-harness.html' ), html );
// eslint-disable-next-line no-console
console.log( 'Wrote parity-harness.html' );
