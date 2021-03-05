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
const exec = util.promisify( require( 'child_process' ).exec );

/**
 * Internal dependencies
 */
const { readConfig } = require( '../../lib/config' );

/**
 * Destroy the development server.
 *
 * @param {Object}  options
 * @param {Object}  options.spinner A CLI spinner which indicates progress.
 * @param {boolean} options.debug   True if debug mode is enabled.
 */
module.exports = async function destroy( { spinner, debug } ) {
	const configPath = path.resolve( '.wp-env.json' );
	const { dockerComposeConfigPath, workDirectoryPath } = await readConfig(
		configPath
	);

	try {
		await fs.readdir( workDirectoryPath );
	} catch {
		spinner.text = 'Could not find any files to remove.';
		return;
	}

	spinner.info(
		'WARNING! This will remove Docker containers, volumes, and networks associated with the WordPress instance.'
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

	spinner.text = 'Removing WordPress docker containers.';

	await dockerCompose.rm( {
		config: dockerComposeConfigPath,
		commandOptions: [ '--stop', '-v' ],
		log: debug,
	} );

	const directoryHash = path.basename( workDirectoryPath );

	spinner.text = 'Removing docker networks and volumes.';
	const getVolumes = `docker volume ls | grep "${ directoryHash }" | awk '/ / { print $2 }'`;
	const removeVolumes = `docker volume rm $(${ getVolumes })`;

	const getNetworks = `docker network ls | grep "${ directoryHash }" | awk '/ / { print $1 }'`;
	const removeNetworks = `docker network rm $(${ getNetworks })`;

	const command = `${ removeVolumes } && ${ removeNetworks }`;

	if ( debug ) {
		spinner.info(
			`Running command to remove volumes and networks:\n${ command }\n`
		);
	}

	const { stdout } = await exec( command );
	if ( debug && stdout ) {
		// Disable reason: Logging information in debug mode.
		// eslint-disable-next-line no-console
		console.log( `Removed volumes and networks:\n${ stdout }` );
	}

	spinner.text = 'Removing local files.';

	await rimraf( workDirectoryPath );

	spinner.text = 'Removed WordPress environment.';
};
