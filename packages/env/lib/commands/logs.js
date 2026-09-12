'use strict';
/**
 * External dependencies
 */
const { v2: dockerCompose } = require( 'docker-compose' );

/**
 * Internal dependencies
 */
const initConfig = require( '../init-config' );

/**
 * Displays the Docker & PHP logs on the given environment.
 *
 * @param {Object}  options
 * @param {Object}  options.environment The environment to run the command in (develop or tests).
 * @param {Object}  options.watch       If true, follow along with log output.
 * @param {Object}  options.spinner     A CLI spinner which indicates progress.
 * @param {boolean} options.debug       True if debug mode is enabled.
 */
module.exports = async function logs( { environment, watch, spinner, debug } ) {
	const config = await initConfig( { spinner, debug } );

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
				config: config.dockerComposeConfigPath,
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
};
