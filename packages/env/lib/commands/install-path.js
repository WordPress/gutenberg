'use strict';
/**
 * External dependencies
 */
const path = require( 'path' );
const { existsSync } = require( 'fs' );

/**
 * Internal dependencies
 */
const { loadConfig } = require( '../config' );

/**
 * Logs the path to where wp-env files are installed.
 *
 * @param {Object} options
 * @param {Object} options.spinner
 */
module.exports = async function installPath( { spinner } ) {
	// Stop the spinner so that stdout is not polluted.
	spinner.stop();

	const config = await loadConfig( path.resolve( '.' ) );

	if ( ! existsSync( config.workDirectoryPath ) ) {
		console.error(
			'wp-env has not yet been initialized. Please run `wp-env start` first.'
		);
		process.exit( 1 );
	}

	console.log( config.workDirectoryPath );
};
