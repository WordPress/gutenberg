'use strict';
/**
 * External dependencies
 */
const { spawn, execSync } = require( 'child_process' );
const path = require( 'path' );
const util = require( 'util' );
const { v2: dockerCompose } = require( 'docker-compose' );
const { rimraf } = require( 'rimraf' );

/**
 * Promisified dependencies
 */
const exec = util.promisify( require( 'child_process' ).exec );

/**
 * Internal dependencies
 */
const initConfig = require( './init-config' );
const getHostUser = require( './get-host-user' );
const downloadSources = require( './download-sources' );
const downloadWPPHPUnit = require( './download-wp-phpunit' );
const {
	RUN_CONTAINERS,
	validateRunContainer,
} = require( './validate-run-container' );
const {
	configureWordPress,
	resetDatabase,
	setupWordPressDirectories,
} = require( './wordpress' );
const { readWordPressVersion, canAccessWPORG } = require( '../../wordpress' );
const { didCacheChange, setCache } = require( '../../cache' );
const md5 = require( '../../md5' );
const retry = require( '../../retry' );

/**
 * @typedef {import('../../config').WPConfig} WPConfig
 */

const CONFIG_CACHE_KEY = 'config_checksum';

/**
 * Docker runtime implementation for wp-env.
 *
 * This runtime uses Docker Compose for container orchestration.
 */
class DockerRuntime {
	/**
	 * Get the name of this runtime.
	 *
	 * @return {string} Runtime name.
	 */
	getName() {
		return 'docker';
	}

	/**
	 * Get supported features for this runtime.
	 *
	 * @return {Object} Feature flags.
	 */
	getFeatures() {
		return {
			testsEnvironment: true,
			xdebug: true,
			spx: true,
			phpMyAdmin: true,
			multisite: true,
			customPhpVersion: true,
			persistentDatabase: true,
			wpCli: true,
		};
	}

	/**
	 * Check if Docker is available.
	 *
	 * @return {Promise<boolean>} True if Docker is available.
	 */
	async isAvailable() {
		try {
			execSync( 'docker info', { stdio: 'ignore' } );
			return true;
		} catch {
			return false;
		}
	}

	/**
	 * Start the Docker containers and configure WordPress.
	 *
	 * @param {WPConfig} config          The wp-env config object.
	 * @param {Object}   options         Start options.
	 * @param {Object}   options.spinner A CLI spinner which indicates progress.
	 * @param {boolean}  options.update  If true, update sources.
	 * @param {string}   options.xdebug  The Xdebug mode to set.
	 * @param {string}   options.spx     The SPX mode to set.
	 * @param {boolean}  options.debug   True if debug mode is enabled.
	 * @return {Promise<Object>} Result object with message and siteUrl.
	 */
	async start( config, { spinner, update, xdebug, spx, debug } ) {
		// Initialize Docker-specific files (docker-compose.yml, Dockerfiles)
		const fullConfig = await initConfig( {
			spinner,
			debug,
			xdebug,
			spx,
			writeChanges: true,
			customConfigPath: config.customConfigPath,
		} );

		// Check if the hash of the config has changed. If so, run configuration.
		const configHash = md5( fullConfig );
		const { workDirectoryPath, dockerComposeConfigPath } = fullConfig;
		const shouldConfigureWp =
			( update ||
				( await didCacheChange( CONFIG_CACHE_KEY, configHash, {
					workDirectoryPath,
				} ) ) ) &&
			// Don't reconfigure everything when we can't connect to the internet because
			// the majority of update tasks involve connecting to the internet. (Such
			// as downloading sources and pulling docker images.)
			( await canAccessWPORG() );

		const dockerComposeConfig = {
			config: dockerComposeConfigPath,
			log: fullConfig.debug,
		};

		if ( ! ( await canAccessWPORG() ) ) {
			spinner.info( 'wp-env is offline' );
		}

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
		if ( shouldConfigureWp ) {
			await this.stop( fullConfig, { spinner, debug } );
			// Update the images before starting the services again.
			spinner.text = 'Updating docker images.';

			const directoryHash = path.basename( workDirectoryPath );

			// Note: when the base docker image is updated, we want that operation to
			// also update WordPress. Since we store wordpress/tests-wordpress files
			// as docker volumes, simply updating the image will not change those
			// files. Thus, we need to remove those volumes in order for the files
			// to be updated when pulling the new images.
			const volumesToRemove = `${ directoryHash }_wordpress ${ directoryHash }_tests-wordpress`;

			try {
				if ( fullConfig.debug ) {
					spinner.text = `Removing the WordPress volumes: ${ volumesToRemove }`;
				}
				await exec( `docker volume rm ${ volumesToRemove }` );
			} catch {
				// Note: we do not care about this error condition because it will
				// mostly happen when the volume already exists. This error would not
				// stop wp-env from working correctly.
			}

			await dockerCompose.pullAll( dockerComposeConfig );
			spinner.text = 'Downloading sources.';
		}

		await Promise.all( [
			dockerCompose.upMany( [ 'mysql', 'tests-mysql' ], {
				...dockerComposeConfig,
				commandOptions: shouldConfigureWp
					? [ '--build', '--force-recreate' ]
					: [],
			} ),
			shouldConfigureWp && downloadSources( fullConfig, spinner ),
		] );

		if ( shouldConfigureWp ) {
			spinner.text = 'Setting up WordPress directories';

			await setupWordPressDirectories( fullConfig );

			// Use the WordPress versions to download the PHPUnit suite.
			const wpVersions = await Promise.all( [
				readWordPressVersion(
					fullConfig.env.development.coreSource,
					spinner,
					debug
				),
				readWordPressVersion(
					fullConfig.env.tests.coreSource,
					spinner,
					debug
				),
			] );
			await downloadWPPHPUnit(
				fullConfig,
				{ development: wpVersions[ 0 ], tests: wpVersions[ 1 ] },
				spinner,
				debug
			);
		}

		spinner.text = 'Starting WordPress.';

		await dockerCompose.upMany(
			[ 'wordpress', 'tests-wordpress', 'cli', 'tests-cli' ],
			{
				...dockerComposeConfig,
				commandOptions: shouldConfigureWp
					? [ '--build', '--force-recreate' ]
					: [],
			}
		);

		if ( fullConfig.env.development.phpmyadminPort ) {
			await dockerCompose.upOne( 'phpmyadmin', {
				...dockerComposeConfig,
				commandOptions: shouldConfigureWp
					? [ '--build', '--force-recreate' ]
					: [],
			} );
		}

		if ( fullConfig.env.tests.phpmyadminPort ) {
			await dockerCompose.upOne( 'tests-phpmyadmin', {
				...dockerComposeConfig,
				commandOptions: shouldConfigureWp
					? [ '--build', '--force-recreate' ]
					: [],
			} );
		}

		// Make sure we've consumed the custom CLI dockerfile.
		if ( shouldConfigureWp ) {
			await dockerCompose.buildOne( [ 'cli' ], {
				...dockerComposeConfig,
			} );
		}

		// Only run WordPress install/configuration when config has changed.
		if ( shouldConfigureWp ) {
			spinner.text = 'Configuring WordPress.';

			// Retry WordPress installation in case MySQL *still* wasn't ready.
			await Promise.all( [
				retry(
					() =>
						configureWordPress(
							'development',
							fullConfig,
							spinner
						),
					{
						times: 2,
					}
				),
				retry(
					() => configureWordPress( 'tests', fullConfig, spinner ),
					{
						times: 2,
					}
				),
			] );

			// Set the cache key once everything has been configured.
			await setCache( CONFIG_CACHE_KEY, configHash, {
				workDirectoryPath,
			} );
		}

		// Get port information for the result message
		const siteUrl = fullConfig.env.development.config.WP_SITEURL;
		const testsSiteUrl = fullConfig.env.tests.config.WP_SITEURL;

		const mySQLPort = await this._getPublicDockerPort(
			'mysql',
			3306,
			dockerComposeConfig
		);

		const testsMySQLPort = await this._getPublicDockerPort(
			'tests-mysql',
			3306,
			dockerComposeConfig
		);

		const phpmyadminPort = fullConfig.env.development.phpmyadminPort
			? await this._getPublicDockerPort(
					'phpmyadmin',
					80,
					dockerComposeConfig
			  )
			: null;

		const testsPhpmyadminPort = fullConfig.env.tests.phpmyadminPort
			? await this._getPublicDockerPort(
					'tests-phpmyadmin',
					80,
					dockerComposeConfig
			  )
			: null;

		const message = [
			'WordPress development site started' +
				( siteUrl ? ` at ${ siteUrl }` : '.' ),
			'WordPress test site started' +
				( testsSiteUrl ? ` at ${ testsSiteUrl }` : '.' ),
			`MySQL is listening on port ${ mySQLPort }`,
			`MySQL for automated testing is listening on port ${ testsMySQLPort }`,
			phpmyadminPort &&
				`phpMyAdmin started at http://localhost:${ phpmyadminPort }`,
			testsPhpmyadminPort &&
				`phpMyAdmin for automated testing started at http://localhost:${ testsPhpmyadminPort }`,
		]
			.filter( Boolean )
			.join( '\n' );

		return {
			message,
			siteUrl,
		};
	}

	/**
	 * Get the public port for a Docker service.
	 *
	 * @param {string} service             The service name.
	 * @param {number} containerPort       The container port.
	 * @param {Object} dockerComposeConfig The docker-compose config.
	 * @return {Promise<string>} The public port.
	 */
	async _getPublicDockerPort( service, containerPort, dockerComposeConfig ) {
		const { out: address } = await dockerCompose.port(
			service,
			containerPort,
			dockerComposeConfig
		);
		return address.split( ':' ).pop().trim();
	}

	/**
	 * Get the warning message for destroy confirmation.
	 *
	 * @return {string} Warning message.
	 */
	getDestroyWarningMessage() {
		return 'WARNING! This will remove Docker containers, volumes, networks, and images associated with the WordPress instance.';
	}

	/**
	 * Get the warning message for cleanup confirmation.
	 *
	 * @return {string} Warning message.
	 */
	getCleanupWarningMessage() {
		return 'WARNING! This will remove Docker containers, volumes, networks, and local files associated with the WordPress instance. Docker images will be preserved.';
	}

	/**
	 * Stop the Docker containers.
	 *
	 * @param {WPConfig} config          The wp-env config object.
	 * @param {Object}   options         Stop options.
	 * @param {Object}   options.spinner A CLI spinner which indicates progress.
	 * @param {boolean}  options.debug   True if debug mode is enabled.
	 */
	async stop( config, { spinner, debug } ) {
		const { dockerComposeConfigPath } = await initConfig( {
			spinner,
			debug,
			customConfigPath: config.customConfigPath,
		} );

		spinner.text = 'Stopping WordPress.';

		await dockerCompose.down( {
			config: dockerComposeConfigPath,
			log: debug,
		} );

		spinner.text = 'Stopped WordPress.';
	}

	/**
	 * Destroy the Docker containers and remove local files.
	 *
	 * @param {WPConfig} config          The wp-env config object.
	 * @param {Object}   options         Destroy options.
	 * @param {Object}   options.spinner A CLI spinner which indicates progress.
	 * @param {boolean}  options.debug   True if debug mode is enabled.
	 */
	async destroy( config, { spinner, debug } ) {
		spinner.text = 'Removing docker images, volumes, and networks.';

		await dockerCompose.down( {
			config: config.dockerComposeConfigPath,
			commandOptions: [ '--volumes', '--remove-orphans', '--rmi', 'all' ],
			log: debug,
		} );

		spinner.text = 'Removing local files.';
		// Note: there is a race condition where docker compose actually hasn't finished
		// by this point, which causes rimraf to fail. We need to wait at least 2.5-5s,
		// but using 10s in case it's dependent on the machine. Removing images takes
		// longer so we use a longer wait time here.
		await new Promise( ( resolve ) => setTimeout( resolve, 10000 ) );
		await rimraf( config.workDirectoryPath );

		spinner.text = 'Removed WordPress environment.';
	}

	/**
	 * Cleanup the Docker containers and remove local files, but preserve images.
	 *
	 * @param {WPConfig} config          The wp-env config object.
	 * @param {Object}   options         Cleanup options.
	 * @param {Object}   options.spinner A CLI spinner which indicates progress.
	 * @param {boolean}  options.debug   True if debug mode is enabled.
	 */
	async cleanup( config, { spinner, debug } ) {
		spinner.text = 'Removing docker containers, volumes, and networks.';

		await dockerCompose.down( {
			config: config.dockerComposeConfigPath,
			commandOptions: [ '--volumes', '--remove-orphans' ],
			log: debug,
		} );

		spinner.text = 'Removing local files.';
		// Note: there is a race condition where docker compose actually hasn't finished
		// by this point, which causes rimraf to fail. We need to wait at least 2.5-5s,
		// but since we're not removing images, the wait can be shorter.
		await new Promise( ( resolve ) => setTimeout( resolve, 3000 ) );
		await rimraf( config.workDirectoryPath );

		spinner.text = 'Cleaned up WordPress environment.';
	}

	/**
	 * Reset the WordPress database.
	 *
	 * @param {WPConfig} config              The wp-env config object.
	 * @param {Object}   options             Reset options.
	 * @param {string}   options.environment The environment to reset.
	 * @param {Object}   options.spinner     A CLI spinner which indicates progress.
	 * @param {boolean}  options.debug       True if debug mode is enabled.
	 */
	async clean( config, { environment, spinner, debug } ) {
		const fullConfig = await initConfig( {
			spinner,
			debug,
			customConfigPath: config.customConfigPath,
		} );

		const description = `${ environment } environment${
			environment === 'all' ? 's' : ''
		}`;
		spinner.text = `Resetting ${ description }.`;

		const tasks = [];

		// Start the appropriate MySQL service(s) first to avoid race conditions
		// where parallel tasks try to create docker networks with the same name.
		// The dependency chain (cli -> wordpress -> mysql with service_healthy)
		// ensures MySQL is ready before database operations run.
		const mysqlServices = [];
		if ( environment === 'all' || environment === 'development' ) {
			mysqlServices.push( 'mysql' );
		}
		if ( environment === 'all' || environment === 'tests' ) {
			mysqlServices.push( 'tests-mysql' );
		}

		await dockerCompose.upMany( mysqlServices, {
			config: fullConfig.dockerComposeConfigPath,
			log: fullConfig.debug,
		} );

		if ( environment === 'all' || environment === 'development' ) {
			tasks.push(
				resetDatabase( 'development', fullConfig )
					.then( () =>
						configureWordPress( 'development', fullConfig )
					)
					.catch( () => {} )
			);
		}

		if ( environment === 'all' || environment === 'tests' ) {
			tasks.push(
				resetDatabase( 'tests', fullConfig )
					.then( () => configureWordPress( 'tests', fullConfig ) )
					.catch( () => {} )
			);
		}

		await Promise.all( tasks );

		spinner.text = `Reset ${ description }.`;
	}

	/**
	 * Get the list of valid container names for the run command.
	 *
	 * @return {string[]} Array of valid container names.
	 */
	getRunContainers() {
		return RUN_CONTAINERS;
	}

	/**
	 * Run a command in a Docker container.
	 *
	 * @param {WPConfig} config            The wp-env config object.
	 * @param {Object}   options           Run options.
	 * @param {string}   options.container The container to run the command in.
	 * @param {string[]} options.command   The command to run.
	 * @param {string}   options.envCwd    The working directory.
	 * @param {Object}   options.spinner   A CLI spinner which indicates progress.
	 * @param {boolean}  options.debug     True if debug mode is enabled.
	 */
	async run( config, { container, command, envCwd, spinner, debug } ) {
		// Validate the container name (throws for deprecated containers)
		validateRunContainer( container );

		const fullConfig = await initConfig( {
			spinner,
			debug,
			customConfigPath: config.customConfigPath,
		} );

		// Shows a contextual tip for the given command.
		const joinedCommand = command.join( ' ' );
		this._showCommandTips( joinedCommand, container, spinner );

		await this._spawnCommandDirectly(
			fullConfig,
			container,
			command,
			envCwd
		);

		spinner.text = `Ran \`${ joinedCommand }\` in '${ container }'.`;
	}

	/**
	 * Show logs from Docker containers.
	 *
	 * @param {WPConfig} config              The wp-env config object.
	 * @param {Object}   options             Logs options.
	 * @param {string}   options.environment The environment to show logs for.
	 * @param {boolean}  options.watch       If true, follow along with log output.
	 * @param {Object}   options.spinner     A CLI spinner which indicates progress.
	 * @param {boolean}  options.debug       True if debug mode is enabled.
	 */
	async logs( config, { environment, watch, spinner, debug } ) {
		const fullConfig = await initConfig( {
			spinner,
			debug,
			customConfigPath: config.customConfigPath,
		} );

		// If we show text while watching the logs, it will continue showing up every
		// few lines in the logs as they happen, which isn't a good look. So only
		// show the message if we are not watching the logs.
		if ( ! watch ) {
			spinner.text = `Showing logs for the ${ environment } environment.`;
		}

		const servicesToWatch =
			environment === 'all'
				? [ 'tests-wordpress', 'wordpress' ]
				: [ environment === 'tests' ? 'tests-wordpress' : 'wordpress' ];

		const output = await Promise.all( [
			...servicesToWatch.map( ( service ) =>
				dockerCompose.logs( service, {
					config: fullConfig.dockerComposeConfigPath,
					log: watch, // Must log inline if we are watching the log output.
					commandOptions: watch ? [ '--follow' ] : [],
				} )
			),
		] );

		// Combine the results from each docker output.
		const result = output.reduce(
			( acc, current ) => {
				if ( current.out ) {
					acc.out = acc.out.concat( current.out );
				}
				if ( current.err ) {
					acc.err = acc.err.concat( current.err );
				}
				if ( current.exitCode !== 0 ) {
					acc.hasNon0ExitCode = true;
				}
				return acc;
			},
			{ out: '', err: '', hasNon0ExitCode: false }
		);

		if ( result.out.length ) {
			console.log(
				process.stdout.isTTY ? `\n\n${ result.out }\n\n` : result.out
			);
		} else if ( result.err.length ) {
			console.error(
				process.stdout.isTTY ? `\n\n${ result.err }\n\n` : result.err
			);
			if ( result.hasNon0ExitCode ) {
				throw result.err;
			}
		}

		spinner.text = 'Finished showing logs.';
	}

	/**
	 * Get the status of the Docker environment.
	 *
	 * @param {WPConfig} config          The wp-env config object.
	 * @param {Object}   options         Status options.
	 * @param {Object}   options.spinner A CLI spinner which indicates progress.
	 * @param {boolean}  options.debug   True if debug mode is enabled.
	 * @return {Promise<Object>} Status object with environment information.
	 */
	async getStatus( config, { spinner, debug } ) {
		spinner.text = 'Getting environment status.';

		const fullConfig = await initConfig( {
			spinner,
			debug,
			customConfigPath: config.customConfigPath,
		} );
		const dockerComposeConfig = {
			config: fullConfig.dockerComposeConfigPath,
			log: debug,
		};

		// Check if containers are running by trying to get a port.
		let isRunning = false;
		let mySQLPort = null;
		let phpmyadminPort = null;

		try {
			mySQLPort = await this._getPublicDockerPort(
				'mysql',
				3306,
				dockerComposeConfig
			);
			isRunning = true;

			if ( fullConfig.env.development.phpmyadminPort ) {
				phpmyadminPort = await this._getPublicDockerPort(
					'phpmyadmin',
					80,
					dockerComposeConfig
				);
			}
		} catch {
			// Containers are not running.
		}

		const siteUrl = fullConfig.env.development.config.WP_SITEURL;

		return {
			status: isRunning ? 'running' : 'stopped',
			runtime: 'docker',
			urls: {
				development: isRunning ? siteUrl : null,
				phpmyadmin:
					isRunning && phpmyadminPort
						? `http://localhost:${ phpmyadminPort }`
						: null,
			},
			ports: {
				development: fullConfig.env.development.port,
				tests: fullConfig.env.tests.port,
				mysql: mySQLPort,
			},
			config: {
				multisite: fullConfig.env.development.multisite,
				xdebug: fullConfig.xdebug || 'off',
			},
			configPath: fullConfig.configDirectoryPath,
			installPath: fullConfig.workDirectoryPath,
		};
	}

	/**
	 * Runs an arbitrary command on the given Docker container.
	 *
	 * @param {WPConfig} config    The wp-env configuration.
	 * @param {string}   container The Docker container to run the command on.
	 * @param {string[]} command   The command to run.
	 * @param {string}   envCwd    The working directory for the command.
	 * @return {Promise} Promise that resolves when the command completes.
	 */
	_spawnCommandDirectly( config, container, command, envCwd ) {
		// Both the `wordpress` and `tests-wordpress` containers have the host's
		// user so that they can maintain ownership parity with the host OS.
		// We should run any commands as that user so that they are able
		// to interact with the files mounted from the host.
		const hostUser = getHostUser();

		// Since Docker requires absolute paths, we should resolve the input to a POSIX path.
		// This is needed because Windows resolves relative paths from the C: drive.
		envCwd = path.posix.resolve(
			// Not all containers have the same starting working directory.
			container === 'mysql' || container === 'tests-mysql'
				? '/'
				: '/var/www/html',
			// Remove spaces and single quotes from both ends of the path.
			// This is needed because Windows treats single quotes as a literal character.
			envCwd.trim().replace( /^'|'$/g, '' )
		);

		const composeCommand = [
			'compose',
			'-f',
			config.dockerComposeConfigPath,
			'exec',
			'-w',
			envCwd,
			'--user',
			hostUser.fullUser,
		];

		if ( ! process.stdout.isTTY ) {
			composeCommand.push( '-T' );
		}

		composeCommand.push( container, ...command );

		return new Promise( ( resolve, reject ) => {
			// Note: since the npm docker-compose package uses the -T option, we
			// cannot use it to spawn an interactive command. Thus, we run docker-
			// compose on the CLI directly.
			const childProc = spawn( 'docker', composeCommand, {
				stdio: 'inherit',
			} );
			childProc.on( 'error', reject );
			childProc.on( 'exit', ( code ) => {
				// Code 130 is set if the user tries to exit with ctrl-c before using
				// ctrl-d (so it is not an error which should fail the script.)
				if ( code === 0 || code === 130 ) {
					resolve();
				} else {
					reject( `Command failed with exit code ${ code }` );
				}
			} );
		} );
	}

	/**
	 * This shows a contextual tip for the command being run. Certain commands (like
	 * bash) may have weird behavior (exit with ctrl-d instead of ctrl-c or ctrl-z),
	 * so we want the user to have that information without having to ask someone.
	 *
	 * @param {string} joinedCommand The command joined by spaces.
	 * @param {string} container     The container the command will be run on.
	 * @param {Object} spinner       A spinner object to show progress.
	 */
	_showCommandTips( joinedCommand, container, spinner ) {
		if ( ! joinedCommand.length ) {
			return;
		}

		const tip = `Starting '${ joinedCommand }' on the ${ container } container. ${ ( () => {
			switch ( joinedCommand ) {
				case 'bash':
					return 'Exit bash with ctrl-d.';
				case 'wp shell':
					return 'Exit the WordPress shell with ctrl-c.';
				default:
					return '';
			}
		} )() }\n`;
		spinner.info( tip );
	}
}

module.exports = DockerRuntime;
