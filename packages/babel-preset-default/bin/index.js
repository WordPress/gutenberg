#!/usr/bin/env node

/**
 * External dependencies
 */
const builder = require( 'core-js-builder' );
const { minify } = require( 'uglify-js' );
const { writeFile } = require( 'fs' ).promises;

builder( {
	modules: [ 'es.', 'web.' ],
	exclude: [
		// This is an IE-only feature which we don't use, and don't want to polyfill.
		// @see https://github.com/WordPress/gutenberg/pull/49234
		'web.immediate',
	],
	summary: { console: { size: true, modules: true } },
	targets: require( '@wordpress/browserslist-config' ),
	filename: './build/polyfill.js',
} )
	.then( async ( code ) => {
		const output = minify( code, {
			output: {
				comments: ( node, comment ) =>
					comment.value.indexOf( 'License' ) >= 0,
			},
		} );
		await writeFile( './build/polyfill.min.js', output.code );
	} )
	.catch( ( error ) => {
		// eslint-disable-next-line no-console
		console.log( error );
		process.exit( 1 );
	} );
