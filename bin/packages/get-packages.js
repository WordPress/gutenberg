/**
 * External dependencies
 */
const fs = require( 'fs' );
const path = require( 'path' );

/**
 * Module Constants
 */
const PACKAGES_DIR = path.resolve( __dirname, '../../packages' );

/**
 * Returns the absolute path of all WordPress packages
 *
 * @return {Array} Package paths
 */
function getPackages() {
	return fs
		.readdirSync( PACKAGES_DIR )
		.map( ( file ) => path.resolve( PACKAGES_DIR, file ) )
		.filter( ( f ) => fs.lstatSync( path.resolve( f ) ).isDirectory() );
}

module.exports = getPackages;
