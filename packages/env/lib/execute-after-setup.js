'use strict';
/**
 * External dependencies
 */
const { execSync } = require( 'child_process' );

/**
 * @typedef {import('./config').WPConfig} WPConfig
 */

/**
 * Error subtype which indicates that the afterSetup command failed.
 */
class AfterSetupError extends Error {}

/**
 * Executes any defined afterSetup command.
 *
 * @param {WPConfig} config  The config object to use.
 * @param {Object}   spinner A CLI spinner which indciates progress.
 */
function executeAfterSetup( config, spinner ) {
	if ( ! config.afterSetup ) {
		return;
	}

	spinner.text = 'Executing Script: afterSetup';

	try {
		let output = execSync( config.afterSetup, {
			encoding: 'utf-8',
			stdio: 'pipe',
			env: process.env,
		} );

		// Remove any trailing whitespace for nicer output.
		output = output.trimRight();

		// We don't need to bother with any output if there isn't any.
		if ( output ) {
			spinner.info( `After Setup:\n${ output }` );
		}
	} catch ( error ) {
		throw new AfterSetupError( `After Setup:\n${ error.stderr }` );
	}
}

module.exports = {
	AfterSetupError,
	executeAfterSetup,
};
