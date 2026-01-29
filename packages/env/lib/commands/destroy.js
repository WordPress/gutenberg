'use strict';
/**
 * External dependencies
 */
const fs = require( 'fs' ).promises;
const path = require( 'path' );
const { confirm } = require( '@inquirer/prompts' );

/**
 * Internal dependencies
 */
const { loadConfig } = require( '../config' );
const { executeLifecycleScript } = require( '../execute-lifecycle-script' );
const { getRuntime, detectRuntime } = require( '../runtime' );

/**
 * Destroy the development server.
 *
 * @param {Object}  options
 * @param {Object}  options.spinner A CLI spinner which indicates progress.
 * @param {boolean} options.scripts Indicates whether or not lifecycle scripts should be executed.
 * @param {boolean} options.debug   True if debug mode is enabled.
 */
module.exports = async function destroy( { spinner, scripts, debug } ) {
	const config = await loadConfig( path.resolve( '.' ) );

	try {
		await fs.readdir( config.workDirectoryPath );
	} catch {
		spinner.text = 'Could not find any files to remove.';
		return;
	}

	const runtime = getRuntime( detectRuntime( config.workDirectoryPath ) );

	spinner.info( runtime.getDestroyWarningMessage() );

	let yesDelete = false;
	try {
		yesDelete = await confirm( {
			message: 'Are you sure you want to continue?',
			default: false,
		} );
	} catch ( error ) {
		if ( error.name === 'ExitPromptError' ) {
			console.log( 'Cancelled.' );
			process.exit( 1 );
		}
		throw error;
	}

	spinner.start();

	if ( ! yesDelete ) {
		spinner.text = 'Cancelled.';
		return;
	}

	await runtime.destroy( config, { spinner, debug } );

	if ( scripts ) {
		await executeLifecycleScript( 'afterDestroy', config, spinner );
	}
};
