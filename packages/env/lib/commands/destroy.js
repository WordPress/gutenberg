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
const stop = require( './stop' );
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

	// check installed WordPress.
	const installed = await fs.readdir( workDirectoryPath );
	if ( ! installed.length ) {
		spinner.text = `Could not find any files to remove.`;
		return;
	}

	spinner.info( 'WARNING! This will remove local volumes and containers.' );

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

	await stop( { spinner, debug } );

	spinner.text = 'Removing WordPress docker containers.';

	await dockerCompose.rm( {
		config: dockerComposeConfigPath,
		log: debug,
	} );

	spinner.text = 'Removing local files.';

	await rimraf( workDirectoryPath );

	spinner.text = 'Removed WordPress environment.';
};
