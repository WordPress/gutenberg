'use strict';
/**
 * External dependencies
 */
const { spawn } = require( 'child_process' );
const path = require( 'path' );

/**
 * Internal dependencies
 */
const initConfig = require( '../init-config' );
const getHostUser = require( '../get-host-user' );
const { ValidationError } = require( '../config' );

/**
 * @typedef {import('../config').WPConfig} WPConfig
 */

/**
 * Runs an arbitrary command on the given Docker container.
 *
 * @param {Object}   options
 * @param {string}   options.container The Docker container to run the command on.
 * @param {string[]} options.command   The command to run.
 * @param {string}   options.envCwd    The working directory for the command to be executed from.
 * @param {Object}   options.spinner   A CLI spinner which indicates progress.
 * @param {boolean}  options.debug     True if debug mode is enabled.
 */
module.exports = async function run( {
	container,
	command,
	envCwd,
	spinner,
	debug,
} ) {
	validateContainerExistence( container );

	const config = await initConfig( { spinner, debug } );

	command = command.join( ' ' );

	// Shows a contextual tip for the given command.
	showCommandTips( command, container, spinner );

	await spawnCommandDirectly( config, container, command, envCwd, spinner );

	spinner.text = `Ran \`${ command }\` in '${ container }'.`;
};

/**
 * Validates the container option and throws if it is invalid.
 *
 * @param {string} container The Docker container to run the command on.
 */
function validateContainerExistence( container ) {
	// Give better errors for containers that we have removed.
	if ( container === 'phpunit' ) {
		throw new ValidationError(
			"The 'phpunit' container has been removed. Please use 'wp-env run tests-cli --env-cwd=wp-content/path/to/plugin phpunit' instead."
		);
	}
	if ( container === 'composer' ) {
		throw new ValidationError(
			"The 'composer' container has been removed. Please use 'wp-env run cli --env-cwd=wp-content/path/to/plugin composer' instead."
		);
	}

	// Provide better error output than Docker's "service does not exist" messaging.
	const validContainers = [
		'mysql',
		'tests-mysql',
		'wordpress',
		'tests-wordpress',
		'cli',
		'tests-cli',
	];
	if ( ! validContainers.includes( container ) ) {
		throw new ValidationError(
			`The '${ container }' container does not exist. Valid selections are: ${ validContainers.join(
				', '
			) }`
		);
	}
}

/**
 * Runs an arbitrary command on the given Docker container.
 *
 * @param {WPConfig} config    The wp-env configuration.
 * @param {string}   container The Docker container to run the command on.
 * @param {string}   command   The command to run.
 * @param {string}   envCwd    The working directory for the command to be executed from.
 * @param {Object}   spinner   A CLI spinner which indicates progress.
 */
function spawnCommandDirectly( config, container, command, envCwd, spinner ) {
	// Both the `wordpress` and `tests-wordpress` containers have the host's
	// user so that they can maintain ownership parity with the host OS.
	// We should run any commands as that user so that they are able
	// to interact with the files mounted from the host.
	const hostUser = getHostUser();

	// We need to pass absolute paths to the container.
	envCwd = path.resolve(
		// Not all containers have the same starting working directory.
		container === 'mysql' || container === 'tests-mysql'
			? '/'
			: '/var/www/html',
		envCwd
	);

	const isTTY = process.stdout.isTTY;
	const composeCommand = [
		'-f',
		config.dockerComposeConfigPath,
		'exec',
		! isTTY ? '-T' : '',
		'-w',
		envCwd,
		'--user',
		hostUser.fullUser,
		container,
		...command.split( ' ' ), // The command will fail if passed as a complete string.
	];

	return new Promise( ( resolve, reject ) => {
		// Note: since the npm docker-compose package uses the -T option, we
		// cannot use it to spawn an interactive command. Thus, we run docker-
		// compose on the CLI directly.
		const childProc = spawn(
			'docker-compose',
			composeCommand,
			{
				stdio: 'inherit',
				shell: true,
			},
			spinner
		);
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
 * @param {string} command   The command for which to show a tip.
 * @param {string} container The container the command will be run on.
 * @param {Object} spinner   A spinner object to show progress.
 */
function showCommandTips( command, container, spinner ) {
	if ( ! command.length ) {
		return;
	}

	const tip = `Starting '${ command }' on the ${ container } container. ${ ( () => {
		switch ( command ) {
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
