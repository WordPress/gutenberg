import { readFile } from 'fs/promises';
import path from 'path';
import { getPackageInfo } from './package-utils.mjs';

/**
 * Infer style dependencies from script dependencies.
 * Only includes dependencies that:
 * 1. Are `@wordpress` packages (start with 'wp-')
 * 2. Have wpScript: true in their package.json
 * 3. Actually have a built style.min.css file
 *
 * @param {string[]} scriptDependencies Array of script handles from asset file.
 * @param {Object}   options            Options object.
 * @param {string}   options.resolveDir Directory to resolve dependency packages from.
 * @param {string}   options.buildDir   Build output directory.
 * @return {Promise<string[]>} Array of style handles to depend on.
 */
export async function inferStyleDependencies(
	scriptDependencies,
	{ resolveDir, buildDir }
) {
	if ( ! scriptDependencies || scriptDependencies.length === 0 ) {
		return [];
	}

	const styleDeps = [];

	for ( const scriptHandle of scriptDependencies ) {
		// Skip non-package dependencies (like 'react', 'lodash', etc.)
		if ( ! scriptHandle.startsWith( 'wp-' ) ) {
			continue;
		}

		// Convert handle to package name: 'wp-components' → '@wordpress/components'
		const shortName = scriptHandle.replace( 'wp-', '' );
		const depPackageName = `@wordpress/${ shortName }`;

		// Read the dependency's package.json with context-aware resolution
		try {
			const depPackageJson = getPackageInfo( depPackageName, resolveDir );

			if ( ! depPackageJson ) {
				continue;
			}

			// ONLY include if it has wpScript: true (which means it builds styles)
			if ( depPackageJson.wpScript === true ) {
				// Check the minified file, which is built even with --no-script-debug.
				const styleFile = path.join(
					buildDir,
					'styles',
					shortName,
					'style.min.css'
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
