#!/usr/bin/env node

import path from 'path';
import { fileURLToPath } from 'url';
import { readFile, writeFile, mkdir } from 'fs/promises';
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
		dependencies: [ 'wp-polyfill' ],
	},
	{
		name: 'react-dom',
		global: 'ReactDOM',
		handle: 'react-dom',
		dependencies: [ 'react' ],
	},
	{
		name: 'react/jsx-runtime',
		global: 'ReactJSXRuntime',
		handle: 'react-jsx-runtime',
		dependencies: [ 'react' ],
	},
];

/**
 * Read the version from a package's package.json in node_modules.
 *
 * @param {string} packageName npm package name (e.g., 'react', 'react-dom').
 * @return {Promise<string>} The package version string.
 */
async function getPackageVersion( packageName ) {
	const packageJsonPath = path.join(
		ROOT_DIR,
		'node_modules',
		packageName,
		'package.json'
	);
	const packageJson = JSON.parse(
		await readFile( packageJsonPath, 'utf-8' )
	);
	return packageJson.version;
}

/**
 * Generate a .asset.php file for a vendor script.
 *
 * @param {Object}   config              Vendor script configuration.
 * @param {string}   config.handle       WordPress script handle.
 * @param {string}   config.name         Package name (e.g., 'react', 'react/jsx-runtime').
 * @param {string[]} config.dependencies WordPress script dependencies.
 */
async function generateAssetFile( config ) {
	const { handle, name, dependencies } = config;

	// The npm package name is the first segment of the name (e.g., 'react/jsx-runtime' -> 'react').
	const packageName = name.split( '/' )[ 0 ];
	const version = await getPackageVersion( packageName );

	const dependenciesString = dependencies
		.map( ( dep ) => `'${ dep }'` )
		.join( ', ' );
	const assetContent = `<?php return array('dependencies' => array(${ dependenciesString }), 'version' => '${ version }');`;

	const assetFilePath = path.join( VENDORS_DIR, `${ handle }.min.asset.php` );
	await mkdir( path.dirname( assetFilePath ), { recursive: true } );
	await writeFile( assetFilePath, assetContent );
}

/**
 * Bundle a vendor script from node_modules into an IIFE script.
 * This is used to build packages like React that don't ship UMD builds.
 *
 * @param {Object}   config              Vendor script configuration.
 * @param {string}   config.name         Package name (e.g., 'react', 'react-dom', 'react/jsx-runtime').
 * @param {string}   config.global       Global variable name (e.g., 'React', 'ReactDOM').
 * @param {string}   config.handle       WordPress script handle (e.g., 'react', 'react-dom').
 * @param {string[]} config.dependencies WordPress script dependencies.
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

	const esbuildOptions = {
		entryPoints: [ name ],
		bundle: true,
		format: 'iife',
		globalName: global,
		target: 'esnext',
		platform: 'browser',
		plugins: [ reactExternalPlugin ],
	};

	await Promise.all( [
		esbuild.build( {
			...esbuildOptions,
			outfile: path.join( VENDORS_DIR, handle + '.js' ),
			minify: false,
		} ),
		esbuild.build( {
			...esbuildOptions,
			outfile: path.join( VENDORS_DIR, handle + '.min.js' ),
			minify: true,
		} ),
		generateAssetFile( config ),
	] );
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
