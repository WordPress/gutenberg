'use strict';
/**
 * External dependencies
 */
const { v2: dockerCompose } = require( 'docker-compose' );

/**
 * Internal dependencies
 */
const initConfig = require( '../init-config' );
const { executeLifecycleScript } = require( '../execute-lifecycle-script' );

/**
 * Stops the development server.
 *
 * @param {Object}  options
 * @param {boolean} options.scripts Indicates whether or not lifecycle scripts should be executed.
 * @param {Object}  options.spinner A CLI spinner which indicates progress.
 * @param {boolean} options.debug   True if debug mode is enabled.
 */
module.exports = async function stop( { scripts, spinner, debug } ) {
	const config = await initConfig( {
		spinner,
		debug,
	} );

	spinner.text = 'Stopping WordPress.';

	await dockerCompose.down( {
		config: config.dockerComposeConfigPath,
		log: debug,
	} );

	if ( scripts ) {
		await executeLifecycleScript( 'afterStop', config, spinner );
	}

	spinner.text = 'Stopped WordPress.';
};
