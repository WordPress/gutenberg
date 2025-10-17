#!/usr/bin/env node

/**
 * External dependencies
 */
import { readFile, writeFile, copyFile, mkdir } from 'fs/promises';
import { readdirSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parseArgs } from 'node:util';
import esbuild from 'esbuild';
import glob from 'fast-glob';
import chokidar from 'chokidar';
// See https://github.com/WordPress/gutenberg/issues/72136
// eslint-disable-next-line import/no-unresolved
import browserslistToEsbuild from 'browserslist-to-esbuild';
import { sassPlugin } from 'esbuild-sass-plugin';
import postcss from 'postcss';
import autoprefixer from 'autoprefixer';
import rtlcss from 'rtlcss';
import cssnano from 'cssnano';
import babel from 'esbuild-plugin-babel';

/**
 * Internal dependencies
 */
import { groupByDepth } from './dependency-graph.js';

const __dirname = path.dirname( fileURLToPath( import.meta.url ) );

const PACKAGES_DIR = path
	.resolve( __dirname, '../../packages' )
	.replace( /\\/g, '/' );
const SOURCE_EXTENSIONS = '{js,ts,tsx}';
const IGNORE_PATTERNS = [
	'**/benchmark/**',
	'**/{__mocks__,__tests__,test}/**',
	'**/{storybook,stories}/**',
	'**/*.native.*',
];
const TEST_FILE_PATTERNS = [
	/\/(benchmark|__mocks__|__tests__|test|storybook|stories)\/.+/,
	/\.(spec|test)\.(js|ts|tsx)$/,
];

/**
 * Get all package names from the packages directory.
 *
 * @return {string[]} Array of package names.
 */
function getAllPackages() {
	return readdirSync( PACKAGES_DIR, { withFileTypes: true } )
		.filter( ( dirent ) => dirent.isDirectory() )
		.map( ( dirent ) => dirent.name );
}

const PACKAGES = getAllPackages();

// Define global variables for feature flagging, matching webpack's DefinePlugin behavior
const define = {
	'globalThis.IS_GUTENBERG_PLUGIN': JSON.stringify(
		Boolean( process.env.npm_package_config_IS_GUTENBERG_PLUGIN )
	),
	'globalThis.IS_WORDPRESS_CORE': JSON.stringify(
		Boolean( process.env.npm_package_config_IS_WORDPRESS_CORE )
	),
	'globalThis.SCRIPT_DEBUG': JSON.stringify(
		process.env.NODE_ENV === 'development'
	),
};

/**
 * Create emotion babel plugin for esbuild.
 * This plugin enables emotion's babel transformations for proper CSS-in-JS handling.
 *
 * @return {Object} esbuild plugin.
 */
function emotionBabelPlugin() {
	return babel( {
		filter: /\.[jt]sx?$/,
		config: {
			plugins: [ '@emotion/babel-plugin' ],
		},
	} );
}

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
 * @param {string} assetName   Optional. The name of the asset file to generate (without .asset.php extension). Defaults to 'index.min'.
 * @param {string} buildFormat Optional. The build format: 'iife' for scripts or 'esm' for script modules. Defaults to 'iife'.
 * @return {Object} esbuild plugin.
 */
function wordpressExternalsPlugin(
	assetName = 'index.min',
	buildFormat = 'iife'
) {
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

				// Check if this is a script module or a script dependency.
				let isScriptModule = isScriptModuleImport(
					packageJson,
					subpath
				);
				let isScript = packageJson.wpScript;
				if ( isScriptModule && isScript ) {
					// If the package is both a script and a script module, we should rely on the format being built
					isScript = buildFormat === 'iife';
					isScriptModule = buildFormat === 'esm';
				}

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
				if ( isScript ) {
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

				await mkdir( path.dirname( assetFilePath ), {
					recursive: true,
				} );
				await writeFile( assetFilePath, assetContent );
			} );
		},
	};
}

/**
 * Resolve the entry point for bundling from package.json exports field.
 * Falls back to build-module/index.js if no exports field is found.
 *
 * @param {string} packageDir  Package directory path.
 * @param {Object} packageJson Package.json object.
 * @return {string} Resolved entry point path.
 */
function resolveEntryPoint( packageDir, packageJson ) {
	// If package has exports field, use it
	if ( packageJson.exports ) {
		const rootExport = packageJson.exports[ '.' ];
		if ( rootExport ) {
			// If it's an object with conditions, prefer 'import' over 'default'
			if ( typeof rootExport === 'object' ) {
				const entryFile =
					rootExport.import ||
					rootExport.default ||
					rootExport.require;
				if ( entryFile ) {
					return path.join( packageDir, entryFile );
				}
			}
			// If it's a string, use it directly
			if ( typeof rootExport === 'string' ) {
				return path.join( packageDir, rootExport );
			}
		}
	}

	// Fallback: try module field, then main field, then build-module/index.js
	if ( packageJson.module ) {
		return path.join( packageDir, packageJson.module );
	}
	if ( packageJson.main ) {
		return path.join( packageDir, packageJson.main );
	}

	// Ultimate fallback
	return path.join( packageDir, 'build-module', 'index.js' );
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
		const entryPoint = resolveEntryPoint( packageDir, packageJson );
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

		const bundlePlugins = [
			momentTimezoneAliasPlugin(),
			wordpressExternalsPlugin( 'index.min', 'iife' ),
		];

		builds.push(
			esbuild.build( {
				...baseConfig,
				outfile: path.join( outputDir, 'index.min.js' ),
				minify: true,
				define,
				plugins: bundlePlugins,
			} ),
			esbuild.build( {
				...baseConfig,
				outfile: path.join( outputDir, 'index.js' ),
				minify: false,
				define,
				plugins: bundlePlugins,
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
			const baseFileName = path.basename( fileName );

			const modulePlugins = [
				wordpressExternalsPlugin( `${ baseFileName }.min`, 'esm' ),
			];

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
					define,
					plugins: modulePlugins,
				} )
			);
		}
	}

	// Process CSS files from build-style to build directory (for wpScript packages)
	if ( packageJson.wpScript ) {
		const buildStyleDir = path.join( packageDir, 'build-style' );
		const outputDir = path.join( PACKAGES_DIR, '..', 'build', packageName );
		const isProduction = process.env.NODE_ENV === 'production';

		try {
			// Find CSS files in build-style directory (including subdirectories)
			const cssFiles = await glob(
				normalizePath( path.join( buildStyleDir, '**/*.css' ) )
			);

			if ( cssFiles.length > 0 ) {
				// Process each CSS file
				for ( const cssFile of cssFiles ) {
					// Calculate relative path from build-style to preserve directory structure
					const relativePath = path.relative( buildStyleDir, cssFile );
					const destPath = path.join( outputDir, relativePath );
					const destDir = path.dirname( destPath );

					if ( isProduction ) {
						// In production, minify CSS with cssnano
						builds.push(
							( async () => {
								// Ensure destination directory exists
								await mkdir( destDir, { recursive: true } );
								const cssContent = await readFile(
									cssFile,
									'utf8'
								);
								const result = await postcss( [
									cssnano( {
										preset: [
											'default',
											{
												discardComments: {
													removeAll: true,
												},
											},
										],
									} ),
								] ).process( cssContent, {
									from: cssFile,
									to: destPath,
								} );
								await writeFile( destPath, result.css );
							} )()
						);
					} else {
						// In development, just copy the file
						builds.push(
							mkdir( destDir, { recursive: true } ).then( () =>
								copyFile( cssFile, destPath )
							)
						);
					}
				}
			}
		} catch ( error ) {
			// build-style doesn't exist or is empty - that's fine, not all packages have styles
		}
	}

	if ( builds.length === 0 ) {
		return false;
	}

	await Promise.all( builds );

	return true;
}

/**
 * Transpile a single package's source files and copy JSON files.
 *
 * @param {string} packageName Package name.
 * @return {Promise<number>} Build time in milliseconds.
 */
async function transpilePackage( packageName ) {
	const startTime = Date.now();
	const packageDir = path.join( PACKAGES_DIR, packageName );
	const packageJsonPath = path.join( packageDir, 'package.json' );
	const packageJson = JSON.parse( await readFile( packageJsonPath, 'utf8' ) );

	// Find source files to transpile
	const srcFiles = await glob(
		normalizePath(
			path.join( packageDir, `src/**/*.${ SOURCE_EXTENSIONS }` )
		),
		{
			ignore: IGNORE_PATTERNS,
		}
	);

	// Find JSON files to copy
	const jsonFiles = await glob(
		normalizePath( path.join( packageDir, 'src/**/*.json' ) ),
		{
			ignore: IGNORE_PATTERNS,
		}
	);

	const buildDir = path.join( packageDir, 'build' );
	const buildModuleDir = path.join( packageDir, 'build-module' );
	const srcDir = path.join( packageDir, 'src' );
	const target = browserslistToEsbuild();

	const builds = [];

	// Check if this is the components package that needs emotion babel plugin
	// Ideally we should remove this exception and move away from emotion.
	const needsEmotionPlugin = packageName === 'components';
	const plugins = needsEmotionPlugin ? [ emotionBabelPlugin() ] : [];

	// Build CJS and copy JSON files to build directory
	if ( packageJson.main ) {
		builds.push(
			esbuild.build( {
				entryPoints: srcFiles,
				outdir: buildDir,
				outbase: srcDir,
				bundle: false,
				platform: 'node',
				format: 'cjs',
				sourcemap: true,
				target,
				jsx: 'automatic',
				jsxImportSource: 'react',
				loader: {
					'.js': 'jsx',
				},
				plugins,
			} )
		);

		// Copy JSON files to build directory
		for ( const jsonFile of jsonFiles ) {
			const relativePath = path.relative( srcDir, jsonFile );
			const destPath = path.join( buildDir, relativePath );
			const destDir = path.dirname( destPath );
			builds.push(
				mkdir( destDir, { recursive: true } ).then( () =>
					copyFile( jsonFile, destPath )
				)
			);
		}
	}

	// Build ESM and copy JSON files to build-module directory
	if ( packageJson.module ) {
		builds.push(
			esbuild.build( {
				entryPoints: srcFiles,
				outdir: buildModuleDir,
				outbase: srcDir,
				bundle: false,
				platform: 'neutral',
				format: 'esm',
				sourcemap: true,
				target,
				jsx: 'automatic',
				jsxImportSource: 'react',
				loader: {
					'.js': 'jsx',
				},
				plugins,
			} )
		);

		// Copy JSON files to build-module directory
		for ( const jsonFile of jsonFiles ) {
			const relativePath = path.relative( srcDir, jsonFile );
			const destPath = path.join( buildModuleDir, relativePath );
			const destDir = path.dirname( destPath );
			builds.push(
				mkdir( destDir, { recursive: true } ).then( () =>
					copyFile( jsonFile, destPath )
				)
			);
		}
	}

	await compileStyles( packageName );

	await Promise.all( builds );

	return Date.now() - startTime;
}

/**
 * Compile styles for a single package.
 * Discovers and compiles SCSS entry points based on package configuration.
 * Supports wpStyleEntryPoints in package.json for custom entry point patterns.
 *
 * @param {string} packageName Package name.
 * @return {Promise<number|null>} Build time in milliseconds, or null if no styles.
 */
async function compileStyles( packageName ) {
	const packageDir = path.join( PACKAGES_DIR, packageName );
	const packageJsonPath = path.join( packageDir, 'package.json' );
	const packageJson = JSON.parse( await readFile( packageJsonPath, 'utf8' ) );

	// Get entry point patterns from package.json, default to root-level only
	const entryPointPatterns = packageJson.wpStyleEntryPoints || [
		'src/*.scss',
	];

	// Find all matching SCSS files
	const styleEntries = await glob(
		entryPointPatterns.map( ( pattern ) =>
			normalizePath( path.join( packageDir, pattern ) )
		)
	);

	if ( styleEntries.length === 0 ) {
		return null;
	}

	const startTime = Date.now();
	const buildStyleDir = path.join( packageDir, 'build-style' );
	const srcDir = path.join( packageDir, 'src' );

	// Compile each style entry point
	await Promise.all(
		styleEntries.map( async ( styleEntryPath ) => {
			// Calculate relative path from src/ to preserve directory structure
			const relativePath = path.relative( srcDir, styleEntryPath );
			const relativeDir = path.dirname( relativePath );
			const entryName = path.basename( styleEntryPath, '.scss' );

			// Determine output directory (preserve subdirectory structure)
			const outputDir =
				relativeDir === '.'
					? buildStyleDir
					: path.join( buildStyleDir, relativeDir );

			// Ensure output directory exists
			await mkdir( outputDir, { recursive: true } );

			// Build with Sass plugin
			await esbuild.build( {
				entryPoints: [ styleEntryPath ],
				outdir: outputDir,
				bundle: true,
				write: false,
				loader: {
					'.scss': 'css',
				},
				plugins: [
					sassPlugin( {
						embedded: true,
						loadPaths: [
							'node_modules',
							path.join( PACKAGES_DIR, 'base-styles' ),
						],
						async transform( source ) {
							// Process with autoprefixer for LTR version
							const ltrResult = await postcss( [
								autoprefixer( { grid: true } ),
							] ).process( source, { from: undefined } );

							// Process with rtlcss for RTL version
							const rtlResult = await postcss( [
								rtlcss(),
							] ).process( ltrResult.css, { from: undefined } );

							// Write both versions
							await Promise.all( [
								writeFile(
									path.join(
										outputDir,
										`${ entryName }.css`
									),
									ltrResult.css
								),
								writeFile(
									path.join(
										outputDir,
										`${ entryName }-rtl.css`
									),
									rtlResult.css
								),
							] );

							return '';
						},
					} ),
				],
			} );
		} )
	);

	return Date.now() - startTime;
}

/**
 * Determine if a file is a source file in a package.
 *
 * @param {string} filename File path.
 * @return {boolean} True if the file is a package source file.
 */
function isPackageSourceFile( filename ) {
	const relativePath = normalizePath(
		path.relative( process.cwd(), filename )
	);

	if ( ! /\/src\/.+\.(js|ts|tsx|scss)$/.test( relativePath ) ) {
		return false;
	}

	// Exclude test files and other non-source files
	if ( TEST_FILE_PATTERNS.some( ( regex ) => regex.test( relativePath ) ) ) {
		return false;
	}

	// Check if it's in a package
	return PACKAGES.some( ( packageName ) => {
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

	for ( const packageName of PACKAGES ) {
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
	console.log( '🔨 Building packages...\n' );

	const startTime = Date.now();

	// Group packages by dependency depth
	const levels = groupByDepth( PACKAGES );

	// Phase 1: Transpile packages level by level (respecting dependencies)
	console.log( '📝 Phase 1: Transpiling packages...\n' );

	for ( let i = 0; i < levels.length; i++ ) {
		const level = levels[ i ];
		await Promise.all(
			level.map( async ( packageName ) => {
				const buildTime = await transpilePackage( packageName );
				console.log(
					`   ✔ Transpiled ${ packageName } (${ buildTime }ms)`
				);
			} )
		);
	}

	// Phase 2: Bundle packages with wpScript in parallel
	console.log( '\n📦 Phase 2: Bundling packages...\n' );
	await Promise.all(
		PACKAGES.map( async ( packageName ) => {
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
		`\n🎉 All packages built successfully! (${ totalTime }ms total)`
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

				await transpilePackage( packageName );
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

	// Watch package source directories
	const watchPaths = PACKAGES.map( ( packageName ) =>
		path.join( PACKAGES_DIR, packageName, 'src' )
	);

	const watcher = chokidar.watch( watchPaths, {
		ignored: [
			// Exclude test files and other non-source files
			'**/{__mocks__,__tests__,test,storybook,stories}/**',
			'**/*.{spec,test}.{js,ts,tsx}',
			'**/*.native.*',
		],
		persistent: true,
		ignoreInitial: true,
		// Reduce file descriptor usage on macOS
		useFsEvents: true,
		depth: 10,
		awaitWriteFinish: {
			stabilityThreshold: 100,
			pollInterval: 50,
		},
	} );

	watcher.on( 'error', ( error ) => {
		if ( error.code === 'EMFILE' ) {
			console.error(
				'\n❌ Too many open files. Try increasing the limit:\n' +
					'   Run: ulimit -n 10240\n' +
					'   Or add to ~/.zshrc: ulimit -n 10240\n'
			);
			process.exit( 1 );
		}
		console.error( '❌ Watcher error:', error );
	} );

	// Handle file changes, additions, and deletions
	const handleFileChange = ( filename ) => {
		if ( ! isPackageSourceFile( filename ) ) {
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
	};

	watcher.on( 'change', handleFileChange );
	watcher.on( 'add', handleFileChange );
	watcher.on( 'unlink', handleFileChange );
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
