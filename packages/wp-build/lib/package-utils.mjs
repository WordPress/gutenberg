/**
 * External dependencies
 */
import { readFileSync, existsSync } from 'fs';
import { createRequire } from 'module';
import path from 'path';

/**
 * Shared cache for package.json files to avoid redundant reads.
 * Cache is keyed by the full package name from package.json's name field.
 */
const packageJsonCache = new Map();
const packagePathCache = new Map();

/**
 * @typedef  {Object} PackageJson
 *
 * @property {string}                 name                    Package name.
 * @property {string}                 version                 Package version.
 * @property {string}                 [description]           Package description.
 * @property {string}                 [author]                Package author.
 * @property {string}                 [license]               Package license.
 * @property {string}                 [main]                  Main entry point.
 * @property {string}                 [module]                ES module entry point.
 * @property {string}                 [react-native]          React Native entry point.
 * @property {Record<string, string>} [dependencies]          Runtime dependencies.
 * @property {Record<string, string>} [devDependencies]       Development dependencies.
 * @property {Record<string, string>} [peerDependencies]      Peer dependencies.
 * @property {string[]}               [wpScript]              WordPress script handles for dependency extraction.
 * @property {Record<string, string>} [wpScriptModuleExports] WordPress script module exports.
 * @property {Object}                 [sideEffects]           Side effects configuration for tree shaking.
 * @property {string}                 [publishConfig]         NPM publish configuration.
 * @property {Record<string, string>} [scripts]               NPM scripts.
 * @property {string[]}               [files]                 Files to include in package.
 * @property {string}                 [repository]            Repository URL.
 * @property {string[]}               [keywords]              Package keywords.
 */

// Create a new type that extends PackageJson with an optional "route" property
/**
 * @typedef {PackageJson & { route: { path: string; page?: string } }} RoutePackageJson
 */

/**
 * Find the nearest package root directory by walking up from the given directory.
 * Looks for a directory containing package.json.
 *
 * @param {string} startDir The directory to start searching from.
 * @return {string} The package root directory, or the start directory if no package.json found.
 */
function findPackageRoot( startDir ) {
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
 * @param {string}      fullPackageName The full package name (e.g., '@wordpress/blocks').
 * @param {string|null} resolveDir      Optional directory context for resolution (from esbuild).
 * @return {PackageJson|null} Package.json object or null if not found.
 */
export function getPackageInfo( fullPackageName, resolveDir = null ) {
	// Determine the package root for cache keying
	const packageRoot = resolveDir
		? findPackageRoot( resolveDir )
		: process.cwd();
	const cacheKey = `${ fullPackageName }@${ packageRoot }`;

	if ( packageJsonCache.has( cacheKey ) ) {
		return packageJsonCache.get( cacheKey );
	}

	// Resolve from the package root context to get correct versions
	const contextPath = path.join( packageRoot, 'package.json' );
	const require = createRequire( contextPath );
	const resolved = require.resolve( `${ fullPackageName }/package.json` );
	const result = getPackageInfoFromFile( resolved );
	packageJsonCache.set( cacheKey, result );

	return result;
}

/**
 * Get package.json info from an explicit file path.
 * Reads the package.json file and caches it by its name field.
 *
 * @param {string} packageJsonPath Absolute path to package.json file.
 * @return {PackageJson|null} Package.json object or null if not found.
 */
export function getPackageInfoFromFile( packageJsonPath ) {
	if ( packagePathCache.has( packageJsonPath ) ) {
		return packagePathCache.get( packageJsonPath );
	}
	const packageJson = JSON.parse( readFileSync( packageJsonPath, 'utf8' ) );
	packagePathCache.set( packageJsonPath, packageJson );
	return packageJson;
}
