import { writeFile, mkdir, readFile } from 'fs/promises';
import path from 'path';
import { createHash } from 'crypto';
import { camelCase } from 'change-case';
import { getPackageInfo } from './package-utils.mjs';

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
 * @typedef {Object} ExternalConfig
 * @property {string} [module] Script module ID that provides the import in script module builds.
 * @property {string} [handle] Script handle that provides the import in classic script builds.
 * @property {string} [global] Global variable path (e.g., 'myPlugin.wpUi') that holds the import in classic script builds.
 */

/**
 * Escape a string for use as a literal inside a regular expression.
 *
 * @param {string} value String to escape.
 * @return {string} Escaped string.
 */
function escapeRegExp( value ) {
	return value.replace( /[.*+?^${}()|[\]\\]/g, '\\$&' );
}

// Characters that would break the generated PHP asset file or the import path.
const UNSAFE_ID_PATTERN = /['"\\\s]/;
// A dotted path of JavaScript identifiers, e.g. 'myPlugin.wpUi'.
const GLOBAL_PATH_PATTERN = /^[A-Za-z_$][\w$]*(\.[A-Za-z_$][\w$]*)*$/;

/**
 * Validate the `wpPlugin.externals` configuration.
 *
 * @param {Record<string, ExternalConfig>} externals Externals configuration.
 * @throws {Error} When an entry is malformed.
 */
function validateExternals( externals ) {
	if ( typeof externals !== 'object' || Array.isArray( externals ) ) {
		throw new Error(
			'`wpPlugin.externals` must be an object mapping import paths to their external configuration.'
		);
	}

	for ( const [ specifier, config ] of Object.entries( externals ) ) {
		const label = `\`wpPlugin.externals[ '${ specifier }' ]\``;

		if ( ! specifier || UNSAFE_ID_PATTERN.test( specifier ) ) {
			throw new Error( `${ label } is not a valid import path.` );
		}
		if (
			! config ||
			typeof config !== 'object' ||
			Array.isArray( config )
		) {
			throw new Error(
				`${ label } must be an object with \`module\`, or \`handle\` and \`global\`.`
			);
		}

		const { module: moduleId, handle, global: globalName } = config;

		for ( const [ key, value ] of Object.entries( {
			module: moduleId,
			handle,
		} ) ) {
			if (
				value !== undefined &&
				( typeof value !== 'string' ||
					! value ||
					UNSAFE_ID_PATTERN.test( value ) )
			) {
				throw new Error(
					`${ label }.${ key } must be a non-empty string without quotes, backslashes, or whitespace.`
				);
			}
		}
		if (
			globalName !== undefined &&
			( typeof globalName !== 'string' ||
				! GLOBAL_PATH_PATTERN.test( globalName ) )
		) {
			throw new Error(
				`${ label }.global must be a dotted path of identifiers, such as 'myPlugin.wpUi'.`
			);
		}
		if ( ( handle === undefined ) !== ( globalName === undefined ) ) {
			throw new Error(
				`${ label } must set both \`handle\` and \`global\`, or neither.`
			);
		}
		if ( moduleId === undefined && handle === undefined ) {
			throw new Error(
				`${ label } must set \`module\`, or \`handle\` and \`global\`.`
			);
		}
	}
}

/**
 * Create WordPress externals plugin for esbuild.
 * This plugin handles WordPress package externals and vendor libraries,
 * treating them as external dependencies available via global variables.
 *
 * @param {string}                         packageNamespace   Custom package namespace (e.g., 'wordpress', 'my-plugin').
 * @param {string|false}                   scriptGlobal       Global variable name (e.g., 'wp', 'myPlugin') or false to disable globals.
 * @param {Object}                         externalNamespaces Additional namespaces to externalize (e.g., { 'woo': { global: 'woo', handlePrefix: 'woocommerce' } }).
 * @param {string}                         handlePrefix       Handle prefix for main package (e.g., 'wp', 'mp'). Defaults to packageNamespace.
 * @param {Record<string, ExternalConfig>} externals          Import paths to load from a custom script module or script (e.g., { '@wordpress/ui': { module: 'my-plugin/wp-ui', handle: 'my-plugin-wp-ui', global: 'myPlugin.wpUi' } }).
 * @return {Function} Function that creates the esbuild plugin instance.
 */
export function createWordpressExternalsPlugin(
	packageNamespace,
	scriptGlobal,
	externalNamespaces = {},
	handlePrefix,
	externals = {}
) {
	validateExternals( externals );

	const externalSpecifiers = Object.keys( externals );
	// Matches each configured import path and any subpath below it, so that an
	// unconfigured subpath fails the build instead of being bundled.
	const externalsFilter = externalSpecifiers.length
		? new RegExp(
				`^(?:${ externalSpecifiers
					.map( escapeRegExp )
					.join( '|' ) })(?:/.*)?$`
			)
		: null;

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
					'react-dom/client': {
						global: 'ReactDOM',
						handle: 'react-dom',
					},
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

				// Build list of package namespace configurations
				const packageExternals = [
					{
						namespace: 'wordpress',
						pattern: /^@wordpress\//,
						globalName: 'wp',
						handlePrefix: 'wp',
					},
				];

				// Add custom namespace if different from wordpress and scriptGlobal is not false
				if (
					packageNamespace &&
					packageNamespace !== 'wordpress' &&
					scriptGlobal !== false
				) {
					packageExternals.push( {
						namespace: packageNamespace,
						pattern: new RegExp( `^@${ packageNamespace }/` ),
						globalName: scriptGlobal,
						handlePrefix: handlePrefix || packageNamespace,
					} );
				}

				// Add additional external namespaces from configuration
				for ( const [ namespace, config ] of Object.entries(
					externalNamespaces
				) ) {
					packageExternals.push( {
						namespace,
						pattern: new RegExp( `^@${ namespace }/` ),
						globalName: config.global,
						handlePrefix: config.handlePrefix || namespace,
					} );
				}

				// Configured externals are registered first so they take
				// precedence over the vendor and package namespace externals.
				if ( externalsFilter ) {
					build.onResolve(
						{ filter: externalsFilter },
						/** @param {import('esbuild').OnResolveArgs} args */
						( args ) => {
							const config = externals[ args.path ];

							if ( ! config ) {
								const parent = externalSpecifiers.find(
									( specifier ) =>
										args.path.startsWith(
											`${ specifier }/`
										)
								);
								return {
									errors: [
										{
											text: `"${ args.path }" is a subpath of "${ parent }", which is listed in \`wpPlugin.externals\`. Add an entry for "${ args.path }" too, so that it is not bundled separately.`,
										},
									],
								};
							}

							if ( buildFormat === 'esm' ) {
								if ( ! config.module ) {
									return {
										errors: [
											{
												text: `"${ args.path }" is imported by a script module, but its \`wpPlugin.externals\` entry has no \`module\`.`,
											},
										],
									};
								}

								// A static import anywhere in the bundle takes precedence, so the module is preloaded instead of lazy-loaded.
								if ( args.kind !== 'dynamic-import' ) {
									moduleDependencies.set(
										config.module,
										'static'
									);
								} else if (
									! moduleDependencies.has( config.module )
								) {
									moduleDependencies.set(
										config.module,
										'dynamic'
									);
								}

								return { path: config.module, external: true };
							}

							if ( ! config.handle ) {
								return {
									errors: [
										{
											text: `"${ args.path }" is imported by a classic script, but its \`wpPlugin.externals\` entry has no \`handle\` and \`global\`.`,
										},
									],
								};
							}

							dependencies.add( config.handle );

							return {
								path: args.path,
								namespace: 'vendor-external',
								pluginData: { global: config.global },
							};
						}
					);
				}

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

				// Handle package namespace externals (wordpress and custom)
				for ( const externalConfig of packageExternals ) {
					build.onResolve(
						{ filter: externalConfig.pattern },
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
							const shortName = parts[ 1 ];
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
						// Extract package name after '@namespace/' prefix
						// e.g., '@wordpress/blocks' or '@my-plugin/data'
						const packagePath = args.path
							.split( '/' )
							.slice( 1 )
							.join( '/' );
						const camelCasedName = camelCase( packagePath );

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
