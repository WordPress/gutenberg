#!/usr/bin/env node

/**
 * External dependencies
 */
const esbuild = require( 'esbuild' );
const path = require( 'path' );

const args = process.argv.slice( 2 );
const packages = [ 'esm-example' ];

esbuild
	.build( {
		entryPoints: packages.map( ( pkg ) => `./packages/${ pkg }` ),
		bundle: true,
		outdir: path.resolve( __dirname, '../../build/esm' ),
		format: 'esm',
		logLevel: 'info',
		external: packages.map( ( pkg ) => `@wordpress/${ pkg }` ),
		define: {},
		watch: args[ 0 ] === '--watch',
	} )
	.catch( () => process.exit( 1 ) );
