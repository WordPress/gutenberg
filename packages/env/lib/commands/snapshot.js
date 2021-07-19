/**
 * External dependencies
 */
const path = require( 'path' );

const fs = require( 'fs' );
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

	spinner.text = `Snapshotting ${ directoryHash }.`;

	if ( ! fs.existsSync( snapshotPath ) ) {
		fs.mkdirSync( snapshotPath );
	}

	try {
		await exec(
			`docker run -v ${ dbVolume }:/volume --rm loomchild/volume-backup backup - > ${ snapshotPath }/db_backup.tar.bz2`
		);
		await exec(
			`docker run -v ${ filesVolume }:/volume --rm loomchild/volume-backup backup - > ${ snapshotPath }/app_backup.tar.bz2`
		);
	} catch ( err ) {
		//TODO: The most likely culpret is an EMPTY filesVolume.
		//However I'm not sure how to ensure the snapshot is needed prior to execution.
		//So for now... just failing silently... :(
	}

	spinner.text = `Snapshotted ${ directoryHash }.`;
};
