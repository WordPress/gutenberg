'use strict';
/**
 * External dependencies
 */
const { exec } = require( 'child_process' );

/**
 * @typedef {import('./config').WPConfig} WPConfig
 */

/**
 * Error subtype which indicates that the lifecycle script failed.
 */
class LifecycleScriptError extends Error {
	constructor( event, stderr ) {
		super( `${ event } Error:\n${ stderr }` );

		this.event = event;
	}
}

/**
 * Executes any defined life cycle script.
 *
 * @param {string}   event   The lifecycle event to run the script for.
 * @param {WPConfig} config  The config object to use.
 * @param {Object}   spinner A CLI spinner which indciates progress.
 *
 * @return {Promise} Resolves when the script has completed and rejects when there is an error.
 */
function executeLifecycleScript( event, config, spinner ) {
	if ( ! config.lifecycleScripts[ event ] ) {
		return Promise.resolve();
	}

	return new Promise( ( resolve, reject ) => {
		// We're going to append the script output to the spinner while it's executing.
		const spinnerMessage = `Executing ${ event } Script`;
		spinner.text = spinnerMessage;

		// Execute the script asynchronously so that it won't block the spinner.
		const childProc = exec( config.lifecycleScripts[ event ], {
			encoding: 'utf-8',
			stdio: 'pipe',
			env: process.env,
		} );

		// Collect all of the output so that we can make use of it.
		let output = '';
		childProc.stdout.on( 'data', ( data ) => {
			output += data;

			// Keep the spinner updated with the command output.
			spinner.text = `${ spinnerMessage }\n${ output }`;
		} );

		// Listen for any error output so we can display it if the command fails.
		let error = '';
		childProc.stderr.on( 'data', ( data ) => {
			error += data;
		} );

		// Pass any process creation errors directly up.
		childProc.on( 'error', reject );

		// Handle the completion of the command based on whether it was successful or not.
		childProc.on( 'exit', ( code ) => {
			if ( code === 0 ) {
				// Keep the output of the command in debug mode.
				if ( config.debug ) {
					spinner.info( `${ event } Script:\n${ output.trimEnd() }` );
				}

				resolve();
				return;
			}

			reject( new LifecycleScriptError( event, error.trimEnd() ) );
		} );
	} );
}

module.exports = {
	LifecycleScriptError,
	executeLifecycleScript,
};
