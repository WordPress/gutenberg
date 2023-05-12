'use strict';
/**
 * External dependencies
 */
const { execSync } = require( 'child_process' );

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
 * Executes any defined afterSetup command.
 *
 * @param {string}   event   The lifecycle event to run the script for.
 * @param {WPConfig} config  The config object to use.
 * @param {Object}   spinner A CLI spinner which indciates progress.
 */
function executeLifecycleScript( event, config, spinner ) {
	if ( ! config.lifecycleScripts[ event ] ) {
		return;
	}

	spinner.text = `Executing ${ event } Script`;

	try {
		let output = execSync( config.lifecycleScripts[ event ], {
			encoding: 'utf-8',
			stdio: 'pipe',
			env: process.env,
		} );

		// Remove any trailing whitespace for nicer output.
		output = output.trimRight();

		// We don't need to bother with any output if there isn't any.
		if ( output ) {
			spinner.info( `${ event }:\n${ output }` );
		}
	} catch ( error ) {
		throw new LifecycleScriptError( event, error.stderr );
	}
}

module.exports = {
	LifecycleScriptError,
	executeLifecycleScript,
};
