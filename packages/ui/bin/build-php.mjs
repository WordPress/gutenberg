/**
 * Builds what PHP needs to render `@wordpress/ui` components on server-rendered
 * admin screens.
 *
 * Each component PHP can render has a `php/<name>/component.json` with its
 * content, props and the stylesheets it uses, named by their path in `src`
 * (`button/style` for `src/button/style.module.css`).
 *
 * PHP gets the markup from React: the build renders each component with
 * placeholders for its content and free-form props, once with the defaults
 * and once per variant value, and stores the default render plus what each
 * value changes. PHP applies those changes and fills in the placeholders.
 *
 * The build:
 *
 *   - Compiles the stylesheets the components use, with the same scoped class
 *     names as the React build, to `style.css`.
 *   - Writes each component's props and markup, and each stylesheet's class
 *     names, to `manifest.json`.
 *   - Renders every combination of variants with React, to `test/fixtures.json`.
 *     The PHPUnit parity tests check that PHP renders the same markup, so it
 *     can't drift from React without a failing test.
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
import { compileVariantChanges } from './php/variant-changes.mjs';

const PACKAGE_DIR = path.resolve(
	path.dirname( fileURLToPath( import.meta.url ) ),
	'..'
);
const ROOT_DIR = path.resolve( PACKAGE_DIR, '../..' );
const OUT_DIR = path.join( PACKAGE_DIR, 'build-php' );

/**
 * Compiles a CSS module of the package, named by its path in `src`:
 * `button/style` is `src/button/style.module.css` (or `.scss`).
 *
 * @param {string} key           Stylesheet name.
 * @param {string} componentName Component that uses it, for the error.
 * @return {Promise<{css: string, classNames: Object}>} Stylesheet.
 */
async function compileStylesheet( key, componentName ) {
	const [ file ] = await glob( `src/${ key }.module.{css,scss}`, {
		cwd: PACKAGE_DIR,
	} );
	if ( ! file ) {
		throw new Error(
			`${ componentName }: there's no "${ key }" CSS module in the package.`
		);
	}
	return compileStyleFile( path.join( PACKAGE_DIR, file ), {
		workingDir: PACKAGE_DIR,
		rootDir: ROOT_DIR,
	} );
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

async function main() {
	const ui = await import(
		pathToFileURL( path.join( PACKAGE_DIR, 'build-module/index.mjs' ) ).href
	);

	const manifest = { components: {}, styles: {} };
	const stylesheets = new Map();
	const fixtures = [];
	const examples = [];

	for ( const file of (
		await glob( 'php/*/component.json', { cwd: PACKAGE_DIR } )
	).sort() ) {
		const component = JSON.parse(
			await readFile( path.join( PACKAGE_DIR, file ), 'utf8' )
		);
		const { name, content, props, styles, react } = component;

		for ( const key of styles ) {
			if ( ! stylesheets.has( key ) ) {
				stylesheets.set( key, await compileStylesheet( key, name ) );
			}
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
		const renderReact = ( phpProps, text ) => {
			const reactProps = { ...react.props };
			for ( const [ prop, value ] of Object.entries( phpProps ) ) {
				reactProps[ 'class' === prop ? 'className' : prop ] = value;
			}
			return renderToStaticMarkup(
				createElement( ui[ react.component ], reactProps, text )
			);
		};
		manifest.components[ name ] = {
			content,
			props,
			markup: compileMarkup( { props, variants, renderReact } ),
		};

		for ( const { props: phpProps, content: text } of cases ) {
			// A component without content renders without it.
			const fixtureContent = content ? text : undefined;
			fixtures.push( {
				component: name,
				props: phpProps,
				content: fixtureContent,
				html: renderReact( phpProps, fixtureContent ),
			} );
		}

		// For the preview page: the default, then each value on its own.
		const exampleContent = content ? 'Save changes' : undefined;
		examples.push( {
			component: name,
			name: 'example',
			props: {},
			content: exampleContent,
			html: renderReact( {}, exampleContent ),
		} );
		for ( const [ prop, values ] of variants ) {
			for ( const value of values ) {
				if ( value === ( props[ prop ].default ?? false ) ) {
					continue;
				}
				examples.push( {
					component: name,
					name: `${ prop }: ${ value }`,
					props: { [ prop ]: value },
					content: exampleContent,
					html: renderReact( { [ prop ]: value }, exampleContent ),
				} );
			}
		}
	}

	// Sorted by name, so the order doesn't depend on which component uses a
	// stylesheet first.
	const keys = [ ...stylesheets.keys() ].sort();
	for ( const key of keys ) {
		manifest.styles[ key ] = stylesheets.get( key ).classNames;
	}

	await rm( OUT_DIR, { recursive: true, force: true } );
	await mkdir( path.join( OUT_DIR, 'test' ), { recursive: true } );
	await writeFile(
		path.join( OUT_DIR, 'style.css' ),
		keys.map( ( key ) => stylesheets.get( key ).css ).join( '\n' ) + '\n'
	);
	await writeFile(
		path.join( OUT_DIR, 'manifest.json' ),
		JSON.stringify( manifest, null, '\t' ) + '\n'
	);
	await writeFile(
		path.join( OUT_DIR, 'examples.json' ),
		JSON.stringify( examples, null, '\t' ) + '\n'
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
