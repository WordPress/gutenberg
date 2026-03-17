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
 * @param {Object}      options
 * @param {Object}      options.spinner A CLI spinner which indicates progress.
 * @param {boolean}     options.debug   True if debug mode is enabled.
 * @param {string|null} options.config  Path to a custom .wp-env.json configuration file.
 */
module.exports = async function stop( {
	spinner,
	debug,
	config: customConfigPath,
} ) {
	const config = await loadConfig( path.resolve( '.' ), customConfigPath );
	const runtime = getRuntime(
		await detectRuntime( config.workDirectoryPath )
	);
	await runtime.stop( config, { spinner, debug } );
};
