/**
 * Builds what PHP needs to render `@wordpress/ui` components on server-rendered
 * admin screens.
 *
 * Each component PHP can render has a `php/<name>/component.json` with its
 * content, props and a recipe: the classes it always has, and the classes each
 * variant value adds. PHP renders the markup from a small template, and the
 * recipe says which classes go on it.
 *
 * Recipes name classes as in the component's own stylesheet (`is-brand` in
 * `src/button/style.module.css`), or as `<stylesheet>:<class>` for a shared
 * one (`utils/css/resets:box-sizing` in `src/utils/css/resets.module.css`).
 * Templates with more than one element name the classes of the others in
 * `parts`, like a switch's thumb.
 *
 * Components with `"interactive": true` are brought to life in the browser:
 * React mounts the real component over what PHP printed. Their template prints
 * React's markup when it can, so nothing moves when React takes over, or a
 * native field (`"nativeFallback": true`), like a `<select>` for a searchable
 * select.
 *
 * The build:
 *
 *   - Compiles the package's CSS modules with the same scoped class names as
 *     the React build, and writes the ones the recipes use to `style.css`.
 *   - Resolves each recipe to those scoped class names, in `manifest.json`.
 *   - Renders every combination of variants with React, to `test/fixtures.json`.
 *     The PHPUnit parity tests check that PHP renders the same markup, so the
 *     recipes and templates can't drift from React without a failing test.
 *   - Bundles the interactive components into `interactive.js`, which uses
 *     WordPress's own React.
 *
 * Runs after `wp-build` (as `build:wp`), because it renders the built package.
 * Writes to `build-php/`, which is never committed.
 */
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import glob from 'fast-glob';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
	compileStyleFile,
	disposeSassCompiler,
} from '@wordpress/build/compile-style';

const PACKAGE_DIR = path.resolve(
	path.dirname( fileURLToPath( import.meta.url ) ),
	'..'
);
const ROOT_DIR = path.resolve( PACKAGE_DIR, '../..' );
const OUT_DIR = path.join( PACKAGE_DIR, 'build-php' );

/**
 * Compiles every CSS module in the package, keyed the way recipes refer to
 * them: `src/button/style.module.css` is `button/style`.
 *
 * @return {Promise<Map<string, {css: string, classNames: Object}>>} Stylesheets.
 */
async function compileStylesheets() {
	const stylesheets = new Map();
	const files = await glob( 'src/**/*.module.{css,scss}', {
		cwd: PACKAGE_DIR,
		ignore: [ '**/stories/**', '**/test/**' ],
	} );
	for ( const file of files.sort() ) {
		const key = file
			.replace( /^src\//, '' )
			.replace( /\.module\.(css|scss)$/, '' );
		stylesheets.set(
			key,
			await compileStyleFile( path.join( PACKAGE_DIR, file ), {
				workingDir: PACKAGE_DIR,
				rootDir: ROOT_DIR,
			} )
		);
	}
	return stylesheets;
}

/**
 * Lists every combination of the values of the given props.
 *
 * @param {Array} variants `[ prop, values ]` pairs.
 * @return {Object[]} Combinations, as props.
 */
function getCombinations( variants ) {
	return variants.reduce(
		( combinations, [ prop, values ] ) =>
			combinations.flatMap( ( combination ) =>
				values.map( ( value ) => ( {
					...combination,
					[ prop ]: value,
				} ) )
			),
		[ {} ]
	);
}

/**
 * Finds the built module of a component, like
 * `build-module/form/searchable-select-control/index.mjs`.
 *
 * @param {string} name Component name, as exported by `@wordpress/ui`.
 * @return {string} Path of the module.
 */
function findModule( name ) {
	const folder = name.replace(
		/[A-Z]/g,
		( letter, index ) => ( index ? '-' : '' ) + letter.toLowerCase()
	);
	const [ file ] = glob
		.sync( `build-module/**/${ folder }/index.mjs`, { cwd: PACKAGE_DIR } )
		.sort( ( a, b ) => a.length - b.length );
	if ( ! file ) {
		throw new Error( `Can't find the module of "${ name }".` );
	}
	return path.join( PACKAGE_DIR, file );
}

/**
 * Points React imports, including `require()` calls in bundled CommonJS
 * modules, at the copies WordPress loads as `wp.element`'s dependencies.
 *
 * @return {Object} Rolldown plugin.
 */
function wordpressGlobals() {
	const globals = {
		react: 'React',
		'react-dom': 'ReactDOM',
		'react-dom/client': 'ReactDOM',
		'react/jsx-runtime': 'ReactJSXRuntime',
	};
	return {
		name: 'wordpress-globals',
		resolveId: ( id ) => ( id in globals ? `\0global:${ id }` : null ),
		load: ( id ) =>
			id.startsWith( '\0global:' )
				? `module.exports = window.${
						globals[ id.slice( '\0global:'.length ) ]
					};`
				: null,
	};
}

/**
 * Bundles `php/interactive.mjs` with the components React mounts
 * in the browser.
 * React and ReactDOM come from WordPress's own scripts, so they aren't bundled.
 *
 * @param {string[]} names Component names, as exported by `@wordpress/ui`.
 */
async function bundleInteractive( names ) {
	const requireFromBuild = createRequire(
		createRequire( import.meta.url ).resolve(
			'@wordpress/build/package.json'
		)
	);
	const { build } = await import(
		pathToFileURL( requireFromBuild.resolve( 'rolldown' ) ).href
	);
	const entry = path.join( OUT_DIR, 'interactive-entry.mjs' );
	await writeFile(
		entry,
		[
			// Each from its own module, so only those components are bundled.
			...names.map(
				( name ) =>
					`import { ${ name } } from ${ JSON.stringify(
						findModule( name )
					) };`
			),
			`import { startAll } from ${ JSON.stringify(
				path.join( PACKAGE_DIR, 'php/interactive.mjs' )
			) };`,
			`const components = { ${ names.join( ', ' ) } };`,
			'startAll( components );',
		].join( '\n' )
	);
	await build( {
		input: entry,
		// Base UI marks its modules with "use client", which only matters to
		// server-component bundlers.
		onLog: ( level, log, handler ) =>
			'MODULE_LEVEL_DIRECTIVE' === log.code
				? undefined
				: handler( level, log ),
		plugins: [ wordpressGlobals() ],
		transform: { define: { 'process.env.NODE_ENV': '"production"' } },
		output: {
			file: path.join( OUT_DIR, 'interactive.js' ),
			format: 'iife',
			minify: true,
		},
	} );
	await rm( entry );
}

async function main() {
	// postcss-modules scopes class names relative to the working directory, so
	// compile from the repository root, as the JavaScript build does.
	process.chdir( ROOT_DIR );

	const stylesheets = await compileStylesheets();
	const ui = await import(
		pathToFileURL( path.join( PACKAGE_DIR, 'build-module/index.mjs' ) ).href
	);

	const resolveClass = ( reference, componentName ) => {
		const [ key, local ] = reference.split( ':' );
		const scoped = stylesheets.get( key )?.classNames?.[ local ];
		if ( ! scoped ) {
			throw new Error(
				`${ componentName }: "${ reference }" doesn't match a class in the package's CSS modules.`
			);
		}
		return scoped;
	};

	// Props are the public contract and the recipe is how each value looks, so
	// they're kept apart. Check they agree, so a value can't be added to one
	// and forgotten in the other.
	const checkRecipe = ( { name, props, classes } ) => {
		const problems = [];
		for ( const [ prop, values ] of Object.entries( classes.variants ) ) {
			const schema = props[ prop ];
			const allowed =
				schema?.enum ??
				( 'boolean' === schema?.type ? [ false, true ] : null );
			if ( ! allowed ) {
				problems.push(
					`the recipe has "${ prop }", which isn't an enum or boolean prop`
				);
				continue;
			}
			const expected = allowed.map( String );
			for ( const value of Object.keys( values ) ) {
				if ( ! expected.includes( value ) ) {
					problems.push(
						`the recipe has "${ prop }: ${ value }", which isn't an allowed value`
					);
				}
			}
			for ( const value of expected ) {
				if ( ! ( value in values ) ) {
					problems.push(
						`the recipe is missing "${ prop }: ${ value }" (use [] if it adds no classes)`
					);
				}
			}
		}
		if ( problems.length ) {
			throw new Error( `${ name }: ${ problems.join( '; ' ) }.` );
		}
	};

	const manifest = { components: {} };
	const fixtures = [];
	const examples = [];
	const usedStylesheets = new Set();
	const interactive = new Set();

	for ( const file of (
		await glob( 'php/*/component.json', { cwd: PACKAGE_DIR } )
	).sort() ) {
		const component = JSON.parse(
			await readFile( path.join( PACKAGE_DIR, file ), 'utf8' )
		);
		const { name, content, props, react } = component;
		const classes = {
			base: [],
			variants: {},
			parts: {},
			...component.classes,
		};
		checkRecipe( { name, props, classes } );
		const resolve = ( references ) =>
			references.map( ( reference ) => {
				const qualified = reference.includes( ':' )
					? reference
					: `${ name }/style:${ reference }`;
				usedStylesheets.add( qualified.split( ':' )[ 0 ] );
				return resolveClass( qualified, name );
			} );
		const resolveAll = ( groups ) =>
			Object.fromEntries(
				Object.entries( groups ).map( ( [ key, references ] ) => [
					key,
					resolve( references ),
				] )
			);

		manifest.components[ name ] = {
			content,
			props,
			classes: {
				base: resolve( classes.base ),
				variants: Object.fromEntries(
					Object.entries( classes.variants ).map(
						( [ prop, values ] ) => [ prop, resolveAll( values ) ]
					)
				),
				// Classes for the other elements of the template, by name.
				parts: resolveAll( classes.parts ),
			},
			...( component.interactive && {
				interactive: {
					component: react.component,
					props: react.props ?? {},
					rename: react.rename ?? {},
				},
			} ),
		};
		if ( component.interactive ) {
			interactive.add( react.component );
		}

		const renderReact = ( phpProps, text ) => {
			const reactProps = { ...react.props };
			for ( const [ prop, value ] of Object.entries( phpProps ) ) {
				const reactProp =
					'class' === prop
						? 'className'
						: ( react.rename?.[ prop ] ?? prop );
				reactProps[ reactProp ] = value;
			}
			// A searchable select takes its selected item, not its value.
			if ( Array.isArray( reactProps.items ) ) {
				reactProps.defaultValue =
					reactProps.items.find(
						( item ) => item.value === reactProps.value
					) ?? null;
				delete reactProps.value;
			}
			return renderToStaticMarkup(
				createElement( ui[ react.component ], reactProps, text )
			);
		};

		// Props and content for the fixtures and the preview. Components with
		// required props, like a switch's label, list them in `example`.
		const example = component.example ?? { content: 'Save changes' };
		const exampleProps = example.props ?? {};
		const exampleContent = example.content ?? null;

		// Every combination of enums and booleans.
		const variants = Object.entries( props )
			.filter(
				( [ , schema ] ) => schema.enum || 'boolean' === schema.type
			)
			.map( ( [ prop, schema ] ) => [
				prop,
				schema.enum ?? [ false, true ],
			] );

		// Templates that print a native field instead of React's markup, like
		// a select React mounts over, aren't compared with React's render.
		if ( ! component.nativeFallback ) {
			// Every combination, rendered with React. Plus a custom class, and
			// text that needs escaping, so the tests also check that PHP
			// escapes it the way React does.
			const escaped = 'Save & <continue> "now"';
			const cases = [
				...getCombinations( variants ).map( ( values ) => ( {
					props: { ...exampleProps, ...values },
					content: exampleContent,
				} ) ),
				{
					props: { ...exampleProps, class: 'my-plugin-class' },
					content: exampleContent,
				},
				null === exampleContent
					? {
							props: { ...exampleProps, label: escaped },
							content: null,
						}
					: { props: exampleProps, content: escaped },
			];
			for ( const { props: phpProps, content: text } of cases ) {
				fixtures.push( {
					component: name,
					props: phpProps,
					content: text,
					html: renderReact( phpProps, text ),
				} );
			}
		}

		// For the preview page: the example, then each value on its own.
		examples.push( {
			component: name,
			name: 'example',
			props: exampleProps,
			content: exampleContent,
			html: renderReact( exampleProps, exampleContent ),
		} );
		for ( const [ prop, values ] of variants ) {
			for ( const value of values ) {
				if ( value === ( props[ prop ].default ?? false ) ) {
					continue;
				}
				const valueProps = { ...exampleProps, [ prop ]: value };
				examples.push( {
					component: name,
					name: `${ prop }: ${ value }`,
					props: valueProps,
					content: exampleContent,
					html: renderReact( valueProps, exampleContent ),
				} );
			}
		}
	}

	await rm( OUT_DIR, { recursive: true, force: true } );
	await mkdir( path.join( OUT_DIR, 'test' ), { recursive: true } );
	await writeFile(
		path.join( OUT_DIR, 'style.css' ),
		[ ...stylesheets ]
			.filter( ( [ key ] ) => usedStylesheets.has( key ) )
			.map( ( [ , { css } ] ) => css )
			.concat(
				interactive.size
					? (
							await compileStyleFile(
								path.join( PACKAGE_DIR, 'php/fallback.css' ),
								{ workingDir: PACKAGE_DIR, rootDir: ROOT_DIR }
							)
						).css
					: []
			)
			.join( '\n' ) + '\n'
	);
	await writeFile(
		path.join( OUT_DIR, 'manifest.json' ),
		JSON.stringify( manifest, null, '\t' ) + '\n'
	);
	await writeFile(
		path.join( OUT_DIR, 'examples.json' ),
		JSON.stringify( examples, null, '\t' ) + '\n'
	);
	if ( interactive.size ) {
		await bundleInteractive( [ ...interactive ] );
	}
	await writeFile(
		path.join( OUT_DIR, 'test/fixtures.json' ),
		JSON.stringify( fixtures, null, '\t' ) + '\n'
	);

	console.log(
		`Built PHP components: ${ Object.keys( manifest.components ).join(
			', '
		) } (${ fixtures.length } React fixtures).`
	);
}

main()
	.catch( ( error ) => {
		console.error( error.message ?? error );
		process.exitCode = 1;
	} )
	.finally( disposeSassCompiler );
