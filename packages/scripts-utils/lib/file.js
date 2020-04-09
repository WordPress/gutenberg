/**
 * External dependencies
 */
const { existsSync } = require( 'fs' );
const path = require( 'path' );

/**
 * Internal dependencies
 */
const { getPackagePath } = require( './package' );

const fromProjectRoot = ( fileName ) =>
	path.join( path.dirname( getPackagePath() ), fileName );

const hasProjectFile = ( fileName ) =>
	existsSync( fromProjectRoot( fileName ) );

module.exports = {
	fromProjectRoot,
	hasProjectFile,
};
