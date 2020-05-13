/**
 * External dependencies
 */
const dockerCompose = require( 'docker-compose' );

/**
 * Internal dependencies
 */
const initConfig = require( '../init-config' );
const getDockerPath = require( '../get-docker-path' );

/**
 * Runs an arbitrary command on the given Docker container.
 *
 * @param {Object}  options
 * @param {Object}  options.container The Docker container to run the command on.
 * @param {Object}  options.command   The command to run.
 * @param {Object}  options.spinner   A CLI spinner which indicates progress.
 * @param {boolean} options.debug     True if debug mode is enabled.
 */
module.exports = async function run( {
	container,
	command,
	cwd,
	spinner,
	debug,
} ) {
	const config = await initConfig( { spinner, debug } );

	command = Array.isArray( command ) ? command.join( ' ' ) : command;

	spinner.text = `Running \`${ command }\` in '${ container }'.`;

	const commandOptions = [ '--rm' ];
	if ( cwd ) {
		// If a cwd for the command was passed, turn it into an internal absolute
		// path. As given, it is relative to the local filesystem, not docker.
		const internalPath = getDockerPath( config, cwd );
		if ( ! internalPath ) {
			throw new Error(
				'Could not convert the given work directory into an internal Docker path.'
			);
		}
		commandOptions.push( [ '-w', internalPath ] );
	}

	const result = await dockerCompose.run( container, command, {
		config: config.dockerComposeConfigPath,
		log: config.debug,
		commandOptions,
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
};
