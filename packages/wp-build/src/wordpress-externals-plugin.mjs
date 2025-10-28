/**
 * External dependencies
 */
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { camelCase } from 'change-case';

/**
 * Internal dependencies
 */
import { getPackageInfo } from './package-utils.mjs';

/**
 * Create WordPress externals plugin for esbuild.
 * This plugin handles WordPress package externals and vendor libraries,
 * treating them as external dependencies available via global variables.
 *
 * @return {Function} Function that creates the esbuild plugin instance.
 */
export function createWordpressExternalsPlugin() {
	/**
	 * WordPress externals plugin for esbuild.
	 *
	 * @param {string}        assetName         Base name for the asset file (e.g., 'index.min').
	 * @param {string}        buildFormat       Build format: 'iife' for classic scripts, 'esm' for modules.
	 * @param {Array<string>} extraDependencies Additional dependencies to include in the asset file.
	 * @return {Object} esbuild plugin object.
	 */
	return function wordpressExternalsPlugin(
		assetName = 'index.min',
		buildFormat = 'iife',
		extraDependencies = []
	) {
		return {
			name: 'wordpress-externals',
			/** @param {import('esbuild').PluginBuild} build */
			setup( build ) {
				const dependencies = new Set();
				const moduleDependencies = new Map();

				/**
				 * Check if a package import is a script module.
				 * A package is considered a script module if it has wpScriptModuleExports
				 * and the specific import path (root or subpath) is declared in wpScriptModuleExports.
				 *
				 * @param {import('./package-utils.mjs').PackageJson} packageJson Package.json object.
				 * @param {string|null}                               subpath     Subpath after package name, or null for root import.
				 * @return {boolean} True if the import is a script module.
				 */
				function isScriptModuleImport( packageJson, subpath ) {
					const { wpScriptModuleExports } = packageJson;

					if ( ! wpScriptModuleExports ) {
						return false;
					}

					// Root import: @wordpress/package-name
					if ( ! subpath ) {
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

				for ( const [ packageName, config ] of Object.entries(
					vendorExternals
				) ) {
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

				build.onResolve(
					{ filter: /^@wordpress\// },
					/** @param {import('esbuild').OnResolveArgs} args */
					( args ) => {
						// Extract package name and subpath from import
						// e.g., '@wordpress/blocks/sub/path' → packageName='@wordpress/blocks', subpath='sub/path'
						const parts = args.path.split( '/' );
						let packageName = args.path;
						let subpath = null;
						if ( parts.length > 2 ) {
							packageName = parts.slice( 0, 2 ).join( '/' );
							subpath = parts.slice( 2 ).join( '/' );
						}
						const shortName = parts[ 1 ]; // 'blocks' from '@wordpress/blocks'
						const wpHandle = `wp-${ shortName }`;

						const packageJson = getPackageInfo( packageName );

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
								moduleDependencies.set( args.path, 'static' );
							} else if (
								! moduleDependencies.has( args.path )
							) {
								moduleDependencies.set( args.path, 'dynamic' );
							}

							return {
								path: args.path,
								external: true,
							};
						}

						if ( isScript ) {
							dependencies.add( wpHandle );

							return {
								path: args.path,
								namespace: 'wordpress-external',
							};
						}

						return undefined;
					}
				);

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
					{ filter: /.*/, namespace: 'wordpress-external' },
					/** @param {import('esbuild').OnLoadArgs} args */
					( args ) => {
						const wpGlobal = camelCase(
							args.path.replace( '@wordpress/', '' )
						);

						return {
							contents: `module.exports = window.wp.${ wpGlobal };`,
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

						// Merge discovered dependencies with extra dependencies
						const allDependencies = new Set( [
							...dependencies,
							...extraDependencies,
						] );

						const dependenciesString = Array.from( allDependencies )
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
