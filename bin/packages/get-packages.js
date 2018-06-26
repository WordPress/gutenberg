/**
 * External dependencies
 */
const fs = require( 'fs' );
const path = require( 'path' );
const { overEvery, compact, includes, negate } = require( 'lodash' );

/**
 * Absolute path to packages directory.
 *
 * @type {string}
 */
const PACKAGES_DIR = path.resolve( __dirname, '../../packages' );

const {
	/**
	 * Comma-separated string of packages to include in build.
	 *
	 * @type {string}
	 */
	INCLUDE_PACKAGES,

	/**
	 * Comma-separated string of packages to exclude from build.
	 *
	 * @type {string}
	 */
	EXCLUDE_PACKAGES,
} = process.env;

/**
 * Given a comma-separated string, returns a filter function which returns true
 * if the item is contained within as a comma-separated entry.
 *
 * @param {Function} filterFn Filter function to call with item to test.
 * @param {string}   list     Comma-separated list of items.
 *
 * @return {Function} Filter function.
 */
const createCommaSeparatedFilter = ( filterFn, list ) => {
	const listItems = list.split( ',' );
	return ( item ) => filterFn( listItems, item );
};

/**
 * Filter predicate, returning true if the given base file name is to be
 * included in the build, based on BUILD_PACKAGES environment variable.
 *
 * @param {string} pkg File base name to test.
 *
 * @return {boolean} Whether to include file in build.
 */
const filterPackages = overEvery( compact( [
	INCLUDE_PACKAGES && createCommaSeparatedFilter( includes, INCLUDE_PACKAGES ),
	EXCLUDE_PACKAGES && createCommaSeparatedFilter( negate( includes ), EXCLUDE_PACKAGES ),
] ) );

/**
 * Returns the absolute path of all WordPress packages
 *
 * @return {Array} Package paths
 */
function getPackages() {
	return fs
		.readdirSync( PACKAGES_DIR )
		.filter( filterPackages )
		.map( ( file ) => path.resolve( PACKAGES_DIR, file ) )
		.filter( ( f ) => fs.lstatSync( path.resolve( f ) ).isDirectory() );
}

module.exports = getPackages;
