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
 * Displays the Docker & PHP logs on the given environment.
 *
 * @param {Object}  options
 * @param {Object}  options.environment The environment to run the command in (develop or tests).
 * @param {Object}  options.watch       If true, follow along with log output.
 * @param {Object}  options.spinner     A CLI spinner which indicates progress.
 * @param {boolean} options.debug       True if debug mode is enabled.
 */
module.exports = async function logs( { environment, watch, spinner, debug } ) {
	const config = await loadConfig( path.resolve( '.' ) );
	const runtime = getRuntime( detectRuntime( config.workDirectoryPath ) );
	await runtime.logs( config, { environment, watch, spinner, debug } );
};
