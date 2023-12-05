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

/**
 * @typedef {import('../config').WPConfig} WPConfig
 */

/**
 * Runs an arbitrary command on the given Docker container.
 *
 * @param {Object}   options
 * @param {string}   options.container The Docker container to run the command on.
 * @param {string[]} options.command   The command to run.
 * @param {string[]} options.'--'      Any arguments that were passed after a double dash.
 * @param {string}   options.envCwd    The working directory for the command to be executed from.
 * @param {Object}   options.spinner   A CLI spinner which indicates progress.
 * @param {boolean}  options.debug     True if debug mode is enabled.
 */
module.exports = async function run( {
	container,
	command,
	'--': doubleDashedArgs,
	envCwd,
	spinner,
	debug,
} ) {
	const config = await initConfig( { spinner, debug } );

	// Include any double dashed arguments in the command so that we can pass them to Docker.
	// This lets users pass options that the command defines without them being parsed.
	if ( Array.isArray( doubleDashedArgs ) ) {
		command.push( ...doubleDashedArgs );
	}

	// Shows a contextual tip for the given command.
	const joinedCommand = command.join( ' ' );
	showCommandTips( joinedCommand, container, spinner );

	await spawnCommandDirectly( config, container, command, envCwd, spinner );

	spinner.text = `Ran \`${ joinedCommand }\` in '${ container }'.`;
};

/**
 * Runs an arbitrary command on the given Docker container.
 *
 * @param {WPConfig} config    The wp-env configuration.
 * @param {string}   container The Docker container to run the command on.
 * @param {string[]} command   The command to run.
 * @param {string}   envCwd    The working directory for the command to be executed from.
 * @param {Object}   spinner   A CLI spinner which indicates progress.
 */
function spawnCommandDirectly( config, container, command, envCwd, spinner ) {
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
		const childProc = spawn(
			'docker',
			composeCommand,
			{ stdio: 'inherit' },
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
 * @param {string} joinedCommand The command for which to show a tip joined by spaces.
 * @param {string} container     The container the command will be run on.
 * @param {Object} spinner       A spinner object to show progress.
 */
function showCommandTips( joinedCommand, container, spinner ) {
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
