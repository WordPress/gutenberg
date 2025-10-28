#!/usr/bin/env node

/**
 * External dependencies
 */
import { readFile, writeFile, copyFile, mkdir } from 'fs/promises';
import { readdirSync } from 'fs';
import path from 'path';
import { parseArgs } from 'node:util';
import esbuild from 'esbuild';
import glob from 'fast-glob';
import chokidar from 'chokidar';
// See https://github.com/WordPress/gutenberg/issues/72136
// eslint-disable-next-line import/no-unresolved
import browserslistToEsbuild from 'browserslist-to-esbuild';
import { sassPlugin } from 'esbuild-sass-plugin';
import postcss from 'postcss';
import postcssModulesPlugin from 'postcss-modules';
import autoprefixer from 'autoprefixer';
import rtlcss from 'rtlcss';
import cssnano from 'cssnano';
import babel from 'esbuild-plugin-babel';

/**
 * Internal dependencies
 */
import { groupByDepth, findScriptsToRebundle } from './dependency-graph.mjs';
import {
	generatePhpFromTemplate,
	getPhpReplacements,
} from './lib/php-generator.mjs';
import {
	getPackageInfo,
	getPackageInfoFromFile,
	kebabToCamelCase,
} from './lib/package-utils.mjs';
import { createWordpressExternalsPlugin } from './lib/wordpress-externals-plugin.mjs';

const ROOT_DIR = process.cwd();
const PACKAGES_DIR = path.join( ROOT_DIR, 'packages' );
const BUILD_DIR = path.join( ROOT_DIR, 'build' );

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
 * Initialize WordPress externals plugin.
 */
const wordpressExternalsPlugin = createWordpressExternalsPlugin();

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

			// For utils, we need to load it but ensure it works with the pre-built bundle.
			// The utils file tries to require('./') which would load index.js.
			// We need to make sure it gets the pre-built bundle instead.
			build.onResolve(
				{ filter: /^moment-timezone\/moment-timezone-utils$/ },
				() => {
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
 * @return {Promise<boolean>} True if the package was bundled, false otherwise.
 */
async function bundlePackage( packageName ) {
	const builtModules = [];
	const builtScripts = [];
	const builtStyles = [];
	const packageDir = path.join( PACKAGES_DIR, packageName );
	const packageJson = getPackageInfoFromFile(
		path.join( PACKAGES_DIR, packageName, 'package.json' )
	);

	const builds = [];

	if ( packageJson.wpScript ) {
		const entryPoint = resolveEntryPoint( packageDir, packageJson );
		const outputDir = path.join( BUILD_DIR, 'scripts', packageName );
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
			wordpressExternalsPlugin(
				'index.min',
				'iife',
				packageJson.wpScriptExtraDependencies || []
			),
		];

		builds.push(
			esbuild.build( {
				...baseConfig,
				outfile: path.join( outputDir, 'index.min.js' ),
				minify: true,
				define: getDefine( false ),
				plugins: bundlePlugins,
			} ),
			esbuild.build( {
				...baseConfig,
				outfile: path.join( outputDir, 'index.js' ),
				minify: false,
				define: getDefine( true ),
				plugins: bundlePlugins,
			} )
		);

		builtScripts.push( {
			handle: `wp-${ packageName }`,
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
					define: getDefine( false ),
					plugins: modulePlugins,
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
					plugins: modulePlugins,
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
		const sourceDir = path.join( packageDir, 'src' );
		const outputDir = path.join( BUILD_DIR, 'scripts', packageName );

		for ( const filePattern of files ) {
			const matchedFiles = await glob(
				normalizePath( path.join( packageDir, filePattern ) )
			);

			for ( const sourceFile of matchedFiles ) {
				const relativePath = path.relative( sourceDir, sourceFile );
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
			handle: `wp-${ packageName }`,
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
 * @param {Array} modules Array of module info objects.
 */
async function generateModuleRegistrationPhp( modules ) {
	const replacements = await getPhpReplacements( ROOT_DIR );

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
 * @param {Array} scripts Array of script info objects.
 */
async function generateScriptRegistrationPhp( scripts ) {
	const replacements = await getPhpReplacements( ROOT_DIR );

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
 */
async function generateVersionPhp() {
	const replacements = await getPhpReplacements( ROOT_DIR );

	await generatePhpFromTemplate(
		'version.php.template',
		path.join( BUILD_DIR, 'version.php' ),
		replacements
	);
}

/**
 * Generate PHP files for style registration.
 *
 * @param {Array} styles Array of style info objects.
 */
async function generateStyleRegistrationPhp( styles ) {
	const replacements = await getPhpReplacements( ROOT_DIR );

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
 */
async function generateMainIndexPhp() {
	const replacements = await getPhpReplacements( ROOT_DIR );

	await generatePhpFromTemplate(
		'index.php.template',
		path.join( BUILD_DIR, 'index.php' ),
		replacements
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

	// Check if this is the components package that needs emotion babel plugin.
	// Ideally we should remove this exception and move away from emotion.
	const needsEmotionPlugin = packageName === 'components';
	const plugins = needsEmotionPlugin ? [ emotionBabelPlugin() ] : [];

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

	await Promise.all( builds );

	await compileStyles( packageName );

	return Date.now() - startTime;
}

/**
 * Compile styles for a single package.
 *
 * Discovers and compiles SCSS entry points based on package configuration
 * (supporting wpStyleEntryPoints in package.json for custom entry point patterns),
 * and all .module.css files in src/ directory.
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

	// Get CSS modules from anywhere in src/
	const cssModuleEntries = await glob(
		normalizePath( path.join( packageDir, 'src/**/*.module.css' ) ),
		{ ignore: IGNORE_PATTERNS }
	);

	if ( scssEntries.length === 0 && cssModuleEntries.length === 0 ) {
		return null;
	}

	const startTime = Date.now();
	const buildStyleDir = path.join( packageDir, 'build-style' );
	const srcDir = path.join( packageDir, 'src' );

	// Process .module.css files and generate JS modules
	const cssResults = await Promise.all(
		cssModuleEntries.map( async ( styleEntryPath ) => {
			const buildDir = path.join( packageDir, 'build' );
			const buildModuleDir = path.join( packageDir, 'build-module' );

			const cssContent = await readFile( styleEntryPath, 'utf8' );
			const relativePath = path.relative( srcDir, styleEntryPath );

			let mappings = {};
			const result = await postcss( [
				postcssModulesPlugin( {
					getJSON: ( _, json ) => ( mappings = json ),
				} ),
			] ).process( cssContent, { from: styleEntryPath } );

			// Write processed CSS to build-style (preserving directory structure)
			const cssOutPath = path.join(
				buildStyleDir,
				relativePath.replace( '.module.css', '.css' )
			);
			await mkdir( path.dirname( cssOutPath ), { recursive: true } );
			await writeFile( cssOutPath, result.css );

			// Generate JS modules with class name mappings (preserving directory structure)
			const jsExport = JSON.stringify( mappings );
			const jsPath = `${ relativePath }.js`;
			await Promise.all( [
				mkdir( path.dirname( path.join( buildDir, jsPath ) ), {
					recursive: true,
				} ),
				mkdir( path.dirname( path.join( buildModuleDir, jsPath ) ), {
					recursive: true,
				} ),
			] );
			await Promise.all( [
				writeFile(
					path.join( buildDir, jsPath ),
					`"use strict";\nmodule.exports = ${ jsExport };\n`
				),
				writeFile(
					path.join( buildModuleDir, jsPath ),
					`export default ${ jsExport };\n`
				),
			] );

			// Return the processed CSS for combining
			return result.css;
		} )
	);

	// Generate combined stylesheet from all CSS modules
	if ( cssResults.length > 0 ) {
		const combinedCss = cssResults.join( '\n' );
		await mkdir( buildStyleDir, { recursive: true } );
		await writeFile( path.join( buildStyleDir, 'style.css' ), combinedCss );
	}

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
 * Main build function.
 */
async function buildAll() {
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

	console.log( '\n📄 Generating PHP registration files...\n' );
	await Promise.all( [
		generateMainIndexPhp(),
		generateModuleRegistrationPhp( modules ),
		generateScriptRegistrationPhp( scripts ),
		generateStyleRegistrationPhp( styles ),
		generateVersionPhp(),
	] );
	console.log( '   ✔ Generated build/modules.php' );
	console.log( '   ✔ Generated build/modules/index.php' );
	console.log( '   ✔ Generated build/scripts.php' );
	console.log( '   ✔ Generated build/scripts/index.php' );
	console.log( '   ✔ Generated build/styles.php' );
	console.log( '   ✔ Generated build/styles/index.php' );
	console.log( '   ✔ Generated build/version.php' );
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
		} catch ( error ) {
			console.log( `❌ ${ packageName } - Error: ${ error.message }` );
		}
	}

	async function processNextRebuild() {
		if ( needsRebuild.size === 0 ) {
			isRebuilding = false;
			return;
		}

		const packagesToRebuild = Array.from( needsRebuild );
		needsRebuild.clear();

		for ( const packageName of packagesToRebuild ) {
			await rebuildPackage( packageName );
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
