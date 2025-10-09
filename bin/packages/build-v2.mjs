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
 * Plugin to handle moment-timezone aliases.
 * Redirects moment-timezone imports to use pre-built bundles with limited data.
 *
 * @return {Object} esbuild plugin.
 */
function momentTimezoneAliasPlugin() {
	return {
		name: 'moment-timezone-alias',
		async setup( build ) {
			// Resolve paths at plugin creation time
			const { createRequire } = await import( 'module' );
			const require = createRequire( import.meta.url );

			const preBuiltBundlePath = require.resolve(
				'moment-timezone/builds/moment-timezone-with-data-1970-2030'
			);
			const momentTimezoneUtilsPath = require.resolve(
				'moment-timezone/moment-timezone-utils.js'
			);

			// Redirect main moment-timezone files to pre-built bundle
			build.onResolve(
				{ filter: /^moment-timezone\/moment-timezone$/ },
				() => {
					return { path: preBuiltBundlePath };
				}
			);

			// For utils, we need to load it but ensure it works with the pre-built bundle
			// The utils file tries to require('./') which would load index.js
			// We need to make sure it gets the pre-built bundle instead
			build.onResolve(
				{ filter: /^moment-timezone\/moment-timezone-utils$/ },
				() => {
					return { path: momentTimezoneUtilsPath };
				}
			);

			// Intercept the require('./') call inside moment-timezone-utils
			// and redirect it to the pre-built bundle
			build.onResolve( { filter: /^\.\/$/ }, ( args ) => {
				// Only intercept if this is coming from moment-timezone-utils
				if (
					args.importer &&
					args.importer.includes( 'moment-timezone-utils' )
				) {
					return { path: preBuiltBundlePath };
				}
			} );
		},
	};
}

/**
 * WordPress externals and asset plugin.
 * Inspired by wp-build's wordpressExternalsAndAssetPlugin.
 *
 * @param {string} assetName Optional. The name of the asset file to generate (without .asset.php extension). Defaults to 'index.min'.
 * @return {Object} esbuild plugin.
 */
function wordpressExternalsPlugin( assetName = 'index.min' ) {
	return {
		name: 'wordpress-externals',
		setup( build ) {
			const dependencies = new Set();
			const moduleDependencies = new Map();
			const packageJsonCache = new Map();

			/**
			 * Get package.json info for a WordPress package.
			 *
			 * @param {string} packageName The package name (without @wordpress/ prefix).
			 * @return {Promise<Object|null>} Package.json object or null if not found.
			 */
			async function getPackageInfo( packageName ) {
				if ( packageJsonCache.has( packageName ) ) {
					return packageJsonCache.get( packageName );
				}

				const packageJsonPath = path.join(
					PACKAGES_DIR,
					packageName,
					'package.json'
				);

				try {
					const packageJson = JSON.parse(
						await readFile( packageJsonPath, 'utf8' )
					);
					packageJsonCache.set( packageName, packageJson );
					return packageJson;
				} catch ( error ) {
					packageJsonCache.set( packageName, null );
					return null;
				}
			}

			/**
			 * Check if a package import is a script module.
			 * A package is considered a script module if it has wpScriptModuleExports
			 * and the specific import path (root or subpath) is declared in wpScriptModuleExports.
			 *
			 * @param {Object}      packageJson Package.json object.
			 * @param {string|null} subpath     Subpath after package name, or null for root import.
			 * @return {boolean} True if the import is a script module.
			 */
			function isScriptModuleImport( packageJson, subpath ) {
				const { wpScriptModuleExports } = packageJson;

				if ( ! wpScriptModuleExports ) {
					return false;
				}

				// Root import: @wordpress/package-name
				if ( ! subpath ) {
					// Check if wpScriptModuleExports is a string or has "." key
					if ( typeof wpScriptModuleExports === 'string' ) {
						return true;
					}
					if (
						typeof wpScriptModuleExports === 'object' &&
						wpScriptModuleExports[ '.' ]
					) {
						return true;
					}
					return false;
				}

				// Subpath import: @wordpress/package-name/subpath
				// Check if wpScriptModuleExports has "./subpath" key
				if (
					typeof wpScriptModuleExports === 'object' &&
					wpScriptModuleExports[ `./${ subpath }` ]
				) {
					return true;
				}

				return false;
			}

			// Map of vendor packages to their global variables and handles
			const vendorExternals = {
				react: { global: 'React', handle: 'react' },
				'react-dom': { global: 'ReactDOM', handle: 'react-dom' },
				'react/jsx-runtime': {
					global: 'ReactJSXRuntime',
					handle: 'react-jsx-runtime',
				},
				'react/jsx-dev-runtime': {
					global: 'ReactJSXRuntime',
					handle: 'react-jsx-runtime',
				},
				moment: { global: 'moment', handle: 'moment' },
				lodash: { global: 'lodash', handle: 'lodash' },
				'lodash-es': { global: 'lodash', handle: 'lodash' },
				jquery: { global: 'jQuery', handle: 'jquery' },
			};

			// Handle vendor packages
			for ( const [ packageName, config ] of Object.entries(
				vendorExternals
			) ) {
				build.onResolve(
					{
						filter: new RegExp(
							`^${ packageName.replace(
								/[.*+?^${}()|[\]\\]/g,
								'\\$&'
							) }$`
						),
					},
					( args ) => {
						// Track dependency for asset file
						dependencies.add( config.handle );

						return {
							path: args.path,
							namespace: 'vendor-external',
							pluginData: { global: config.global },
						};
					}
				);
			}

			// Handle all @wordpress/* packages
			build.onResolve( { filter: /^@wordpress\// }, async ( args ) => {
				// Parse the import: @wordpress/package-name or @wordpress/package-name/subpath
				const fullPath = args.path.replace( '@wordpress/', '' );
				const [ packageName, ...subpathParts ] = fullPath.split( '/' );
				const subpath =
					subpathParts.length > 0 ? subpathParts.join( '/' ) : null;
				const wpHandle = `wp-${ packageName }`;

				// Get package.json for the package
				const packageJson = await getPackageInfo( packageName );

				if ( ! packageJson ) {
					// Package not found, let esbuild handle it (will likely error)
					return undefined;
				}

				// Check if this is a script module
				const isScriptModule = isScriptModuleImport(
					packageJson,
					subpath
				);

				// Determine import kind: dynamic or static
				const kind =
					args.kind === 'dynamic-import' ? 'dynamic' : 'static';

				// If it's a script module, keep as ESM import (external)
				if ( isScriptModule ) {
					// Track module dependency with kind using @wordpress/ format
					if ( kind === 'static' ) {
						moduleDependencies.set( args.path, 'static' );
					} else if ( ! moduleDependencies.has( args.path ) ) {
						moduleDependencies.set( args.path, 'dynamic' );
					}

					return {
						path: args.path,
						external: true,
					};
				}

				// If it has wpScript, convert to global variable
				if ( packageJson.wpScript ) {
					// Track regular script dependency using wp- handle format
					dependencies.add( wpHandle );

					return {
						path: args.path,
						namespace: 'wordpress-external',
					};
				}

				// Otherwise, bundle it (not external)
				return undefined;
			} );

			build.onLoad(
				{ filter: /.*/, namespace: 'vendor-external' },
				( args ) => {
					const global = args.pluginData.global;

					return {
						contents: `module.exports = window.${ global };`,
						loader: 'js',
					};
				}
			);

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

				// Format regular script dependencies
				const dependenciesString = Array.from( dependencies )
					.sort()
					.map( ( dep ) => `'${ dep }'` )
					.join( ', ' );

				// Format module dependencies as array of arrays with 'id' and 'import' keys
				const moduleDependenciesArray = Array.from(
					moduleDependencies.entries()
				)
					.sort( ( [ a ], [ b ] ) => a.localeCompare( b ) )
					.map(
						( [ dep, kind ] ) =>
							`array('id' => '${ dep }', 'import' => '${ kind }')`
					);

				const moduleDependenciesString =
					moduleDependenciesArray.length > 0
						? moduleDependenciesArray.join( ', ' )
						: '';

				const version = Date.now();

				// Build asset content with both dependencies and module_dependencies
				const parts = [
					`'dependencies' => array(${ dependenciesString })`,
				];
				if ( moduleDependenciesString ) {
					parts.push(
						`'module_dependencies' => array(${ moduleDependenciesString })`
					);
				}
				parts.push( `'version' => '${ version }'` );
				const assetContent = `<?php return array(${ parts.join(
					', '
				) });`;

				// Write asset file
				const outputDir =
					build.initialOptions.outdir ||
					path.dirname( build.initialOptions.outfile || 'build' );

				const assetFilePath = path.join(
					outputDir,
					`${ assetName }.asset.php`
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
 * @return {Promise<boolean>} True if the package was bundled, false otherwise.
 */
async function bundlePackage( packageName ) {
	const packageDir = path.join( PACKAGES_DIR, packageName );
	const packageJsonPath = path.join( packageDir, 'package.json' );
	const packageJson = JSON.parse( await readFile( packageJsonPath, 'utf8' ) );

	const builds = [];

	// Bundle wpScript (IIFE format for global wp.* namespace)
	if ( packageJson.wpScript ) {
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

		// For packages with default exports, add a footer to properly expose the default
		if ( packageJson.wpScriptDefaultExport ) {
			baseConfig.footer = {
				js: `if (typeof ${ globalName } === 'object' && ${ globalName }.default) { ${ globalName } = ${ globalName }.default; }`,
			};
		}

		builds.push(
			esbuild.build( {
				...baseConfig,
				outfile: path.join( outputDir, 'index.min.js' ),
				minify: true,
				plugins: [
					momentTimezoneAliasPlugin(),
					wordpressExternalsPlugin( 'index.min' ),
				],
			} ),
			esbuild.build( {
				...baseConfig,
				outfile: path.join( outputDir, 'index.js' ),
				minify: false,
				plugins: [ momentTimezoneAliasPlugin() ],
			} )
		);
	}

	// Bundle wpScriptModuleExports (ESM format for Script Modules API)
	if ( packageJson.wpScriptModuleExports ) {
		const target = browserslistToEsbuild();
		const rootBuildModuleDir = path.join(
			PACKAGES_DIR,
			'..',
			'build-module',
			packageName
		);

		// Normalize to object format
		const exports =
			typeof packageJson.wpScriptModuleExports === 'string'
				? { '.': packageJson.wpScriptModuleExports }
				: packageJson.wpScriptModuleExports;

		// Bundle each export
		for ( const [ exportName, exportPath ] of Object.entries( exports ) ) {
			// Convert export name to file name: '.' -> 'index', './debug' -> 'debug'
			const fileName =
				exportName === '.'
					? 'index'
					: exportName.replace( /^\.\//, '' );
			const entryPoint = path.join( packageDir, exportPath );

			builds.push(
				esbuild.build( {
					entryPoints: [ entryPoint ],
					outfile: path.join(
						rootBuildModuleDir,
						`${ fileName }.min.js`
					),
					bundle: true,
					sourcemap: true,
					format: 'esm',
					target,
					platform: 'browser',
					minify: true,
					plugins: [
						wordpressExternalsPlugin( `${ fileName }.min` ),
					],
				} )
			);
		}
	}

	if ( builds.length === 0 ) {
		return false;
	}

	await Promise.all( builds );

	return true;
}

/**
 * Transpile source files for a package (both CJS and ESM).
 *
 * @param {string}   packageDir  Package directory path.
 * @param {string[]} srcFiles    Array of source file paths.
 * @param {Object}   packageJson Package.json contents.
 */
async function transpilePackage( packageDir, srcFiles, packageJson ) {
	const buildDir = path.join( packageDir, 'build' );
	const buildModuleDir = path.join( packageDir, 'build-module' );
	const target = browserslistToEsbuild();

	const builds = [];

	// Only build CJS if package has 'main' property
	if ( packageJson.main ) {
		builds.push(
			esbuild.build( {
				entryPoints: srcFiles,
				outdir: buildDir,
				outbase: path.join( packageDir, 'src' ),
				bundle: false,
				platform: 'node',
				format: 'cjs',
				sourcemap: true,
				target,
			} )
		);
	}

	// Only build ESM if package has 'module' property
	if ( packageJson.module ) {
		builds.push(
			esbuild.build( {
				entryPoints: srcFiles,
				outdir: buildModuleDir,
				outbase: path.join( packageDir, 'src' ),
				bundle: false,
				platform: 'neutral',
				format: 'esm',
				sourcemap: true,
				target,
			} )
		);
	}

	await Promise.all( builds );
}

/**
 * Transpile a single package's source files.
 *
 * @param {string} packageName Package name.
 * @return {Promise<number>} Build time in milliseconds.
 */
async function transpilePackageFiles( packageName ) {
	const startTime = Date.now();
	const packageDir = path.join( PACKAGES_DIR, packageName );
	const packageJsonPath = path.join( packageDir, 'package.json' );
	const packageJson = JSON.parse( await readFile( packageJsonPath, 'utf8' ) );

	const srcFiles = await glob(
		normalizePath(
			path.join( packageDir, `src/**/*.${ SOURCE_EXTENSIONS }` )
		),
		{
			ignore: IGNORE_PATTERNS,
		}
	);

	await transpilePackage( packageDir, srcFiles, packageJson );

	return Date.now() - startTime;
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

	// Phase 1: Transpile all packages in parallel
	console.log( '📝 Phase 1: Transpiling packages...\n' );
	await Promise.all(
		V2_PACKAGES.map( async ( packageName ) => {
			const buildTime = await transpilePackageFiles( packageName );
			console.log( `✔ Transpiled ${ packageName } (${ buildTime }ms)` );
		} )
	);

	// Phase 2: Bundle packages with wpScript in parallel
	console.log( '\n📦 Phase 2: Bundling packages...\n' );
	await Promise.all(
		V2_PACKAGES.map( async ( packageName ) => {
			const startBundleTime = Date.now();
			const isBundled = await bundlePackage( packageName );
			const buildTime = Date.now() - startBundleTime;
			if ( isBundled ) {
				console.log( `✔ Bundled ${ packageName } (${ buildTime }ms)` );
			}
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
	const packagesToRebuild = new Set();
	const rebuilding = new Set();
	let rebuildTimeoutId = null;

	async function processRebuilds() {
		for ( const packageName of packagesToRebuild ) {
			if ( rebuilding.has( packageName ) ) {
				continue;
			}

			rebuilding.add( packageName );

			try {
				const startTime = Date.now();

				await transpilePackageFiles( packageName );
				await bundlePackage( packageName );

				const buildTime = Date.now() - startTime;
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
