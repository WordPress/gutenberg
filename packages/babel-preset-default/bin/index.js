#!/usr/bin/env node
const { writeFile } = require( 'fs' ).promises;
const builder = require( 'core-js-builder' );
const compat = require( 'core-js-compat' );
const { minify } = require( 'terser' );
const exclusions = require( '../polyfill-exclusions' );
const inclusions = require( '../polyfill-inclusions' );

// Resolve `targets` so that `inclusions` can be added.
const { list } = compat( {
	modules: [ 'es.', 'web.' ],
	exclude: exclusions,
	targets: require( '@wordpress/browserslist-config' ),
} );

builder( {
	modules: [ ...new Set( [ ...list, ...inclusions ] ) ],
	summary: {
		console: { size: true, modules: true },
		comment: { modules: true },
	},
	filename: './build/polyfill.js',
} )
	.then( ( code ) =>
		minify( code, {
			output: {
				comments: ( node, comment ) =>
					comment.value.toLowerCase().includes( 'license' ),
			},
		} )
	)
	.then( ( output ) => writeFile( './build/polyfill.min.js', output.code ) )
	.catch( ( error ) => {
		console.log( error );
		process.exit( 1 );
	} );
