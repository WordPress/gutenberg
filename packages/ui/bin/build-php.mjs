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
 *   - `example`      Props for the preview page and the checks below, and
 *                    its `content` for components that accept it.
 *   - `content`      Optional. Whether the component accepts content, rendered
 *                    where `render` uses `"$content"`.
 *   - `compositionExamples`
 *                    Optional. Components to render inside the content, for
 *                    the check that PHP composes them as React nests them.
 *
 * The build renders the React element once for every combination of variants,
 * with placeholders for the slots. It stores one base render and what each
 * variant value changes, and checks that those changes rebuild every
 * combination exactly. Combinations they don't rebuild, such as a variant that
 * swaps an element, are stored as full snapshots.
 *
 * It also checks what keeps PHP in step with React:
 *
 *   - Every variant must change the markup, or React stopped reading the prop.
 *   - `php/<name>/snapshot.html` holds the example markup. When React changes,
 *     it's out of date until updated with `--update-snapshots`, so the change
 *     shows up in review and the PHPUnit check fails until then.
 *   - Translated strings aren't supported yet, so the build fails if one
 *     reaches the markup rather than writing the English text into it.
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
	getSlotPlaceholder,
	getSlotValues,
	getSnapshotKey,
	getUnreadPropRemover,
	getVariants,
} from './php/render.mjs';
import {
	formatSnapshotFile,
	stripRuntimeAttributes,
} from './php/snapshots.mjs';
import {
	compileVariantChanges,
	markPlaceholderContext,
} from './php/variant-changes.mjs';
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
 * Makes strings React translates come out as a marker while rendering
 * snapshots. PHP components don't support translations yet, so the build
 * fails if the marker reaches the markup, rather than writing the English
 * text into it. It can't fail on the call itself: components call `__()` for
 * text they don't always render, such as Button's loading announcement.
 *
 * Hooks into the `@wordpress/hooks` instance `@wordpress/i18n` uses, which is
 * the one the built package imports.
 *
 * @return {Promise<Object>} `start()` and `stop()` the marker.
 */
const TRANSLATED_TEXT = '__wpuitext__';

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
	let active = false;

	for ( const hook of [
		'i18n.gettext',
		'i18n.gettext_with_context',
		'i18n.ngettext',
		'i18n.ngettext_with_context',
	] ) {
		defaultHooks.addFilter(
			hook,
			'wordpress/ui/build-php',
			( translation ) => ( active ? TRANSLATED_TEXT : translation )
		);
	}

	return {
		start: () => ( active = true ),
		stop: () => ( active = false ),
	};
}

/**
 * Builds one component: renders its snapshots and examples, and checks them
 * against React.
 *
 * @param {Object} component Its `component.json`, in `php/<name>/`.
 * @param {Object} context   Shared build state: the built package (`ui`), the
 *                           compiled `stylesheets`, `allCss`, `classReferences`,
 *                           `translations` and every component's `definitions`.
 * @return {Promise<Object>} The component's manifest entry, examples and used
 *         stylesheets, and any problems, stale snapshot or markup change to
 *         report.
 */
async function buildComponent( component, context ) {
	const {
		ui,
		stylesheets,
		allCss,
		classReferences,
		translations,
		definitions,
	} = context;
	const dir = path.join( PACKAGE_DIR, 'php', component.name );

	// Content isn't a prop. In PHP it's its own argument, escaped unless it's
	// safe HTML, so it gets its own placeholder, `$content` in `render`.
	if ( component.props.content ) {
		throw new Error(
			`${ component.name }: "content" is reserved for the content argument. Set \`"content": true\` instead of declaring it as a prop.`
		);
	}
	if (
		component.content &&
		! JSON.stringify( component.render ).includes( '"$content"' )
	) {
		throw new Error(
			`${ component.name } accepts content, but its \`render\` mapping doesn't use \`"$content"\`.`
		);
	}
	const { content: exampleContent, ...exampleProps } =
		component.example ?? {};
	const withContent = ( values, content ) =>
		component.content ? { ...values, content } : values;
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
	const slotValues = withContent(
		getSlotValues( component ),
		getSlotPlaceholder( 'content' )
	);
	const renders = new Map();
	for ( const combination of getCombinations( variants ) ) {
		const values = { ...slotValues };
		for ( const { prop } of variants ) {
			values[ prop ] = combination[ prop ];
		}
		translations.start();
		const html = render( values );
		translations.stop();
		if ( html.includes( TRANSLATED_TEXT ) ) {
			throw new Error(
				`${ component.name } renders translated text, which PHP components don't support yet.`
			);
		}
		// Content is HTML, so it can only go where HTML goes, never in an attribute.
		if (
			markPlaceholderContext( html ).includes(
				'__wpuislot_content__attr_'
			)
		) {
			throw new Error(
				`${ component.name } renders its content in an attribute. Content can only be rendered as children.`
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

	// Keep one base render and what each variant value changes, with full
	// snapshots only for the combinations those changes don't rebuild.
	const defaults = Object.fromEntries(
		variants.map( ( { prop, values } ) => [
			prop,
			component.props[ prop ].default ?? values[ 0 ],
		] )
	);
	const { base, changes, exceptions } = compileVariantChanges(
		variants,
		defaults,
		renders
	);

	// Every combination rendered with real values, for the PHPUnit check that
	// PHP rebuilds each one exactly.
	result.combinations = [ ...renders.values() ].map( ( { combination } ) => {
		const props = { ...exampleProps, ...combination };
		return {
			component: component.name,
			props,
			content: exampleContent,
			html: render(
				withContent(
					getExampleValues( component, props ),
					exampleContent
				)
			),
		};
	} );

	// Render the examples with real values. A variant that doesn't change the
	// markup means React no longer reads the prop, for example after a rename.
	// An unread prop can still show up as a stray attribute (`tone="neutral"`),
	// so those don't count.
	result.examples = getExampleCases(
		{ ...component, example: exampleProps },
		variants
	).map( ( { name, props } ) => ( {
		component: component.name,
		name,
		props,
		content: exampleContent,
		html: render(
			withContent( getExampleValues( component, props ), exampleContent )
		),
	} ) );

	// Components rendered inside this one's content, as React would nest them,
	// for the PHPUnit check that composing them in PHP gives the same markup.
	result.compositions = ( component.compositionExamples ?? [] ).map(
		( { name, props = {}, content } ) => {
			const inner = definitions.get( content.component );
			if ( ! inner ) {
				throw new Error(
					`${ component.name }: the "${ name }" composition uses an unknown component "${ content.component }".`
				);
			}
			const node = createNode(
				inner.render,
				getExampleValues( inner, content.props ?? {} ),
				ui
			);
			return {
				component: component.name,
				name,
				props,
				content,
				html: render(
					withContent( getExampleValues( component, props ), node )
				),
			};
		}
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
		content: Boolean( component.content ),
		base,
		changes,
		exceptions,
	};
	result.combinationCount = renders.size;

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
		definitions: new Map(),
	};
	for ( const file of (
		await glob( 'php/*/component.json', { cwd: PACKAGE_DIR } )
	).sort() ) {
		const definition = JSON.parse(
			await readFile( path.join( PACKAGE_DIR, file ), 'utf8' )
		);
		context.definitions.set( definition.name, definition );
	}

	await rm( OUT_DIR, { recursive: true, force: true } );
	await mkdir( path.join( TEST_DIR, 'snapshots' ), { recursive: true } );

	const results = [];
	for ( const definition of context.definitions.values() ) {
		results.push( await buildComponent( definition, context ) );
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
	await writeFile(
		path.join( TEST_DIR, 'compositions.json' ),
		JSON.stringify(
			results.flatMap( ( result ) => result.compositions ),
			null,
			'\t'
		) + '\n'
	);
	await writeFile(
		path.join( TEST_DIR, 'combinations.json' ),
		JSON.stringify(
			results.flatMap( ( result ) => result.combinations ),
			null,
			'\t'
		) + '\n'
	);

	console.log(
		`Built PHP components: ${ results
			.map(
				( { name, entry, combinationCount } ) =>
					`${ name } (${ combinationCount } combination${
						combinationCount === 1 ? '' : 's'
					}: a base, ${
						Object.keys( entry.changes ).length
					} changes and ${
						Object.keys( entry.exceptions ).length
					} full snapshots)`
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
