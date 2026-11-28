#!/usr/bin/env node
const { readFile, writeFile } = require( 'fs/promises' );
const path = require( 'path' );
const { version } = require( 'core-js/package.json' );
const compat = require( 'core-js-compat' );
const { build } = require( 'rolldown' );
const { minify } = require( 'terser' );
const exclusions = require( '../polyfill-exclusions' );
const inclusions = require( '../polyfill-inclusions' );

const BUILD_DIR = path.resolve( __dirname, '../build' );
const ENTRY = '\0polyfill-entry';

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
 * Bundles the given `core-js` modules into `build/polyfill.js`, a strict-mode
 * IIFE script.
 *
 * @param {string[]} modules Module names.
 * @param {string}   banner  Banner comment.
 * @return {Promise<string>} Written script.
 */
async function bundle( modules, banner ) {
	const entry = modules
		.map( ( name ) => {
			const file = require.resolve( `core-js/modules/${ name }` );
			return `import ${ JSON.stringify( file ) };`;
		} )
		.join( '\n' );
	const {
		output: [ chunk ],
	} = await build( {
		input: ENTRY,
		platform: 'browser',
		// Leave out the `// <module path>` comments, which contain local paths.
		experimental: { attachDebugInfo: 'none' },
		plugins: [
			{
				name: 'polyfill-entry',
				resolveId: ( id ) => ( id === ENTRY ? id : null ),
				load: ( id ) => ( id === ENTRY ? entry : null ),
			},
		],
		output: {
			file: path.join( BUILD_DIR, 'polyfill.js' ),
			format: 'iife',
			// The `;` keeps the IIFE from calling the end of a script that
			// WordPress concatenates before this one.
			postBanner: `${ banner }\n;`,
			// Rolldown drops the `'use strict'` of each CommonJS module.
			intro: "'use strict';",
		},
	} );
	return chunk.code;
}

async function buildPolyfill() {
	const modules = getModules();
	const script = await bundle( modules, await getBanner( modules ) );

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
	await writeFile( path.join( BUILD_DIR, 'polyfill.min.js' ), minified.code );
}

buildPolyfill().catch( ( error ) => {
	console.error( error );
	process.exit( 1 );
} );
