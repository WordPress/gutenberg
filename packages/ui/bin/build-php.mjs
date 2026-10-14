#!/usr/bin/env node
/**
 * Builds what PHP needs to render `@wordpress/ui` components on server-rendered
 * admin screens, generated from the React components themselves. See
 * `php/README.md` for how it fits together.
 *
 * Each component that PHP can render has a `php/<name>/component.json`:
 *
 *   - `props`        The PHP contract: a JSON schema per prop. Props with a
 *                    fixed set of values (an `enum` or a boolean) are variants;
 *                    free-form strings are slots filled in at render time.
 *   - `render`       The React element to render for those props, as
 *                    `[ type, props, ...children ]`, where `"$name"` refers to a prop.
 *   - `example`      Props for the preview page and the checks below.
 *
 * The build renders the React element once for every combination of variants,
 * with placeholders for the slots, and turns each render into a snapshot: the
 * markup split into literal HTML and the slots PHP fills in.
 *
 * It also checks what keeps PHP in step with React:
 *
 *   - Every variant must change the markup, or React stopped reading the prop.
 *   - `php/<name>/snapshot.html` holds the example markup. When React changes,
 *     it's out of date until updated with `--update-snapshots`, so the change
 *     shows up in review and the PHPUnit check fails until then.
 *
 * Writes everything else to `build-php/`, which is never committed.
 *
 * Runs after `wp-build` (as `build:wp`), because it renders the built package.
 * Each step lives in a module in `bin/php/`: rendering (`render.mjs`),
 * snapshots (`snapshots.mjs`) and stylesheets (`stylesheets.mjs`).
 */
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import glob from 'fast-glob';
import json2php from 'json2php';
import { renderToStaticMarkup } from 'react-dom/server';
import {
	createNode,
	getCombinations,
	getExampleCases,
	getExampleValues,
	getSlotValues,
	getSnapshotKey,
	getTextPlaceholder,
	getUnreadPropRemover,
	getVariants,
} from './php/render.mjs';
import {
	formatSnapshotFile,
	stripRuntimeAttributes,
	toSnapshot,
} from './php/snapshots.mjs';
import { compileStylesheets, getUsedStylesheets } from './php/stylesheets.mjs';

const PACKAGE_DIR = path.resolve(
	path.dirname( fileURLToPath( import.meta.url ) ),
	'..'
);
const ROOT_DIR = path.resolve( PACKAGE_DIR, '../..' );
const OUT_DIR = path.join( PACKAGE_DIR, 'build-php' );
// What only the checks and the preview page read; not published.
const TEST_DIR = path.join( OUT_DIR, 'test' );

const UPDATE_SNAPSHOTS = process.argv.includes( '--update-snapshots' );

/**
 * Makes the strings React translates come out as placeholders while rendering
 * snapshots, so PHP translates them instead of using the English text. Only
 * `__()` is supported; other functions fail the build if their text is
 * rendered, until they're needed.
 *
 * Hooks into the `@wordpress/hooks` instance `@wordpress/i18n` uses, which is
 * the one the built package imports.
 *
 * @return {Promise<Object>} `start()` and `stop()` the placeholders, and the
 *         `texts` seen so far, by placeholder index.
 */
const UNSUPPORTED_TRANSLATION = '__wpuitext_unsupported__';

async function catchTranslations() {
	const requireFromI18n = createRequire(
		createRequire( import.meta.url ).resolve(
			'@wordpress/i18n/package.json'
		)
	);
	const { defaultHooks } = await import(
		pathToFileURL(
			path.join(
				path.dirname(
					requireFromI18n.resolve( '@wordpress/hooks/package.json' )
				),
				'build-module/index.mjs'
			)
		).href
	);
	const texts = [];
	let active = false;

	defaultHooks.addFilter(
		'i18n.gettext',
		'wordpress/ui/build-php',
		( translation, text, domain = 'default' ) => {
			if ( ! active ) {
				return translation;
			}
			let index = texts.findIndex(
				( item ) => item.text === text && item.domain === domain
			);
			if ( index === -1 ) {
				index = texts.push( { text, domain } ) - 1;
			}
			return getTextPlaceholder( index );
		}
	);
	// Other functions return a marker the build fails on if it reaches the
	// markup. It can't fail on the call itself: `isRTL()` calls `_x()` too.
	// TODO: Support them when a component needs it. `_x()` only needs the
	// context recorded for PHP's `translate_with_gettext_context()`. `_n()`
	// depends on a number known at render time, so the number has to become a
	// prop and PHP has to pick the form with `_n()`.
	for ( const hook of [
		'i18n.gettext_with_context',
		'i18n.ngettext',
		'i18n.ngettext_with_context',
	] ) {
		defaultHooks.addFilter(
			hook,
			'wordpress/ui/build-php',
			( translation ) =>
				active ? UNSUPPORTED_TRANSLATION : translation
		);
	}

	return {
		texts,
		start: () => ( active = true ),
		stop: () => ( active = false ),
	};
}

/**
 * Builds one component: renders its snapshots and examples, and checks it
 * against React.
 *
 * @param {string} file    Path of its `component.json`, relative to the package.
 * @param {Object} context Shared build state: the built package (`ui`), the
 *                         compiled `stylesheets`, `allCss`, `classReferences`
 *                         and `translations`.
 * @return {Promise<Object>} The component's manifest entry, examples and used
 *         stylesheets, and any problems or stale snapshot to report.
 */
async function buildComponent( file, context ) {
	const { ui, stylesheets, allCss, classReferences, translations } = context;
	const dir = path.join( PACKAGE_DIR, path.dirname( file ) );
	const component = JSON.parse(
		await readFile( path.join( PACKAGE_DIR, file ), 'utf8' )
	);
	const render = ( values ) =>
		stripRuntimeAttributes(
			renderToStaticMarkup( createNode( component.render, values, ui ) ),
			allCss
		);
	const result = {
		problems: [],
		usedStyles: new Set(),
	};

	// Render every combination of variants, with placeholders for the slots.
	const variants = getVariants( component );
	const slotValues = getSlotValues( component );
	const renders = new Map();
	for ( const combination of getCombinations( variants ) ) {
		const values = { ...slotValues };
		for ( const { prop } of variants ) {
			values[ prop ] = combination[ prop ];
		}
		translations.start();
		const html = render( values );
		translations.stop();
		if ( html.includes( UNSUPPORTED_TRANSLATION ) ) {
			throw new Error(
				`${ component.name } renders text translated with \`_x()\` or \`_n()\`, which PHP components don't support yet.`
			);
		}
		renders.set( getSnapshotKey( variants, combination ), {
			combination,
			html,
		} );
		getUsedStylesheets( html, stylesheets ).forEach( ( key ) =>
			result.usedStyles.add( key )
		);
	}

	// Turn the renders into snapshots.
	const snapshots = {};
	for ( const [ key, { html } ] of renders ) {
		snapshots[ key ] = toSnapshot( html, translations.texts );
	}

	// Render the examples with real values. A variant that doesn't change the
	// markup means React no longer reads the prop, for example after a rename.
	// An unread prop can still show up as a stray attribute (`tone="neutral"`),
	// so those don't count.
	result.examples = getExampleCases( component, variants ).map(
		( { name, props } ) => ( {
			component: component.name,
			name,
			props,
			html: render( getExampleValues( component, props ) ),
		} )
	);
	const ignoreUnreadProps = getUnreadPropRemover( component );
	const [ example, ...variations ] = result.examples;
	for ( const variation of variations ) {
		if (
			ignoreUnreadProps( variation.html ) ===
			ignoreUnreadProps( example.html )
		) {
			result.problems.push(
				`${ component.name }: "${ variation.name }" renders the same markup as the example. Does the React component still accept that prop and value?`
			);
		}
	}

	// The committed snapshot shows reviewers the markup. PHPUnit compares it
	// with the one written to the build output.
	const snapshotFile = path.join( dir, 'snapshot.html' );
	const snapshot = formatSnapshotFile( result.examples, classReferences );
	await writeFile(
		path.join( TEST_DIR, 'snapshots', `${ component.name }.html` ),
		snapshot
	);
	if ( UPDATE_SNAPSHOTS ) {
		await writeFile( snapshotFile, snapshot );
	} else if (
		! existsSync( snapshotFile ) ||
		( await readFile( snapshotFile, 'utf8' ) ) !== snapshot
	) {
		result.staleSnapshot = path.relative( ROOT_DIR, snapshotFile );
	}

	result.name = component.name;
	result.entry = {
		props: component.props,
		variants: variants.map( ( { prop } ) => prop ),
		snapshots,
	};

	return result;
}

async function main() {
	// postcss-modules scopes class names relative to the working directory, so
	// compile from the repository root, as the JavaScript build does.
	process.chdir( ROOT_DIR );

	const packageJson = JSON.parse(
		await readFile( path.join( PACKAGE_DIR, 'package.json' ), 'utf8' )
	);
	const stylesheets = await compileStylesheets( PACKAGE_DIR, ROOT_DIR );
	const classReferences = new Map();
	for ( const [ key, { classNames } ] of stylesheets ) {
		for ( const [ local, scoped ] of Object.entries( classNames ?? {} ) ) {
			classReferences.set( scoped, `${ key }:${ local }` );
		}
	}
	const context = {
		ui: await import(
			pathToFileURL( path.join( PACKAGE_DIR, 'build-module/index.mjs' ) )
				.href
		),
		stylesheets,
		allCss: [ ...stylesheets.values() ]
			.map( ( { css } ) => css )
			.join( '' ),
		classReferences,
		translations: await catchTranslations(),
	};

	await rm( OUT_DIR, { recursive: true, force: true } );
	await mkdir( path.join( TEST_DIR, 'snapshots' ), { recursive: true } );

	const results = [];
	for ( const file of (
		await glob( 'php/*/component.json', { cwd: PACKAGE_DIR } )
	).sort() ) {
		results.push( await buildComponent( file, context ) );
	}

	const problems = results.flatMap( ( result ) => result.problems );
	if ( problems.length ) {
		throw new Error(
			`PHP components are out of step with React:\n- ${ problems.join(
				'\n- '
			) }`
		);
	}

	// Keep the order stable, so shared utilities come first as in React.
	const usedStyles = new Set(
		results.flatMap( ( result ) => [ ...result.usedStyles ] )
	);
	const styleKeys = [ ...stylesheets.keys() ].filter( ( key ) =>
		usedStyles.has( key )
	);
	await writeFile(
		path.join( OUT_DIR, 'style.css' ),
		styleKeys.map( ( key ) => stylesheets.get( key ).css ).join( '\n' ) +
			'\n'
	);

	// Every stylesheet in the package, as React has them. Only the visual check
	// uses it, to style React's markup independently of the PHP selection.
	await writeFile(
		path.join( TEST_DIR, 'all-styles.css' ),
		[ ...stylesheets.values() ].map( ( { css } ) => css ).join( '\n' ) +
			'\n'
	);

	const manifest = {
		version: packageJson.version,
		components: Object.fromEntries(
			results.map( ( result ) => [ result.name, result.entry ] )
		),
	};
	await writeFile(
		path.join( OUT_DIR, 'manifest.php' ),
		`<?php
/**
 * Generated by packages/ui/bin/build-php.mjs. Do not edit.
 *
 * @package gutenberg
 */

return ${ json2php.make( { linebreak: '\n', indent: '\t' } )( manifest ) };
`
	);
	await writeFile(
		path.join( TEST_DIR, 'examples.json' ),
		JSON.stringify(
			results.flatMap( ( result ) => result.examples ),
			null,
			'\t'
		) + '\n'
	);

	console.log(
		`Built PHP components: ${ results
			.map(
				( { name, entry } ) =>
					`${ name } (${
						Object.keys( entry.snapshots ).length
					} variants)`
			)
			.join( ', ' ) }.`
	);

	const staleSnapshots = results
		.map( ( result ) => result.staleSnapshot )
		.filter( Boolean );
	if ( staleSnapshots.length ) {
		console.warn(
			`\nThe React markup of these PHP components changed:\n- ${ staleSnapshots.join(
				'\n- '
			) }\nReview the change, then run \`npm run update-php-snapshots --workspace @wordpress/ui\` and commit the snapshots. The PHPUnit check fails until then.`
		);
	}
}

main().catch( ( error ) => {
	console.error( error.message ?? error );
	process.exitCode = 1;
} );
