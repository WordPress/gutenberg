'use strict';
/**
 * External dependencies
 */
const path = require( 'path' );

/**
 * Internal dependencies
 */
const { executeLifecycleScript } = require( '../execute-lifecycle-script' );
const { loadConfig } = require( '../config' );
const { getRuntime, detectRuntime } = require( '../runtime' );

/**
 * @typedef {import('../wordpress').WPEnvironment} WPEnvironment
 * @typedef {import('../wordpress').WPEnvironmentSelection} WPEnvironmentSelection
 */

/**
 * Resets the development server's database, the tests server's database, or both.
 *
 * @param {Object}                 options
 * @param {WPEnvironmentSelection} options.environment The environment to reset. Either 'development', 'tests', or 'all'.
 * @param {Object}                 options.spinner     A CLI spinner which indicates progress.
 * @param {boolean}                options.scripts     Indicates whether or not lifecycle scripts should be executed.
 * @param {boolean}                options.debug       True if debug mode is enabled.
 * @param {string|null}            options.config      Path to a custom .wp-env.json configuration file.
 */
module.exports = async function reset( {
	environment,
	spinner,
	scripts,
	debug,
	config: customConfigPath,
} ) {
	const config = await loadConfig( path.resolve( '.' ), customConfigPath );
	const runtime = getRuntime(
		await detectRuntime( config.workDirectoryPath )
	);

	await runtime.clean( config, { environment, spinner, debug } );

	if ( scripts ) {
		await executeLifecycleScript( 'afterReset', config, spinner );
	}
};
