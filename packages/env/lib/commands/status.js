'use strict';
/**
 * External dependencies
 */
const path = require( 'path' );
const { existsSync } = require( 'fs' );
const chalk = require( 'chalk' );

/**
 * Internal dependencies
 */
const { loadConfig } = require( '../config' );
const { getRuntime, detectRuntime } = require( '../runtime' );

/**
 * Check if an environment has been initialized by looking for runtime-specific files.
 *
 * @param {Object} config The wp-env configuration object.
 * @return {boolean} True if the environment has been initialized.
 */
function isEnvironmentInitialized( config ) {
	// Check for Docker's docker-compose.yml
	if ( existsSync( config.dockerComposeConfigPath ) ) {
		return true;
	}

	// Check for Playground's blueprint file
	const playgroundBlueprintPath = path.join(
		config.workDirectoryPath,
		'playground-blueprint.json'
	);
	if ( existsSync( playgroundBlueprintPath ) ) {
		return true;
	}

	return false;
}

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

	// Check if environment is initialized by looking for runtime-specific files.
	// We check for these files specifically because the work directory may exist
	// just from caching the WordPress version, but these files are only created
	// when `wp-env start` is actually run.
	if ( ! isEnvironmentInitialized( config ) ) {
		spinner.stop();
		if ( json ) {
			console.log(
				JSON.stringify( {
					status: 'uninitialized',
					installPath: config.workDirectoryPath,
					configPath: config.configDirectoryPath,
				} )
			);
		} else {
			console.log( formatNotInitialized( config ) );
		}
		return;
	}

	// Detect and get runtime.
	const runtimeName = detectRuntime( config.workDirectoryPath );
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

	let output = `
${ chalk.bold( 'status' ) }: ${ statusColor( status.status ) }
${ indent }runtime: ${ chalk.dim( status.runtime ) }
${ indent }install path: ${ chalk.dim( status.installPath ) }
${ indent }config: ${ chalk.dim( status.configPath ) }
`;

	// Environment section.
	output += `\n${ chalk.bold( 'environment' ) }:\n`;
	if ( status.urls?.development ) {
		output += `${ indent }url: ${ chalk.dim( status.urls.development ) }\n`;
	}
	output += `${ indent }multisite: ${ chalk.dim(
		status.config?.multisite ? 'yes' : 'no'
	) }\n`;
	output += `${ indent }xdebug: ${ chalk.dim(
		status.config?.xdebug || 'off'
	) }\n`;
	if ( status.ports?.development ) {
		output += `${ indent }http port: ${ chalk.dim(
			status.ports.development
		) }\n`;
	}
	if ( status.urls?.phpmyadmin ) {
		output += `${ indent }phpmyadmin url: ${ chalk.dim(
			status.urls.phpmyadmin
		) }\n`;
	}
	if ( status.ports?.mysql ) {
		output += `${ indent }mysql port: ${ chalk.dim(
			status.ports.mysql
		) }\n`;
	}
	if ( status.ports?.tests ) {
		output += `${ indent }test http port: ${ chalk.dim(
			status.ports.tests
		) }\n`;
	}

	return output;
}
