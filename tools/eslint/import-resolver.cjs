/**
 * External dependencies
 */
const path = require( 'node:path' );
const { existsSync, readFileSync } = require( 'node:fs' );
const resolverNode = require( 'eslint-import-resolver-typescript' );
const PACKAGES_DIR = path.resolve( __dirname, '../../packages' );

exports.interfaceVersion = 2;

/**
 * @typedef ExportEntryObject
 *
 * @property {string} import  ESM import entrypoint.
 * @property {string} default Default export entrypoint.
 */

/**
 * @typedef {string|ExportEntryObject} ExportEntry
 */

/**
 * Given an export entry and a subpath, returns the resolved export path for
 * the matching entry. Defaults to the ESM entrypoint if available, falling back
 * to the default export or the root entry if it is a string.
 *
 * @param {ExportEntry} exportEntry Export entry from package manifest.
 *
 * @return {string|undefined} The resolved export path, or undefined if no
 *                            matching entry is found.
 */
function getResolvedExportPath( exportEntry ) {
	return typeof exportEntry === 'string'
		? exportEntry
		: exportEntry?.import ?? exportEntry?.default;
}

/**
 * Given a package entrypoint identifier, returns the resolved export path for
 * the matching entry. Supports matching wildcard entries, and defaults to the
 * ESM entrypoint if available.
 *
 * @param {string}                      subpath   Package entrypoint identifier.
 * @param {Record<string, ExportEntry>} exportMap Export map from package manifest.
 *
 * @return {string|void|undefined} The resolved export path, or undefined if no
 *                                 matching entry is found.
 */
function getResolvedExport( subpath, exportMap ) {
	if ( Object.hasOwn( exportMap, subpath ) ) {
		return getResolvedExportPath( exportMap[ subpath ] );
	}

	for ( const key in exportMap ) {
		if ( ! Object.hasOwn( exportMap, key ) ) {
			continue;
		}

		const wildcardIndex = key.indexOf( '*' );
		if ( wildcardIndex === -1 ) {
			continue;
		}

		if ( subpath.startsWith( key.substring( 0, wildcardIndex ) ) ) {
			const wildcardPath = subpath.substring( wildcardIndex );
			const resolvedPath = getResolvedExportPath( exportMap[ key ] );
			return resolvedPath?.replace( '*', wildcardPath );
		}
	}
}

exports.resolve = function ( source, file, config ) {
	const resolve = ( sourcePath ) =>
		resolverNode.resolve( sourcePath, file, {
			...config,
			extensions: [
				'.tsx',
				'.ts',
				'.mjs',
				'.js',
				'.jsx',
				'.cjs',
				'.json',
				'.node',
			],
		} );

	if ( source.startsWith( '@wordpress/' ) ) {
		const [ , packageName, ...pathParts ] = source.split( '/' );

		// Consider whether the package is local to the project. If it's not,
		// use the default resolution behavior.
		const packagePath = path.join( PACKAGES_DIR, packageName );
		if ( ! existsSync( packagePath ) ) {
			return resolve( source );
		}

		// For all local packages, ensure that we can resolve the requested
		// source file using its declared exports.
		try {
			const manifestPath = path.join( packagePath, 'package.json' );
			const manifest = JSON.parse( readFileSync( manifestPath, 'utf8' ) );
			let subpath = '.';
			if ( pathParts.length > 0 ) {
				subpath += '/' + pathParts.join( '/' );
			}

			// Storybook uses the React Vite builder, and Vite supports
			// importing assets as strings by appending `?raw`. Ignore this
			// and other querystrings in the path when resolving the export.
			//
			// See: https://vite.dev/guide/assets#importing-asset-as-string
			subpath = subpath.split( '?' )[ 0 ];

			const exportPath = getResolvedExport( subpath, manifest.exports );

			const sourcePath = exportPath
				// Remap build-style CSS files to src SCSS files. By default,
				// wp-build emits a CSS file for each SCSS file in src. This is
				// controlled by wpStyleEntryPoints which we don't fully
				// recreate here (yet), but generally we don't override this.
				.replace( /build-style\/(.+?)\.css/, 'src/$1.scss' )
				.replace( /build(-module)?/, 'src' )
				.replace( /\.[cm]?js$/, '.js' );

			return resolve( path.join( packagePath, sourcePath ) );
		} catch {
			return { found: false };
		}
	}

	return resolve( source );
};
