#!/usr/bin/env node

/**
 * External dependencies
 */
import { readFile, writeFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { parseArgs } from 'node:util';
import esbuild from 'esbuild';
import glob from 'fast-glob';
import watch from 'node-watch';
// See https://github.com/WordPress/gutenberg/issues/72136
// eslint-disable-next-line import/no-unresolved
import browserslistToEsbuild from 'browserslist-to-esbuild';

/**
 * Internal dependencies
 */
import { V2_PACKAGES } from './v2-packages.js';

const __dirname = path.dirname( fileURLToPath( import.meta.url ) );

const PACKAGES_DIR = path
	.resolve( __dirname, '../../packages' )
	.replace( /\\/g, '/' );
const SOURCE_EXTENSIONS = '{js,ts,tsx}';
const IGNORE_PATTERNS = [
	'**/benchmark/**',
	'**/{__mocks__,__tests__,test}/**',
	'**/{storybook,stories}/**',
];
const TEST_FILE_PATTERNS = [
	/\/(benchmark|__mocks__|__tests__|test|storybook|stories)\/.+/,
	/\.(spec|test)\.(js|ts|tsx)$/,
];

/**
 * Normalize path separators for cross-platform compatibility.
 *
 * @param {string} p Path to normalize.
 * @return {string} Normalized path with forward slashes.
 */
function normalizePath( p ) {
	return p.replace( /\\/g, '/' );
}

/**
 * Convert kebab-case to camelCase.
 *
 * @param {string} str String to convert.
 * @return {string} Converted string.
 */
function kebabToCamelCase( str ) {
	return str.replace( /-([a-z])/g, ( _, letter ) => letter.toUpperCase() );
}

/**
 * WordPress externals and asset plugin.
 * Inspired by wp-build's wordpressExternalsAndAssetPlugin.
 *
 * @return {Object} esbuild plugin.
 */
function wordpressExternalsPlugin() {
	return {
		name: 'wordpress-externals',
		setup( build ) {
			const dependencies = new Set();

			// Handle all @wordpress/* packages
			build.onResolve( { filter: /^@wordpress\// }, ( args ) => {
				// Track dependency for asset file
				const wpHandle = args.path.replace( '@wordpress/', 'wp-' );
				dependencies.add( wpHandle );

				return {
					path: args.path,
					namespace: 'wordpress-external',
				};
			} );

			build.onLoad(
				{ filter: /.*/, namespace: 'wordpress-external' },
				( args ) => {
					// Convert @wordpress/package-name to wp.packageName
					const wpGlobal = kebabToCamelCase(
						args.path.replace( '@wordpress/', '' )
					);

					return {
						contents: `module.exports = window.wp.${ wpGlobal };`,
						loader: 'js',
					};
				}
			);

			// Generate asset file at the end
			build.onEnd( async ( result ) => {
				if ( result.errors.length > 0 ) {
					return;
				}

				const dependenciesString = Array.from( dependencies )
					.sort()
					.map( ( dep ) => `'${ dep }'` )
					.join( ', ' );

				const version = Date.now();
				const assetContent = `<?php return array('dependencies' => array(${ dependenciesString }), 'version' => '${ version }');`;

				// Write asset file
				const outputDir =
					build.initialOptions.outdir ||
					path.dirname( build.initialOptions.outfile || 'build' );

				const assetFilePath = path.join(
					outputDir,
					'index.min.asset.php'
				);
				await writeFile( assetFilePath, assetContent );
			} );
		},
	};
}

/**
 * Bundle a package for WordPress using esbuild.
 *
 * @param {string} packageName Package name.
 */
async function bundlePackage( packageName ) {
	const packageDir = path.join( PACKAGES_DIR, packageName );
	const entryPoint = path.join( packageDir, 'build-module', 'index.js' );
	const outputDir = path.join( PACKAGES_DIR, '..', 'build', packageName );
	const target = browserslistToEsbuild();
	const globalName = `wp.${ kebabToCamelCase( packageName ) }`;

	const baseConfig = {
		entryPoints: [ entryPoint ],
		bundle: true,
		sourcemap: true,
		format: 'iife',
		target,
		platform: 'browser',
		globalName,
	};

	await Promise.all( [
		esbuild.build( {
			...baseConfig,
			outfile: path.join( outputDir, 'index.min.js' ),
			minify: true,
			plugins: [ wordpressExternalsPlugin() ],
		} ),
		esbuild.build( {
			...baseConfig,
			outfile: path.join( outputDir, 'index.js' ),
			minify: false,
		} ),
	] );
}

/**
 * Transpile source files for a package (both CJS and ESM).
 *
 * @param {string}   packageDir Package directory path.
 * @param {string[]} srcFiles   Array of source file paths.
 */
async function transpilePackage( packageDir, srcFiles ) {
	const buildDir = path.join( packageDir, 'build' );
	const buildModuleDir = path.join( packageDir, 'build-module' );
	const target = browserslistToEsbuild();

	await Promise.all( [
		// CJS build
		esbuild.build( {
			entryPoints: srcFiles,
			outdir: buildDir,
			outbase: path.join( packageDir, 'src' ),
			bundle: false,
			platform: 'node',
			format: 'cjs',
			sourcemap: true,
			target,
		} ),
		// ESM build
		esbuild.build( {
			entryPoints: srcFiles,
			outdir: buildModuleDir,
			outbase: path.join( packageDir, 'src' ),
			bundle: false,
			platform: 'neutral',
			format: 'esm',
			sourcemap: true,
			target,
		} ),
	] );
}

/**
 * Build a single package (transpile + bundle).
 *
 * @param {string}  packageName    Package name.
 * @param {Object}  options        Build options.
 * @param {boolean} options.silent If true, suppress console output.
 * @return {Promise<number>} Build time in milliseconds.
 */
async function buildPackage( packageName, { silent = false } = {} ) {
	const startTime = Date.now();
	const packageDir = path.join( PACKAGES_DIR, packageName );

	if ( ! silent ) {
		console.log( `📦 Building ${ packageName }...` );
	}

	const packageJsonPath = path.join( packageDir, 'package.json' );
	const packageJson = JSON.parse( await readFile( packageJsonPath, 'utf8' ) );

	// Step 1: Transpile source files
	const srcFiles = await glob(
		normalizePath(
			path.join( packageDir, `src/**/*.${ SOURCE_EXTENSIONS }` )
		),
		{
			ignore: IGNORE_PATTERNS,
		}
	);

	if ( ! silent ) {
		console.log(
			`  📝 Transpiling ${ srcFiles.length } source file(s)...`
		);
	}
	await transpilePackage( packageDir, srcFiles );

	// Step 2: Bundle for WordPress (if wpScript is true)
	if ( packageJson.wpScript ) {
		if ( ! silent ) {
			console.log( '  📦 Bundling for WordPress...' );
		}
		await bundlePackage( packageName );
	}

	const buildTime = Date.now() - startTime;
	if ( ! silent ) {
		console.log( `  ✅ ${ packageName } built successfully\n` );
	}

	return buildTime;
}

/**
 * Determine if a file is a source file in a v2 package.
 *
 * @param {string} filename File path.
 * @return {boolean} True if the file is a v2 source file.
 */
function isV2SourceFile( filename ) {
	const relativePath = normalizePath(
		path.relative( process.cwd(), filename )
	);

	if ( ! /\/src\/.+\.(js|ts|tsx)$/.test( relativePath ) ) {
		return false;
	}

	// Exclude test files and other non-source files
	if ( TEST_FILE_PATTERNS.some( ( regex ) => regex.test( relativePath ) ) ) {
		return false;
	}

	// Check if it's in a v2 package
	return V2_PACKAGES.some( ( packageName ) => {
		const packagePath = normalizePath(
			path.join( 'packages', packageName )
		);
		return relativePath.startsWith( packagePath );
	} );
}

/**
 * Get the package name from a file path.
 *
 * @param {string} filename File path.
 * @return {string|null} Package name or null if not found.
 */
function getPackageName( filename ) {
	const relativePath = normalizePath(
		path.relative( process.cwd(), filename )
	);

	for ( const packageName of V2_PACKAGES ) {
		const packagePath = normalizePath(
			path.join( 'packages', packageName )
		);
		if ( relativePath.startsWith( packagePath ) ) {
			return packageName;
		}
	}
	return null;
}

/**
 * Main build function.
 */
async function buildAll() {
	console.log( '🔨 Building v2 packages...\n' );

	const startTime = Date.now();

	// Build all packages in parallel, logging each as it completes
	await Promise.all(
		V2_PACKAGES.map( async ( packageName ) => {
			const buildTime = await buildPackage( packageName, {
				silent: true,
			} );
			console.log( `✔ ${ packageName } (${ buildTime }ms)` );
		} )
	);

	const totalTime = Date.now() - startTime;
	console.log(
		`\n🎉 All v2 packages built successfully! (${ totalTime }ms total)`
	);
}

/**
 * Watch mode for development.
 */
async function watchMode() {
	let packagesToRebuild = new Set();
	const rebuilding = new Set();
	let rebuildTimeoutId = null;

	async function processRebuilds() {
		for ( const packageName of packagesToRebuild ) {
			if ( rebuilding.has( packageName ) ) {
				continue;
			}

			rebuilding.add( packageName );

			try {
				const buildTime = await buildPackage( packageName, {
					silent: true,
				} );
				console.log( `✅ ${ packageName } (${ buildTime }ms)` );
			} catch ( error ) {
				console.log(
					`❌ ${ packageName } - Error: ${ error.message }`
				);
			} finally {
				rebuilding.delete( packageName );
			}
		}

		packagesToRebuild.clear();
		rebuildTimeoutId = null;
	}

	watch(
		PACKAGES_DIR,
		{ recursive: true, delay: 500 },
		( event, filename ) => {
			if ( ! isV2SourceFile( filename ) ) {
				return;
			}

			const packageName = getPackageName( filename );
			if ( ! packageName ) {
				return;
			}

			packagesToRebuild.add( packageName );

			// Only schedule a rebuild if one isn't already scheduled
			if ( rebuildTimeoutId ) {
				return;
			}

			rebuildTimeoutId = setTimeout( processRebuilds, 100 );
		}
	);
}

/**
 * Main entry point.
 */
async function main() {
	const { values } = parseArgs( {
		options: {
			watch: {
				type: 'boolean',
				short: 'w',
				default: false,
			},
		},
	} );

	await buildAll();

	if ( values.watch ) {
		console.log( '\n👀 Watching for changes...\n' );
		await watchMode();
	}
}

main().catch( ( error ) => {
	console.error( '❌ Build failed:', error );
	process.exit( 1 );
} );
