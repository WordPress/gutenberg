/**
 * External dependencies
 */
const path = require( 'node:path' );
const { existsSync, readFileSync } = require( 'node:fs' );
const resolverNode = require( 'eslint-import-resolver-typescript' );
const PACKAGES_DIR = path.resolve( __dirname, '../../packages' );

exports.interfaceVersion = 2;

exports.resolve = function ( source, file, config ) {
	const resolve = ( sourcePath ) =>
		resolverNode.resolve( sourcePath, file, {
			...config,
			extensions: [ '.tsx', '.ts', '.mjs', '.js', '.json', '.node' ],
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
			const subpath = path.join( '.', pathParts.join( '/' ) );
			const exportPath = manifest.exports?.[ subpath ]?.import;
			const sourcePath = exportPath.replace( 'build-module', 'src' );

			return resolve( path.join( packagePath, sourcePath ) );
		} catch {
			return { found: false };
		}
	}

	return resolve( source );
};
