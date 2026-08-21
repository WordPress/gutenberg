#!/usr/bin/env node
const { readFile, writeFile } = require( 'fs' ).promises;
const path = require( 'path' );
const webpack = require( 'webpack' );
const { minify } = require( 'terser' );
const { getPolyfillModules } = require( './polyfill-modules' );

const BUILD_DIR = path.resolve( __dirname, '../build' );
const FILENAME = 'polyfill.js';

/**
 * Builds the banner kept at the top of both polyfill files.
 *
 * @return {Promise<string>} Banner comment.
 */
async function getBanner() {
	const { version } = require( 'core-js/package.json' );
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
		' */'
	);
}

/**
 * Bundles the given `core-js` modules into a single script.
 *
 * @param {string[]} list `core-js` module names, in order.
 * @return {Promise<string>} Bundled code, before the banner and wrapper.
 */
function bundle( list ) {
	return new Promise( ( resolve, reject ) => {
		webpack(
			{
				mode: 'none',
				target: [ 'web', 'es5' ],
				entry: list.map( ( name ) =>
					require.resolve( `core-js/modules/${ name }` )
				),
				node: false,
				output: {
					path: BUILD_DIR,
					filename: FILENAME,
					iife: false,
				},
			},
			( error, stats ) => {
				if ( error ) {
					return reject( error );
				}
				if ( stats.hasErrors() ) {
					return reject(
						new Error( stats.toString( 'errors-only' ) )
					);
				}
				resolve( readFile( path.join( BUILD_DIR, FILENAME ), 'utf8' ) );
			}
		);
	} );
}

async function build() {
	const { list, targets } = getPolyfillModules();
	const [ banner, bundled ] = await Promise.all( [
		getBanner(),
		bundle( list ),
	] );
	const code =
		`${ banner }\n!function (undefined) { 'use strict'; ` +
		bundled.replace(
			/function __webpack_require__/,
			'var __webpack_require__ = function '
		) +
		' }();\n';

	console.log(
		`bundling build/${ FILENAME }, size: ${ ( code.length / 1024 ).toFixed(
			2
		) }KB, modules:`
	);
	for ( const name of list ) {
		console.log( `${ name } for ${ JSON.stringify( targets[ name ] ) }` );
	}

	const { code: minified } = await minify( code, {
		output: {
			comments: ( node, comment ) =>
				comment.value.toLowerCase().includes( 'license' ),
		},
	} );

	await Promise.all( [
		writeFile( path.join( BUILD_DIR, FILENAME ), code ),
		writeFile(
			path.join( BUILD_DIR, FILENAME.replace( /\.js$/, '.min.js' ) ),
			minified
		),
	] );
}

build().catch( ( error ) => {
	console.error( error );
	process.exit( 1 );
} );
