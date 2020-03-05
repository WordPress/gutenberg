'use strict';
/**
 * External dependencies
 */
const util = require( 'util' );
const path = require( 'path' );
const fs = require( 'fs' ).promises;
const dockerCompose = require( 'docker-compose' );
const yaml = require( 'js-yaml' );
const inquirer = require( 'inquirer' );

/**
 * Promisified dependencies
 */
const copyDir = util.promisify( require( 'copy-dir' ) );
const sleep = util.promisify( setTimeout );
const rimraf = util.promisify( require( 'rimraf' ) );

/**
 * Internal dependencies
 */
const { ValidationError, readConfig } = require( './config' );
const downloadSource = require( './download-source' );
const buildDockerComposeConfig = require( './build-docker-compose-config' );

/**
 * @typedef {import('./config').Config} Config
 */

module.exports = {
	/**
	 * Starts the development server.
	 *
	 * @param {Object}  options
	 * @param {Object}  options.spinner A CLI spinner which indicates progress.
	 * @param {boolean} options.debug   True if debug mode is enabled.
	 */
	async start( { spinner, debug } ) {
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
		await module.exports.stop( { spinner, debug } );

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
							`  - ${ key }: ${ ( value * 100 ).toFixed(
								0
							) }/100%`
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
	},

	/**
	 * Stops the development server.
	 *
	 * @param {Object}  options
	 * @param {Object}  options.spinner A CLI spinner which indicates progress.
	 * @param {boolean} options.debug   True if debug mode is enabled.
	 */
	async stop( { spinner, debug } ) {
		const { dockerComposeConfigPath } = await initConfig( {
			spinner,
			debug,
		} );

		spinner.text = 'Stopping WordPress.';

		await dockerCompose.down( {
			config: dockerComposeConfigPath,
			log: debug,
		} );

		spinner.text = 'Stopped WordPress.';
	},

	/**
	 * Wipes the development server's database, the tests server's database, or both.
	 *
	 * @param {Object}  options
	 * @param {string}  options.environment The environment to clean. Either 'development', 'tests', or 'all'.
	 * @param {Object}  options.spinner     A CLI spinner which indicates progress.
	 * @param {boolean} options.debug       True if debug mode is enabled.
	 */
	async clean( { environment, spinner, debug } ) {
		const config = await initConfig( { spinner, debug } );

		const description = `${ environment } environment${
			environment === 'all' ? 's' : ''
		}`;
		spinner.text = `Cleaning ${ description }.`;

		const tasks = [];

		if ( environment === 'all' || environment === 'development' ) {
			tasks.push(
				resetDatabase( 'development', config )
					.then( () => configureWordPress( 'development', config ) )
					.catch( () => {} )
			);
		}

		if ( environment === 'all' || environment === 'tests' ) {
			tasks.push(
				resetDatabase( 'tests', config )
					.then( () => configureWordPress( 'tests', config ) )
					.catch( () => {} )
			);
		}

		await Promise.all( tasks );

		spinner.text = `Cleaned ${ description }.`;
	},

	/**
	 * Runs an arbitrary command on the given Docker container.
	 *
	 * @param {Object}  options
	 * @param {Object}  options.container The Docker container to run the command on.
	 * @param {Object}  options.command   The command to run.
	 * @param {Object}  options.spinner   A CLI spinner which indicates progress.
	 * @param {boolean} options.debug     True if debug mode is enabled.
	 */
	async run( { container, command, spinner, debug } ) {
		const config = await initConfig( { spinner, debug } );

		command = command.join( ' ' );

		spinner.text = `Running \`${ command }\` in '${ container }'.`;

		const result = await dockerCompose.run( container, command, {
			config: config.dockerComposeConfigPath,
			commandOptions: [ '--rm' ],
			log: config.debug,
		} );

		if ( result.out ) {
			// eslint-disable-next-line no-console
			console.log(
				process.stdout.isTTY ? `\n\n${ result.out }\n\n` : result.out
			);
		} else if ( result.err ) {
			// eslint-disable-next-line no-console
			console.error(
				process.stdout.isTTY ? `\n\n${ result.err }\n\n` : result.err
			);
			throw result.err;
		}

		spinner.text = `Ran \`${ command }\` in '${ container }'.`;
	},

	ValidationError,
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

/**
 * Initializes the local environment so that Docker commands can be run. Reads
 * ./.wp-env.json, creates ~/.wp-env, and creates ~/.wp-env/docker-compose.yml.
 *
 * @param {Object}  options
 * @param {Object}  options.spinner A CLI spinner which indicates progress.
 * @param {boolean} options.debug   True if debug mode is enabled.
 *
 * @return {Config} The-env config object.
 */
async function initConfig( { spinner, debug } ) {
	const configPath = path.resolve( '.wp-env.json' );
	const config = await readConfig( configPath );
	config.debug = debug;

	await fs.mkdir( config.workDirectoryPath, { recursive: true } );

	const dockerComposeConfig = buildDockerComposeConfig( config );
	await fs.writeFile(
		config.dockerComposeConfigPath,
		yaml.dump( dockerComposeConfig )
	);

	if ( config.debug ) {
		spinner.info(
			`Config:\n${ JSON.stringify(
				config,
				null,
				4
			) }\n\nDocker Compose Config:\n${ JSON.stringify(
				dockerComposeConfig,
				null,
				4
			) }`
		);
		spinner.start();
	}

	return config;
}

/**
 * Copies a WordPress installation, taking care to ignore large directories
 * (.git, node_modules) and configuration files (wp-config.php).
 *
 * @param {string} fromPath Path to the WordPress directory to copy.
 * @param {string} toPath Destination path.
 */
async function copyCoreFiles( fromPath, toPath ) {
	await copyDir( fromPath, toPath, {
		filter( stat, filepath, filename ) {
			if ( stat === 'symbolicLink' ) {
				return false;
			}
			if ( stat === 'directory' && filename === '.git' ) {
				return false;
			}
			if ( stat === 'directory' && filename === 'node_modules' ) {
				return false;
			}
			if ( stat === 'file' && filename === 'wp-config.php' ) {
				return false;
			}
			return true;
		},
	} );
}

/**
 * Makes the WordPress content directories (wp-content, wp-content/plugins,
 * wp-content/themes) owned by the www-data user. This ensures that WordPress
 * can write to these directories.
 *
 * This is necessary when running wp-env with `"core": null` because Docker
 * will automatically create these directories as the root user when binding
 * volumes during `docker-compose up`, and `docker-compose up` doesn't support
 * the `-u` option.
 *
 * See https://github.com/docker-library/wordpress/issues/436.
 *
 * @param {string} environment The environment to check. Either 'development' or 'tests'.
 * @param {Config} config The wp-env config object.
 */
async function makeContentDirectoriesWritable(
	environment,
	{ dockerComposeConfigPath, debug }
) {
	await dockerCompose.exec(
		environment === 'development' ? 'wordpress' : 'tests-wordpress',
		'chown www-data:www-data wp-content wp-content/plugins wp-content/themes',
		{
			config: dockerComposeConfigPath,
			log: debug,
		}
	);
}

/**
 * Performs the given action again and again until it does not throw an error.
 *
 * @param {Function} action The action to perform.
 * @param {Object} options
 * @param {number} options.times How many times to try before giving up.
 * @param {number} [options.delay=5000] How long, in milliseconds, to wait between each try.
 */
async function retry( action, { times, delay = 5000 } ) {
	let tries = 0;
	while ( true ) {
		try {
			return await action();
		} catch ( error ) {
			if ( ++tries >= times ) {
				throw error;
			}
			await sleep( delay );
		}
	}
}

/**
 * Checks a WordPress database connection. An error is thrown if the test is
 * unsuccessful.
 *
 * @param {Config} config The wp-env config object.
 */
async function checkDatabaseConnection( { dockerComposeConfigPath, debug } ) {
	await dockerCompose.run( 'cli', 'wp db check', {
		config: dockerComposeConfigPath,
		commandOptions: [ '--rm' ],
		log: debug,
	} );
}

/**
 * Configures WordPress for the given environment by installing WordPress,
 * activating all plugins, and activating the first theme. These steps are
 * performed sequentially so as to not overload the WordPress instance.
 *
 * @param {string} environment The environment to configure. Either 'development' or 'tests'.
 * @param {Config} config The wp-env config object.
 */
async function configureWordPress( environment, config ) {
	const options = {
		config: config.dockerComposeConfigPath,
		commandOptions: [ '--rm' ],
		log: config.debug,
	};

	const port = environment === 'development' ? config.port : config.testsPort;

	// Install WordPress.
	await dockerCompose.run(
		environment === 'development' ? 'cli' : 'tests-cli',
		[
			'wp',
			'core',
			'install',
			`--url=localhost:${ port }`,
			`--title=${ config.name }`,
			'--admin_user=admin',
			'--admin_password=password',
			'--admin_email=wordpress@example.com',
			'--skip-email',
		],
		options
	);

	// Set wp-config.php values.
	for ( const [ key, value ] of Object.entries( config.config ) ) {
		const command = [ 'wp', 'config', 'set', key, value ];
		if ( typeof value !== 'string' ) {
			command.push( '--raw' );
		}
		await dockerCompose.run(
			environment === 'development' ? 'cli' : 'tests-cli',
			command,
			options
		);
	}

	// Activate all plugins.
	for ( const pluginSource of config.pluginSources ) {
		await dockerCompose.run(
			environment === 'development' ? 'cli' : 'tests-cli',
			`wp plugin activate ${ pluginSource.basename }`,
			options
		);
	}

	// Activate the first theme.
	const [ themeSource ] = config.themeSources;
	if ( themeSource ) {
		await dockerCompose.run(
			environment === 'development' ? 'cli' : 'tests-cli',
			`wp theme activate ${ themeSource.basename }`,
			options
		);
	}
}

/**
 * Resets the development server's database, the tests server's database, or both.
 *
 * @param {string} environment The environment to clean. Either 'development', 'tests', or 'all'.
 * @param {Config} config The wp-env config object.
 */
async function resetDatabase(
	environment,
	{ dockerComposeConfigPath, debug }
) {
	const options = {
		config: dockerComposeConfigPath,
		commandOptions: [ '--rm' ],
		log: debug,
	};

	const tasks = [];

	if ( environment === 'all' || environment === 'development' ) {
		tasks.push( dockerCompose.run( 'cli', 'wp db reset --yes', options ) );
	}

	if ( environment === 'all' || environment === 'tests' ) {
		tasks.push(
			dockerCompose.run( 'tests-cli', 'wp db reset --yes', options )
		);
	}

	await Promise.all( tasks );
}
