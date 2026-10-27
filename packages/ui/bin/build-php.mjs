/**
 * Builds what PHP needs to render `@wordpress/ui` components on server-rendered
 * admin screens.
 *
 * Each component PHP can render has a `php/<name>/component.json` with its
 * content, props and a recipe: the classes it always has, and the classes each variant
 * value adds. PHP renders the markup from a small template, and the recipe
 * says which classes go on it. The build:
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

	const manifest = { components: {} };
	const fixtures = [];
	const usedStylesheets = new Set();

	for ( const file of (
		await glob( 'php/*/component.json', { cwd: PACKAGE_DIR } )
	).sort() ) {
		const component = JSON.parse(
			await readFile( path.join( PACKAGE_DIR, file ), 'utf8' )
		);
		const { name, content, props, classes, react } = component;
		const resolve = ( references ) =>
			references.map( ( reference ) => {
				usedStylesheets.add( reference.split( ':' )[ 0 ] );
				return resolveClass( reference, name );
			} );

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

		// Every combination of enums and booleans, rendered with React.
		const variants = Object.entries( props )
			.filter(
				( [ , schema ] ) => schema.enum || 'boolean' === schema.type
			)
			.map( ( [ prop, schema ] ) => [
				prop,
				schema.enum ?? [ false, true ],
			] );
		// Plus a custom class, and content that needs escaping, so the tests
		// also check that PHP escapes it the way React does.
		const cases = [
			...getCombinations( variants ).map( ( values ) => ( {
				props: values,
				content: 'Save changes',
			} ) ),
			{ props: { class: 'my-plugin-button' }, content: 'Save changes' },
			{ props: {}, content: 'Save & <continue> "now"' },
		];
		for ( const { props: phpProps, content: text } of cases ) {
			const reactProps = { ...react.props };
			for ( const [ prop, value ] of Object.entries( phpProps ) ) {
				reactProps[ 'class' === prop ? 'className' : prop ] = value;
			}
			fixtures.push( {
				component: name,
				props: phpProps,
				content: text,
				html: renderToStaticMarkup(
					createElement( ui[ react.component ], reactProps, text )
				),
			} );
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
