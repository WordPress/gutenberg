'use strict';
/**
 * External dependencies
 */
const { spawn } = require( 'child_process' );
const path = require( 'path' );
const { v2: dockerCompose } = require( 'docker-compose' );
const { rimraf } = require( 'rimraf' );

/**
 * Internal dependencies
 */
const initConfig = require( '../../init-config' );
const getHostUser = require( '../../get-host-user' );
const { configureWordPress, resetDatabase } = require( '../../wordpress' );

/**
 * @typedef {import('../../config').WPConfig} WPConfig
 */

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
		const { execSync } = require( 'child_process' );
		try {
			execSync( 'docker info', { stdio: 'ignore' } );
			return true;
		} catch {
			return false;
		}
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
		// but using 10s in case it's dependant on the machine.
		await new Promise( ( resolve ) => setTimeout( resolve, 10000 ) );
		await rimraf( config.workDirectoryPath );

		spinner.text = 'Removed WordPress environment.';
	}

	/**
	 * Clean/reset the WordPress database.
	 *
	 * @param {WPConfig} config              The wp-env config object.
	 * @param {Object}   options             Clean options.
	 * @param {string}   options.environment The environment to clean.
	 * @param {Object}   options.spinner     A CLI spinner which indicates progress.
	 * @param {boolean}  options.debug       True if debug mode is enabled.
	 */
	async clean( config, { environment, spinner, debug } ) {
		const fullConfig = await initConfig( { spinner, debug } );

		const description = `${ environment } environment${
			environment === 'all' ? 's' : ''
		}`;
		spinner.text = `Cleaning ${ description }.`;

		const tasks = [];

		// Start the database first to avoid race conditions where all tasks create
		// different docker networks with the same name.
		await dockerCompose.upOne( 'mysql', {
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

		spinner.text = `Cleaned ${ description }.`;
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
		const fullConfig = await initConfig( { spinner, debug } );

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
		const fullConfig = await initConfig( { spinner, debug } );

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
