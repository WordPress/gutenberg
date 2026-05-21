#!/usr/bin/env node

import path from 'path';
import { fileURLToPath } from 'url';
import { readFile, writeFile, mkdir } from 'fs/promises';
import esbuild from 'esbuild';

const __dirname = path.dirname( fileURLToPath( import.meta.url ) );
const ROOT_DIR = path.resolve( __dirname, '../../..' );
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
		contents: [
			'module.exports = {',
			'  ...require("react-dom"),',
			'  ...require("react-dom/client"),',
			'};',
		].join( '\n' ),
	},
	{
		name: 'react/jsx-runtime',
		global: 'ReactJSXRuntime',
		handle: 'react-jsx-runtime',
		dependencies: [ 'react' ],
	},
];

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

async function generateAssetFile( config ) {
	const { handle, name, dependencies } = config;

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

async function bundleVendorScript( config ) {
	const { name, global, handle, contents } = config;

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
		plugins: [ reactExternalPlugin ],
	};

	if ( contents ) {
		esbuildOptions.stdin = {
			contents,
			resolveDir: ROOT_DIR,
			loader: 'js',
		};
	} else {
		esbuildOptions.entryPoints = [ name ];
	}

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
