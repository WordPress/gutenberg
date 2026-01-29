/**
 * Worker build utilities for wp-build.
 *
 * Handles building worker bundles and generating inline worker code
 * for packages that define wpWorkers in their package.json.
 *
 * @package
 */

/**
 * External dependencies
 */
import { readFile, writeFile, access } from 'fs/promises';
import path from 'path';
import esbuild from 'esbuild';

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

	for ( const [ outputName, entryPath ] of workerEntries ) {
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
					format: 'esm',
					platform: 'browser',
					target,
					sourcemap: true,
					// Bundle everything - workers need to be self-contained.
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
 * @param {Array}    options.plugins        esbuild plugins for transpilation.
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
	const retranspileBuilds = [];

	if ( packageJson.module ) {
		retranspileBuilds.push(
			esbuild.build( {
				entryPoints: [ workerCodeSrcFile ],
				outdir: buildModuleDir,
				outbase: srcDir,
				outExtension: { '.js': '.mjs' },
				bundle: true,
				platform: 'neutral',
				format: 'esm',
				sourcemap: true,
				target,
				jsx: 'automatic',
				jsxImportSource: 'react',
				loader: { '.js': 'jsx' },
				plugins,
			} )
		);
	}

	if ( packageJson.main ) {
		retranspileBuilds.push(
			esbuild.build( {
				entryPoints: [ workerCodeSrcFile ],
				outdir: buildDir,
				outbase: srcDir,
				outExtension: { '.js': '.cjs' },
				bundle: true,
				platform: 'node',
				format: 'cjs',
				sourcemap: true,
				target,
				jsx: 'automatic',
				jsxImportSource: 'react',
				loader: { '.js': 'jsx' },
				plugins,
			} )
		);
	}

	await Promise.all( retranspileBuilds );
}
