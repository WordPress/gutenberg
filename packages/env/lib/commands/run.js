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
 * Runs an arbitrary command on the given Docker container.
 *
 * @param {Object}   options
 * @param {string}   options.container The Docker container to run the command on.
 * @param {string[]} options.command   The command to run.
 * @param {string[]} options.'--'      Any arguments that were passed after a double dash.
 * @param {string}   options.envCwd    The working directory for the command to be executed from.
 * @param {Object}   options.spinner   A CLI spinner which indicates progress.
 * @param {boolean}  options.debug     True if debug mode is enabled.
 */
module.exports = async function run( {
	container,
	command,
	'--': doubleDashedArgs,
	envCwd,
	spinner,
	debug,
} ) {
	const config = await loadConfig( path.resolve( '.' ) );
	const runtime = getRuntime(
		await detectRuntime( config.workDirectoryPath )
	);

	// Include any double dashed arguments in the command so that we can pass them to Docker.
	// This lets users pass options that the command defines without them being parsed.
	if ( Array.isArray( doubleDashedArgs ) ) {
		command.push( ...doubleDashedArgs );
	}

	await runtime.run( config, { container, command, envCwd, spinner, debug } );
};
