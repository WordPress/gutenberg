/**
 * External dependencies
 */
const dockerCompose = require( 'docker-compose' );
const util = require( 'util' );
const fs = require( 'fs' ).promises;
const inquirer = require( 'inquirer' );
/**
 * Promisified dependencies
 */
const rimraf = util.promisify( require( 'rimraf' ) );

/**
 * Internal dependencies
 */
const initConfig = require( '../init-config' );
const stop = require( './stop' );

/**
 * Destroy the development server.
 *
 * @param {Object}  options
 * @param {Object}  options.spinner A CLI spinner which indicates progress.
 * @param {boolean} options.debug   True if debug mode is enabled.
 */
module.exports = async function destroy( { spinner, debug } ) {
	const config = await initConfig( { spinner, debug } );
	const { dockerComposeConfigPath, workDirectoryPath } = config;

	const installed = await fs.access( dockerComposeConfigPath );

	if ( ! installed ) {
		spinner.text = `Not installed WordPress.`;
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

	if ( yesDelete ) {
		await stop( { spinner, debug } );

		spinner.text = 'Removing WordPress environment.';

		await dockerCompose.rm( {
			config: dockerComposeConfigPath,
			log: debug,
		} );

		await rimraf( workDirectoryPath );

		spinner.text = 'Removed WordPress environment.';
	} else {
		spinner.text = 'Cancelled';
	}
};
