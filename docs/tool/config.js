/**
 * External dependencies
 */
const glob = require( 'glob' ).sync;
const path = require( 'path' );

module.exports = {
	packageFileNames: glob( 'packages/*/package.json' )
		.map( ( fileName ) => fileName.split( '/' )[ 1 ] ),

	tocFileName: path.resolve( __dirname, '../toc.json' ),
	manifestOutput: path.resolve( __dirname, '../manifest.json' ),
};
