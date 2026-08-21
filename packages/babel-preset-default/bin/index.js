#!/usr/bin/env node
const { readFile, writeFile } = require( 'fs' ).promises;
const path = require( 'path' );
const { promisify } = require( 'util' );
const { version } = require( 'core-js/package.json' );
const compat = require( 'core-js-compat' );
const webpack = promisify( require( 'webpack' ) );
const { minify } = require( 'terser' );
const exclusions = require( '../polyfill-exclusions' );
const inclusions = require( '../polyfill-inclusions' );

const BUILD_DIR = path.resolve( __dirname, '../build' );

/**
 * Lists the `core-js` modules to bundle, in `core-js-compat` order.
 *
 * Passing the installed `core-js` version keeps a newer `core-js-compat` from
 * selecting a module that `core-js` does not ship.
 *
 * @return {string[]} Module names.
 */
function getModules() {
	// Resolve `targets` first, so that `inclusions` are added regardless.
	const { list } = compat( {
		modules: [ 'es.', 'web.' ],
		exclude: exclusions,
		targets: require( '@wordpress/browserslist-config' ),
		version,
	} );
	return compat( { modules: [ ...list, ...inclusions ], version } ).list;
}

/**
 * Builds the banner comment, which lists the bundled modules.
 *
 * @param {string[]} modules Module names.
 * @return {Promise<string>} Banner comment.
 */
async function getBanner( modules ) {
	const license = await readFile(
		require.resolve( 'core-js/LICENSE' ),
		'utf8'
	);
	const copyright = license
		.split( '\n' )
		.filter( ( line ) => line.startsWith( 'Copyright (c) ' ) )
		.map( ( line ) => ` * © ${ line.slice( 'Copyright (c) '.length ) }\n` )
		.join( '' );
	return (
		'/**\n' +
		` * core-js ${ version }\n` +
		copyright +
		` * license: https://github.com/zloirock/core-js/blob/v${ version }/LICENSE\n` +
		' * source: https://github.com/zloirock/core-js\n' +
		' *//*\n' +
		' * modules:\n' +
		modules.map( ( name ) => ` * ${ name }\n` ).join( '' ) +
		' */'
	);
}

/**
 * Bundles the given `core-js` modules into one ES5 script, wrapped the same
 * way `core-js-builder` wraps its bundle.
 *
 * @param {string[]} modules Module names.
 * @return {Promise<string>} Wrapped bundle.
 */
async function bundle( modules ) {
	const stats = await webpack( {
		mode: 'none',
		target: [ 'web', 'es5' ],
		entry: modules.map( ( name ) =>
			require.resolve( `core-js/modules/${ name }` )
		),
		node: false,
		output: { path: BUILD_DIR, filename: 'polyfill.js', iife: false },
	} );
	if ( stats.hasErrors() ) {
		throw new Error( stats.toString( 'errors-only' ) );
	}
	const code = await readFile(
		path.join( BUILD_DIR, 'polyfill.js' ),
		'utf8'
	);
	// Same wrapper and `__webpack_require__` rewrite as `core-js-builder`.
	return `!function (undefined) { 'use strict'; ${ code.replace(
		/function __webpack_require__/,
		'var __webpack_require__ = function '
	) } }();\n`;
}

async function build() {
	const modules = getModules();
	const [ banner, code ] = await Promise.all( [
		getBanner( modules ),
		bundle( modules ),
	] );
	const script = `${ banner }\n${ code }`;

	console.log(
		`bundling ./build/polyfill.js, size: ${ (
			script.length / 1024
		).toFixed( 2 ) }KB, modules:\n${ modules.join( '\n' ) }`
	);

	const minified = await minify( script, {
		output: {
			comments: ( node, comment ) =>
				comment.value.toLowerCase().includes( 'license' ),
		},
	} );

	await Promise.all( [
		writeFile( path.join( BUILD_DIR, 'polyfill.js' ), script ),
		writeFile( path.join( BUILD_DIR, 'polyfill.min.js' ), minified.code ),
	] );
}

build().catch( ( error ) => {
	console.error( error );
	process.exit( 1 );
} );
