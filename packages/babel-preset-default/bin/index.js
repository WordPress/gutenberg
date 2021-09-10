#!/usr/bin/env node

/**
 * External dependencies
 */
const builder = require( 'core-js-builder' );
const { minify } = require( 'uglify-js' );
const { writeFile } = require( 'fs' ).promises;

builder( {
	modules: [ 'es', 'web' ],
	// core-js is extremely conservative in which polyfills to include.
	// Knowing about tiny browser implementation bugs that anyone rarely cares about,
	// we prevent some features from having the full polyfill included.
	// @see https://github.com/WordPress/gutenberg/pull/31279
	exclude: [ 'es.promise' ],
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
