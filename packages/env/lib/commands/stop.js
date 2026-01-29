'use strict';
/**
 * External dependencies
 */
const path = require( 'path' );

/**
 * Internal dependencies
 */
const { loadConfig } = require( '../config' );
const { getRuntime, detectRuntime } = require( '../runtime' );

/**
 * Stops the development server.
 *
 * @param {Object}  options
 * @param {Object}  options.spinner A CLI spinner which indicates progress.
 * @param {boolean} options.debug   True if debug mode is enabled.
 */
module.exports = async function stop( { spinner, debug } ) {
	const config = await loadConfig( path.resolve( '.' ) );
	const runtimeName = await detectRuntime( config.workDirectoryPath );
	if ( ! runtimeName ) {
		spinner.fail(
			'Environment not initialized. Run `wp-env start` first.'
		);
		process.exit( 1 );
	}
	const runtime = getRuntime( runtimeName );
	await runtime.stop( config, { spinner, debug } );
};
