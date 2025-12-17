#!/usr/bin/env node

/**
 * External dependencies
 */
import { readFile, writeFile, copyFile, mkdir, unlink } from 'fs/promises';
import path from 'path';
import { parseArgs } from 'node:util';
import esbuild from 'esbuild';
import glob from 'fast-glob';
import chokidar from 'chokidar';
import browserslistToEsbuild from 'browserslist-to-esbuild';
import { sassPlugin, postcssModules } from 'esbuild-sass-plugin';
import postcss from 'postcss';
import autoprefixer from 'autoprefixer';
import rtlcss from 'rtlcss';
import cssnano from 'cssnano';
import babel from 'esbuild-plugin-babel';
import { camelCase } from 'change-case';

/**
 * Internal dependencies
 */
import {
	groupByDepth,
	findScriptsToRebundle,
	findRoutesToRebuild,
} from './dependency-graph.mjs';
import {
	generatePhpFromTemplate,
	getPhpReplacements,
} from './php-generator.mjs';
import { getPackageInfo, getPackageInfoFromFile } from './package-utils.mjs';
import { createWordpressExternalsPlugin } from './wordpress-externals-plugin.mjs';
import {
	getAllRoutes,
	getRouteFiles,
	getRouteMetadata,
	generateContentEntryPoint,
} from './route-utils.mjs';

const ROOT_DIR = process.cwd();
const PACKAGES_DIR = path.join( ROOT_DIR, 'packages' );
const BUILD_DIR = path.join( ROOT_DIR, 'build' );

const SOURCE_EXTENSIONS = '{js,ts,tsx}';
const ASSET_EXTENSIONS = 'json';
const IGNORE_PATTERNS = [
	'**/benchmark/**',
	'**/{__mocks__,__tests__,test}/**',
	'**/{storybook,stories}/**',
	'**/*.native.*',
	'**/*.ios.*',
	'**/*.android.*',
	'**/*.{spec,test}.*',
];
const TEST_FILE_PATTERNS = [
	/\/(benchmark|__mocks__|__tests__|test|storybook|stories)\/.+/,
	/\.(spec|test)\.(js|ts|tsx)$/,
	/\.(native|ios|android)\.(js|ts|tsx)$/,
];

/**
 * Get all package names from the packages directory.
 *
 * @return {string[]} Array of package names.
 */
function getAllPackages() {
	return glob
		.sync( normalizePath( path.join( PACKAGES_DIR, '*', 'package.json' ) ) )
		.map( ( packageJsonPath ) =>
			path.basename( path.dirname( packageJsonPath ) )
		);
}

const PACKAGES = getAllPackages();
const ROOT_PACKAGE_JSON = getPackageInfoFromFile(
	path.join( ROOT_DIR, 'package.json' )
);
const WP_PLUGIN_CONFIG = ROOT_PACKAGE_JSON.wpPlugin || {};
const SCRIPT_GLOBAL = WP_PLUGIN_CONFIG.scriptGlobal;
const PACKAGE_NAMESPACE = WP_PLUGIN_CONFIG.packageNamespace;
const HANDLE_PREFIX = WP_PLUGIN_CONFIG.handlePrefix || PACKAGE_NAMESPACE;
const EXTERNAL_NAMESPACES = WP_PLUGIN_CONFIG.externalNamespaces || {};
const PAGES = WP_PLUGIN_CONFIG.pages || [];

const baseDefine = {
	'globalThis.IS_GUTENBERG_PLUGIN': JSON.stringify(
		Boolean( process.env.npm_package_config_IS_GUTENBERG_PLUGIN )
	),
	'globalThis.IS_WORDPRESS_CORE': JSON.stringify(
		Boolean( process.env.npm_package_config_IS_WORDPRESS_CORE )
	),
};
const getDefine = ( scriptDebug ) => ( {
	...baseDefine,
	'globalThis.SCRIPT_DEBUG': JSON.stringify( scriptDebug ),
} );

/**
 * Initialize WordPress externals plugin with custom namespace configuration.
 */
const wordpressExternalsPlugin = createWordpressExternalsPlugin(
	PACKAGE_NAMESPACE,
	SCRIPT_GLOBAL,
	EXTERNAL_NAMESPACES,
	HANDLE_PREFIX
);

const styleBundlingPlugins = [
	// Handle CSS modules (.module.css and .module.scss)
	sassPlugin( {
		embedded: true,
		filter: /\.module\.(css|scss)$/,
		transform: postcssModules( {
			generateScopedName: '[name]__[local]__[hash:base64:5]',
		} ),
		type: 'style',
		loadPaths: [ 'node_modules', path.join( PACKAGES_DIR, 'base-styles' ) ],
	} ),
	// Handle regular CSS/SCSS files
	// Note: .module.css and .module.scss already handled by plugin above
	sassPlugin( {
		embedded: true,
		filter: /\.(css|scss)$/,
		type: 'style',
		loadPaths: [ 'node_modules', path.join( PACKAGES_DIR, 'base-styles' ) ],
	} ),
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

function transformPhpContent( content, transforms ) {
	const {
		functionPrefix = '',
		classSuffix = '',
		prefixFunctions = [],
		suffixClasses = [],
		addActionPriority,
	} = transforms;

	content = content.toString();

	if ( prefixFunctions.length ) {
		content = content.replace(
			new RegExp( prefixFunctions.join( '|' ), 'g' ),
			( match ) => `${ functionPrefix }${ match.replace( /^wp_/, '' ) }`
		);
	}

	if ( suffixClasses.length ) {
		content = content.replace(
			new RegExp( suffixClasses.join( '|' ), 'g' ),
			( match ) => `${ match }${ classSuffix }`
		);
	}

	if ( functionPrefix ) {
		content = Array.from(
			content.matchAll( /^\s*function ([^\(]+)/gm )
		).reduce( ( result, [ , functionName ] ) => {
			return result.replace(
				new RegExp( functionName + '(?![a-zA-Z0-9_])', 'g' ),
				( match ) => functionPrefix + match.replace( /^wp_/, '' )
			);
		}, content );
	}

	if ( addActionPriority ) {
		content = content.replace(
			/(add_action\(\s*'init',\s*'gutenberg_register_block_[^']+'(?!,))/,
			`$1, ${ addActionPriority }`
		);
	}

	return content;
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
			const { createRequire } = await import( 'module' );
			const require = createRequire( import.meta.url );

			// Cached paths - resolved lazily on first use
			let preBuiltBundlePath;
			let momentTimezoneUtilsPath;
			const resolvePaths = () => {
				if ( preBuiltBundlePath ) {
					return;
				}
				preBuiltBundlePath = require.resolve(
					'moment-timezone/builds/moment-timezone-with-data-1970-2030'
				);
				momentTimezoneUtilsPath = require.resolve(
					'moment-timezone/moment-timezone-utils.js'
				);
			};

			// Redirect main moment-timezone files to pre-built bundle
			build.onResolve(
				{ filter: /^moment-timezone\/moment-timezone$/ },
				() => {
					resolvePaths();
					return { path: preBuiltBundlePath };
				}
			);

			// For utils, we need to load it but ensure it works with the pre-built bundle.
			// The utils file tries to require('./') which would load index.js.
			// We need to make sure it gets the pre-built bundle instead.
			build.onResolve(
				{ filter: /^moment-timezone\/moment-timezone-utils$/ },
				() => {
					resolvePaths();
					return { path: momentTimezoneUtilsPath };
				}
			);

			// Intercept the require('./') call inside moment-timezone-utils
			// and redirect it to the pre-built bundle.
			build.onResolve( { filter: /^\.\/$/ }, ( args ) => {
				if (
					args.importer &&
					args.importer.includes( 'moment-timezone-utils' )
				) {
					resolvePaths();
					return { path: preBuiltBundlePath };
				}
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

	return path.join( packageDir, 'build-module', 'index.js' );
}

/**
 * Bundle a package for WordPress using esbuild.
 *
 * @param {string} packageName Package name.
 * @param {Object} options     Optional bundling options.
 * @return {Promise<boolean>} True if the package was bundled, false otherwise.
 */
async function bundlePackage( packageName, options = {} ) {
	const {
		sourceDir = PACKAGES_DIR,
		handlePrefix = HANDLE_PREFIX,
		scriptGlobal = SCRIPT_GLOBAL,
		packageNamespace = PACKAGE_NAMESPACE,
	} = options;

	const builtModules = [];
	const builtScripts = [];
	const builtStyles = [];
	const packageDir = path.join( sourceDir, packageName );
	const packageJson = getPackageInfoFromFile(
		path.join( sourceDir, packageName, 'package.json' )
	);

	const builds = [];

	if ( packageJson.wpScript ) {
		const entryPoint = resolveEntryPoint( packageDir, packageJson );
		const outputDir = path.join( BUILD_DIR, 'scripts', packageName );
		const target = browserslistToEsbuild();

		// Check if package matches the namespace and should expose a global
		const packageFullName = packageJson.name;
		const matchesNamespace = packageFullName.startsWith(
			`@${ packageNamespace }/`
		);
		const shouldExposeGlobal = matchesNamespace && scriptGlobal !== false;

		const globalName = shouldExposeGlobal
			? `${ scriptGlobal }.${ camelCase( packageName ) }`
			: undefined;

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
		if ( packageJson.wpScriptDefaultExport && globalName ) {
			baseConfig.footer = {
				js: `if (typeof ${ globalName } === 'object' && ${ globalName }.default) { ${ globalName } = ${ globalName }.default; }`,
			};
		}

		const baseBundlePlugins = [ momentTimezoneAliasPlugin() ];

		builds.push(
			esbuild.build( {
				...baseConfig,
				outfile: path.join( outputDir, 'index.min.js' ),
				minify: true,
				define: getDefine( false ),
				plugins: [
					...baseBundlePlugins,
					wordpressExternalsPlugin(
						'index.min',
						'iife',
						packageJson.wpScriptExtraDependencies || [],
						true // Generate asset file for minified build
					),
				],
			} ),
			esbuild.build( {
				...baseConfig,
				outfile: path.join( outputDir, 'index.js' ),
				minify: false,
				define: getDefine( true ),
				plugins: [
					...baseBundlePlugins,
					wordpressExternalsPlugin(
						'index.min',
						'iife',
						packageJson.wpScriptExtraDependencies || [],
						false // Skip asset file for non-minified build
					),
				],
			} )
		);

		builtScripts.push( {
			handle: `${ handlePrefix }-${ packageName }`,
			path: `${ packageName }/index`,
			asset: `${ packageName }/index.min.asset.php`,
		} );
	}

	if ( packageJson.wpScriptModuleExports ) {
		const target = browserslistToEsbuild();
		const rootBuildModuleDir = path.join(
			BUILD_DIR,
			'modules',
			packageName
		);

		const exports =
			typeof packageJson.wpScriptModuleExports === 'string'
				? { '.': packageJson.wpScriptModuleExports }
				: packageJson.wpScriptModuleExports;

		for ( const [ exportName, exportPath ] of Object.entries( exports ) ) {
			const fileName =
				exportName === '.'
					? 'index'
					: exportName.replace( /^\.\//, '' );
			const entryPoint = path.join( packageDir, exportPath );
			const baseFileName = path.basename( fileName );

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
					define: getDefine( false ),
					plugins: [
						wordpressExternalsPlugin(
							`${ baseFileName }.min`,
							'esm',
							[],
							true // Generate asset file for minified build
						),
					],
				} ),
				esbuild.build( {
					entryPoints: [ entryPoint ],
					outfile: path.join(
						rootBuildModuleDir,
						`${ fileName }.js`
					),
					bundle: true,
					sourcemap: true,
					format: 'esm',
					target,
					platform: 'browser',
					minify: false,
					define: getDefine( true ),
					plugins: [
						wordpressExternalsPlugin(
							`${ baseFileName }.min`,
							'esm',
							[],
							false // Skip asset file for non-minified build
						),
					],
				} )
			);

			const scriptModuleId =
				exportName === '.'
					? `@wordpress/${ packageName }`
					: `@wordpress/${ packageName }/${ fileName }`;

			builtModules.push( {
				id: scriptModuleId,
				path: `${ packageName }/${ fileName }`,
				asset: `${ packageName }/${ fileName }.min.asset.php`,
			} );
		}
	}

	let hasMainStyle = false;
	if ( packageJson.wpScript ) {
		const buildStyleDir = path.join( packageDir, 'build-style' );
		const outputDir = path.join( BUILD_DIR, 'styles', packageName );
		const isProduction = process.env.NODE_ENV === 'production';

		const cssFiles = await glob(
			normalizePath( path.join( buildStyleDir, '**/*.css' ) )
		);

		for ( const cssFile of cssFiles ) {
			const relativePath = path.relative( buildStyleDir, cssFile );
			const destPath = path.join( outputDir, relativePath );
			const destDir = path.dirname( destPath );

			// Track if this package has a main style.css for auto-registration
			if ( relativePath === 'style.css' ) {
				hasMainStyle = true;
			}

			if ( isProduction ) {
				builds.push(
					( async () => {
						await mkdir( destDir, { recursive: true } );
						const content = await readFile( cssFile, 'utf8' );
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
						] ).process( content, {
							from: cssFile,
							to: destPath,
						} );
						await writeFile( destPath, result.css );
					} )()
				);
			} else {
				builds.push(
					mkdir( destDir, { recursive: true } ).then( () =>
						copyFile( cssFile, destPath )
					)
				);
			}
		}
	}

	if ( packageJson.wpCopyFiles ) {
		const { files, transforms = {} } = packageJson.wpCopyFiles;
		const packageSourceDir = path.join( packageDir, 'src' );
		const outputDir = path.join( BUILD_DIR, 'scripts', packageName );

		for ( const filePattern of files ) {
			const matchedFiles = await glob(
				normalizePath( path.join( packageDir, filePattern ) )
			);

			for ( const sourceFile of matchedFiles ) {
				const relativePath = path.relative(
					packageSourceDir,
					sourceFile
				);
				const destPath = path.join( outputDir, relativePath );
				const destDir = path.dirname( destPath );

				if ( sourceFile.endsWith( '.php' ) && transforms.php ) {
					builds.push(
						( async () => {
							let finalPath = destPath;
							let finalDir = destDir;

							const content = await readFile(
								sourceFile,
								'utf8'
							);
							const transformed = transformPhpContent(
								content,
								transforms.php
							);

							if ( transforms.php.filenameSuffix ) {
								const ext = path.extname( destPath );
								const base = path.basename( destPath, ext );
								finalPath = path.join(
									destDir,
									`${ base }${ transforms.php.filenameSuffix }${ ext }`
								);
							}

							// Check if we should flatten index.php files
							if (
								transforms.php.flattenIndexFiles &&
								path.basename( sourceFile ) === 'index.php'
							) {
								// Flatten: button/index.php → button.php
								const parentDir = path.dirname( finalPath );
								const blockName = path.basename( parentDir );
								finalPath = path.join(
									path.dirname( parentDir ),
									`${ blockName }.php`
								);
								finalDir = path.dirname( finalPath );
							}

							await mkdir( finalDir, { recursive: true } );
							await writeFile( finalPath, transformed );
						} )()
					);
				} else {
					builds.push(
						mkdir( destDir, { recursive: true } ).then( () =>
							copyFile( sourceFile, destPath )
						)
					);
				}
			}
		}
	}

	if ( builds.length === 0 ) {
		return false;
	}

	await Promise.all( builds );

	// Collect style metadata after builds complete (so asset files exist)
	// Only register the main style.css file - complex cases handled manually in lib/client-assets.php
	if ( hasMainStyle ) {
		// Read script asset file to get dependencies
		const scriptAssetPath = path.join(
			BUILD_DIR,
			'scripts',
			packageName,
			'index.min.asset.php'
		);

		const assetContent = await readFile( scriptAssetPath, 'utf8' );
		const depsMatch = assetContent.match(
			/'dependencies' => array\((.*?)\)/s
		);

		let scriptDependencies = [];
		if ( depsMatch ) {
			const depsString = depsMatch[ 1 ];
			scriptDependencies =
				depsString
					.match( /'([^']+)'/g )
					?.map( ( d ) => d.replace( /'/g, '' ) ) || [];
		}

		const styleDeps = await inferStyleDependencies( scriptDependencies );

		builtStyles.push( {
			handle: `${ handlePrefix }-${ packageName }`,
			path: `${ packageName }/style`,
			dependencies: styleDeps,
		} );
	}

	return {
		modules: builtModules,
		scripts: builtScripts,
		styles: builtStyles,
	};
}

/**
 * Infer style dependencies from script dependencies.
 * Only includes dependencies that:
 * 1. Are @wordpress packages (start with 'wp-')
 * 2. Have wpScript: true in their package.json
 * 3. Actually have a built style.css file
 *
 * @param {string[]} scriptDependencies Array of script handles from asset file.
 * @return {Promise<string[]>} Array of style handles to depend on.
 */
async function inferStyleDependencies( scriptDependencies ) {
	if ( ! scriptDependencies || scriptDependencies.length === 0 ) {
		return [];
	}

	const styleDeps = [];

	for ( const scriptHandle of scriptDependencies ) {
		// Skip non-package dependencies (like 'react', 'lodash', etc.)
		if ( ! scriptHandle.startsWith( 'wp-' ) ) {
			continue;
		}

		// Convert handle to package name: 'wp-components' → 'components'
		const shortName = scriptHandle.replace( 'wp-', '' );
		const depPackageName = `@wordpress/${ shortName }`;

		// Read the dependency's package.json
		try {
			const depPackageJson = getPackageInfo( depPackageName );

			if ( ! depPackageJson ) {
				continue;
			}

			// ONLY include if it has wpScript: true (which means it builds styles)
			if ( depPackageJson.wpScript === true ) {
				// Double-check the style file actually exists
				const styleFile = path.join(
					BUILD_DIR,
					'styles',
					shortName,
					'style.css'
				);
				try {
					await readFile( styleFile );
					styleDeps.push( scriptHandle );
				} catch {
					// Style file doesn't exist, skip it
				}
			}
		} catch {
			// Package not found or can't read package.json - skip it
			continue;
		}
	}

	return styleDeps;
}

/**
 * Generate PHP files for script module registration.
 *
 * @param {Array}                  modules      Array of module info objects.
 * @param {Record<string, string>} replacements PHP template replacements.
 */
async function generateModuleRegistrationPhp( modules, replacements ) {
	// Generate modules array for registry
	const modulesArray = modules
		.map(
			( module ) =>
				`\tarray(\n` +
				`\t\t'id' => '${ module.id }',\n` +
				`\t\t'path' => '${ module.path }',\n` +
				`\t\t'asset' => '${ module.asset }',\n` +
				`\t),`
		)
		.join( '\n' );

	await Promise.all( [
		generatePhpFromTemplate(
			'module-registry.php.template',
			path.join( BUILD_DIR, 'modules', 'index.php' ),
			{ ...replacements, '{{MODULES}}': modulesArray }
		),
		generatePhpFromTemplate(
			'module-registration.php.template',
			path.join( BUILD_DIR, 'modules.php' ),
			replacements
		),
	] );
}

/**
 * Generate PHP files for script registration.
 *
 * @param {Array}                  scripts      Array of script info objects.
 * @param {Record<string, string>} replacements PHP template replacements.
 */
async function generateScriptRegistrationPhp( scripts, replacements ) {
	// Generate scripts array for registry
	const scriptsArray = scripts
		.map(
			( script ) =>
				`\tarray(\n` +
				`\t\t'handle' => '${ script.handle }',\n` +
				`\t\t'path' => '${ script.path }',\n` +
				`\t\t'asset' => '${ script.asset }',\n` +
				`\t),`
		)
		.join( '\n' );

	await Promise.all( [
		generatePhpFromTemplate(
			'script-registry.php.template',
			path.join( BUILD_DIR, 'scripts', 'index.php' ),
			{ ...replacements, '{{SCRIPTS}}': scriptsArray }
		),
		generatePhpFromTemplate(
			'script-registration.php.template',
			path.join( BUILD_DIR, 'scripts.php' ),
			replacements
		),
	] );
}

/**
 * Generate PHP file for version constant.
 *
 * @param {Record<string, string>} replacements PHP template replacements.
 */
async function generateVersionPhp( replacements ) {
	await generatePhpFromTemplate(
		'version.php.template',
		path.join( BUILD_DIR, 'version.php' ),
		replacements
	);
}

/**
 * Generate PHP files for style registration.
 *
 * @param {Array}                  styles       Array of style info objects.
 * @param {Record<string, string>} replacements PHP template replacements.
 */
async function generateStyleRegistrationPhp( styles, replacements ) {
	// Generate styles array for registry
	const stylesArray = styles
		.map(
			( style ) =>
				`\tarray(\n` +
				`\t\t'handle' => '${ style.handle }',\n` +
				`\t\t'path' => '${ style.path }',\n` +
				`\t\t'dependencies' => array(${ style.dependencies
					.map( ( dep ) => `'${ dep }'` )
					.join( ', ' ) }),\n` +
				`\t),`
		)
		.join( '\n' );

	await Promise.all( [
		generatePhpFromTemplate(
			'style-registry.php.template',
			path.join( BUILD_DIR, 'styles', 'index.php' ),
			{ ...replacements, '{{STYLES}}': stylesArray }
		),
		generatePhpFromTemplate(
			'style-registration.php.template',
			path.join( BUILD_DIR, 'styles.php' ),
			replacements
		),
	] );
}

/**
 * Generate main index.php that loads both modules and scripts.
 *
 * @param {Record<string, string>} replacements PHP template replacements.
 */
async function generateMainIndexPhp( replacements ) {
	await generatePhpFromTemplate(
		'index.php.template',
		path.join( BUILD_DIR, 'index.php' ),
		replacements
	);
}

/**
 * Generate global route registry file.
 * Creates a single registry with all routes including page metadata.
 *
 * @param {Array}                  routes       Array of route objects.
 * @param {Record<string, string>} replacements PHP template replacements.
 */
async function generateRoutesRegistry( routes, replacements ) {
	if ( routes.length === 0 ) {
		// No routes to register, skip generating routes registry
		return;
	}

	// Generate PHP array entries with page metadata
	const routeEntries = routes
		.map( ( route ) => {
			const hasRouteStr = route.hasRoute ? 'true' : 'false';
			const hasContentStr = route.hasContent ? 'true' : 'false';
			return `\tarray(
		'name'        => '${ route.name }',
		'path'        => '${ route.path }',
		'page'        => '${ route.page }',
		'has_route'   => ${ hasRouteStr },
		'has_content' => ${ hasContentStr },
	)`;
		} )
		.join( ',\n' );

	// Generate single global registry at build/routes/index.php
	await generatePhpFromTemplate(
		'route-registry.php.template',
		path.join( BUILD_DIR, 'routes', 'index.php' ),
		{ ...replacements, '{{ROUTES}}': routeEntries }
	);
}

/**
 * Generate routes.php file with route registration logic.
 * Uses registry pattern with loop-based registration on page init hooks.
 *
 * @param {Array}                  routes       Array of route objects.
 * @param {Record<string, string>} replacements PHP template replacements.
 */
async function generateRoutesPhp( routes, replacements ) {
	if ( routes.length === 0 ) {
		// No routes to register, skip generating routes.php
		return;
	}

	// Generate routes.php from template
	await generatePhpFromTemplate(
		'routes-registration.php.template',
		path.join( BUILD_DIR, 'routes.php' ),
		{ ...replacements, '{{HANDLE_PREFIX}}': HANDLE_PREFIX }
	);
}

/**
 * Generate page-specific PHP files for all pages.
 *
 * @param {Array}                  pageData     Array of page objects with routes.
 * @param {Record<string, string>} replacements PHP template replacements.
 */
async function generatePagesPhp( pageData, replacements ) {
	if ( pageData.length === 0 ) {
		// No pages to generate
		return;
	}

	// Generate files for each page
	const pageGenerationPromises = pageData.map( async ( page ) => {
		// Skip pages with no routes
		if ( page.routes.length === 0 ) {
			return;
		}

		const pageSlugUnderscore = page.slug.replace( /-/g, '_' );
		const prefixUnderscore = replacements[ '{{PREFIX}}' ].replace(
			/-/g,
			'_'
		);

		// Generate PHP code for init modules
		const initModulesPhp =
			page.initModules.length > 0
				? page.initModules
						.map(
							( moduleId ) =>
								`\t\t\t$boot_dependencies[] = array( 'import' => 'static', 'id' => '${ moduleId }' );`
						)
						.join( '\n' )
				: '\t\t\t// No init modules configured';

		const templateReplacements = {
			...replacements,
			'{{PAGE_SLUG}}': page.slug,
			'{{PAGE_SLUG_UNDERSCORE}}': pageSlugUnderscore,
			'{{PREFIX}}': prefixUnderscore,
			'{{INIT_MODULES_PHP_ARRAY}}': initModulesPhp,
			'{{INIT_MODULES_JSON}}': JSON.stringify( page.initModules ),
		};

		// Generate both page.php and page-wp-admin.php
		await Promise.all( [
			generatePhpFromTemplate(
				'page.php.template',
				path.join( BUILD_DIR, 'pages', page.slug, 'page.php' ),
				templateReplacements
			),
			generatePhpFromTemplate(
				'page-wp-admin.php.template',
				path.join( BUILD_DIR, 'pages', page.slug, 'page-wp-admin.php' ),
				templateReplacements
			),
		] );

		// Generate empty loader.js (dummy module for dependencies)
		await writeFile(
			path.join( BUILD_DIR, 'pages', page.slug, 'loader.js' ),
			'// Empty module loader for page dependencies\n'
		);
	} );

	await Promise.all( pageGenerationPromises );

	// Generate pages.php loader
	const pageIncludes = pageData
		.map( ( page ) => {
			return `require_once __DIR__ . '/pages/${ page.slug }/page.php';\nrequire_once __DIR__ . '/pages/${ page.slug }/page-wp-admin.php';`;
		} )
		.join( '\n' );

	await generatePhpFromTemplate(
		'pages.php.template',
		path.join( BUILD_DIR, 'pages.php' ),
		{ ...replacements, '{{PAGE_INCLUDES}}': pageIncludes }
	);
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
	const packageJson = getPackageInfoFromFile(
		path.join( PACKAGES_DIR, packageName, 'package.json' )
	);

	if ( ! packageJson ) {
		throw new Error(
			`Could not find package.json for package: ${ packageName }`
		);
	}

	const srcFiles = await glob(
		normalizePath(
			path.join( packageDir, `src/**/*.${ SOURCE_EXTENSIONS }` )
		),
		{
			ignore: IGNORE_PATTERNS,
		}
	);

	const assetFiles = await glob(
		normalizePath(
			path.join( packageDir, `src/**/*.${ ASSET_EXTENSIONS }` )
		),
		{
			ignore: IGNORE_PATTERNS,
		}
	);

	const buildDir = path.join( packageDir, 'build' );
	const buildModuleDir = path.join( packageDir, 'build-module' );
	const srcDir = path.join( packageDir, 'src' );
	const target = browserslistToEsbuild();

	const builds = [];

	// Check if this is the components package that needs emotion babel plugin.
	// Ideally we should remove this exception and move away from emotion.
	const needsEmotionPlugin = packageName === 'components';
	const emotionPlugin = babel( {
		filter: /\.[jt]sx?$/,
		config: {
			plugins: [ '@emotion/babel-plugin' ],
		},
	} );
	const externalizeAllExceptCssPlugin = {
		name: 'externalize-except-css',
		setup( build ) {
			// Externalize all non-CSS imports
			build.onResolve( { filter: /.*/ }, ( args ) => {
				// Skip entry points
				if ( args.kind === 'entry-point' ) {
					return null;
				}

				// Let CSS/SCSS files be processed by sassPlugin
				if ( args.path.match( /\.(css|scss)$/ ) ) {
					return null;
				}

				// Externalize everything else (keep imports as-is)
				return { path: args.path, external: true };
			} );
		},
	};
	const plugins = [
		needsEmotionPlugin && emotionPlugin,
		externalizeAllExceptCssPlugin,
		...styleBundlingPlugins,
	].filter( Boolean );

	if ( packageJson.main ) {
		builds.push(
			esbuild.build( {
				entryPoints: srcFiles,
				outdir: buildDir,
				outbase: srcDir,
				bundle: true,
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

		for ( const assetFile of assetFiles ) {
			const relativePath = path.relative( srcDir, assetFile );
			const destPath = path.join( buildDir, relativePath );
			const destDir = path.dirname( destPath );
			builds.push(
				mkdir( destDir, { recursive: true } ).then( () =>
					copyFile( assetFile, destPath )
				)
			);
		}
	}

	if ( packageJson.module ) {
		builds.push(
			esbuild.build( {
				entryPoints: srcFiles,
				outdir: buildModuleDir,
				outbase: srcDir,
				bundle: true,
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

		for ( const jsonFile of assetFiles ) {
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

	await Promise.all( builds );

	await compileStyles( packageName );

	return Date.now() - startTime;
}

/**
 * Compile styles for a single package.
 *
 * Discovers and compiles SCSS entry points based on package configuration,
 * supporting wpStyleEntryPoints in package.json for custom entry point
 * patterns.
 *
 * @param {string} packageName Package name.
 * @return {Promise<number|null>} Build time in milliseconds, or null if no styles.
 */
async function compileStyles( packageName ) {
	const packageDir = path.join( PACKAGES_DIR, packageName );
	const packageJson = getPackageInfoFromFile(
		path.join( PACKAGES_DIR, packageName, 'package.json' )
	);

	// Get SCSS entry point patterns from package.json, default to root-level only
	const scssEntryPointPatterns = packageJson.wpStyleEntryPoints || [
		'src/*.scss',
	];

	// Find all matching SCSS files
	const scssEntries = await glob(
		scssEntryPointPatterns.map( ( pattern ) =>
			normalizePath( path.join( packageDir, pattern ) )
		)
	);

	if ( scssEntries.length === 0 ) {
		return null;
	}

	const startTime = Date.now();
	const buildStyleDir = path.join( packageDir, 'build-style' );
	const srcDir = path.join( packageDir, 'src' );

	// Process SCSS files
	await Promise.all(
		scssEntries.map( async ( styleEntryPath ) => {
			// Calculate relative path from src/ to preserve directory structure
			const relativePath = path.relative( srcDir, styleEntryPath );
			const relativeDir = path.dirname( relativePath );
			const entryName = path.basename( styleEntryPath, '.scss' );

			const outputDir =
				relativeDir === '.'
					? buildStyleDir
					: path.join( buildStyleDir, relativeDir );

			await mkdir( outputDir, { recursive: true } );

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

	if ( ! /\/src\/.+/.test( relativePath ) ) {
		return false;
	}

	if ( TEST_FILE_PATTERNS.some( ( regex ) => regex.test( relativePath ) ) ) {
		return false;
	}

	return PACKAGES.some( ( packageName ) => {
		const packagePath = normalizePath(
			path.join( 'packages', packageName )
		);
		return relativePath.startsWith( packagePath + '/' );
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
		if ( relativePath.startsWith( packagePath + '/' ) ) {
			return packageName;
		}
	}
	return null;
}

/**
 * Build a single route's files.
 *
 * @param {string} routeName Route name.
 * @return {Promise<number>} Build time in milliseconds.
 */
async function buildRoute( routeName ) {
	const startTime = Date.now();
	const routeDir = path.join( ROOT_DIR, 'routes', routeName );
	const outputDir = path.join( BUILD_DIR, 'routes', routeName );

	// Ensure output directory exists
	await mkdir( outputDir, { recursive: true } );

	// Copy package.json
	await copyFile(
		path.join( routeDir, 'package.json' ),
		path.join( outputDir, 'package.json' )
	);

	const files = getRouteFiles( routeDir );

	// Build route.js if it exists
	if ( files.hasRoute ) {
		const routeEntryPoints = await glob( `route.${ SOURCE_EXTENSIONS }`, {
			cwd: routeDir,
			absolute: true,
		} );

		if ( routeEntryPoints.length > 0 ) {
			// Build both minified and non-minified versions in parallel
			await Promise.all( [
				esbuild.build( {
					entryPoints: routeEntryPoints,
					outfile: path.join( outputDir, 'route.min.js' ),
					bundle: true,
					format: 'esm',
					target: browserslistToEsbuild(),
					minify: true,
					define: getDefine( false ),
					plugins: [
						wordpressExternalsPlugin(
							'route.min',
							'esm',
							[],
							true // Generate asset file for minified build
						),
					],
				} ),
				esbuild.build( {
					entryPoints: routeEntryPoints,
					outfile: path.join( outputDir, 'route.js' ),
					bundle: true,
					format: 'esm',
					target: browserslistToEsbuild(),
					minify: false,
					define: getDefine( true ),
					plugins: [
						wordpressExternalsPlugin(
							'route.min',
							'esm',
							[],
							false // Skip asset file for non-minified build
						),
					],
				} ),
			] );
		}
	}

	// Build content.js if stage, inspector, or canvas exists
	if ( files.hasStage || files.hasInspector || files.hasCanvas ) {
		// Create synthetic entry point
		const syntheticEntry = generateContentEntryPoint( files );
		const tempEntryPath = path.join( routeDir, '.content-entry.js' );

		// Write temporary entry file
		await writeFile( tempEntryPath, syntheticEntry );

		// Build both minified and non-minified versions in parallel
		await Promise.all( [
			esbuild.build( {
				entryPoints: [ tempEntryPath ],
				outfile: path.join( outputDir, 'content.min.js' ),
				bundle: true,
				format: 'esm',
				target: browserslistToEsbuild(),
				minify: true,
				define: getDefine( false ),
				plugins: [
					wordpressExternalsPlugin(
						'content.min',
						'esm',
						[],
						true // Generate asset file for minified build
					),
					...styleBundlingPlugins,
				],
			} ),
			esbuild.build( {
				entryPoints: [ tempEntryPath ],
				outfile: path.join( outputDir, 'content.js' ),
				bundle: true,
				format: 'esm',
				target: browserslistToEsbuild(),
				minify: false,
				define: getDefine( true ),
				plugins: [
					wordpressExternalsPlugin(
						'content.min',
						'esm',
						[],
						false // Skip asset file for non-minified build
					),
					...styleBundlingPlugins,
				],
			} ),
		] );

		await unlink( tempEntryPath );
	}

	return Date.now() - startTime;
}

/**
 * Build all discovered routes.
 *
 * @return {Promise<void>}
 */
async function buildAllRoutes() {
	console.log( '\n🚦 Phase 3: Building routes...\n' );

	const routes = getAllRoutes( ROOT_DIR );

	if ( routes.length === 0 ) {
		console.log( '   No routes found, skipping.\n' );
		return;
	}

	await Promise.all(
		routes.map( async ( routeName ) => {
			const buildTime = await buildRoute( routeName );
			console.log(
				`   ✔ Built route ${ routeName } (${ buildTime }ms)`
			);
		} )
	);
}

/**
 * Main build function.
 *
 * @param {string?} baseUrlExpression
 */
async function buildAll( baseUrlExpression ) {
	console.log( '🔨 Building packages...\n' );

	const startTime = Date.now();

	// Build maps: short name ↔ full name from package.json
	const shortToFull = new Map();
	const fullToShort = new Map();
	for ( const pkg of PACKAGES ) {
		const packageJson = getPackageInfoFromFile(
			path.join( PACKAGES_DIR, pkg, 'package.json' )
		);
		shortToFull.set( pkg, packageJson.name );
		fullToShort.set( packageJson.name, pkg );
	}

	const levels = groupByDepth( Array.from( shortToFull.values() ) );

	console.log( '📝 Phase 1: Transpiling packages...\n' );

	for ( const level of levels ) {
		await Promise.all(
			level.map( async ( fullName ) => {
				const packageName = fullToShort.get( fullName );
				const buildTime = await transpilePackage( packageName );
				console.log(
					`   ✔ Transpiled ${ packageName } (${ buildTime }ms)`
				);
			} )
		);
	}

	console.log( '\n📦 Phase 2: Bundling packages...\n' );
	const modules = [];
	const scripts = [];
	const styles = [];
	await Promise.all(
		PACKAGES.map( async ( packageName ) => {
			const startBundleTime = Date.now();
			const ret = await bundlePackage( packageName );
			const buildTime = Date.now() - startBundleTime;
			if ( ret ) {
				console.log(
					`   ✔ Bundled ${ packageName } (${ buildTime }ms)`
				);

				if ( ret.modules ) {
					modules.push( ...ret.modules );
				}
				if ( ret.scripts ) {
					scripts.push( ...ret.scripts );
				}
				if ( ret.styles ) {
					styles.push( ...ret.styles );
				}
			}
		} )
	);

	// Build routes
	await buildAllRoutes();

	// Collect route and page data for PHP generation
	// Use flatMap to expand routes with multiple pages into separate entries
	const routes = getAllRoutes( ROOT_DIR ).flatMap( ( routeName ) => {
		const metadata = getRouteMetadata( ROOT_DIR, routeName );

		// Skip routes without pages
		if ( ! metadata || ! metadata.pages || metadata.pages.length === 0 ) {
			return [];
		}
		const routeFiles = getRouteFiles(
			path.join( ROOT_DIR, 'routes', routeName )
		);

		// Create a route entry for each page
		return metadata.pages.map( ( page ) => {
			return {
				name: routeName,
				path: metadata.path,
				page,
				hasRoute: routeFiles.hasRoute,
				hasContent: routeFiles.hasStage || routeFiles.hasInspector,
			};
		} );
	} );

	// Normalize PAGES config to support both string and object formats
	const normalizedPages = PAGES.map( ( page ) => {
		if ( typeof page === 'string' ) {
			return { id: page, init: [], title: undefined };
		}
		return {
			id: page.id,
			init: page.init || [],
			title: page.title || undefined,
		};
	} );

	const pageData = normalizedPages.map( ( page ) => {
		const pageRoutes = routes.filter( ( r ) => r.page === page.id );
		return {
			slug: page.id,
			routes: pageRoutes,
			initModules: page.init,
			title: page.title,
		};
	} );

	// Bundle boot, route, and theme packages from node_modules when pages exist
	if ( pageData.length > 0 ) {
		try {
			const { createRequire } = await import( 'module' );
			const require = createRequire( import.meta.url );

			// Resolve the @wordpress packages directory from node_modules
			const bootPackageJson = require.resolve(
				'@wordpress/boot/package.json',
				{ paths: [ ROOT_DIR ] }
			);
			const wordpressPackagesDir = path.dirname(
				path.dirname( bootPackageJson )
			);

			// Bundle boot, route, theme, and private-apis packages
			const externalPackages = [
				'boot',
				'route',
				'theme',
				'private-apis',
			];
			for ( const pkgName of externalPackages ) {
				const result = await bundlePackage( pkgName, {
					sourceDir: wordpressPackagesDir,
					handlePrefix: 'wp',
					scriptGlobal: 'wp',
					packageNamespace: 'wordpress',
				} );

				if ( result && result.modules ) {
					modules.push( ...result.modules );
				}
				if ( result && result.scripts ) {
					scripts.push( ...result.scripts );
				}
			}
		} catch ( error ) {
			console.warn(
				'\n⚠️  Warning: Could not bundle WordPress packages for pages:',
				error.message
			);
		}
	}

	console.log( '\n📄 Generating PHP registration files...\n' );
	const phpReplacements = await getPhpReplacements(
		ROOT_DIR,
		baseUrlExpression
	);
	await Promise.all( [
		generateMainIndexPhp( phpReplacements ),
		generateModuleRegistrationPhp( modules, phpReplacements ),
		generateScriptRegistrationPhp( scripts, phpReplacements ),
		generateStyleRegistrationPhp( styles, phpReplacements ),
		generateVersionPhp( phpReplacements ),
		generateRoutesRegistry( routes, phpReplacements ),
		generateRoutesPhp( routes, phpReplacements ),
		generatePagesPhp( pageData, phpReplacements ),
	] );
	console.log( '   ✔ Generated build/modules.php' );
	console.log( '   ✔ Generated build/modules/index.php' );
	console.log( '   ✔ Generated build/scripts.php' );
	console.log( '   ✔ Generated build/scripts/index.php' );
	console.log( '   ✔ Generated build/styles.php' );
	console.log( '   ✔ Generated build/styles/index.php' );
	console.log( '   ✔ Generated build/version.php' );
	console.log( '   ✔ Generated build/routes.php' );
	if ( pageData.length > 0 ) {
		console.log( '   ✔ Generated build/pages.php' );
		for ( const page of pageData ) {
			console.log(
				`   ✔ Generated build/pages/${ page.slug }/page.php`
			);
			console.log(
				`   ✔ Generated build/pages/${ page.slug }/page-wp-admin.php`
			);
		}
	}
	console.log( '   ✔ Generated build/index.php' );

	const totalTime = Date.now() - startTime;
	console.log(
		`\n🎉 All packages built successfully! (${ totalTime }ms total)`
	);
}

/**
 * Watch mode for development.
 */
async function watchMode() {
	let isRebuilding = false;
	const needsRebuild = new Set();

	// Build maps: short name ↔ full name from package.json (once)
	const shortToFull = new Map();
	const fullToShort = new Map();
	for ( const pkg of PACKAGES ) {
		const packageJson = getPackageInfoFromFile(
			path.join( PACKAGES_DIR, pkg, 'package.json' )
		);
		shortToFull.set( pkg, packageJson.name );
		fullToShort.set( packageJson.name, pkg );
	}
	const allFullNames = Array.from( shortToFull.values() );

	// Get all routes for dependency tracking
	const allRoutes = getAllRoutes( ROOT_DIR );

	/**
	 * Rebuild a package and any affected scripts/modules.
	 *
	 * @param {string} packageName Package to rebuild (short name).
	 */
	async function rebuildPackage( packageName ) {
		try {
			const startTime = Date.now();

			await transpilePackage( packageName );
			await bundlePackage( packageName );

			const buildTime = Date.now() - startTime;
			console.log( `✅ ${ packageName } (${ buildTime }ms)` );

			const fullName = shortToFull.get( packageName );
			const affectedScripts = findScriptsToRebundle(
				fullName,
				allFullNames
			);

			for ( const fullScript of affectedScripts ) {
				const script = fullToShort.get( fullScript );
				try {
					const rebundleStartTime = Date.now();
					await compileStyles( script );
					await bundlePackage( script );
					const rebundleTime = Date.now() - rebundleStartTime;
					console.log(
						`✅ ${ script } (rebundled) (${ rebundleTime }ms)`
					);
				} catch ( error ) {
					console.log(
						`❌ ${ script } - Rebundle error: ${ error.message }`
					);
				}
			}

			// Find and rebuild affected routes
			const affectedRoutes = findRoutesToRebuild(
				fullName,
				allFullNames,
				ROOT_DIR,
				allRoutes
			);

			for ( const route of affectedRoutes ) {
				try {
					const rebuildStartTime = Date.now();
					await buildRoute( route );
					const rebuildTime = Date.now() - rebuildStartTime;
					console.log(
						`✅ routes/${ route } (rebuilt) (${ rebuildTime }ms)`
					);
				} catch ( error ) {
					console.log(
						`❌ routes/${ route } - Rebuild error: ${ error.message }`
					);
				}
			}
		} catch ( error ) {
			console.log( `❌ ${ packageName } - Error: ${ error.message }` );
		}
	}

	/**
	 * Rebuild a route.
	 *
	 * @param {string} routeName Route to rebuild.
	 */
	async function rebuildRoute( routeName ) {
		try {
			const startTime = Date.now();
			await buildRoute( routeName );
			const buildTime = Date.now() - startTime;
			console.log( `✅ routes/${ routeName } (${ buildTime }ms)` );
		} catch ( error ) {
			console.log(
				`❌ routes/${ routeName } - Error: ${ error.message }`
			);
		}
	}

	async function processNextRebuild() {
		if ( needsRebuild.size === 0 ) {
			isRebuilding = false;
			return;
		}

		const itemsToRebuild = Array.from( needsRebuild );
		needsRebuild.clear();

		for ( const item of itemsToRebuild ) {
			// Check if it's a route (prefixed with 'route:')
			if ( item.startsWith( 'route:' ) ) {
				const routeName = item.slice( 6 ); // Remove 'route:' prefix
				await rebuildRoute( routeName );
			} else {
				await rebuildPackage( item );
			}
		}

		await processNextRebuild();
	}

	const watchPaths = PACKAGES.map( ( packageName ) =>
		path.join( PACKAGES_DIR, packageName, 'src' )
	);

	const watcher = chokidar.watch( watchPaths, {
		ignored: [
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

	const handleFileChange = async ( filename ) => {
		if ( ! isPackageSourceFile( filename ) ) {
			return;
		}

		const packageName = getPackageName( filename );
		if ( ! packageName ) {
			return;
		}

		if ( isRebuilding ) {
			needsRebuild.add( packageName );
			return;
		}

		isRebuilding = true;
		await rebuildPackage( packageName );
		await processNextRebuild();
	};

	watcher.on( 'change', handleFileChange );
	watcher.on( 'add', handleFileChange );
	watcher.on( 'unlink', handleFileChange );

	// Watch route files if routes exist
	if ( allRoutes.length > 0 ) {
		const routeWatchPaths = allRoutes.map( ( routeName ) =>
			path.join( ROOT_DIR, 'routes', routeName )
		);

		const routeWatcher = chokidar.watch( routeWatchPaths, {
			persistent: true,
			ignoreInitial: true,
			ignored: ( filepath ) => {
				const basename = path.basename( filepath );
				// Ignore .content-entry.js temporary build files
				if ( basename === '.content-entry.js' ) {
					return true;
				}
				// Ignore node_modules directories and contents
				if ( filepath.includes( 'node_modules' ) ) {
					return true;
				}
				return false;
			},
			useFsEvents: true,
			depth: 10,
			awaitWriteFinish: {
				stabilityThreshold: 100,
				pollInterval: 50,
			},
		} );

		routeWatcher.on( 'error', ( error ) => {
			console.error( '❌ Route watcher error:', error );
		} );

		const handleRouteFileChange = async ( filename ) => {
			// Extract route name from path: routes/{routeName}/...
			const routeMatch = filename.match( /routes[/\\]([^/\\]+)[/\\]/ );
			if ( ! routeMatch ) {
				return;
			}

			const routeName = routeMatch[ 1 ];
			if ( ! allRoutes.includes( routeName ) ) {
				return;
			}

			if ( isRebuilding ) {
				needsRebuild.add( `route:${ routeName }` );
				return;
			}

			isRebuilding = true;
			await rebuildRoute( routeName );
			await processNextRebuild();
		};

		routeWatcher.on( 'change', handleRouteFileChange );
		routeWatcher.on( 'add', handleRouteFileChange );
		routeWatcher.on( 'unlink', handleRouteFileChange );
	}
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
			'base-url': {
				type: 'string',
				default: "plugins_url( 'build', dirname( __FILE__ ) )",
			},
		},
	} );

	const baseUrlExpression = values[ 'base-url' ];

	await buildAll( baseUrlExpression );

	if ( values.watch ) {
		console.log( '\n👀 Watching for changes...\n' );
		await watchMode();
	}
}

main().catch( ( error ) => {
	console.error( '❌ Build failed:', error );
	process.exit( 1 );
} );
