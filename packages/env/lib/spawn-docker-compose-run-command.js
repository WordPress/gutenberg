/**
 * External dependencies
 */
const { spawn } = require( 'child_process' );

/**
 * @typedef {import('../config').Config} Config
 */

/**
 * Runs an arbitrary command on the given Docker container.
 *
 * @param {Config}      config     The wp-env configuration.
 * @param {string}      container  The Docker container to run the command on.
 * @param {string|null} workingDir The working directory that the command should be executed in.
 * @param {string}      command    The command to run.
 * @param {Object}      spinner    A CLI spinner which indicates progress.
 */
module.exports = function spawnDockerComposeRunCommand(
	config,
	container,
	workingDir,
	command,
	spinner
) {
	// Start building the commany we're going to send to Docker.
	const composeCommand = [ '-f', config.dockerComposeConfigPath, 'run' ];

	// Pass the working directory if one has been supplied.
	if ( workingDir ) {
		composeCommand.push( '-w', workingDir );
	}

	// Finish building the command.
	composeCommand.push( '--rm', container, ...command.split( ' ' ) );

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
};
