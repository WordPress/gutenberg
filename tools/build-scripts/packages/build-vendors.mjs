#!/usr/bin/env node

import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import { readFile, writeFile, mkdir } from 'fs/promises';
import esbuild from 'esbuild';
import {
	createPatcher,
	patchTransitionalSymbols,
	patchCoerceRef,
	patchInertAttribute,
} from './codemod-react-legacy-element.mjs';

const __dirname = path.dirname( fileURLToPath( import.meta.url ) );
const ROOT_DIR = path.resolve( __dirname, '../../..' );
const BUILD_DIR = path.join( ROOT_DIR, 'build', 'scripts' );
const VENDORS_DIR = path.join( BUILD_DIR, 'vendors' );

// Resolve vendor packages from this workspace, instead of root.
const WORKSPACE_DIR = path.resolve( __dirname, '..' );

// Patchers that adapt React 19 to also accept legacy (React 17/18) elements.
// The `react` core bundle only needs the element-symbol patch, while the
// `react-dom` bundle additionally needs the DOM-only ref and `inert` patches.
const patchReact = createPatcher( patchTransitionalSymbols );
const patchReactDOM = createPatcher(
	patchTransitionalSymbols,
	patchCoerceRef,
	patchInertAttribute
);

const requireFromWorkspace = createRequire(
	path.join( WORKSPACE_DIR, 'package.json' )
);

/**
 * Read the React version a vendor package resolves to.
 *
 * @param {string} pkg Vendor package name, e.g. `@wordpress/react-18`.
 * @return {Promise<string>} The installed `react` version, e.g. `18.3.1`.
 */
async function getReactVersion( pkg ) {
	const requireFromVendor = createRequire(
		requireFromWorkspace.resolve( `${ pkg }/package.json` )
	);
	const manifest = await readFile(
		requireFromVendor.resolve( 'react/package.json' ),
		'utf-8'
	);
	return JSON.parse( manifest ).version;
}

const REACT_18_VERSION = await getReactVersion( '@wordpress/react-18' );
const REACT_19_VERSION = await getReactVersion( '@wordpress/react-19' );

const VENDOR_SCRIPTS = [
	{
		name: '@wordpress/react-18/react',
		global: 'React',
		handle: 'react',
		dependencies: [ 'wp-polyfill' ],
		version: REACT_18_VERSION,
	},
	{
		name: '@wordpress/react-18/react-dom',
		global: 'ReactDOM',
		handle: 'react-dom',
		dependencies: [ 'react' ],
		version: REACT_18_VERSION,
	},
	{
		name: '@wordpress/react-18/react-jsx-runtime',
		global: 'ReactJSXRuntime',
		handle: 'react-jsx-runtime',
		dependencies: [ 'react' ],
		version: REACT_18_VERSION,
	},
	{
		name: '@wordpress/react-19/react',
		global: 'React',
		handle: 'react-19',
		dependencies: [ 'wp-polyfill' ],
		version: REACT_19_VERSION,
		patch: patchReact,
	},
	{
		name: '@wordpress/react-19/react-dom',
		global: 'ReactDOM',
		handle: 'react-dom-19',
		dependencies: [ 'react' ],
		version: REACT_19_VERSION,
		patch: patchReactDOM,
	},
	{
		name: '@wordpress/react-19/react-jsx-runtime',
		global: 'ReactJSXRuntime',
		handle: 'react-jsx-runtime-19',
		dependencies: [ 'react' ],
		version: REACT_19_VERSION,
	},
];

/**
 * Generate a .asset.php file for a vendor script.
 *
 * @param {Object}   config              Vendor script configuration.
 * @param {string}   config.handle       WordPress script handle.
 * @param {string[]} config.dependencies WordPress script dependencies.
 * @param {string}   config.version      Bundled React version (e.g. `18.3.1`).
 */
async function generateAssetFile( config ) {
	const { handle, version, dependencies } = config;

	const dependenciesString = dependencies
		.map( ( dep ) => `'${ dep }'` )
		.join( ', ' );
	const assetContent = `<?php return array('dependencies' => array(${ dependenciesString }), 'version' => '${ version }');`;

	const assetFilePath = path.join( VENDORS_DIR, `${ handle }.min.asset.php` );
	await mkdir( path.dirname( assetFilePath ), { recursive: true } );
	await writeFile( assetFilePath, assetContent );
}

/**
 * Applies a codemod patcher to a built vendor file. The original, unpatched
 * source is written alongside it with an `-orig` suffix (e.g. `react-19-orig.js`)
 * so the patch can be diffed.
 *
 * @param {string}   fileName Built file name (e.g., `react-19.js`).
 * @param {Function} patch    The patcher to apply, `( code, filename ) => string`.
 * @return {Promise<void>} Promise that resolves once the file is patched.
 */
async function patchVendorOutput( fileName, patch ) {
	const filePath = path.join( VENDORS_DIR, fileName );
	const code = await readFile( filePath, 'utf-8' );

	const ext = fileName.endsWith( '.min.js' ) ? '.min.js' : '.js';
	const origFileName = `${ fileName.slice( 0, -ext.length ) }-orig${ ext }`;

	await writeFile( path.join( VENDORS_DIR, origFileName ), code );
	await writeFile( filePath, patch( code, fileName ) );
}

/**
 * Bundle a vendor script from node_modules into an IIFE script.
 * This is used to build packages like React that don't ship UMD builds.
 *
 * @param {Object}   config              Vendor script configuration.
 * @param {string}   config.name         Entry point name (e.g., '@wordpress/react-18/react').
 * @param {string}   config.global       Global variable name (e.g., 'React', 'ReactDOM').
 * @param {string}   config.handle       WordPress script handle (e.g., 'react', 'react-dom').
 * @param {string[]} config.dependencies WordPress script dependencies.
 * @param {Function} [config.patch]      Optional codemod patcher applied to the built output.
 * @return {Promise<void>} Promise that resolves when all builds are finished.
 */
async function bundleVendorScript( config ) {
	const { name, global, handle, dependencies } = config;

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
		bundle: true,
		format: 'iife',
		globalName: global,
		target: 'esnext',
		platform: 'browser',
		entryPoints: [ name ],
		// Resolve imports from this workspace's dependencies.
		absWorkingDir: WORKSPACE_DIR,
		plugins: dependencies?.includes( 'react' )
			? [ reactExternalPlugin ]
			: [],
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

	if ( config.patch ) {
		await Promise.all( [
			patchVendorOutput( handle + '.js', config.patch ),
			patchVendorOutput( handle + '.min.js', config.patch ),
		] );
	}
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
				`   ✔ Bundled vendor ${ vendorConfig.handle } (${ buildTime }ms)`
			);
		} catch ( error ) {
			console.error(
				`   ✘ Failed to bundle vendor ${ vendorConfig.handle }: ${ error.message }`
			);
		}
	}
}

buildVendors().catch( ( error ) => {
	console.error( '❌ Build failed:', error );
	process.exit( 1 );
} );
