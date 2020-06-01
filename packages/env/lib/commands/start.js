/**
 * External dependencies
 */
const dockerCompose = require( 'docker-compose' );
const util = require( 'util' );
const path = require( 'path' );
const fs = require( 'fs' ).promises;
const inquirer = require( 'inquirer' );

/**
 * Promisified dependencies
 */
const sleep = util.promisify( setTimeout );
const rimraf = util.promisify( require( 'rimraf' ) );

/**
 * Internal dependencies
 */
const retry = require( '../retry' );
const stop = require( './stop' );
const initConfig = require( '../init-config' );
const downloadSource = require( '../download-source' );
const {
	checkDatabaseConnection,
	makeContentDirectoriesWritable,
	configureWordPress,
	copyCoreFiles,
} = require( '../wordpress' );

/**
 * Starts the development server.
 *
 * @param {Object}  options
 * @param {Object}  options.spinner A CLI spinner which indicates progress.
 * @param {boolean} options.debug   True if debug mode is enabled.
 */
module.exports = async function start( { spinner, debug } ) {
	/**
	 * If the Docker image is already running and the `wp-env` files have been
	 * deleted, the start command will not complete successfully. Stopping
	 * the container before continuing allows the docker entrypoint script,
	 * which restores the files, to run again when we start the containers.
	 *
	 * Additionally, this serves as a way to restart the container entirely
	 * should the need arise.
	 *
	 * @see https://github.com/WordPress/gutenberg/pull/20253#issuecomment-587228440
	 */
	await stop( { spinner, debug } );

	await checkForLegacyInstall( spinner );

	const config = await initConfig( { spinner, debug } );

	spinner.text = 'Downloading WordPress.';

	const progresses = {};
	const getProgressSetter = ( id ) => ( progress ) => {
		progresses[ id ] = progress;
		spinner.text =
			'Downloading WordPress.\n' +
			Object.entries( progresses )
				.map(
					( [ key, value ] ) =>
						`  - ${ key }: ${ ( value * 100 ).toFixed( 0 ) }/100%`
				)
				.join( '\n' );
	};

	await Promise.all( [
		// Preemptively start the database while we wait for sources to download.
		dockerCompose.upOne( 'mysql', {
			config: config.dockerComposeConfigPath,
			log: config.debug,
		} ),

		( async () => {
			if ( config.coreSource ) {
				await downloadSource( config.coreSource, {
					onProgress: getProgressSetter( 'core' ),
					spinner,
					debug: config.debug,
				} );
				await copyCoreFiles(
					config.coreSource.path,
					config.coreSource.testsPath
				);

				// Ensure the tests uploads folder is writeable for travis,
				// creating the folder if necessary.
				const testsUploadsPath = path.join(
					config.coreSource.testsPath,
					'wp-content/uploads'
				);
				await fs.mkdir( testsUploadsPath, { recursive: true } );
				await fs.chmod( testsUploadsPath, 0o0767 );
			}
		} )(),

		...config.pluginSources.map( ( source ) =>
			downloadSource( source, {
				onProgress: getProgressSetter( source.basename ),
				spinner,
				debug: config.debug,
			} )
		),

		...config.themeSources.map( ( source ) =>
			downloadSource( source, {
				onProgress: getProgressSetter( source.basename ),
				spinner,
				debug: config.debug,
			} )
		),
	] );

	spinner.text = 'Starting WordPress.';

	await dockerCompose.upMany( [ 'wordpress', 'tests-wordpress' ], {
		config: config.dockerComposeConfigPath,
		log: config.debug,
	} );

	if ( config.coreSource === null ) {
		// Don't chown wp-content when it exists on the user's local filesystem.
		await Promise.all( [
			makeContentDirectoriesWritable( 'development', config ),
			makeContentDirectoriesWritable( 'tests', config ),
		] );
	}

	try {
		await checkDatabaseConnection( config );
	} catch ( error ) {
		// Wait 30 seconds for MySQL to accept connections.
		await retry( () => checkDatabaseConnection( config ), {
			times: 30,
			delay: 1000,
		} );

		// It takes 3-4 seconds for MySQL to be ready after it starts accepting connections.
		await sleep( 4000 );
	}

	// Retry WordPress installation in case MySQL *still* wasn't ready.
	await Promise.all( [
		retry( () => configureWordPress( 'development', config ), {
			times: 2,
		} ),
		retry( () => configureWordPress( 'tests', config ), { times: 2 } ),
	] );

	spinner.text = 'WordPress started.';
};

/**
 * Checks for legacy installs and provides
 * the user the option to delete them.
 *
 * @param {Object} spinner A CLI spinner which indicates progress.
 */
async function checkForLegacyInstall( spinner ) {
	const basename = path.basename( process.cwd() );
	const installs = [
		`../${ basename }-wordpress`,
		`../${ basename }-tests-wordpress`,
	];
	await Promise.all(
		installs.map( ( install ) =>
			fs
				.access( install )
				.catch( () =>
					installs.splice( installs.indexOf( install ), 1 )
				)
		)
	);
	if ( ! installs.length ) {
		return;
	}

	spinner.info(
		`It appears that you have used a previous version of this tool where installs were kept in ${ installs.join(
			' and '
		) }. Installs are now in your home folder.\n`
	);
	const { yesDelete } = await inquirer.prompt( [
		{
			type: 'confirm',
			name: 'yesDelete',
			message:
				'Do you wish to delete these old installs to reclaim disk space?',
			default: true,
		},
	] );
	if ( yesDelete ) {
		await Promise.all( installs.map( ( install ) => rimraf( install ) ) );
		spinner.info( 'Old installs deleted successfully.' );
	}
	spinner.start();
}
