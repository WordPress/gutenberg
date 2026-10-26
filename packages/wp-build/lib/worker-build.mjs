/**
 * Worker build utilities for wp-build.
 *
 * Handles building worker bundles and generating inline worker code
 * for packages that define wpWorkers in their package.json.
 *
 * @package
 */
import { readFile, writeFile, access } from 'fs/promises';
import path from 'path';
import { buildWithConcurrency } from './build-concurrency.mjs';

/**
 * Creates a Rolldown plugin that redirects module loads based on filename patterns.
 *
 * This is useful when bundling workers for Blob URL contexts where certain
 * ES module entry points use `import.meta.url` (which resolves to an invalid
 * `blob:` URL at runtime). By redirecting to an alternative entry point
 * (e.g., a CommonJS version), the issue is avoided.
 *
 * Packages declare redirects in their `wpWorkers` config:
 *
 *   "wpWorkers": {
 *     "./worker": {
 *       "entry": "./src/worker.ts",
 *       "resolve": {
 *         "vips-es6.js": "vips.js"
 *       }
 *     }
 *   }
 *
 * @param {Object} resolveMap An object mapping source filenames to target
 *                            filenames. When Rolldown loads a file whose path
 *                            ends with a source key, the plugin rewrites it
 *                            to re-export from the corresponding target file
 *                            in the same directory.
 * @return {import('rolldown').Plugin} A Rolldown plugin.
 */
function createModuleRedirectPlugin( resolveMap ) {
	// Build a single regex that matches any of the source filenames.
	const escapedKeys = Object.keys( resolveMap ).map( ( key ) =>
		key.replace( /[.*+?^${}()|[\]\\]/g, '\\$&' )
	);
	const pattern = new RegExp( `(${ escapedKeys.join( '|' ) })$` );

	return {
		name: 'module-redirect',
		load: {
			filter: { id: pattern },
			handler( id ) {
				// Find which key matched.
				const matchedKey = Object.keys( resolveMap ).find( ( key ) =>
					id.endsWith( key )
				);
				const targetPath = id.replace(
					matchedKey,
					resolveMap[ matchedKey ]
				);
				// A relative specifier keeps the checkout path out of the source map.
				const specifier =
					'./' +
					path
						.relative( path.dirname( id ), targetPath )
						.split( path.sep )
						.join( '/' );
				return {
					code: `export { default } from ${ JSON.stringify(
						specifier
					) };`,
					moduleType: 'js',
				};
			},
		},
	};
}

/**
 * Extracts the entry path from a wpWorkers config value.
 *
 * Supports both the string shorthand and the object format:
 *   - String: "./src/worker.ts"
 *   - Object: { "entry": "./src/worker.ts", "resolve": { ... } }
 *
 * @param {string|Object} workerConfig The worker configuration value.
 * @return {string} The entry file path.
 */
function getWorkerEntryPath( workerConfig ) {
	if ( typeof workerConfig === 'string' ) {
		return workerConfig;
	}
	return workerConfig.entry;
}

/**
 * Extracts the resolve map from a wpWorkers config value, if present.
 *
 * @param {string|Object} workerConfig The worker configuration value.
 * @return {Object|undefined} The resolve map, or undefined if not configured.
 */
function getWorkerResolveMap( workerConfig ) {
	if ( typeof workerConfig === 'string' ) {
		return undefined;
	}
	return workerConfig.resolve;
}

/**
 * Generate placeholder worker-code.ts for packages with wpWorkers.
 *
 * This must run before transpilation since worker files import worker-code.ts.
 * The placeholder is later replaced with actual bundled worker content.
 *
 * @param {string} packageDir  Path to the package directory.
 * @param {Object} packageJson Parsed package.json contents.
 */
export async function generateWorkerPlaceholder( packageDir, packageJson ) {
	if ( ! packageJson.wpWorkers ) {
		return;
	}

	const workerCodeFile = path.join( packageDir, 'src', 'worker-code.ts' );
	try {
		await access( workerCodeFile );
	} catch {
		// File doesn't exist, create placeholder
		const placeholderContent = `/**
 * Worker code for inline Blob URL creation.
 *
 * This file is a placeholder that gets overwritten by the build process.
 * If you see this placeholder content at runtime, run \`npm run build\` first.
 *
 * @package gutenberg
 */

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const workerCode = '/* Placeholder - run npm run build to generate actual worker code */';
`;
		await writeFile( workerCodeFile, placeholderContent );
	}
}

/**
 * Build worker bundles (ESM and CJS) for packages with wpWorkers.
 *
 * Workers are bundled as self-contained files with all dependencies included.
 *
 * @param {string}   packageDir               Path to the package directory.
 * @param {Object}   packageJson              Parsed package.json contents.
 * @param {Object}   options                  Build options.
 * @param {string}   options.buildDir         Path to the CJS build directory.
 * @param {string}   options.buildModuleDir   Path to the ESM build-module directory.
 * @param {string[]} options.target           esbuild target configuration.
 * @param {Object}   options.wasmInlinePlugin The WASM inline plugin for Rolldown.
 */
export async function buildWorkers(
	packageDir,
	packageJson,
	{ buildDir, buildModuleDir, target, wasmInlinePlugin }
) {
	if ( ! packageJson.wpWorkers ) {
		return;
	}

	const workerBuilds = [];
	const workerEntries =
		typeof packageJson.wpWorkers === 'object' &&
		packageJson.wpWorkers !== null
			? Object.entries( packageJson.wpWorkers )
			: [];

	for ( const [ outputName, workerConfig ] of workerEntries ) {
		const entryPath = getWorkerEntryPath( workerConfig );
		const resolveMap = getWorkerResolveMap( workerConfig );
		const workerEntryPoint = path.join( packageDir, entryPath );
		const workerOutputName = outputName.replace( /^\.\//, '' );

		// Build ESM worker for build-module (primary for browser use).
		if ( packageJson.module ) {
			workerBuilds.push(
				buildWithConcurrency( {
					input: workerEntryPoint,
					// wasm-vips uses eval, don't warn about it
					checks: { eval: false },
					platform: 'browser',
					// Rolldown's default conditions lack esbuild's module condition.
					resolve: {
						conditionNames: [ 'module', 'browser', 'default' ],
					},
					// Bundle everything - workers need to be self-contained.
					plugins: [
						wasmInlinePlugin,
						...( resolveMap
							? [ createModuleRedirectPlugin( resolveMap ) ]
							: [] ),
					],
					transform: {
						target,
						define: {
							'process.env.NODE_ENV': JSON.stringify(
								process.env.NODE_ENV || 'production'
							),
						},
					},
					output: {
						file: path.join(
							buildModuleDir,
							`${ workerOutputName }.mjs`
						),
						format: 'esm',
						minify: false,
						sourcemap: true,
						codeSplitting: false,
					},
				} )
			);
		}

		// Build CJS worker for the `build` directory (Node.js compatibility).
		//
		// Note: We only generate CJS worker bundles when the package exposes a
		// CommonJS entry point via `packageJson.main`. Packages that are ESM-only
		// or browser-focused (for example, packages that have removed their
		// `main` field like `@wordpress/vips`) will not produce CJS worker
		// outputs, and will instead rely solely on the ESM worker built into
		// `build-module`. This conditional is intentional to avoid creating
		// unused or misleading CJS artifacts.
		if ( packageJson.main ) {
			workerBuilds.push(
				buildWithConcurrency( {
					input: workerEntryPoint,
					// wasm-vips uses eval, don't warn about it
					checks: { eval: false },
					platform: 'node',
					resolve: {
						conditionNames: [ 'module', 'node', 'default' ],
					},
					plugins: [ wasmInlinePlugin ],
					transform: {
						target,
						define: {
							'process.env.NODE_ENV': JSON.stringify(
								process.env.NODE_ENV || 'production'
							),
						},
					},
					output: {
						file: path.join(
							buildDir,
							`${ workerOutputName }.cjs`
						),
						format: 'cjs',
						minify: false,
						sourcemap: true,
						codeSplitting: false,
					},
				} )
			);
		}
	}

	await Promise.all( workerBuilds );
}

/**
 * Generate inline worker code exports and re-transpile worker-code.ts.
 *
 * Creates worker-code.ts with bundled content for Blob URL loading,
 * then re-transpiles it to the output directories.
 *
 * @param {string}   packageDir             Path to the package directory.
 * @param {string}   packageName            Name of the package.
 * @param {Object}   packageJson            Parsed package.json contents.
 * @param {Object}   options                Build options.
 * @param {string}   options.srcDir         Path to the source directory.
 * @param {string}   options.buildDir       Path to the CJS build directory.
 * @param {string}   options.buildModuleDir Path to the ESM build-module directory.
 * @param {string[]} options.target         esbuild target configuration.
 * @param {Array}    options.plugins        Rolldown plugins for transpilation.
 */
export async function generateWorkerCode(
	packageDir,
	packageName,
	packageJson,
	{ srcDir, buildDir, buildModuleDir, target, plugins }
) {
	if ( ! packageJson.wpWorkers ) {
		return;
	}

	const workerEntries =
		typeof packageJson.wpWorkers === 'object' &&
		packageJson.wpWorkers !== null
			? Object.entries( packageJson.wpWorkers )
			: [];

	// Generate inline worker code exports for each worker.
	// This allows the worker code to be bundled inline and loaded via Blob URL,
	// which works even when import.meta.url is not available (e.g., webpack bundles).
	for ( const [ outputName ] of workerEntries ) {
		const workerOutputName = outputName.replace( /^\.\//, '' );
		const workerOutputPath = path.join(
			buildModuleDir,
			`${ workerOutputName }.mjs`
		);

		try {
			const workerContent = await readFile( workerOutputPath, 'utf8' );
			const workerCodeFile = path.join(
				packageDir,
				'src',
				'worker-code.ts'
			);
			const workerCodeContent = `/**
 * Worker code for inline Blob URL creation.
 *
 * This file is auto-generated by the build process.
 * Do not edit manually - run \`npm run build\` to regenerate.
 *
 * @package gutenberg
 */

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const workerCode = ${ JSON.stringify( workerContent ) };
`;
			await writeFile( workerCodeFile, workerCodeContent );
		} catch ( error ) {
			console.warn(
				`Warning: Could not generate worker-code.ts for ${ packageName }:`,
				error.message
			);
		}
	}

	// Re-transpile worker-code.ts to output directories.
	// The initial transpilation used placeholder content because worker
	// bundling hadn't completed yet. Now that src/worker-code.ts contains
	// the real bundled worker code, re-transpile it so that
	// build-module/worker-code.mjs (and build/worker-code.cjs if applicable)
	// reflect the actual worker code in a single build run.
	const workerCodeSrcFile = path.join( packageDir, 'src', 'worker-code.ts' );
	// Name the entry after its path in `src`, so the output mirrors it.
	const workerCodeEntryName = path
		.relative( srcDir, workerCodeSrcFile )
		.replace( /\.ts$/, '' );
	const retranspileBuilds = [];

	if ( packageJson.module ) {
		retranspileBuilds.push(
			buildWithConcurrency( {
				input: { [ workerCodeEntryName ]: workerCodeSrcFile },
				platform: 'neutral',
				transform: { target },
				plugins,
				output: {
					dir: buildModuleDir,
					entryFileNames: '[name].mjs',
					format: 'esm',
					sourcemap: true,
				},
			} )
		);
	}

	if ( packageJson.main ) {
		retranspileBuilds.push(
			buildWithConcurrency( {
				input: { [ workerCodeEntryName ]: workerCodeSrcFile },
				platform: 'node',
				transform: { target },
				plugins,
				output: {
					dir: buildDir,
					entryFileNames: '[name].cjs',
					format: 'cjs',
					exports: 'named',
					sourcemap: true,
				},
			} )
		);
	}

	await Promise.all( retranspileBuilds );
}
