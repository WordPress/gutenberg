import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { compileAsync, NodePackageImporter } from 'sass-embedded';
import { compileCss } from './compile-inline-style.mjs';

export { compileCss };

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

/**
 * Compile a stylesheet file exactly as wp-build compiles it when a package
 * imports it, and return the CSS and class names as data.
 *
 * Lets a package emit its styles in another form, such as a static stylesheet
 * for server-rendered markup, with class names identical to the ones the
 * JavaScript build injects at runtime.
 *
 * @param {string}  filePath              Absolute path to a `.css` or `.scss` file.
 * @param {Object}  options
 * @param {string}  options.workingDir    Directory of the package that owns the file.
 * @param {string}  [options.rootDir]     The repository root. Defaults to the current directory.
 * @param {boolean} [options.cssModules]  Whether to scope class names as CSS Modules. Defaults to true for `.module.*` files.
 * @param {boolean} [options.minify=true] Whether to minify the CSS.
 * @return {Promise<{css: string, classNames: Record<string, string>|null}>} Compiled CSS and class name map.
 */
export async function compileStyleFile(
	filePath,
	{
		workingDir,
		rootDir,
		cssModules = /\.module\.(css|scss)$/.test( filePath ),
		minify = true,
	}
) {
	let cssText;
	if ( filePath.endsWith( '.scss' ) ) {
		( { css: cssText } = await compileAsync( filePath, {
			...getSassOptions( workingDir, rootDir ),
			style: 'expanded',
		} ) );
	} else {
		cssText = await readFile( filePath, 'utf8' );
	}

	return compileCss( cssText, filePath, { cssModules, minify } );
}
