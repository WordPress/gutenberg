'use strict';
/**
 * External dependencies
 */
const path = require( 'path' );
const chalk = require( 'chalk' );

/**
 * Internal dependencies
 */
const { loadConfig } = require( '../config' );
const {
	getRuntime,
	detectRuntime,
	EnvironmentNotInitializedError,
} = require( '../runtime' );

/**
 * Outputs the status of the wp-env environment.
 *
 * @param {Object}  options
 * @param {Object}  options.spinner A CLI spinner which indicates progress.
 * @param {boolean} options.debug   True if debug mode is enabled.
 * @param {boolean} options.json    True to output as JSON.
 */
module.exports = async function status( { spinner, debug, json } ) {
	spinner.text = 'Getting environment status.';

	const config = await loadConfig( path.resolve( '.' ) );

	// Detect and get runtime.
	let runtimeName;
	try {
		runtimeName = await detectRuntime( config.workDirectoryPath );
	} catch ( error ) {
		if ( error instanceof EnvironmentNotInitializedError ) {
			spinner.stop();
			if ( json ) {
				console.log(
					JSON.stringify( {
						status: 'uninitialized',
						workDirectoryPath: config.workDirectoryPath,
						configDirectoryPath: config.configDirectoryPath,
					} )
				);
			} else {
				console.log( formatNotInitialized( config ) );
			}
			return;
		}
		throw error;
	}
	const runtime = getRuntime( runtimeName );

	// Get status from runtime.
	const statusData = await runtime.getStatus( config, { spinner, debug } );

	spinner.stop();
	if ( json ) {
		console.log( JSON.stringify( statusData ) );
	} else {
		console.log( formatStatus( statusData ) );
	}
};

/**
 * Format status for human-readable output when not initialized.
 *
 * @param {Object} config The config object.
 * @return {string} Formatted output.
 */
function formatNotInitialized( config ) {
	const indent = '    - ';
	return `
${ chalk.bold( 'status' ) }: ${ chalk.red( 'uninitialized' ) }
${ indent }install path: ${ chalk.dim( config.workDirectoryPath ) }
${ indent }config: ${ chalk.dim( config.configDirectoryPath ) }

${ chalk.dim( 'Run `wp-env start` to initialize the environment.' ) }
`;
}

/**
 * Format status data for human-readable output.
 *
 * @param {Object} status The status object from runtime.
 * @return {string} Formatted output.
 */
function formatStatus( status ) {
	const statusColor = status.status === 'running' ? chalk.green : chalk.red;
	const indent = '    - ';
	const envIndent = '        - ';

	let output = `
${ chalk.bold( 'status' ) }: ${ statusColor( status.status ) }
${ indent }runtime: ${ chalk.dim( status.runtime ) }
${ indent }install path: ${ chalk.dim( status.workDirectoryPath ) }
${ indent }config: ${ chalk.dim( status.configDirectoryPath ) }
`;

	// Environment section.
	output += `\n${ chalk.bold( 'environment' ) }:\n`;
	if ( status.urls?.development ) {
		output += `${ envIndent }url: ${ chalk.dim(
			status.urls.development
		) }\n`;
	}
	output += `${ envIndent }multisite: ${ chalk.dim(
		status.config?.multisite ? 'yes' : 'no'
	) }\n`;
	output += `${ envIndent }xdebug: ${ chalk.dim(
		status.config?.xdebug || 'off'
	) }\n`;
	if ( status.ports?.development ) {
		output += `${ envIndent }http port: ${ chalk.dim(
			status.ports.development
		) }\n`;
	}
	if ( status.urls?.phpmyadmin ) {
		output += `${ envIndent }phpmyadmin url: ${ chalk.dim(
			status.urls.phpmyadmin
		) }\n`;
	}
	if ( status.ports?.mysql ) {
		output += `${ envIndent }mysql port: ${ chalk.dim(
			status.ports.mysql
		) }\n`;
	}
	if ( status.ports?.tests ) {
		output += `${ envIndent }test http port: ${ chalk.dim(
			status.ports.tests
		) }\n`;
	}

	return output;
}
