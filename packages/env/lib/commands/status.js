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
 */
module.exports = async function status( { spinner, debug } ) {
	spinner.text = 'Getting environment status.';

	const config = await loadConfig( path.resolve( '.' ) );

	// Check if environment is initialized by looking for runtime-specific files.
	// We check for these files specifically because the work directory may exist
	// just from caching the WordPress version, but these files are only created
	// when `wp-env start` is actually run.
	if ( ! isEnvironmentInitialized( config ) ) {
		spinner.stop();
		console.log( formatNotInitialized( config ) );
		return;
	}

	// Detect and get runtime.
	const runtimeName = detectRuntime( config.workDirectoryPath );
	const runtime = getRuntime( runtimeName );

	// Get status from runtime.
	const statusData = await runtime.getStatus( config, { spinner, debug } );

	spinner.stop();
	console.log( formatStatus( statusData ) );
};

/**
 * Format status for human-readable output when not initialized.
 *
 * @param {Object} config The config object.
 * @return {string} Formatted output.
 */
function formatNotInitialized( config ) {
	return `
${ chalk.bold( 'wp-env Status' ) }
${ chalk.dim( '─'.repeat( 40 ) ) }

Status: ${ chalk.red( 'Uninitialized' ) }
${ chalk.dim( 'Run `wp-env start` to initialize the environment.' ) }

Config Directory: ${ chalk.dim( config.configDirectoryPath ) }
Work Directory: ${ chalk.dim( config.workDirectoryPath ) }
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
	const statusText =
		status.status.charAt( 0 ).toUpperCase() + status.status.slice( 1 );

	let output = `
${ chalk.bold( 'wp-env Status' ) }
${ chalk.dim( '─'.repeat( 40 ) ) }

Status: ${ statusColor( statusText ) }
Runtime: ${ chalk.dim( status.runtime ) }
`;

	// URLs section.
	if ( status.urls ) {
		output += `
${ chalk.bold( 'URLs' ) }
${ chalk.dim( '─'.repeat( 40 ) ) }
`;
		if ( status.urls.development ) {
			output += `Development Site: ${ chalk.dim(
				status.urls.development
			) }\n`;
		}
		if ( status.urls.tests ) {
			output += `Tests Site: ${ chalk.dim( status.urls.tests ) }\n`;
		}
		if ( status.urls.phpmyadmin ) {
			output += `phpMyAdmin: ${ chalk.dim( status.urls.phpmyadmin ) }\n`;
		}
		if ( status.urls.testsPhpmyadmin ) {
			output += `Tests phpMyAdmin: ${ chalk.dim(
				status.urls.testsPhpmyadmin
			) }\n`;
		}
	}

	// Ports section.
	if ( status.ports ) {
		output += `
${ chalk.bold( 'Ports' ) }
${ chalk.dim( '─'.repeat( 40 ) ) }
`;
		if ( status.ports.development ) {
			output += `Development: ${ chalk.dim(
				status.ports.development
			) }\n`;
		}
		if ( status.ports.tests ) {
			output += `Tests: ${ chalk.dim( status.ports.tests ) }\n`;
		}
		if ( status.ports.mysql ) {
			output += `MySQL: ${ chalk.dim( status.ports.mysql ) }\n`;
		}
		if ( status.ports.testsMysql ) {
			output += `Tests MySQL: ${ chalk.dim(
				status.ports.testsMysql
			) }\n`;
		}
	}

	// Configuration section.
	if ( status.config ) {
		output += `
${ chalk.bold( 'Configuration' ) }
${ chalk.dim( '─'.repeat( 40 ) ) }
`;
		if ( status.config.wpVersion ) {
			output += `WordPress: ${ chalk.dim( status.config.wpVersion ) }\n`;
		}
		if ( status.config.phpVersion ) {
			output += `PHP Version: ${ chalk.dim(
				status.config.phpVersion
			) }\n`;
		}
		output += `Multisite: ${ chalk.dim(
			status.config.multisite ? 'Yes' : 'No'
		) }\n`;

		if ( status.config.plugins && status.config.plugins.length > 0 ) {
			output += `Plugins: ${ chalk.dim(
				status.config.plugins.join( ', ' )
			) }\n`;
		}
		if ( status.config.themes && status.config.themes.length > 0 ) {
			output += `Themes: ${ chalk.dim(
				status.config.themes.join( ', ' )
			) }\n`;
		}
		if ( status.config.mappings && status.config.mappings.length > 0 ) {
			output += `Mappings: ${ chalk.dim(
				status.config.mappings.join( ', ' )
			) }\n`;
		}
	}

	// Paths section.
	output += `
${ chalk.bold( 'Paths' ) }
${ chalk.dim( '─'.repeat( 40 ) ) }
Config Directory: ${ chalk.dim( status.configDirectoryPath ) }
Work Directory: ${ chalk.dim( status.workDirectoryPath ) }
`;

	return output;
}
