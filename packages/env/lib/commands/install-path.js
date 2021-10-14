/**
 * External dependencies
 */
const path = require( 'path' );

/**
 * Internal dependencies
 */
const { readConfig } = require( '../config' );

/**
 * Logs the path to where wp-env files are installed.
 */
module.exports = async function installPath() {
	const { workDirectoryPath } = await readConfig(
		path.resolve( '.wp-env.json' )
	);
	console.log( workDirectoryPath );
};
