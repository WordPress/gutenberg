/**
 * Internal dependencies
 */
const initConfig = require( '../init-config' );
const spawnDockerComposeRunCommand = require( '../spawn-docker-compose-run-command' );

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

	// Shows a contextual tip for the given command.
	showCommandTips( container, command, spinner );

	await spawnDockerComposeRunCommand( config, container, command, spinner );

	spinner.text = `Ran \`${ command }\` in '${ container }'.`;
};

/**
 * This shows a contextual tip for the command being run. Certain commands (like
 * bash) may have weird behavior (exit with ctrl-d instead of ctrl-c or ctrl-z),
 * so we want the user to have that information without having to ask someone.
 *
 * @param {string}   container The container the command will be run on.
 * @param {string[]} command   The command for which to show a tip.
 * @param {Object}   spinner   A spinner object to show progress.
 */
function showCommandTips( container, command, spinner ) {
	command = command.join( ' ' );

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
