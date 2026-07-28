#!/usr/bin/env node
/**
 * WPDS classic buttons — generation step (POC).
 *
 * Re-sources classic wp-admin button styles FROM the React component's own
 * compiled CSS, so classic renders identically to the React Button (same
 * implementation, not just the same tokens).
 *
 * How: parse packages/components/build-style/style.css, take every rule whose
 * selector starts with `.components-button`, and rewrite the selector onto the
 * legacy classic classes per buttons-translation-key.json. Declarations are
 * kept verbatim (already token-based), so classic inherits React's exact
 * constructions — including the transparent-border + outline/outline-offset
 * focus ring. A forced 40px height is appended (40px is always the default).
 *
 * Because the source is the compiled component CSS, re-running after a build
 * tracks any React change — that is the drift-avoidance. `--check` fails if the
 * committed buttons.css is out of sync.
 *
 * Usage:
 *   node generate.mjs            Regenerate buttons.css.
 *   node generate.mjs --check    Exit 1 if buttons.css is out of sync.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire( import.meta.url );
// eslint-disable-next-line import/no-extraneous-dependencies -- postcss is present via the build toolchain; this is a dev-only generation script, not shipped code.
const postcss = require( 'postcss' );

const HERE = dirname( fileURLToPath( import.meta.url ) );
const REPO_ROOT = resolve( HERE, '../../..' );

const SOURCE = resolve(
	REPO_ROOT,
	'packages/components/build-style/style.css'
);
const KEY_FILE = resolve( HERE, 'buttons-translation-key.json' );
const OUT_FILE = resolve( HERE, 'buttons.css' );

const key = JSON.parse( readFileSync( KEY_FILE, 'utf8' ) );
const SCOPE = key.scopePrefix;

// Classes that, when present on the subject, mean "no classic equivalent" — the
// whole selector is dropped (classic keeps Core's own rule for that case).
const DROP_CLASSES = [
	'is-tertiary',
	'is-destructive',
	'is-busy',
	'is-pressed',
	'has-icon',
	'has-text',
	'has-icon-right',
	'is-next-40px-default-size',
	'is-compact-40px', // defensive
];

// Every class we recognise on a button subject. Any OTHER class means the
// selector belongs to a DIFFERENT component that merely extends .components-button
// (e.g. .components-guide__back-button, .components-menu-item) — those are
// context-specific, not the generic button, so they are dropped.
const KNOWN_CLASSES = new Set( [
	...Object.keys( key.variantMap ).filter( ( k ) => k.startsWith( 'is-' ) ),
	...Object.keys( key.sizeMap ),
	...DROP_CLASSES,
] );

/**
 * Rewrite one selector from the React component onto the legacy classes.
 *
 * @param {string} sel A single selector (already split from any comma list).
 * @return {string|null} The rewritten selector, or null to drop it.
 */
function mapSelector( sel ) {
	sel = sel.trim();
	if ( ! sel.startsWith( '.components-button' ) ) {
		return null;
	}
	// Button groups map wholesale to the legacy group + button classes.
	if ( sel.startsWith( '.components-button-group' ) ) {
		return sel
			.replace( /\.components-button-group/g, `${ SCOPE } .button-group` )
			.replace( /\.components-button/g, '.button' );
	}

	// Capture the leading `.components-button` subject compound: its attached
	// classes, attributes, and pseudos (single level of parens, which covers
	// the `:not(:disabled, [aria-disabled=true])` shapes used here).
	const headRe =
		/^\.components-button((?:\.[\w-]+|\[[^\]]*\]|::?[\w-]+(?:\([^)]*\))?)*)/;
	const m = sel.match( headRe );
	if ( ! m ) {
		return null;
	}
	const mods = m[ 1 ];
	const classes = [ ...mods.matchAll( /\.([\w-]+)/g ) ].map(
		( x ) => x[ 1 ]
	);
	const has = ( c ) => classes.includes( c );

	// Foreign component extending .components-button (unknown class) — not a
	// generic button rule; drop it.
	if ( classes.some( ( c ) => ! KNOWN_CLASSES.has( c ) ) ) {
		return null;
	}

	if ( DROP_CLASSES.some( has ) ) {
		return null;
	}

	const tail = sel.slice( m[ 0 ].length ); // combinator + descendant, verbatim
	const nonClass = mods.replace( /\.[\w-]+/g, '' ); // keep pseudos + attributes

	let variant;
	if ( has( 'is-primary' ) ) {
		variant = key.variantMap[ 'is-primary' ];
	} else if ( has( 'is-secondary' ) ) {
		variant = key.variantMap[ 'is-secondary' ];
	} else if ( has( 'is-link' ) ) {
		variant = key.variantMap[ 'is-link' ];
	} else {
		variant = key.variantMap[ '(base — no variant class)' ];
	}

	let size = '';
	if ( has( 'is-small' ) ) {
		size = key.sizeMap[ 'is-small' ];
	}

	// base + size collapses to just the size class (e.g. `.button-small`);
	// variant + size compounds (e.g. `.button-primary.button-small`).
	const isBase = variant.startsWith( ':is(.button,' );
	let legacy;
	if ( size && isBase ) {
		legacy = size;
	} else {
		legacy = variant + size;
	}

	return `${ SCOPE } ${ legacy }${ nonClass }${ tail }`;
}

/**
 * Map a single rule onto legacy selectors, or return null to drop it.
 * Drops rules that have no button-subject selector, no mappable selector, or
 * no declarations (empty shells left by the compiler).
 *
 * @param {import('postcss').Rule} rule
 * @return {import('postcss').Rule|null} A re-scoped clone, or null to drop it.
 */
function processRule( rule ) {
	if (
		! rule.selectors.some( ( s ) =>
			s.trim().startsWith( '.components-button' )
		)
	) {
		return null;
	}
	if ( ! rule.nodes.some( ( n ) => n.type === 'decl' ) ) {
		return null;
	}
	const mapped = rule.selectors.map( mapSelector ).filter( Boolean );
	if ( ! mapped.length ) {
		return null;
	}
	const clone = rule.clone();
	clone.selector = [ ...new Set( mapped ) ].join( ',\n' );
	clone.raws.before = '\n\n';
	return clone;
}

function build() {
	const source = readFileSync( SOURCE, 'utf8' );
	const root = postcss.parse( source );
	const out = postcss.root();

	root.each( ( node ) => {
		if ( node.type === 'rule' ) {
			const mapped = processRule( node );
			if ( mapped ) {
				out.append( mapped );
			}
		} else if ( node.type === 'atrule' ) {
			// Preserve the media condition around any button rules inside it.
			const inner = [];
			node.walkRules( ( r ) => {
				const mapped = processRule( r );
				if ( mapped ) {
					inner.push( mapped );
				}
			} );
			if ( inner.length ) {
				const at = postcss.atRule( {
					name: node.name,
					params: node.params,
				} );
				at.raws.before = '\n\n';
				inner.forEach( ( r ) => at.append( r ) );
				out.append( at );
			}
		}
	} );

	// Force 40px default height (see key.forced.height).
	out.append(
		postcss.parse(
			`\n\n/* 40px is always the default button size (see translation key). */\n` +
				`${ key.forced.height.selector } {\n` +
				`\theight: ${ key.forced.height.value };\n` +
				`\tmin-height: ${ key.forced.height.value };\n}`
		)
	);

	// Neutralise the legacy box-shadow focus ring from the `colors` stylesheet;
	// focus is drawn with outline/outline-offset (see key.forced.focusBoxShadowReset).
	out.append(
		postcss.parse(
			`\n\n/* Remove the legacy box-shadow focus ring (colors stylesheet); we use outline. */\n` +
				`${ key.forced.focusBoxShadowReset.selector } {\n` +
				`\tbox-shadow: none;\n}`
		)
	);

	const header =
		`/* stylelint-disable -- Generated build artifact, not hand-authored source. It is the React Button's COMPILED CSS re-scoped onto legacy selectors, so it legitimately carries compiled-output traits that source rules reject: baked-in token fallbacks, --wp-components-color-* bridge vars, and duplicate selectors from SCSS nesting. */\n` +
		`/*\n` +
		` * WordPress Design System — classic button styles.\n` +
		` *\n` +
		` * GENERATED FILE — DO NOT EDIT BY HAND.\n` +
		` * Regenerate: node lib/experimental/wpds-classic-buttons/generate.mjs\n` +
		` *\n` +
		` * Derived from the React Button's compiled CSS\n` +
		` * (packages/components/build-style/style.css): each \`.components-button\`\n` +
		` * rule is re-scoped onto the legacy classic classes per\n` +
		` * buttons-translation-key.json. Declarations are React's, verbatim, so\n` +
		` * classic renders the same implementation (incl. outline focus ring).\n` +
		` *\n` +
		` * NOTE (finding): the compiled output references --wp-components-color-*\n` +
		` * bridge variables that are components-package-internal. They resolve in\n` +
		` * classic admin only via their baked-in fallback chain down to\n` +
		` * --wp-admin-theme-color. A Core-native version should author against\n` +
		` * --wpds-* / --wp-admin-* directly and drop the components bridge layer.\n` +
		` */\n`;

	let css = header + out.toString() + '\n';
	// Normalise to WordPress CSS house style so the output passes stylelint
	// without a separate --fix pass (keeps the --check drift gate honest):
	// 2-space indentation from the compiled source -> tabs.
	css = css.replace( /^( +)/gm, ( spaces ) =>
		'\t'.repeat( Math.floor( spaces.length / 2 ) )
	);
	// Unquoted attribute selectors -> quoted (e.g. [aria-disabled=true]).
	css = css.replace(
		/\[([\w-]+)=([^\]"']+)\]/g,
		( _match, attr, value ) => `[${ attr }="${ value }"]`
	);
	return css;
}

const output = build();

if ( process.argv.includes( '--check' ) ) {
	let current = '';
	try {
		current = readFileSync( OUT_FILE, 'utf8' );
	} catch {
		current = '';
	}
	if ( current !== output ) {
		// eslint-disable-next-line no-console
		console.error(
			'DRIFT: buttons.css is out of sync with the React source / key.\n' +
				'Run: node lib/experimental/wpds-classic-buttons/generate.mjs'
		);
		process.exit( 1 );
	}
	// eslint-disable-next-line no-console
	console.log( 'OK: buttons.css is in sync.' );
	process.exit( 0 );
}

writeFileSync( OUT_FILE, output );
// eslint-disable-next-line no-console
console.log( `Wrote ${ OUT_FILE }` );
