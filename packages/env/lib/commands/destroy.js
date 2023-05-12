'use strict';
/**
 * External dependencies
 */
const dockerCompose = require( 'docker-compose' );
const util = require( 'util' );
const fs = require( 'fs' ).promises;
const path = require( 'path' );
const inquirer = require( 'inquirer' );

/**
 * Promisified dependencies
 */
const rimraf = util.promisify( require( 'rimraf' ) );

/**
 * Internal dependencies
 */
const { loadConfig } = require( '../config' );

/**
 * Destroy the development server.
 *
 * @param {Object}  options
 * @param {Object}  options.spinner A CLI spinner which indicates progress.
 * @param {boolean} options.debug   True if debug mode is enabled.
 */
module.exports = async function destroy( { spinner, debug } ) {
	const { dockerComposeConfigPath, workDirectoryPath } = await loadConfig(
		path.resolve( '.' )
	);

	try {
		await fs.readdir( workDirectoryPath );
	} catch {
		spinner.text = 'Could not find any files to remove.';
		return;
	}

	spinner.info(
		'WARNING! This will remove Docker containers, volumes, networks, and images associated with the WordPress instance.'
	);

	const { yesDelete } = await inquirer.prompt( [
		{
			type: 'confirm',
			name: 'yesDelete',
			message: 'Are you sure you want to continue?',
			default: false,
		},
	] );

	spinner.start();

	if ( ! yesDelete ) {
		spinner.text = 'Cancelled.';
		return;
	}

	spinner.text = 'Removing docker images, volumes, and networks.';

	await dockerCompose.down( {
		config: dockerComposeConfigPath,
		commandOptions: [ '--volumes', '--remove-orphans', '--rmi', 'all' ],
		log: debug,
	} );

	spinner.text = 'Removing local files.';
	// Note: there is a race condition where docker compose actually hasn't finished
	// by this point, which causes rimraf to fail. We need to wait at least 2.5-5s,
	// but using 10s in case it's dependant on the machine.
	await new Promise( ( resolve ) => setTimeout( resolve, 10000 ) );
	await rimraf( workDirectoryPath );

	spinner.text = 'Removed WordPress environment.';
};
