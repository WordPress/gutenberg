/**
 * External dependencies
 */
const path = require( 'path' );

const util = require( 'util' );
const exec = util.promisify( require( 'child_process' ).exec );
/**
 * Internal dependencies
 */
const initConfig = require( '../init-config' );

/**
 * @typedef {import('../wordpress').WPEnvironment} WPEnvironment
 * @typedef {import('../wordpress').WPEnvironmentSelection} WPEnvironmentSelection
 */

/**
 * Takes a snapshot of the development server's database.
 *
 * @param {Object}                 options
 * @param {Object}                 options.spinner     A CLI spinner which indicates progress.
 * @param {boolean}                options.debug       True if debug mode is enabled.
 */
module.exports = async function snapshot( { spinner, debug } ) {
	const config = await initConfig( { spinner, debug } );

	const snapshotPath = `${ config.configDirectoryPath }/snapshot`;
	const directoryHash = path.basename( config.workDirectoryPath );
	const filesVolume = `${ directoryHash }_wordpress`;
	const dbVolume = `${ directoryHash }_mysql`;

	spinner.text = `Restoring to ${ directoryHash }.`;

	await exec(
		`cat ${ snapshotPath }/db_backup.tar.bz2 | docker run -i -v ${ dbVolume }:/volume --rm loomchild/volume-backup restore -`
	);
	await exec(
		`cat ${ snapshotPath }/app_backup.tar.bz2 | docker run -i -v ${ filesVolume }:/volume --rm loomchild/volume-backup restore -`
	);

	spinner.text = `Restored to ${ directoryHash }.`;
};
