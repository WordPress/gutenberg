import { readFile } from 'fs/promises';
import path from 'path';
import { initAsyncCompiler, NodePackageImporter } from 'sass-embedded';

/** @type {Promise<import('sass-embedded').AsyncCompiler> | undefined} */
let compilerPromise;

/**
 * Stop the shared Sass compiler, if it was started. Its process keeps Node
 * running until it is stopped.
 *
 * @return {Promise<void>}
 */
export async function disposeSassCompiler() {
	if ( ! compilerPromise ) {
		return;
	}
	const compiler = await compilerPromise;
	compilerPromise = undefined;
	await compiler.dispose();
}

/**
 * Compile a stylesheet to CSS. Plain CSS files are returned as they are.
 *
 * @param {string}                                   filePath    Absolute path of the stylesheet.
 * @param {import('sass-embedded').Options<'async'>} sassOptions Sass options.
 * @return {Promise<string>} The CSS.
 */
export async function compileStylesheet( filePath, sassOptions ) {
	if ( filePath.endsWith( '.css' ) ) {
		return readFile( filePath, 'utf8' );
	}

	compilerPromise ??= initAsyncCompiler();
	const compiler = await compilerPromise;
	const { css } = await compiler.compileAsync( filePath, {
		...sassOptions,
		sourceMap: false,
	} );
	return css;
}

/**
 * Get SASS options for the given working directory.
 *
 * Uses NodePackageImporter from sass-embedded for resolving package imports
 * (like `@wordpress/base-styles`) which works with any package manager (npm, pnpm, yarn).
 *
 * @param {string} workingDir              - The directory where we're working (for NodePackageImporter).
 * @param {string} [rootDir=process.cwd()] - The repository root.
 * @return {Object} SASS options object with importers and loadPaths.
 */
export function getSassOptions( workingDir, rootDir = process.cwd() ) {
	return {
		importers: [ new NodePackageImporter( workingDir ) ],
		// loadPaths for resolving @wordpress/base-styles imports and local base-styles imports
		loadPaths: [
			// Package's own node_modules (for pnpm isolated deps)
			path.join( workingDir, 'node_modules' ),
			// Root node_modules (for npm hoisted deps)
			path.join( rootDir, 'node_modules' ),
			// For local imports like @use "mixins"
			path.join( rootDir, 'packages', 'base-styles' ),
		],
	};
}
