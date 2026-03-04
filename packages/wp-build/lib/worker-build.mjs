/**
 * Worker build utilities for wp-build.
 *
 * Handles building worker bundles and writing inline worker code exports
 * for packages that define wpWorkers in their package.json.
 *
 * @package
 */

/**
 * External dependencies
 */
import { readFile, writeFile } from 'fs/promises';
import path from 'path';
import esbuild from 'esbuild';

/**
 * Creates an esbuild plugin that redirects module loads based on filename patterns.
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
 *                            filenames. When esbuild loads a file whose path
 *                            ends with a source key, the plugin rewrites it
 *                            to re-export from the corresponding target file
 *                            in the same directory.
 * @return {Object} An esbuild plugin.
 */
function createModuleRedirectPlugin( resolveMap ) {
	// Build a single regex that matches any of the source filenames.
	const escapedKeys = Object.keys( resolveMap ).map( ( key ) =>
		key.replace( /[.*+?^${}()|[\]\\]/g, '\\$&' )
	);
	const pattern = new RegExp( `(${ escapedKeys.join( '|' ) })$` );

	return {
		name: 'module-redirect',
		setup( build ) {
			build.onLoad( { filter: pattern }, ( args ) => {
				// Find which key matched.
				const matchedKey = Object.keys( resolveMap ).find( ( key ) =>
					args.path.endsWith( key )
				);
				const targetPath = args.path.replace(
					matchedKey,
					resolveMap[ matchedKey ]
				);
				return {
					contents: `export { default } from ${ JSON.stringify(
						targetPath
					) };`,
					loader: 'js',
				};
			} );
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
 * Creates an esbuild plugin that short-circuits resolution of `./worker-code`
 * imports, marking them as external without touching the filesystem.
 *
 * `src/worker-code.ts` is a committed stub used only for TypeScript type
 * checking. The real output (`build-module/worker-code.mjs` / `build/
 * worker-code.cjs`) is written directly by `writeWorkerCodeOutputs` after the
 * worker bundle is built. This plugin prevents esbuild from attempting a
 * filesystem stat on the stub during transpilation.
 *
 * @return {Object} An esbuild plugin.
 */
export function createWorkerCodeExternalPlugin() {
	return {
		name: 'worker-code-external',
		setup( build ) {
			const newExt =
				build.initialOptions.format === 'cjs' ? '.cjs' : '.mjs';
			build.onResolve( { filter: /\/worker-code$/ }, () => ( {
				path: `./worker-code${ newExt }`,
				external: true,
			} ) );
		},
	};
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
 * @param {Object}   options.wasmInlinePlugin The WASM inline plugin for esbuild.
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
				esbuild.build( {
					entryPoints: [ workerEntryPoint ],
					outfile: path.join(
						buildModuleDir,
						`${ workerOutputName }.mjs`
					),
					bundle: true,
					// Emit UTF-8 so binary-encoded inlined WASM stays compact
					// (ASCII output would escape high bytes as \uXXXX).
					charset: 'utf8',
					format: 'esm',
					platform: 'browser',
					target,
					sourcemap: true,
					// Bundle everything - workers need to be self-contained.
					external: [],
					plugins: [
						wasmInlinePlugin,
						...( resolveMap
							? [ createModuleRedirectPlugin( resolveMap ) ]
							: [] ),
					],
					define: {
						'process.env.NODE_ENV': JSON.stringify(
							process.env.NODE_ENV || 'production'
						),
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
				esbuild.build( {
					entryPoints: [ workerEntryPoint ],
					outfile: path.join( buildDir, `${ workerOutputName }.cjs` ),
					bundle: true,
					// Emit UTF-8 so binary-encoded inlined WASM stays compact
					// (ASCII output would escape high bytes as \uXXXX).
					charset: 'utf8',
					format: 'cjs',
					platform: 'node',
					target,
					sourcemap: true,
					external: [],
					plugins: [ wasmInlinePlugin ],
					define: {
						'process.env.NODE_ENV': JSON.stringify(
							process.env.NODE_ENV || 'production'
						),
					},
				} )
			);
		}
	}

	await Promise.all( workerBuilds );
}

/**
 * Write worker code output files directly to the build directories.
 *
 * Reads the built worker bundle from build-module/ and writes
 * `worker-code.mjs` (ESM) and `worker-code.cjs` (CJS) directly, without
 * going through a transpilation step. The content is a simple string export
 * that requires no transformation.
 *
 * This replaces the old approach of writing to `src/worker-code.ts` and
 * re-transpiling, which caused an infinite watcher loop because the build was
 * writing into the watched source directory.
 *
 * @param {string} packageName            Name of the package (for warnings).
 * @param {Object} packageJson            Parsed package.json contents.
 * @param {Object} options                Build options.
 * @param {string} options.buildDir       Path to the CJS build directory.
 * @param {string} options.buildModuleDir Path to the ESM build-module directory.
 */
export async function writeWorkerCodeOutputs(
	packageName,
	packageJson,
	{ buildDir, buildModuleDir }
) {
	if ( ! packageJson.wpWorkers ) {
		return;
	}

	const workerEntries =
		typeof packageJson.wpWorkers === 'object' &&
		packageJson.wpWorkers !== null
			? Object.entries( packageJson.wpWorkers )
			: [];

	for ( const [ outputName ] of workerEntries ) {
		const workerOutputName = outputName.replace( /^\.\//, '' );
		const workerBundlePath = path.join(
			buildModuleDir,
			`${ workerOutputName }.mjs`
		);

		try {
			const workerContent = await readFile( workerBundlePath, 'utf8' );

			if ( packageJson.module ) {
				await writeFile(
					path.join( buildModuleDir, 'worker-code.mjs' ),
					`export const workerCode = ${ JSON.stringify( workerContent ) };\n`
				);
			}

			if ( packageJson.main ) {
				await writeFile(
					path.join( buildDir, 'worker-code.cjs' ),
					`"use strict";\nObject.defineProperty(exports, "__esModule", { value: true });\nexports.workerCode = ${ JSON.stringify( workerContent ) };\n`
				);
			}
		} catch ( error ) {
			console.warn(
				`Warning: Could not write worker-code outputs for ${ packageName }:`,
				error.message
			);
		}
	}
}
