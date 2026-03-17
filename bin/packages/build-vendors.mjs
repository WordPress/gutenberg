#!/usr/bin/env node

import path from 'path';
import { fileURLToPath } from 'url';
import esbuild from 'esbuild';

const __dirname = path.dirname( fileURLToPath( import.meta.url ) );
const ROOT_DIR = path.resolve( __dirname, '../..' );
const BUILD_DIR = path.join( ROOT_DIR, 'build', 'scripts' );
const VENDORS_DIR = path.join( BUILD_DIR, 'vendors' );

const VENDOR_SCRIPTS = [
	{
		name: 'react',
		global: 'React',
		handle: 'react',
	},
	{
		name: 'react-dom',
		global: 'ReactDOM',
		handle: 'react-dom',
	},
	{
		name: 'react/jsx-runtime',
		global: 'ReactJSXRuntime',
		handle: 'react-jsx-runtime',
	},
];

/**
 * Bundle a vendor script from node_modules into an IIFE script.
 * This is used to build packages like React that don't ship UMD builds.
 *
 * @param {Object} config        Vendor script configuration.
 * @param {string} config.name   Package name (e.g., 'react', 'react-dom', 'react/jsx-runtime').
 * @param {string} config.global Global variable name (e.g., 'React', 'ReactDOM').
 * @param {string} config.handle WordPress script handle (e.g., 'react', 'react-dom').
 * @return {Promise<void>} Promise that resolves when all builds are finished.
 */
async function bundleVendorScript( config ) {
	const { name, global, handle } = config;

	// Plugin that externalizes the `react` package.
	const reactExternalPlugin = {
		name: 'react-external',
		setup( build ) {
			build.onResolve( { filter: /^react$/ }, ( args ) => {
				if ( args.kind === 'entry-point' ) {
					return null;
				}
				return {
					path: 'react',
					namespace: 'react-external',
				};
			} );

			build.onLoad(
				{ filter: /.*/, namespace: 'react-external' },
				() => ( {
					contents: `module.exports = globalThis.React`,
					loader: 'js',
				} )
			);
		},
	};

	// Build both minified and non-minified versions
	await Promise.all(
		[ false, true ].map( ( production ) => {
			const outputFile = handle + ( production ? '.min.js' : '.js' );
			return esbuild.build( {
				entryPoints: [ name ],
				outfile: path.join( VENDORS_DIR, outputFile ),
				bundle: true,
				format: 'iife',
				globalName: global,
				minify: production,
				target: 'esnext', // Don't transpile, just bundle.
				platform: 'browser',
				plugins: [ reactExternalPlugin ],
			} );
		} )
	);
}

/**
 * Main build function.
 */
async function buildVendors() {
	console.log( '\n📦 Bundling vendor scripts...\n' );

	for ( const vendorConfig of VENDOR_SCRIPTS ) {
		try {
			const startTime = Date.now();
			await bundleVendorScript( vendorConfig );
			const buildTime = Date.now() - startTime;
			console.log(
				`   ✔ Bundled vendor ${ vendorConfig.name } (${ buildTime }ms)`
			);
		} catch ( error ) {
			console.error(
				`   ✘ Failed to bundle vendor ${ vendorConfig.name }: ${ error.message }`
			);
		}
	}
}

buildVendors().catch( ( error ) => {
	console.error( '❌ Build failed:', error );
	process.exit( 1 );
} );
