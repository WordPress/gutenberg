/**
 * External dependencies
 */
import { writeFile, mkdir, readFile } from 'fs/promises';
import path from 'path';
import { createHash } from 'crypto';
import buildCore from '@wordpress/build-core';

/**
 * Internal dependencies
 */
import { getPackageInfo } from './package-utils.mjs';

const {
	camelCasePackagePath,
	getPackageExternalConfigs,
	getVendorExternal,
	isScriptModuleImport,
	parsePackageRequest,
} = buildCore;

/**
 * Generate a content hash from file contents.
 * Uses SHA256 algorithm for broad compatibility across Node.js versions.
 *
 * @param {string[]} filePaths - Absolute paths to files to hash
 * @param {string}   algorithm - Hash algorithm (default: 'sha256')
 * @param {number}   length    - Hash length (default: 20)
 * @return {Promise<string>} Content hash string
 */
async function generateContentHash(
	filePaths,
	algorithm = 'sha256',
	length = 20
) {
	const hashBuilder = createHash( algorithm );

	// Sort paths for deterministic ordering
	const sortedPaths = [ ...filePaths ].sort();

	// Read and hash each file
	for ( const filePath of sortedPaths ) {
		const content = await readFile( filePath );
		hashBuilder.update( content );
	}

	// Generate hash as hex string and truncate
	const fullHash = hashBuilder.digest( 'hex' );
	return fullHash.slice( 0, length );
}

/**
 * Create WordPress externals plugin for esbuild.
 * This plugin handles WordPress package externals and vendor libraries,
 * treating them as external dependencies available via global variables.
 *
 * @param {string}       packageNamespace   Custom package namespace (e.g., 'wordpress', 'my-plugin').
 * @param {string|false} scriptGlobal       Global variable name (e.g., 'wp', 'myPlugin') or false to disable globals.
 * @param {Object}       externalNamespaces Additional namespaces to externalize (e.g., { 'woo': { global: 'woo', handlePrefix: 'woocommerce' } }).
 * @param {string}       handlePrefix       Handle prefix for main package (e.g., 'wp', 'mp'). Defaults to packageNamespace.
 * @return {Function} Function that creates the esbuild plugin instance.
 */
export function createWordpressExternalsPlugin(
	packageNamespace,
	scriptGlobal,
	externalNamespaces = {},
	handlePrefix
) {
	/**
	 * WordPress externals plugin for esbuild.
	 *
	 * @param {string}        assetName         Base name for the asset file (e.g., 'index.min').
	 * @param {string}        buildFormat       Build format: 'iife' for classic scripts, 'esm' for modules.
	 * @param {Array<string>} extraDependencies Additional dependencies to include in the asset file.
	 * @param {boolean}       generateAssetFile Whether to generate the .asset.php file. Default true.
	 * @return {Object} esbuild plugin object.
	 */
	return function wordpressExternalsPlugin(
		assetName = 'index.min',
		buildFormat = 'iife',
		extraDependencies = [],
		generateAssetFile = true
	) {
		return {
			name: 'wordpress-externals',
			/** @param {import('esbuild').PluginBuild} build */
			setup( build ) {
				const dependencies = new Set();
				const moduleDependencies = new Map();

				const vendorExternalRequests = [
					'react',
					'react-dom',
					'react-dom/client',
					'react/jsx-runtime',
					'react/jsx-dev-runtime',
					'moment',
					'lodash',
					'lodash-es',
					'jquery',
				];

				const packageExternals = getPackageExternalConfigs( {
					packageNamespace,
					scriptGlobal,
					externalNamespaces,
					handlePrefix,
				} );

				for ( const packageName of vendorExternalRequests ) {
					const config = getVendorExternal( packageName );
					build.onResolve(
						{
							filter: new RegExp( `^${ packageName }$` ),
						},
						/** @param {import('esbuild').OnResolveArgs} args */
						( args ) => {
							dependencies.add( config.handle );

							return {
								path: args.path,
								namespace: 'vendor-external',
								pluginData: { global: config.global },
							};
						}
					);
				}

				// Handle package namespace externals (wordpress and custom)
				for ( const externalConfig of packageExternals ) {
					build.onResolve(
						{ filter: externalConfig.pattern },
						/** @param {import('esbuild').OnResolveArgs} args */
						( args ) => {
							const { packageName, shortName, subpath } =
								parsePackageRequest( args.path );
							const handle = `${ externalConfig.handlePrefix }-${ shortName }`;

							const packageJson = getPackageInfo(
								packageName,
								args.resolveDir
							);

							if ( ! packageJson ) {
								return undefined;
							}

							let isScriptModule = isScriptModuleImport(
								packageJson,
								subpath
							);
							let isScript = !! packageJson.wpScript;
							if ( isScriptModule && isScript ) {
								// If the package is both a script and a script module, rely on the format being built
								isScript = buildFormat === 'iife';
								isScriptModule = buildFormat === 'esm';
							}

							const kind =
								args.kind === 'dynamic-import'
									? 'dynamic'
									: 'static';

							if ( isScriptModule ) {
								if ( kind === 'static' ) {
									moduleDependencies.set(
										args.path,
										'static'
									);
								} else if (
									! moduleDependencies.has( args.path )
								) {
									moduleDependencies.set(
										args.path,
										'dynamic'
									);
								}

								return {
									path: args.path,
									external: true,
									sideEffects: !! packageJson.sideEffects,
								};
							}

							if ( isScript ) {
								dependencies.add( handle );

								return {
									path: args.path,
									namespace: 'package-external',
									pluginData: {
										globalName: externalConfig.globalName,
									},
								};
							}

							return undefined;
						}
					);
				}

				build.onLoad(
					{ filter: /.*/, namespace: 'vendor-external' },
					/** @param {import('esbuild').OnLoadArgs} args */
					( args ) => {
						const global = args.pluginData.global;

						return {
							contents: `module.exports = window.${ global };`,
							loader: 'js',
						};
					}
				);

				build.onLoad(
					{ filter: /.*/, namespace: 'package-external' },
					/** @param {import('esbuild').OnLoadArgs} args */
					( args ) => {
						const globalName = args.pluginData.globalName;
						const { packagePath } = parsePackageRequest(
							args.path
						);
						const camelCasedName =
							camelCasePackagePath( packagePath );

						return {
							contents: `module.exports = window.${ globalName }.${ camelCasedName };`,
							loader: 'js',
						};
					}
				);

				build.onEnd(
					/** @param {import('esbuild').BuildResult} result */
					async ( result ) => {
						if ( result.errors.length > 0 ) {
							return;
						}

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

						// Only generate asset file if requested
						if ( ! generateAssetFile ) {
							return;
						}

						// Merge discovered dependencies with extra dependencies
						const allDependencies = new Set( [
							...dependencies,
							...extraDependencies,
						] );

						const dependenciesString = Array.from( allDependencies )
							.sort()
							.map( ( dep ) => `'${ dep }'` )
							.join( ', ' );

						// Determine output file path from build config
						let outputFilePath;
						if ( build.initialOptions.outfile ) {
							outputFilePath = build.initialOptions.outfile;
						} else if ( build.initialOptions.outdir ) {
							// Construct expected output filename from assetName
							// e.g., assetName='index.min' -> 'index.min.js'
							outputFilePath = path.join(
								build.initialOptions.outdir,
								`${ assetName }.js`
							);
						}

						// Collect files to hash
						const filesToHash = [];
						if ( outputFilePath ) {
							filesToHash.push( outputFilePath );
						}

						// Generate content-based version hash
						const version =
							await generateContentHash( filesToHash );

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

						const outputDir =
							build.initialOptions.outdir ||
							path.dirname(
								build.initialOptions.outfile || 'build'
							);

						const assetFilePath = path.join(
							outputDir,
							`${ assetName }.asset.php`
						);

						await mkdir( path.dirname( assetFilePath ), {
							recursive: true,
						} );
						await writeFile( assetFilePath, assetContent );
					}
				);
			},
		};
	};
}
