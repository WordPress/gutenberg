/**
 * External dependencies
 */
const resolverNode = require( 'eslint-import-resolver-node' );
const path = require( 'path' );

const PACKAGES_DIR = path.resolve( __dirname, '../../packages' );

exports.interfaceVersion = 2;

exports.resolve = function ( source, file, config ) {
	const resolve = ( sourcePath ) =>
		resolverNode.resolve( sourcePath, file, {
			...config,
			extensions: [ '.tsx', '.ts', '.mjs', '.js', '.json', '.node' ],
		} );

	if ( source.startsWith( '@wordpress/' ) ) {
		const packageName = source.slice( '@wordpress/'.length );

		const result = resolve( path.join( PACKAGES_DIR, packageName ) );

		if ( result.found ) {
			return result;
		}

		return resolve( path.join( PACKAGES_DIR, `${ packageName }/src/` ) );
	}

	return resolve( source );
};
