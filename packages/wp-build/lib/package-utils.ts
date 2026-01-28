/**
 * External dependencies
 */
import { readFileSync, existsSync } from 'fs';
import { createRequire } from 'module';
import path from 'path';

import type { PackageJson } from './types.ts';

/**
 * Shared cache for package.json files to avoid redundant reads.
 * Cache is keyed by the full package name from package.json's name field.
 */
const packageJsonCache = new Map< string, PackageJson >();
const packagePathCache = new Map< string, PackageJson >();

/**
 * Find the nearest package root directory by walking up from the given directory.
 * Looks for a directory containing package.json.
 *
 * @param startDir The directory to start searching from.
 * @return The package root directory, or the start directory if no package.json found.
 */
function findPackageRoot( startDir: string ): string {
	let current = startDir;
	const root = path.parse( current ).root;

	while ( current !== root ) {
		const packageJsonPath = path.join( current, 'package.json' );
		if ( existsSync( packageJsonPath ) ) {
			return current;
		}
		current = path.dirname( current );
	}

	// Fallback to the start directory if no package.json found
	return startDir;
}

/**
 * Get package.json info using Node's module resolution.
 * Resolves packages from the appropriate context to support both workspace packages
 * and external dependencies in pnpm/yarn/npm workspaces.
 *
 * @param fullPackageName The full package name (e.g., '@wordpress/blocks').
 * @param resolveDir      Optional directory context for resolution (from esbuild).
 * @return Package.json object or null if not found.
 */
export function getPackageInfo(
	fullPackageName: string,
	resolveDir: string | null = null
): PackageJson | null {
	// Determine the package root for cache keying
	const packageRoot = resolveDir
		? findPackageRoot( resolveDir )
		: process.cwd();
	const cacheKey = `${ fullPackageName }@${ packageRoot }`;

	if ( packageJsonCache.has( cacheKey ) ) {
		return packageJsonCache.get( cacheKey ) ?? null;
	}

	// Resolve from the package root context to get correct versions
	const contextPath = path.join( packageRoot, 'package.json' );
	const require = createRequire( contextPath );
	const resolved = require.resolve( `${ fullPackageName }/package.json` );
	const result = getPackageInfoFromFile( resolved );

	if ( result ) {
		packageJsonCache.set( cacheKey, result );
	}

	return result;
}

/**
 * Get package.json info from an explicit file path.
 * Reads the package.json file and caches it by its name field.
 *
 * @param packageJsonPath Absolute path to package.json file.
 * @return Package.json object or null if not found.
 */
export function getPackageInfoFromFile(
	packageJsonPath: string
): PackageJson | null {
	if ( packagePathCache.has( packageJsonPath ) ) {
		return packagePathCache.get( packageJsonPath ) ?? null;
	}
	const packageJson = JSON.parse(
		readFileSync( packageJsonPath, 'utf8' )
	) as PackageJson;
	packagePathCache.set( packageJsonPath, packageJson );
	return packageJson;
}
