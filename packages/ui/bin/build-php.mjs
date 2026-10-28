/**
 * Builds what PHP needs to render `@wordpress/ui` components on server-rendered
 * admin screens.
 *
 * Each component PHP can render has a `php/<name>/component.json` with its
 * content, props and a recipe: the classes it always has, and the classes each
 * variant value adds. PHP renders the markup from a small template, and the
 * recipe says which classes go on it.
 *
 * A component without a recipe gets its markup from React instead: the build
 * renders it with placeholders for its content and free-form props, once with
 * the defaults and once per variant value, and stores the default render plus
 * what each value changes. PHP applies those changes and fills in the
 * placeholders.
 *
 * Recipes name classes as in the component's own stylesheet (`is-brand` in
 * `src/button/style.module.css`), or as `<stylesheet>:<class>` for a shared
 * one (`utils/css/resets:box-sizing` in `src/utils/css/resets.module.css`).
 *
 * The build:
 *
 *   - Compiles the package's CSS modules with the same scoped class names as
 *     the React build, and writes the ones the recipes use to `style.css`.
 *   - Resolves each recipe to those scoped class names, in `manifest.json`.
 *   - Renders every combination of variants with React, to `test/fixtures.json`.
 *     The PHPUnit parity tests check that PHP renders the same markup, so the
 *     recipes and templates can't drift from React without a failing test.
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
import { compileVariantChanges } from './php/variant-changes.mjs';

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
 * The prefix React's generated IDs get in build renders. PHP replaces it with
 * a prefix per instance, and passes the same prefix to `hydrateRoot()`, so
 * IDs stay unique on the page and match when React hydrates.
 */
const ID_PREFIX = '__wpuiid__';

/**
 * Turns PHP props into the props the React component takes: `class` becomes
 * `className`, and the component's `rename` map applies (for example,
 * `checked` becomes `defaultChecked`, since the page owns the value).
 *
 * @param {Object} react    The component's `react` section.
 * @param {Object} phpProps PHP props.
 * @return {Object} React props.
 */
function getReactProps( react, phpProps ) {
	const reactProps = { ...react.props };
	for ( const [ prop, value ] of Object.entries( phpProps ) ) {
		const reactProp =
			'class' === prop ? 'className' : ( react.rename?.[ prop ] ?? prop );
		reactProps[ reactProp ] = value;
	}
	return reactProps;
}

/**
 * Renders a component with React, with placeholders for its content and
 * free-form props, and compacts the renders into a base render plus what
 * each variant value changes.
 *
 * @param {Object}                                     options
 * @param {Object}                                     options.props       Props schema.
 * @param {Array}                                      options.variants    `[ prop, values ]` for enum and boolean props.
 * @param {(props: Object, content: string) => string} options.renderReact Renders the component with PHP props and content.
 * @return {Object} `{ base, changes, exceptions }`.
 */
function compileMarkup( { props, variants, renderReact } ) {
	const slots = Object.fromEntries(
		Object.entries( props )
			.filter(
				( [ , schema ] ) => ! schema.enum && 'boolean' !== schema.type
			)
			.map( ( [ prop ] ) => [ prop, `__wpuislot_${ prop }__` ] )
	);
	const defaults = Object.fromEntries(
		variants.map( ( [ prop, values ] ) => [
			prop,
			props[ prop ].default ?? values[ 0 ],
		] )
	);
	const keyOf = ( combination ) =>
		variants
			.map( ( [ prop ] ) => `${ prop }=${ combination[ prop ] }` )
			.join( '&' );

	const renders = new Map();
	const render = ( combination ) =>
		renders.set( keyOf( combination ), {
			combination,
			html: renderReact(
				{ ...combination, ...slots },
				'__wpuislot_content__'
			),
		} );
	render( defaults );
	for ( const [ prop, values ] of variants ) {
		for ( const value of values ) {
			if ( value !== defaults[ prop ] ) {
				render( { ...defaults, [ prop ]: value } );
			}
		}
	}

	return compileVariantChanges(
		variants.map( ( [ prop, values ] ) => ( { prop, values } ) ),
		defaults,
		renders
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
 * Bundles `php/interactive.mjs` with the components React mounts or hydrates
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
	const interactive = new Set();
	const usedStylesheets = new Set();

	for ( const file of (
		await glob( 'php/*/component.json', { cwd: PACKAGE_DIR } )
	).sort() ) {
		const component = JSON.parse(
			await readFile( path.join( PACKAGE_DIR, file ), 'utf8' )
		);
		const { name, content, props, classes, react } = component;

		// Components that React renders in the browser, over a native
		// fallback PHP prints. Their markup isn't compared with React's,
		// since the fallback is different on purpose.
		if ( 'mount' === component.interactive ) {
			manifest.components[ name ] = {
				props,
				interactive: { how: 'mount', component: react.component },
			};
			interactive.add( react.component );
			const {
				value,
				class: className,
				...rest
			} = component.example.props;
			examples.push( {
				component: name,
				name: 'example',
				props: component.example.props,
				content: null,
				html: renderToStaticMarkup(
					createElement( ui[ react.component ], {
						...rest,
						className,
						defaultValue:
							rest.items.find(
								( item ) => item.value === value
							) ?? null,
					} )
				),
			} );
			continue;
		}
		const resolve = ( references ) =>
			references.map( ( reference ) => {
				const qualified = reference.includes( ':' )
					? reference
					: `${ name }/style:${ reference }`;
				usedStylesheets.add( qualified.split( ':' )[ 0 ] );
				return resolveClass( qualified, name );
			} );

		if ( classes ) {
			checkRecipe( component );
			manifest.components[ name ] = {
				content,
				props,
				classes: {
					base: resolve( classes.base ),
					variants: Object.fromEntries(
						Object.entries( classes.variants ).map(
							( [ prop, values ] ) => [
								prop,
								Object.fromEntries(
									Object.entries( values ).map(
										( [ value, references ] ) => [
											value,
											resolve( references ),
										]
									)
								),
							]
						)
					),
				},
			};
		}

		// Every combination of enums and booleans, rendered with React.
		const variants = Object.entries( props )
			.filter(
				( [ , schema ] ) => schema.enum || 'boolean' === schema.type
			)
			.map( ( [ prop, schema ] ) => [
				prop,
				schema.enum ?? [ false, true ],
			] );
		// The example's props and content, for the fixtures and the preview.
		// Button only needs its label; components with required props, like
		// SwitchControl, list them in `example`.
		const example = component.example ?? { content: 'Save changes' };
		const exampleProps = example.props ?? {};
		// Plus a custom class, and content that needs escaping, so the tests
		// also check that PHP escapes it the way React does.
		const cases = [
			...getCombinations( variants ).map( ( values ) => ( {
				props: { ...exampleProps, ...values },
				content: example.content,
			} ) ),
			{
				props: { ...exampleProps, class: 'my-plugin-class' },
				content: example.content,
			},
			...( example.content
				? [
						{
							props: exampleProps,
							content: 'Save & <continue> "now"',
						},
					]
				: [] ),
		];
		const renderReact = ( phpProps, text ) =>
			renderToStaticMarkup(
				createElement(
					ui[ react.component ],
					getReactProps( react, phpProps ),
					text
				),
				// Hydrated components keep React's generated IDs, which PHP
				// makes unique per instance by replacing this prefix.
				{ identifierPrefix: ID_PREFIX }
			);
		if ( ! classes ) {
			manifest.components[ name ] = {
				content,
				props,
				markup: compileMarkup( {
					props,
					variants,
					renderReact: ( phpProps, text ) =>
						renderReact( { ...exampleProps, ...phpProps }, text ),
				} ),
				...( 'hydrate' === component.interactive && {
					interactive: {
						how: 'hydrate',
						component: react.component,
						props: react.props ?? {},
						rename: react.rename ?? {},
					},
				} ),
			};
			if ( component.interactive ) {
				interactive.add( react.component );
			}
			for ( const [ key, { classNames } ] of stylesheets ) {
				const markup = JSON.stringify(
					manifest.components[ name ].markup
				);
				if (
					Object.values( classNames ?? {} ).some( ( className ) =>
						markup.includes( className )
					)
				) {
					usedStylesheets.add( key );
				}
			}
		}

		for ( const { props: phpProps, content: text } of cases ) {
			fixtures.push( {
				component: name,
				props: phpProps,
				content: text ?? null,
				html: renderReact( phpProps, text ),
			} );
		}

		// For the preview page: the example, then each value on its own.
		examples.push( {
			component: name,
			name: 'example',
			props: exampleProps,
			content: example.content ?? null,
			html: renderReact( exampleProps, example.content ),
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
					content: example.content ?? null,
					html: renderReact( valueProps, example.content ),
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
