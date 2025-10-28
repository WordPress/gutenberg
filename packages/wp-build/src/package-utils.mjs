/**
 * External dependencies
 */
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';

/**
 * Shared cache for package.json files to avoid redundant reads.
 * Cache is keyed by the full package name from package.json's name field.
 */
const packageJsonCache = new Map();

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

/**
 * Get package.json info using Node's module resolution.
 * Resolves the package using import.meta.resolve and reads its package.json.
 *
 * @param {string} fullPackageName The full package name (e.g., '@wordpress/blocks').
 * @return {PackageJson|null} Package.json object or null if not found.
 */
export function getPackageInfo( fullPackageName ) {
	if ( packageJsonCache.has( fullPackageName ) ) {
		return packageJsonCache.get( fullPackageName );
	}

	try {
		const resolved = import.meta.resolve(
			`${ fullPackageName }/package.json`
		);
		const packageJson = JSON.parse(
			readFileSync( fileURLToPath( resolved ), 'utf8' )
		);
		packageJsonCache.set( packageJson.name, packageJson );
		return packageJson;
	} catch ( error ) {
		packageJsonCache.set( fullPackageName, null );
		return null;
	}
}

/**
 * Get package.json info from an explicit file path.
 * Reads the package.json file and caches it by its name field.
 *
 * @param {string} packageJsonPath Absolute path to package.json file.
 * @return {PackageJson|null} Package.json object or null if not found.
 */
export function getPackageInfoFromFile( packageJsonPath ) {
	try {
		const packageJson = JSON.parse(
			readFileSync( packageJsonPath, 'utf8' )
		);
		// Cache by the actual name from package.json
		packageJsonCache.set( packageJson.name, packageJson );
		return packageJson;
	} catch ( error ) {
		return null;
	}
}

/**
 * Convert kebab-case string to camelCase.
 *
 * @param {string} str String in kebab-case format.
 * @return {string} String in camelCase format.
 */
export function kebabToCamelCase( str ) {
	return str.replace( /-([a-z])/g, ( _, letter ) => letter.toUpperCase() );
}
