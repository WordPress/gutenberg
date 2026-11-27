import { writeFile, mkdir, readFile } from 'fs/promises';
import path from 'path';
import { createHash } from 'crypto';
import { camelCase } from 'change-case';
import { getPackageInfo } from './package-utils.mjs';

/**
 * Prefix of the ids of the modules that expose a script's global to an ES
 * module build.
 */
const GLOBAL_MODULE_PREFIX = '\0wp-global:';

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
 * Create WordPress externals plugin for Rolldown.
 * This plugin handles WordPress package externals and vendor libraries,
 * treating them as external dependencies available via global variables.
 *
 * @param {string}       packageNamespace   Custom package namespace (e.g., 'wordpress', 'my-plugin').
 * @param {string|false} scriptGlobal       Global variable name (e.g., 'wp', 'myPlugin') or false to disable globals.
 * @param {Object}       externalNamespaces Additional namespaces to externalize (e.g., { 'woo': { global: 'woo', handlePrefix: 'woocommerce' } }).
 * @param {string}       handlePrefix       Handle prefix for main package (e.g., 'wp', 'mp'). Defaults to packageNamespace.
 * @return {Function} Function that creates the Rolldown plugin instance.
 */
export function createWordpressExternalsPlugin(
	packageNamespace,
	scriptGlobal,
	externalNamespaces = {},
	handlePrefix
) {
	/**
	 * WordPress externals plugin for Rolldown.
	 *
	 * Scripts are read from their globals: in a classic script (`iife`) build,
	 * as external modules passed to the bundle's function, and in an ES module
	 * (`esm`) build, through a module exporting the global. Script modules stay
	 * external imports, resolved by the import map.
	 *
	 * @param {string}        assetName         Base name for the asset file (e.g., 'index.min').
	 * @param {string}        buildFormat       Build format: 'iife' for classic scripts, 'esm' for modules.
	 * @param {Array<string>} extraDependencies Additional dependencies to include in the asset file.
	 * @param {boolean}       generateAssetFile Whether to generate the .asset.php file. Default true.
	 * @return {import('rolldown').Plugin} Rolldown plugin object.
	 */
	return function wordpressExternalsPlugin(
		assetName = 'index.min',
		buildFormat = 'iife',
		extraDependencies = [],
		generateAssetFile = true
	) {
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
		/** @type {Record<string, {global: string, handle: string}>} */
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

		/**
		 * Get the expression of the global exposing a script.
		 *
		 * @param {string} specifier The script's import specifier, e.g. `@wordpress/blocks` or `react`.
		 * @return {string|undefined} The expression, e.g. `window.wp.blocks`, or undefined for a specifier that is not a script.
		 */
		function getScriptGlobal( specifier ) {
			if (
				Object.prototype.hasOwnProperty.call(
					vendorExternals,
					specifier
				)
			) {
				return `window.${ vendorExternals[ specifier ].global }`;
			}
			const externalConfig = packageExternals.find( ( { pattern } ) =>
				pattern.test( specifier )
			);
			if ( ! externalConfig ) {
				return undefined;
			}
			// Extract package name after '@namespace/' prefix
			// e.g., '@wordpress/blocks' or '@my-plugin/data'
			const packagePath = specifier.split( '/' ).slice( 1 ).join( '/' );
			const camelCasedName = camelCase( packagePath );
			return `window.${ externalConfig.globalName }.${ camelCasedName }`;
		}

		/**
		 * Resolve an import of a script to its global.
		 *
		 * @param {string} specifier The script's import specifier.
		 * @param {string} kind      The kind of import, e.g. `import-statement` or `require-call`.
		 * @return {import('rolldown').ResolveIdResult} The resolved module.
		 */
		function resolveScript( specifier, kind ) {
			// The output keeps `require()` calls of external modules as they are,
			// even in a classic script.
			if ( buildFormat === 'iife' && kind !== 'require-call' ) {
				return { id: specifier, external: true };
			}
			return GLOBAL_MODULE_PREFIX + specifier;
		}

		return {
			name: 'wordpress-externals',

			outputOptions( options ) {
				if ( buildFormat !== 'iife' ) {
					return null;
				}
				return {
					...options,
					globals: ( id ) => getScriptGlobal( id ) ?? id,
				};
			},

			resolveId( source, importer, extraOptions ) {
				if ( extraOptions.isEntry ) {
					return null;
				}

				if (
					Object.prototype.hasOwnProperty.call(
						vendorExternals,
						source
					)
				) {
					dependencies.add( vendorExternals[ source ].handle );

					return resolveScript( source, extraOptions.kind );
				}

				// Handle package namespace externals (wordpress and custom)
				const externalConfig = packageExternals.find( ( { pattern } ) =>
					pattern.test( source )
				);
				if ( ! externalConfig ) {
					return null;
				}

				// Extract package name and subpath from import
				// e.g., '@wordpress/blocks/sub/path' → packageName='@wordpress/blocks', subpath='sub/path'
				const parts = source.split( '/' );
				let packageName = source;
				let subpath = null;
				if ( parts.length > 2 ) {
					packageName = parts.slice( 0, 2 ).join( '/' );
					subpath = parts.slice( 2 ).join( '/' );
				}
				const shortName = parts[ 1 ];
				const handle = `${ externalConfig.handlePrefix }-${ shortName }`;

				const packageJson = getPackageInfo(
					packageName,
					importer && ! importer.startsWith( '\0' )
						? path.dirname( importer )
						: null
				);

				if ( ! packageJson ) {
					return null;
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
					extraOptions.kind === 'dynamic-import'
						? 'dynamic'
						: 'static';

				if ( isScriptModule ) {
					if ( kind === 'static' ) {
						moduleDependencies.set( source, 'static' );
					} else if ( ! moduleDependencies.has( source ) ) {
						moduleDependencies.set( source, 'dynamic' );
					}

					return {
						id: source,
						external: true,
						moduleSideEffects: !! packageJson.sideEffects,
					};
				}

				if ( isScript ) {
					dependencies.add( handle );

					return resolveScript( source, extraOptions.kind );
				}

				return null;
			},

			load: {
				filter: { id: /^\0wp-global:/ },
				handler( id ) {
					const specifier = id.slice( GLOBAL_MODULE_PREFIX.length );

					return {
						code: `module.exports = ${ getScriptGlobal(
							specifier
						) };`,
						moduleType: 'js',
					};
				},
			},

			async writeBundle( outputOptions ) {
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
				if ( outputOptions.file ) {
					outputFilePath = outputOptions.file;
				} else if ( outputOptions.dir ) {
					// Construct expected output filename from assetName
					// e.g., assetName='index.min' -> 'index.min.js'
					outputFilePath = path.join(
						outputOptions.dir,
						`${ assetName }.js`
					);
				}

				// Collect files to hash
				const filesToHash = [];
				if ( outputFilePath ) {
					filesToHash.push( outputFilePath );
				}

				// Generate content-based version hash
				const version = await generateContentHash( filesToHash );

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
					outputOptions.dir ||
					path.dirname( outputOptions.file || 'build' );

				const assetFilePath = path.join(
					outputDir,
					`${ assetName }.asset.php`
				);

				await mkdir( path.dirname( assetFilePath ), {
					recursive: true,
				} );
				await writeFile( assetFilePath, assetContent );
			},
		};
	};
}
