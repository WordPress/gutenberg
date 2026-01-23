#!/usr/bin/env node

/**
 * External dependencies
 */
import { copyFile, mkdir } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import esbuild from 'esbuild';

const __dirname = path.dirname( fileURLToPath( import.meta.url ) );
const ROOT_DIR = path.resolve( __dirname, '../..' );
const BUILD_DIR = path.join( ROOT_DIR, 'build', 'scripts' );
const VENDORS_DIR = path.join( BUILD_DIR, 'vendors' );

/**
 * Copy React and ReactDOM UMD files from node_modules.
 * These are pre-built browser-ready bundles that don't need processing.
 */
async function copyReactUMDFiles() {
	console.log( '📦 Copying React UMD files...' );

	const filesToCopy = [
		{
			from: 'node_modules/react/umd/react.development.js',
			to: 'react.js',
		},
		{
			from: 'node_modules/react/umd/react.production.min.js',
			to: 'react.min.js',
		},
		{
			from: 'node_modules/react-dom/umd/react-dom.development.js',
			to: 'react-dom.js',
		},
		{
			from: 'node_modules/react-dom/umd/react-dom.production.min.js',
			to: 'react-dom.min.js',
		},
	];

	await mkdir( VENDORS_DIR, { recursive: true } );

	await Promise.all(
		filesToCopy.map( ( { from, to } ) => {
			const source = path.join( ROOT_DIR, from );
			const dest = path.join( VENDORS_DIR, to );
			return copyFile( source, dest );
		} )
	);

	console.log( '   ✔ Copied React UMD files' );
}

/**
 * Bundle react-jsx-runtime using esbuild.
 * Creates a browser-ready bundle that exposes ReactJSXRuntime global.
 */
async function bundleReactJsxRuntime() {
	console.log( '📦 Bundling react-jsx-runtime...' );

	// Plugin to map React import to global window.React
	const reactGlobalPlugin = {
		name: 'react-global',
		setup( build ) {
			// Intercept imports of 'react' and provide window.React instead
			build.onResolve( { filter: /^react$/ }, ( args ) => ( {
				path: args.path,
				namespace: 'react-global',
			} ) );

			build.onLoad( { filter: /.*/, namespace: 'react-global' }, () => ( {
				contents: 'module.exports = window.React',
				loader: 'js',
			} ) );
		},
	};

	const baseConfig = {
		entryPoints: [ 'react/jsx-runtime' ],
		bundle: true,
		format: 'iife',
		globalName: 'ReactJSXRuntime',
		target: 'es2015',
		platform: 'browser',
		plugins: [ reactGlobalPlugin ],
		banner: {
			js: '/* React JSX Runtime - https://react.dev/ */\n',
		},
	};

	await Promise.all( [
		// Development build
		esbuild.build( {
			...baseConfig,
			outfile: path.join( VENDORS_DIR, 'react-jsx-runtime.js' ),
			minify: false,
		} ),
		// Production build
		esbuild.build( {
			...baseConfig,
			outfile: path.join( VENDORS_DIR, 'react-jsx-runtime.min.js' ),
			minify: true,
		} ),
	] );

	console.log( '   ✔ Bundled react-jsx-runtime' );
}

/**
 * Main build function.
 */
async function buildVendors() {
	console.log( '🔨 Building vendor files...\n' );

	const startTime = Date.now();

	await Promise.all( [ copyReactUMDFiles(), bundleReactJsxRuntime() ] );

	const totalTime = Date.now() - startTime;
	console.log( `\n🎉 Vendor files built successfully! (${ totalTime }ms)` );
}

buildVendors().catch( ( error ) => {
	console.error( '❌ Build failed:', error );
	process.exit( 1 );
} );
