/**
 * External dependencies
 */
const dockerCompose = require( 'docker-compose' );

/**
 * Internal dependencies
 */
const initConfig = require( '../init-config' );

/**
 * Runs an arbitrary command on the given Docker container.
 *
 * @param {Object}  options
 * @param {Object}  options.container The Docker container to run the command on.
 * @param {Object}  options.command   The command to run.
 * @param {Object}  options.spinner   A CLI spinner which indicates progress.
 * @param {boolean} options.debug     True if debug mode is enabled.
 */
module.exports = async function run( { container, command, spinner, debug } ) {
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
};
