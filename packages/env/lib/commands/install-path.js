/**
 * External dependencies
 */
const path = require( 'path' );
const fs = require( 'fs' );

/**
 * Internal dependencies
 */
const { readConfig } = require( '../config' );

/**
 * Logs the path to where wp-env files are installed.
 */
module.exports = async function installPath() {
	const configPath = path.resolve( '.wp-env.json' );
	if ( ! fs.existsSync( configPath ) ) {
		console.error( 'Error: .wp-env.json file not found.' );
		return;
	}

	const { workDirectoryPath } = await readConfig( configPath );

	if ( ! fs.existsSync( workDirectoryPath ) ) {
		console.error(
			'Error: Environment has not yet been created. Try running `wp-env start`.'
		);
		return;
	}

	console.log( workDirectoryPath );
};
