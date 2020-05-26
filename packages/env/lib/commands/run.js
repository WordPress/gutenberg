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

	spinner.info( typeof container );
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
			if ( code === 0 ) {
				resolve();
			} else {
				reject( `Command failed with exit code ${ code }` );
			}
		} );
	} );
}

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
