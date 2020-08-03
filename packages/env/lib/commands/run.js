/**
 * External dependencies
 */
const { spawn } = require( 'child_process' );

/**
 * Internal dependencies
 */
const initConfig = require( '../init-config' );

/**
 * @typedef {import('../config').Config} Config
 */

/**
 * Runs an arbitrary command on the given Docker container.
 *
 * @param {Object}   options
 * @param {string}   options.container The Docker container to run the command on.
 * @param {string[]} options.command   The command to run.
 * @param {Object}   options.spinner   A CLI spinner which indicates progress.
 * @param {boolean}  options.debug     True if debug mode is enabled.
 */
module.exports = async function run( { container, command, spinner, debug } ) {
	const config = await initConfig( { spinner, debug } );

	command = command.join( ' ' );

	// Shows a contextual tip for the given command.
	showCommandTips( command, container, spinner );

	await spawnCommandDirectly( {
		container,
		command,
		spinner,
		config,
	} );

	spinner.text = `Ran \`${ command }\` in '${ container }'.`;
};

/**
 * Runs an arbitrary command on the given Docker container.
 *
 * @param {Object} options
 * @param {string} options.container The Docker container to run the command on.
 * @param {string} options.command   The command to run.
 * @param {Config} options.config    The wp-env configuration.
 * @param {Object} options.spinner   A CLI spinner which indicates progress.
 */
function spawnCommandDirectly( { container, command, config, spinner } ) {
	const composeCommand = [
		'-f',
		config.dockerComposeConfigPath,
		'run',
		'--rm',
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
