#!/usr/bin/env node

/**
 * External dependencies
 */
const builder = require( 'core-js-builder' );
const { minify } = require( 'uglify-js' );
const { writeFile } = require( 'fs' ).promises;

builder( {
	modules: [ 'es', 'web' ],
	exclude: [
		// core-js is extremely conservative in which polyfills to include.
		// Since we don't care about the tiny browser implementation bugs behind its decision
		// to polyfill these features, we forcefully prevent them from being included.
		// @see https://github.com/WordPress/gutenberg/pull/31279
		'es.promise',
		// This is an IE-only feature which we don't use, and don't want to polyfill.
		// @see https://github.com/WordPress/gutenberg/pull/49234
		'web.immediate',
	],
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
