#!/usr/bin/env node

/**
 * External dependencies
 */
const esbuild = require( 'esbuild' );
const path = require( 'path' );

/**
 * Internal dependencies
 */
const { dependencies } = require( '../../package' );

const WORDPRESS_NAMESPACE = '@wordpress/';
const BUNDLED_PACKAGES = [ '@wordpress/icons', '@wordpress/interface' ];

const packages = Object.keys( dependencies )
	.filter(
		( packageName ) =>
			! BUNDLED_PACKAGES.includes( packageName ) &&
			packageName.startsWith( WORDPRESS_NAMESPACE ) &&
			! packageName.startsWith( WORDPRESS_NAMESPACE + 'react-native' )
	)
	.map( ( packageName ) => packageName.replace( WORDPRESS_NAMESPACE, '' ) );

esbuild
	.build( {
		entryPoints: packages.map( ( pkg ) => `./packages/${ pkg }` ),
		bundle: true,
		outdir: path.resolve( __dirname, '../../build/esm' ),
		format: 'esm',
		logLevel: 'info',
		external: [
			'react',
			'react-dom',
			'moment',
			'lodash',
			'moment-timezone/moment-timezone',
			'moment-timezone/moment-timezone-utils',
		].concat( packages.map( ( pkg ) => `@wordpress/${ pkg }` ) ),
		define: {
			'process.env.FORCE_REDUCED_MOTION': 'false',
			'process.env.NODE_ENV': '"production"',
			'process.env.GUTENBERG_PHASE': '2',
		},
	} )
	.catch( () => process.exit( 1 ) );
