'use strict';
/**
 * External dependencies
 */
const { v2: dockerCompose } = require( 'docker-compose' );
const fs = require( 'fs' ).promises;
const path = require( 'path' );
const { confirm } = require( '@inquirer/prompts' );

/**
 * Promisified dependencies
 */
const { rimraf } = require( 'rimraf' );

/**
 * Internal dependencies
 */
const { loadConfig } = require( '../config' );
const { executeLifecycleScript } = require( '../execute-lifecycle-script' );

/**
 * Destroy the development server.
 *
 * @param {Object}  options
 * @param {Object}  options.spinner A CLI spinner which indicates progress.
 * @param {boolean} options.scripts Indicates whether or not lifecycle scripts should be executed.
 * @param {boolean} options.debug   True if debug mode is enabled.
 */
module.exports = async function destroy( { spinner, scripts, debug } ) {
	const config = await loadConfig( path.resolve( '.' ) );

	try {
		await fs.readdir( config.workDirectoryPath );
	} catch {
		spinner.text = 'Could not find any files to remove.';
		return;
	}

	spinner.info(
		'WARNING! This will remove Docker containers, volumes, networks, and images associated with the WordPress instance.'
	);

	let yesDelete = false;
	try {
		yesDelete = await confirm( {
			message: 'Are you sure you want to continue?',
			default: false,
		} );
	} catch ( error ) {
		if ( error.name === 'ExitPromptError' ) {
			console.log( 'Cancelled.' );
			process.exit( 1 );
		}
		throw error;
	}

	spinner.start();

	if ( ! yesDelete ) {
		spinner.text = 'Cancelled.';
		return;
	}

	spinner.text = 'Removing docker images, volumes, and networks.';

	await dockerCompose.down( {
		config: config.dockerComposeConfigPath,
		commandOptions: [ '--volumes', '--remove-orphans', '--rmi', 'all' ],
		log: debug,
	} );

	spinner.text = 'Removing local files.';
	// Note: there is a race condition where docker compose actually hasn't finished
	// by this point, which causes rimraf to fail. We need to wait at least 2.5-5s,
	// but using 10s in case it's dependant on the machine.
	await new Promise( ( resolve ) => setTimeout( resolve, 10000 ) );
	await rimraf( config.workDirectoryPath );

	if ( scripts ) {
		await executeLifecycleScript( 'afterDestroy', config, spinner );
	}

	spinner.text = 'Removed WordPress environment.';
};
